import { AuthenticatedComponentProps } from '@/components/Authenticated'
import { GameMenu } from '@/components/GameMenu'
import { Loader } from '@/components/Loader'
import { Button, ButtonWithFx } from '@/components/ui/button'
import { isDevnetEnv } from '@/lib/config'
import { AppError } from '@/lib/error'
import { DUEL, DuelistCap } from '@/lib/protocol/duel'
import { joinTx, leaveTx, Waitroom, waitroom } from '@/lib/protocol/waitroom'
import { createRoom } from '@/lib/supabase/client'
import { displayName } from '@/lib/user'
import {
  useSignAndExecuteTransaction,
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

type WaitState = 'loading' | 'iddle' | 'needs_funding' | 'waiting' | 'paired'

export function WaitRoom({ userAccount }: AuthenticatedComponentProps) {
  const suiContext = useSuiClientContext()
  const [onlineCount, setOnlineCount] = useState(UNCONNECTED_COUNTER_STATE)
  const [waitState, setWaitState] = useState<WaitState>('loading')
  const { mutate: signAndExecute, isPending: isSigningAndExecuting } =
    useSignAndExecuteTransaction()
  const [waitRoomStateIsReconciling, setWaitRoomStateIsReconciling] = useState(false)

  const navigate = useNavigate()

  const waitroomQuery = useSuiClientQuery(
    'getObject',
    {
      id: waitroom.object.waitroom,
      options: { showContent: true },
    },
    { enabled: waitState !== 'loading', refetchInterval: THREE_SECONDS_IN_MS }
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

  const playerBalance = useSuiClientQuery(
    'getBalance',
    {
      owner: userAccount.id,
      coinType: '0x2::sui::SUI',
    },
    { refetchInterval: 0 }
  )

  useEffect(() => {
    MUSIC.duelground.play()
    MUSIC.duelground.fade(0, 0.5, 2500)
    return () => {
      MUSIC.duelground.stop()
    }
  }, [])

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

  useEffect(() => {
    if (!duelistCapQuery.data) {
      return
    }
    // assume players will only have 1 duelistCap
    // but take the last one which should be the most recent in case if a player holds multiple DuelistCaps
    const duelistCap = duelistCapQuery.data.data?.at(-1)?.data
    if (!duelistCap || duelistCap.content?.dataType !== 'moveObject') {
      console.debug('no existing duelist cap found')
      setWaitState('iddle')
      return
    }

    console.debug('found existing duelist cap', duelistCap)
    const duelId = (duelistCap.content?.fields as DuelistCap).duel
    navigate(`/d/${duelId}`)
  }, [duelistCapQuery.data, navigate])

  useEffect(() => {
    // Check if the wallet has enough SUI
    if (!playerBalance.data) {
      return
    }

    const balanceInMist = BigInt(playerBalance.data.totalBalance)
    const requiredBalanceInMist = 12800000n * 2n // x2 0.0128 SUI in MIST

    console.debug('Wizard wallet balance:', balanceInMist.toString(), 'MIST')

    // If the wallet doesn't have enough SUI, set the state to needs_funding
    if (balanceInMist < requiredBalanceInMist && waitState === 'iddle') {
      setWaitState('needs_funding')
    }
  }, [playerBalance.data, waitState])

  const waitroomState = waitroomQuery.data?.data
  useEffect(() => {
    if (!waitroomState) {
      return
    }
    if (waitroomState.content?.dataType !== 'moveObject') {
      console.warn('failed to load Waitroom state')
      return
    }

    const queue = (waitroomState.content.fields as Waitroom).queue
    const isInQueue = queue.find((pair) => pair.fields.wizard1 === userAccount.id) != null
    if (isInQueue) {
      setWaitState('waiting')
    } else {
      // Only set to idle if not in needs_funding state
      // FIXME: how it must work now with zk wallets
      if (waitState !== 'needs_funding') {
        setWaitState('iddle')
      }
    }
    setWaitRoomStateIsReconciling(false)
  }, [waitroomState, userAccount.id, waitState])

  const refetchWaitListState = waitroomQuery.refetch
  const handleJoinWaitlist = useCallback(() => {
    signAndExecute(
      { transaction: joinTx() },
      {
        onSuccess(_result) {
          console.debug('waitroom join tx success', _result)
        },
        onError(err) {
          const appErr = new AppError('handleJoinWaitlist', err)
          toast.error('An error occurred, refresh the page and try again')
          appErr.log()
        },
        onSettled() {
          setWaitRoomStateIsReconciling(true)
          refetchWaitListState()
        },
      }
    )
  }, [signAndExecute, refetchWaitListState])

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
        onSettled() {
          setWaitRoomStateIsReconciling(true)
          refetchWaitListState()
        },
      }
    )
  }, [signAndExecute, refetchWaitListState])

  if (onlineCount === UNCONNECTED_COUNTER_STATE || waitState === 'loading') {
    return <Loader />
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <GameMenu userAccount={userAccount} />
      <h1 className="text-2xl font-semibold mb-2">Duelground</h1>
      <p>Join other player in Player vs Player Wizards Duels.</p>
      <p>Defeat your opponent to take away his Sui force.</p>

      {waitState === 'paired' ? (
        <p className="mt-12">
          <span className="animate-pulse font-semibold text-green-600">
            OPPONENT FOUND! PREPARE FOR A DUEL...
          </span>
        </p>
      ) : waitState === 'waiting' ? (
        <>
          <p className="mt-12">
            <span className="animate-pulse font-semibold">FINDING OPPONENT</span>
          </p>
          <ButtonWithFx
            className="mt-4"
            onClick={handleLeave}
            disabled={isSigningAndExecuting || waitRoomStateIsReconciling}
            isLoading={isSigningAndExecuting || waitRoomStateIsReconciling}
          >
            Cancel
          </ButtonWithFx>
        </>
      ) : waitState === 'needs_funding' ? (
        <Button onClick={() => navigate('/welcome-reward')}>Claim Welcome Reward</Button>
      ) : (
        <ButtonWithFx
          className="mt-12"
          onClick={handleJoinWaitlist}
          disabled={isSigningAndExecuting || waitRoomStateIsReconciling}
          isLoading={isSigningAndExecuting || waitRoomStateIsReconciling}
        >
          Play
        </ButtonWithFx>
      )}

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
      {isDevnetEnv && (
        <div className="top-0 left-0 absolute pl-6 pb-8 text-xs">
          <p className="text-sm text-gray-600 mt-2">network: {suiContext.network}</p>
          <p className="text-sm text-gray-600 mt-2">you: {userAccount.id}</p>
          <pre className="text-gray-600 mt-2">
            waitroom: {JSON.stringify(waitroomState, null, 4)}
          </pre>
        </div>
      )}
    </div>
  )
}
