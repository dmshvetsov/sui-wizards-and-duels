import { Loader } from '@/components/Loader'
import { DuelProvider, useDuel } from '@/context/DuelContext'
import { Navigate, useParams } from 'react-router-dom'
import { UserAccount } from '../components/Authenticated'
import { Start } from './Start'
import { Action } from './Action'
import { Result } from './Result'
import { isDevnetEnv } from '@/lib/config'

export function DuelLayout({ userAccount }: { userAccount: UserAccount }) {
  const { slug: duelId } = useParams<{ slug: string }>()

  if (!duelId) {
    return <Navigate to="/" />
  }

  return (
    <div className="w-[460px] h-full mx-auto px-4">
      <DuelProvider duelId={duelId} currentUser={userAccount}>
        <Duel userAccount={userAccount} />
      </DuelProvider>
    </div>
  )
}

function Duel({ userAccount }: { userAccount: UserAccount }) {
  const { duel, duelState, duelId } = useDuel()

  // Render different screens based on duel state
  if (duelState === 'loading') {
    return <Loader />
  }

  if (duelState === 'not-found') {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <p className="text-lg font-semibold text-red-600">Duel not found</p>
        <p className="text-sm text-gray-600 mt-2">
          The duel you're looking for doesn't exist or has been removed.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {duelState === 'pending' && <Start userAccount={userAccount} />}

      {duelState === 'started' && <Action duelId={duelId} userAccount={userAccount} /> }

      {duelState === 'finished' && <Result userAccount={userAccount} />}

      {isDevnetEnv && (
        <div className="top-0 left-0 absolute pl-6 pb-8 text-xs">
          <p className="text-sm text-gray-600 mt-2">you: {userAccount.id}</p>
          <pre className="text-gray-600 mt-2">
            duel: {JSON.stringify(duel, null, 4)}
          </pre>
        </div>
      )}
    </div>
  )
}
