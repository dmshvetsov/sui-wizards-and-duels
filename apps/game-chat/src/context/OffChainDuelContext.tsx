import {
  createInitialDuelState,
  duelReducer,
  getLoser,
  getWinner,
  hasFinished,
  hasStarted,
} from '@/lib/duel/duel-reducer'
import { PropsWithChildren, useReducer } from 'react'
import { OffChainDuelContext, PracticeDuelState } from './useOffChainDuel'

export function OffChainDuelProvider({
  children,
  duelId,
  currentWizardId,
  opponentId,
}: PropsWithChildren<{ duelId: string; currentWizardId: string; opponentId: string }>) {
  const [duelData, dispatch] = useReducer(
    duelReducer,
    createInitialDuelState({
      id: duelId,
      wizard1Id: currentWizardId,
      wizard2Id: opponentId,
      initialForce: 128,
      startedAt: Date.now(),
    })
  )

  const duelState: PracticeDuelState = hasFinished(duelData)
    ? 'finished'
    : hasStarted(duelData)
      ? 'started'
      : 'pending'
  const winner = getWinner(duelData)
  const loser = getLoser(duelData)

  return (
    <OffChainDuelContext.Provider
      value={{
        duelState,
        duelData,
        startDuel: () => {},
        dispatch,
        winner,
        loser,
        isLoading: false,
        currentWizardId,
        opponentId:
          duelData.wizard1.id === currentWizardId ? duelData.wizard2.id : duelData.wizard1.id,
      }}
    >
      {children}
    </OffChainDuelContext.Provider>
  )
}
