import { useEffect, useState } from 'react'
import { createRoom } from '@/lib/supabase/client'
import { AuthenticatedComponentProps } from '@/components/Authenticated'

export function Waitroom({ userAccount }: AuthenticatedComponentProps) {
  const [onlineCount, setOnlineCount] = useState(0)

  useEffect(() => {
    const userId = Math.random().toString(36).substring(2, 15)
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

    channel.subscribe((status, err?: Error) => {
      if (status === 'SUBSCRIBED') {
        channel.track({ user_id: userId })
      }
      if (err) {
        console.error('Waitroom channel error:', err)
      }
    })

    return () => {
      channel.unsubscribe()
    }
  }, [])

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
      {onlineCount > 1 ? (
        <p>
          <span className="animate-pulse font-semibold">FINDING OPPONENT</span>
        </p>
      ) : (
        <p>
          Give it time for other Wizards to join or invite friends with the following link{' '}
          <span className='font-semibold'>{window.location.toString()}</span>
        </p>
      )}
    </div>
  )
}
