import { Loader } from '@/components/Loader'
import { DuelProvider } from '@/context/DuelContext'
import { useSuiClientQuery } from '@mysten/dapp-kit'
import { useEffect } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { UserAccount } from '../components/Authenticated'
import { RealtimeChat } from '../components/realtime-chat'

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

  if (duelQuery.isPending) {
    return <Loader />
  }

  // TODO: countdown to duel start

  return (
    <div className="w-[460px] h-full mx-auto px-4">
      <DuelProvider duelId={duelId}>
        {/** start duel screen */}
        {/** duel in action screen */}
        <RealtimeChat roomName={duelId} username={userAccount.username} />
        {/** duel results screen */}
      </DuelProvider>
    </div>
  )
}

