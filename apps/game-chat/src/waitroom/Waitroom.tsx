import { AuthenticatedComponentProps } from '@/components/Authenticated'
import { FundWallet } from '@/components/FundWallet'
import { GameMenu } from '@/components/GameMenu'
import { Loader } from '@/components/Loader'
import { StakeSelector } from '@/components/StakeSelector'
import { ButtonWithFx } from '@/components/ui/button'
import { isDevnetEnv } from '@/lib/config'
import { AppError } from '@/lib/error'
import { DUEL, DuelistCap } from '@/lib/protocol/duel'
import { joinTx, leaveTx, Waitroom, waitroom } from '@/lib/protocol/waitroom'
import { executeWith } from '@/lib/sui/client'
import { createRoom } from '@/lib/supabase/client'
import { displayName } from '@/lib/user'
import {
  useSignAndExecuteTransaction,
  useSuiClient,
  useSuiClientContext,
  useSuiClientQuery,
} from '@mysten/dapp-kit'
import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

const MUSIC = {
  duelground: new Howl({
    src: ['/music/duelground.ogg'],
    volume: 0,
    loop: true,
    preload: true,
  }),
}

const UNCONNECTED_COUNTER_STATE = 0

const THREE_SECONDS_IN_MS = 3000
const ONE_SECOND_IN_MS = 1000

const REQUIRED_BALANCE_TO_PLAY = 12800000n * 2n // x2 0.0128 SUI in MIST

type UserWaitRoomState = 'loading' | 'iddle' | 'needs_funding' | 'waiting' | 'paired'

