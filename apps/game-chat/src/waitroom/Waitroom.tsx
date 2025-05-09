import { useCallback, useEffect, useState } from 'react'
import { createRoom } from '@/lib/supabase/client'
import { DUEL, DuelistCap } from '@/lib/protocol/duel'
import { AuthenticatedComponentProps } from '@/components/Authenticated'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useSignAndExecuteTransaction, useSuiClient, useSuiClientQuery } from '@mysten/dapp-kit'
import { ExecuteTransactionBlockParams, SuiClient } from '@mysten/sui/client'
import { joinTx, leaveTx, Waitroom, waitroom } from '@/lib/protocol/waitroom'
import { toast } from 'sonner'
import { displayName } from '@/lib/user'

const UNCONNECTED_COUNTER_STATE = 0

const ONE_SECOND_IN_MS = 1000

type WaitState = 'loading' | 'iddle' | 'waiting' | 'paired'

export function WaitRoom({ userAccount }: AuthenticatedComponentProps) {
  const [onlineCount, setOnlineCount] = useState(UNCONNECTED_COUNTER_STATE)
  const [waitState, setWaitState] = useState<WaitState>('loading')

  const navigate = useNavigate()

  const waitroomQuery = useSuiClientQuery(
    'getObject',
    {
      id: waitroom.object.waitroom,
      options: { showContent: true },
    },
    { enabled: waitState !== 'loading', refetchInterval: ONE_SECOND_IN_MS }
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

  const waitroomState = waitroomQuery.data?.data;
  useEffect(() => {
    if (!waitroomState) {
      return
    }
    if (waitroomState.content?.dataType !== 'moveObject') {
      console.warn('failed to load Waitroom state')
      return
    }

    console.debug('waitroom data', waitroomState)
    const queue = (waitroomState.content.fields as Waitroom).queue
    const isInQueue = queue.find((pair) => pair.fields.wizard1 === userAccount.id) != null
    if (isInQueue) {
      setWaitState('waiting')
    } else {
      setWaitState('iddle')
    }
  }, [waitroomState, userAccount.id])

  const client = useSuiClient()
  const { mutate: signAndExecute } = useSignAndExecuteTransaction({
    execute: executeWith(client, { showRawEffects: true, showObjectChanges: true }),
  })

  const handleJoin = useCallback(() => {
    signAndExecute(
      { transaction: joinTx() },
      {
        onSuccess(_result) {
          console.debug('waitroom join tx success', _result)
        },
      }
    )
  }, [signAndExecute])

  const handleLeave = useCallback(() => {
    signAndExecute(
      { transaction: leaveTx() },
      {
        onSuccess(_result) {
          console.debug('waitroom leave tx success', _result)
        },
      }
    )
  }, [signAndExecute])

  if (onlineCount === UNCONNECTED_COUNTER_STATE || waitState === 'loading') {
    return <div className="flex flex-col items-center justify-center h-full">Loading...</div>
  }

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <h1 className="text-2xl font-semibold mb-2">Duelground</h1>
      <p className="text-lg">
        wizards online:{' '}
        <span className="font-bold">{onlineCount === 1 ? 'only you' : onlineCount}</span>
      </p>

      {waitState === 'paired' ? (
        <p className="mt-4">
          <span className="animate-pulse font-semibold text-green-600">
            OPPONENT FOUND! PREPARE FOR A DUEL...
          </span>
        </p>
      ) : waitState === 'waiting' ? (
        <>
          <p className="mt-4">
            <span className="animate-pulse font-semibold">FINDING OPPONENT</span>
          </p>
          <Button className="mt-4" onClick={handleLeave}>
            Cancel
          </Button>
        </>
      ) : onlineCount > 1 ? (
        <>
          <Button className="mt-4" onClick={handleJoin}>
            Play
          </Button>
          <p className="mt-2">Join other player in Wizards Duels.</p>
          <p>Defeat your opponent to take away his Sui force.</p>
        </>
      ) : (
        <p>
          Give it time for other Wizards to join or invite friends with the following link{' '}
          <span className="font-semibold">{window.location.toString()}</span>
        </p>
      )}
    </div>
  )
}

function executeWith(client: SuiClient, opts: ExecuteTransactionBlockParams['options']) {
  return ({ bytes, signature }: { bytes: string; signature: string }) =>
    client.executeTransactionBlock({
      transactionBlock: bytes,
      signature,
      options: opts,
    })
}
