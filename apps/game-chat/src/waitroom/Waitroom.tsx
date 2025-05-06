import { useEffect, useState } from 'react'
import { createRoom } from '@/lib/supabase/client'
import { AuthenticatedComponentProps } from '@/components/Authenticated'
import { useNavigate } from 'react-router-dom'

const UNCONNECTED_COUNTER_STATE = 0

// Define the type for pairing payload
interface PairingPayload {
  pairs: Array<{
    user1: string
    user2: string
    duelLink: string
  }>
}

export function WaitRoom({ userAccount }: AuthenticatedComponentProps) {
  const [onlineCount, setOnlineCount] = useState(UNCONNECTED_COUNTER_STATE)
  const [isPairing, setIsPairing] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const channel = createRoom('waitroom', { config: { presence: { key: userAccount.id } } })
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()
        console.debug('sync state', state)
        setOnlineCount(new Set(Object.keys(state)).size)
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.debug('join', key, newPresences)
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.debug('leave', key, leftPresences)
      })
      .on('broadcast', { event: 'pairing' }, (payload) => {
        // Handle pairing event from the server
        const pairingData = payload.payload as PairingPayload
        console.debug('Received pairing:', pairingData)

        // Find if this user is part of any pair
        const userPair = pairingData.pairs.find(
          (pair) => pair.user1 === userAccount.id || pair.user2 === userAccount.id
        )

        if (userPair) {
          setIsPairing(true)

          // Navigate to the duel page after a short delay
          setTimeout(() => {
            navigate(userPair.duelLink)
          }, 1500)
        }
      })

    channel.subscribe((status, err?: Error) => {
      if (status === 'SUBSCRIBED') {
        channel.track({
          user_id: userAccount.id,
          joined_at: Date.now(),
          nonce: Math.floor(Math.random() * 100),
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

  if (onlineCount === 0) {
    return <div className="flex flex-col items-center justify-center h-full">Loading...</div>
  }

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <h1 className="text-2xl font-semibold mb-2">Duelground</h1>
      <p className="text-lg">
        wizards online:{' '}
        <span className="font-bold">{onlineCount === 1 ? 'only you' : onlineCount}</span>
      </p>

      {isPairing ? (
        <p className="mt-4">
          <span className="animate-pulse font-semibold text-green-600">
            OPPONENT FOUND! PREPARE TO DUEL...
          </span>
        </p>
      ) : onlineCount > 1 ? (
        <p>
          <span className="animate-pulse font-semibold">FINDING OPPONENT</span>
        </p>
      ) : (
        <p>
          Give it time for other Wizards to join or invite friends with the following link{' '}
          <span className="font-semibold">{window.location.toString()}</span>
        </p>
      )}
    </div>
  )
}
