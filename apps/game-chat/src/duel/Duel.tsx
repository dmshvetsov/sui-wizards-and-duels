import { RealtimeChat } from '../components/realtime-chat'
import { UserAccount } from '../components/Authenticated'
import { Navigate, useParams } from 'react-router-dom'
import { DuelProvider } from '@/context/DuelContext'
import { useSuiClientQuery } from '@mysten/dapp-kit'
import { useEffect } from 'react'

export function Duel({ userAccount }: { userAccount: UserAccount }) {
  const { slug: duelId } = useParams<{ slug: string }>()
  const duelQuery = useSuiClientQuery(
    'getObject',
    { id: duelId ?? '', options: { showContent: true } },
    { enabled: duelId != null }
  )

  useEffect(() => {
    if (duelQuery.data) {
      console.log('duel state', duelQuery.data)
    }
  }, [duelQuery.data])

  if (!duelId) {
    return <Navigate to="/" />
  }

  // TODO: countdown to duel start

  return (
    <div className="w-[460px] h-full mx-auto px-4">
      <DuelProvider duelId={duelId}>
        <RealtimeChat roomName={duelId} username={userAccount.username} />
      </DuelProvider>
    </div>
  )
}

