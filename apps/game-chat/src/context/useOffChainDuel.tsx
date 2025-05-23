import {
  DuelAction,
  DuelState,
  createInitialDuelState,
  getLoser,
  getWinner,
} from '@/lib/duel/duel-reducer'
import { createContext, useContext } from 'react'

export type PracticeDuelState =
  /** duel created but not yet started or start time is not yet set */
  | 'pending'
  /** duel in action and spell can be casted */
  | 'started'
  /** duel has a winner */
  | 'finished'
  /** duel context is not loaded yet */
  | 'loading'

export type OffChainDuelContextValue = {
  duelState: PracticeDuelState
  duelData: DuelState
  startDuel: (
    args: { countdownSeconds: number },
    opts?: {
      onSuccess?: () => void
      onError?: (error: unknown) => void
      onSettled?: () => void
    }
  ) => void
  dispatch: React.Dispatch<DuelAction>
  // castSpell: (
  //   spellName: string,
  //   targetType: 'self' | 'opponent',
  //   opts?: {
  //     onSuccess?: () => void
  //     onError?: (error: unknown) => void
  //     onSettled?: () => void
  //   }
  // ) => void
  winner: string | null
  loser: string | null
  isLoading: boolean
  currentWizardId: string
  opponentId: string
}

const initialDuelData = createInitialDuelState({
  id: 'practice',
  wizard1Id: 'player',
  wizard2Id: 'opponent',
  initialForce: 128,
})

const defaultContextValue: OffChainDuelContextValue = {
  duelState: 'loading',
  duelData: initialDuelData,
  startDuel: () => {},
  dispatch: () => {},
  winner: getWinner(initialDuelData),
  loser: getLoser(initialDuelData),
  isLoading: true,
  currentWizardId: 'player',
  opponentId: 'opponent',
}

export const OffChainDuelContext = createContext<OffChainDuelContextValue>(defaultContextValue)

export function useOffChainDuel() {
  const context = useContext(OffChainDuelContext)
  if (!context) {
    throw new Error('useOffChainDuel must be used within an OffChainDuelProvider')
  }
  return context
}
