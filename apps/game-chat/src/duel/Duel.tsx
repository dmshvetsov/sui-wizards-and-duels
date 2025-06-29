import { Loader } from '@/components/Loader'
import { DuelProvider, useDuel } from '@/context/DuelContext'
import { Navigate, useParams } from 'react-router-dom'
import { UserAccount } from '../components/Authenticated'
import { Start } from './Start'
import { Action } from './Action'
import { Result } from './Result'
import { isDevnetEnv } from '@/lib/config'
import { useEffect } from 'react'
import { AnimatePresence, motion } from 'motion/react'

const MUSIC = {
  duelStart: new Howl({
    src: ['/music/duel-start.ogg'],
    loop: false,
    preload: true,
  }),
  duelAction: new Howl({
    src: ['/music/duel-action.ogg'],
    volume: 0.3,
    loop: true,
    preload: true,
  }),
  duelResultDefeat: new Howl({
    src: ['/music/duel-result-defeat.ogg'],
    loop: false,
    preload: true,
  }),
  duelResultVictory: new Howl({
    src: ['/music/duel-result-victory.ogg'],
    loop: false,
    preload: true,
  }),
}

export function DuelLayout({ userAccount }: { userAccount: UserAccount }) {
  const { slug: duelId } = useParams<{ slug: string }>()

  if (!duelId) {
    return <Navigate to="/" />
  }

  return (
    <div className="w-[720px] h-full mx-auto">
      <DuelProvider duelId={duelId} currentUser={userAccount}>
        <Duel userAccount={userAccount} />
      </DuelProvider>
    </div>
  )
}

function Duel({ userAccount }: { userAccount: UserAccount }) {
  const { duel, duelState, duelistCap, winner } = useDuel()

  useEffect(() => {
    if (duelState === 'pending') {
      MUSIC.duelStart.play()
    } else if (duelState === 'started') {
      MUSIC.duelStart.stop()
      MUSIC.duelAction.play()
    } else if (duelState === 'finished') {
      MUSIC.duelAction.stop()
      if (winner === userAccount.id) {
        MUSIC.duelResultVictory.play()
      } else {
        MUSIC.duelResultDefeat.play()
      }
    }

    return () => {
      MUSIC.duelStart.stop()
      MUSIC.duelAction.stop()
      MUSIC.duelResultVictory.stop()
      MUSIC.duelResultDefeat.stop()
    }
  }, [duelState, winner, userAccount.id])

  // Render different screens based on duel state
  if (duelState === 'loading') {
    return <Loader />
  }

  if (duelState === 'not-found') {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <h2>Duel not found</h2>
        <p className="text-sm text-gray-600 mt-2">
          The duel you're looking for doesn't exist or has been removed.
        </p>
      </div>
    )
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={duelState}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="flex flex-col h-full"
      >
        {duelState === 'pending' && <Start userAccount={userAccount} />}

        {duelState === 'started' && <Action duel={duel} duelistCap={duelistCap} userAccount={userAccount} />}

        {duelState === 'finished' && <Result userAccount={userAccount} />}

        {isDevnetEnv && (
          <div className="top-0 left-0 absolute pl-6 pb-8 text-xs">
            <p className="text-sm text-gray-600 mt-2">you: {userAccount.id}</p>
            <pre className="text-gray-600 mt-2">duel: {JSON.stringify(duel, null, 4)}</pre>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  )
}