export function WaitRoom({ userAccount }: AuthenticatedComponentProps) {
  const suiContext = useSuiClientContext()
  const [onlineCount, setOnlineCount] = useState(UNCONNECTED_COUNTER_STATE)
  const client = useSuiClient()
  const { mutate: signAndExecute, isPending: isSigningAndExecuting } = useSignAndExecuteTransaction(
    {
      execute: executeWith(client, { showRawEffects: true, showEffects: true }),
    }
  )
  const [isWaitRoomStateReconciling, setWaitRoomStateReconciling] = useState(false)
  const [selectedStake, setSelectedStake] = useState(0)

  const navigate = useNavigate()

  const waitroomQuery = useSuiClientQuery(
    'getObject',
    {
      id: waitroom.object.waitroom,
      options: { showContent: true },
    },
    { refetchInterval: THREE_SECONDS_IN_MS }
  )

  const duelistCapQuery = useSuiClientQuery(
    'getOwnedObjects',
    {
      owner: userAccount.id,
      filter: {
        StructType: DUEL.type.duelCap,
      },
      options: { showContent: true },
    },
    { refetchInterval: ONE_SECOND_IN_MS }
  )

  const playerBalanceQuery = useSuiClientQuery(
    'getBalance',
    {
      owner: userAccount.id,
      coinType: '0x2::sui::SUI',
    },
    { refetchInterval: 0 }
  )

  // music
  useEffect(() => {
    MUSIC.duelground.play()
    MUSIC.duelground.fade(0, 0.5, 2500)
    return () => {
      MUSIC.duelground.stop()
    }
  }, [])

  const waitroomState = waitroomQuery.data?.data
  const userBalanceInMist = playerBalanceQuery.data
    ? BigInt(playerBalanceQuery.data.totalBalance)
    : 0
  const queue =
    waitroomState?.content?.dataType === 'moveObject'
      ? (waitroomState.content.fields as Waitroom).queue
      : []
  const duelistCap = duelistCapQuery.data?.data?.at(-1)?.data ?? null
  const isInQueue = queue.find((pair) => pair.fields.wizard1 === userAccount.id) != null
  const isDataFetching =
    duelistCapQuery.isPending || playerBalanceQuery.isPending || waitroomQuery.isPending
  const userState: UserWaitRoomState = isDataFetching
    ? 'loading'
    : duelistCap
      ? 'paired'
      : isInQueue
        ? 'waiting'
        : userBalanceInMist < REQUIRED_BALANCE_TO_PLAY
          ? 'needs_funding'
          : 'iddle'

  // presence in waitroom tracker
  useEffect(() => {
    const channel = createRoom('waitroom', { config: { presence: { key: userAccount.id } } })
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()
        console.debug('sync state', state)
        setOnlineCount(new Set(Object.keys(state)).size)
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.debug('join', key, newPresences)
        toast(`${displayName(key)} joined the Duelground`)
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.debug('leave', key, leftPresences)
        toast(`${displayName(key)} left the Duelground`)
      })

    channel.subscribe((status, err?: Error) => {
      if (status === 'SUBSCRIBED') {
        channel.track({
          user_id: userAccount.id,
          joined_at: Date.now(),
        })
      }
      if (err) {
        console.error('WaitRoom channel error:', err)
      }
    })

    return () => {
      channel.unsubscribe()
    }
  }, [userAccount.id, navigate])

  // pairing and duel creation event
  useEffect(() => {
    // assume players will only have 1 duelistCap
    // but take the last one which should be the most recent in case if a player holds multiple DuelistCaps
    const duelistCap = duelistCapQuery.data?.data?.at(-1)?.data
    if (!duelistCap || duelistCap.content?.dataType !== 'moveObject') {
      return
    }

    console.debug('found existing duelist cap', duelistCap)
    const duelId = (duelistCap.content?.fields as DuelistCap).duel
    setTimeout(() => {
      navigate(`/d/${duelId}`)
    }, 800)
  }, [duelistCapQuery.data, navigate])

  const refetchWaitListState = waitroomQuery.refetch
  const refetchBalance = playerBalanceQuery.refetch
  const handleJoinWaitlist = useCallback(() => {
    signAndExecute(
      { transaction: joinTx(selectedStake * 1_000_000_000) },
      {
        onSuccess(result) {
          console.debug('waitroom join tx success', result)
          if (result.effects?.status.status === 'failure') {
            toast.error('Failed to join, please refresh the page and try again')
            return
          }
          toast.success(
            `Joined waitroom with ${selectedStake === 0 ? 'no stake' : `${selectedStake} SUI stake`}`
          )
        },
        onError(err) {
          console.error(err)
          const appErr = new AppError('handleJoinWaitlist', err)
          toast.error('An error occurred, refresh the page and try again')
          appErr.log()
        },
        async onSettled() {
          setWaitRoomStateReconciling(true)
          await refetchWaitListState()
          setWaitRoomStateReconciling(false)
          await refetchBalance()
        },
      }
    )
  }, [selectedStake, signAndExecute, refetchWaitListState, refetchBalance])

  const handleLeave = useCallback(() => {
    signAndExecute(
      { transaction: leaveTx() },
      {
        onSuccess(_result) {
          refetchWaitListState()
          console.debug('waitroom leave tx success', _result)
        },
        onError(err) {
          const appErr = new AppError('handleLeave', err)
          toast.error('An error occurred, refresh the page and try again')
          appErr.log()
        },
        async onSettled() {
          setWaitRoomStateReconciling(true)
          await refetchWaitListState()
          setWaitRoomStateReconciling(false)
          await refetchBalance()
        },
      }
    )
  }, [signAndExecute, refetchWaitListState, refetchBalance])

  if (!waitroomQuery.data || onlineCount === UNCONNECTED_COUNTER_STATE || userState === 'loading') {
    return <Loader />
  }

  if (waitroomQuery.status === 'error') {
    // network error
    return (
      <div className="flex flex-col justify-center gap-8 items-center h-screen">
        <h1>Come back later!</h1>
        <h3>Something is wrong and we are working on a fix for it.</h3>
      </div>
    )
  }

  if (waitroomQuery.data.error && waitroomQuery.data.error.code === 'notExists') {
    // on chain error
    return (
      <div className="flex flex-col justify-center gap-8 items-center h-screen">
        <h1>Come back later!</h1>
        <h3>We upgrading our game, we will be back shortly.</h3>
      </div>
    )
  }

  return (
    <div className="flex justify-center gap-8 items-center h-screen">
      <div className="w-[300px]" />
      <div className="flex flex-col items-center justify-center w-[480px]">
        <h1 className="text-2xl font-semibold mb-2">Duelground</h1>
        <p>Join others in Player vs Player Wizards Duels.</p>
        <p>Defeat your opponent to take away his Sui force.</p>

        <div className="mt-8 text-center">
          {userState === 'paired' ? (
            <p className="mt-10">
              <span className="animate-pulse font-semibold text-green-600">
                OPPONENT FOUND! PREPARE FOR A DUEL...
              </span>
            </p>
          ) : userState === 'waiting' ? (
            <>
              <p>
                <span className="animate-pulse font-semibold">FINDING OPPONENT</span>
              </p>
              <ButtonWithFx
                className="mt-4"
                onClick={handleLeave}
                disabled={isSigningAndExecuting || isWaitRoomStateReconciling}
                isLoading={isSigningAndExecuting || isWaitRoomStateReconciling}
              >
                Cancel
              </ButtonWithFx>
            </>
          ) : userState === 'needs_funding' ? (
            <FundWallet walletAddress={userAccount.id} />
          ) : (
            <ButtonWithFx
              className="mt-10"
              onClick={handleJoinWaitlist}
              disabled={isSigningAndExecuting || isWaitRoomStateReconciling}
              isLoading={isSigningAndExecuting || isWaitRoomStateReconciling}
            >
              {selectedStake > 0 ? 'Stake and Play' : 'Play'}
            </ButtonWithFx>
          )}
        </div>

        <div className="mt-12">
          <p className="text-lg">
            wizards online:{' '}
            <span className="font-bold">{onlineCount === 1 ? 'only you' : onlineCount}</span>
          </p>
        </div>
        {onlineCount === 1 && (
          <>
            <p className="mt-2 text-center">
              You are the only one in the Duelground. Wait for others to join or invite friends with
              the following link
            </p>
            <p>
              <span className="font-semibold">{window.location.toString()}</span>
            </p>
          </>
        )}
      </div>
      <div className="mt-8 w-[300px]">
        {userState !== 'needs_funding' && (
          <StakeSelector selectedStake={selectedStake} onStakeSelect={setSelectedStake} />
        )}
      </div>
      {isDevnetEnv && (
        <div className="top-0 left-0 absolute pl-6 pb-8 text-xs">
          <p className="text-sm text-gray-600 mt-2">network: {suiContext.network}</p>
          <p className="text-sm text-gray-600 mt-2">you: {userAccount.id}</p>
          <pre className="text-gray-600 mt-2">
            waitroom: {JSON.stringify(waitroomState, null, 4)}
          </pre>
        </div>
      )}
      <GameMenu userAccount={userAccount} />
    </div>
  )
}
