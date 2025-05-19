import {
  createInitialDuelState,
  duelReducer,
  getLoser,
  getWinner,
  hasFinished,
  hasStarted,
} from '@/lib/duel/duel-reducer'
import { PropsWithChildren, useReducer } from 'react'
import { toast } from 'sonner'
import { OffChainDuelContext, OffChainDuelContextValue, PracticeDuelState } from './useOffChainDuel'

export function OffChainDuelProvider({
  children,
  currentWizardId = 'player',
  opponentId = 'opponent',
}: PropsWithChildren<{ currentWizardId?: string; opponentId?: string }>) {
  const [duelData, dispatch] = useReducer(
    duelReducer,
    createInitialDuelState('practice', currentWizardId, opponentId)
  )

  // const [duelState, setDuelState] = useState<PracticeDuelState>('loading')

  // useEffect(() => {
  //   const updateState = () => {
  //     const newDuelState: PracticeDuelState = hasFinished(duelData)
  //       ? 'finished'
  //       : hasStarted(duelData)
  //         ? 'started'
  //         : 'pending'
  //
  //     setDuelState(newDuelState)
  //   }
  //
  //   updateState()
  //
  //   // Set up interval to check if duel has started
  //   // FIXME: redunant, react to "start" button click
  //   const intervalId = setInterval(() => {
  //     if (duelState === 'pending' && hasStarted(duelData)) {
  //       updateState()
  //     }
  //   }, 1000)
  //
  //   return () => clearInterval(intervalId)
  // }, [duelData, duelState])

  const startDuel: OffChainDuelContextValue['startDuel'] = (args, opts = {}) => {
    try {
      dispatch({
        type: 'START_DUEL',
        payload: { countdownSeconds: args.countdownSeconds },
      })
      opts.onSuccess?.()
    } catch (error) {
      toast.error('Failed to start duel')
      opts.onError?.(error)
    } finally {
      opts.onSettled?.()
    }
  }

  const duelState: PracticeDuelState = hasFinished(duelData)
    ? 'finished'
    : hasStarted(duelData)
      ? 'started'
      : 'pending'
  const winner = getWinner(duelData)
  const loser = getLoser(duelData)

  // Practice against agains NPC that cast random spells
  // useEffect(() => {
  //   if (duelState === 'started' && !hasFinished(duelData)) {
  //     const to = setTimeout(() => {
  //       // Simple AI: randomly choose a spell to cast
  //       const spells = ['arrow', 'choke', 'deflect', 'throw']
  //       const randomSpell = spells[Math.floor(Math.random() * spells.length)]
  //
  //       // Save the previous state to check if the spell was successful
  //       const prevState = duelData
  //
  //       // Dispatch the action
  //       dispatch({
  //         type: 'CAST_SPELL',
  //         payload: {
  //           casterId: opponentId,
  //           spellName: randomSpell,
  //           targetId: currentWizardId,
  //         },
  //       })
  //
  //       // Check if the spell was successful
  //       if (prevState !== duelData) {
  //         toast.info(`Opponent cast ${randomSpell}!`)
  //       }
  //     }, 1500)
  //
  //     return () => clearTimeout(to)
  //   }
  // }, [duelState, duelData, currentWizardId, opponentId])

  return (
    <OffChainDuelContext.Provider
      value={{
        duelState,
        duelData,
        startDuel,
        dispatch,
        winner,
        loser,
        isLoading: false,
        currentWizardId,
        opponentId,
      }}
    >
      {children}
    </OffChainDuelContext.Provider>
  )
}
