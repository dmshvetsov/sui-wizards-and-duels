import { UserAccount } from '@/components/Authenticated'
import { useDuelOnChainState } from '@/hooks/useDuelOnChainState'
import { useDuelistCapOnChainState } from '@/hooks/useDuelistCapOnChainState'
import { Duel, DuelistCap, WithOnChainRef } from '@/lib/protocol/duel'
import { getPidLatest } from '@/lib/protocol/package'
import { useSignAndExecuteTransaction } from '@mysten/dapp-kit'
import { Transaction } from '@mysten/sui/transactions'
import { createContext, PropsWithChildren, useContext, useEffect, useState } from 'react'
import { toast } from 'sonner'

export type DuelState =
  /** duel created but not yet started or start time is not yet set */
  | 'pending'
  /** duel in action and spell can be casted */
  | 'started'
  /** duel has a winner */
  | 'finished'
  /** duel context is not loaded yet */
  | 'loading'
  /** duel context is loaded but some of all or some of data not found */
  | 'not-found'

type DuelContextValue = {
  duelId: string
  duel: WithOnChainRef<Duel> | null
  duelState: DuelState
  startDuel: (
    args: { countdownSeconds: number },
    opts: {
      onSuccess?: (result: any) => void
      onError?: (error: unknown) => void
      onSettled?: (result: any | undefined, err: unknown | null) => void
    }
  ) => void
  duelistCap: WithOnChainRef<DuelistCap> | null
  refetchDuelistCap: () => void
  winner: string | null
  loser: string | null
  isLoading: boolean
}

const defaultContextValue: DuelContextValue = {
  duelId: '',
  duel: null,
  duelState: 'loading',
  startDuel: () => {},
  duelistCap: null,
  refetchDuelistCap: () => {},
  winner: null,
  loser: null,
  isLoading: true,
}

const DuelContext = createContext<DuelContextValue>(defaultContextValue)

const PACKAGE_ID_LATEST = getPidLatest()

export function DuelProvider({
  children,
  duelId,
  currentUser,
}: PropsWithChildren<{ duelId: string; currentUser: UserAccount }>) {
  const [duelState, setDuelState] = useState<DuelState>('loading')

  const duelOnChainStateQuery = useDuelOnChainState(duelId, { refetchInterval: 1000 })
  const duelistCapStateQuery = useDuelistCapOnChainState(currentUser.id, { refetchInterval: 0 })

  const duelData = duelOnChainStateQuery.duel ?? null

  useEffect(() => {
    const duelState: DuelState =
      duelOnChainStateQuery.isPending || duelistCapStateQuery.isPending
        ? 'loading'
        : !duelData
          ? 'not-found'
          : duelData.wizard1_force === 0 || duelData.wizard2_force === 0
            ? 'finished'
            : duelData.started_at !== 0 && Date.now() >= duelData.started_at
              ? 'started'
              : 'pending'
    setDuelState(duelState)
  }, [duelData, duelOnChainStateQuery.isPending, duelistCapStateQuery.isPending])

  useEffect(() => {
    let intervalId: NodeJS.Timeout
    if (duelState === 'pending') {
      intervalId = setInterval(() => {
        if (
          duelData?.started_at &&
          duelData.started_at !== 0 &&
          Date.now() >= duelData.started_at
        ) {
          setDuelState('started')
          clearInterval(intervalId)
        }
      }, 1000)
    }
    return () => intervalId && clearInterval(intervalId)
  }, [duelState, duelData])

  const winner = !duelData
    ? null
    : duelData.wizard1_force === 0
      ? duelData.wizard2
      : duelData.wizard2_force === 0
        ? duelData.wizard1
        : null
  const loser =
    duelData == null || winner == null
      ? null
      : winner === duelData.wizard1
        ? duelData.wizard2
        : duelData.wizard1

  const { mutate: signAndExecute } = useSignAndExecuteTransaction()
  const startDuel: DuelContextValue['startDuel'] = (args, opts = {}) => {
    if (!duelData) {
      toast.error('something went wrong, refresh the page and try again')
      return
    }

    const tx = new Transaction()
    tx.moveCall({
      target: `${PACKAGE_ID_LATEST}::duel::start`,
      arguments: [tx.object(duelId), tx.pure.u64(args.countdownSeconds), tx.object.clock()],
    })
    tx.setGasBudget(3_500_000)

    signAndExecute({ transaction: tx }, opts)
  }

  return (
    <DuelContext.Provider
      value={{
        duelId,
        duel: duelData,
        duelState,
        startDuel,
        duelistCap: duelistCapStateQuery.duelistCap,
        refetchDuelistCap: duelistCapStateQuery.refetch,
        winner,
        loser,
        isLoading: duelState === 'loading',
      }}
    >
      {children}
    </DuelContext.Provider>
  )
}

export function useDuel() {
  const context = useContext(DuelContext)
  if (!context) {
    throw new Error('useDuel must be used within a DuelProvider')
  }
  return context
}
