import { UserAccount } from '@/components/Authenticated'
import { useDuelOnChainState } from '@/hooks/useDuelOnChainState'
import { useDuelistCapOnChainState } from '@/hooks/useDuelistCapOnChainState'
import { useSpellsOnChainState } from '@/hooks/useSpellsOnChainState'
import { Duel, DuelistCap, Spell } from '@/lib/protocol/duel'
import { getPidLatest } from '@/lib/protocol/package'
import { useSignAndExecuteTransaction } from '@mysten/dapp-kit'
import { Transaction } from '@mysten/sui/transactions'
import { createContext, PropsWithChildren, useContext, useEffect, useState } from 'react'
import { toast } from 'sonner'

export type DuelState = 'pending' | 'started' | 'finished' | 'loading' | 'not-found'

type DuelContextValue = {
  duelId: string
  duel: Duel | null
  /** @deprecated use `duel` instead */
  duelData: Duel | null
  duelState: DuelState
  startDuel: (
    args: { countdownSeconds: number },
    opts: {
      onSuccess?: (result: nay) => void
      onError?: (error: unknown) => void
      onSettled?: (result: any| undefined, err: unknown| null) => void
    }
  ) => void
  /** @deprecated do not use will be removed */
  isCurrentUserWizard1: boolean
  /** current wizard duelist capability */
  duelistCap: DuelistCap | null
  refetchDuelistCap: () => void
  /** spells of the current user */
  spells: Spell[] | null
  refetchSpells: () => void
  winner: string | null
  loser: string | null
}

const defaultContextValue: DuelContextValue = {
  duelId: '',
  duel: null,
  duelData: null,
  duelState: 'loading',
  startDuel: () => {},
  isCurrentUserWizard1: false,
  duelistCap: null,
  refetchDuelistCap: () => {},
  spells: null,
  refetchSpells: () => {},
  winner: null,
  loser: null,
}

const DuelContext = createContext<DuelContextValue>(defaultContextValue)

const PACKAGE_ID_LATEST = getPidLatest()

export function DuelProvider({
  children,
  duelId,
  currentUser,
}: PropsWithChildren<{ duelId: string; currentUser: UserAccount }>) {
  const [duelState, setDuelState] = useState<DuelState>('loading')
  const [duelData, setDuelData] = useState<Duel | null>(null)
  const [winner, setWinner] = useState<string | null>(null)
  const [loser, setLoser] = useState<string | null>(null)
  // const autoSignWallet = useAutosignWallet(currentUser.publicKey)

  const duelOnChainState = useDuelOnChainState(duelId, { refetchInterval: 1000 })
  const duelistCapState = useDuelistCapOnChainState(currentUser.id, { refetchInterval: 0 })
  const spellsState = useSpellsOnChainState(currentUser.id, { refetchInterval: 0 })

  useEffect(() => {
    if (duelOnChainState.isPending) {
      setDuelState('loading')
      return
    }

    if (duelOnChainState.isError || !duelOnChainState.duel) {
      setDuelState('not-found')
      return
    }

    setDuelData(duelOnChainState.duel)

    // Determine duel state based on started_at and ended_at timestamps
    if (
      duelOnChainState.duel.wizard2_force === 0 ||
      duelOnChainState.duel.wizard1_force === 0 ||
      duelOnChainState.duel.ended_at !== '0'
    ) {
      setDuelState('finished')

      // Determine winner and loser
      if (Number(duelOnChainState.duel.wizard1_force) === 0) {
        setWinner(duelOnChainState.duel.wizard2)
        setLoser(duelOnChainState.duel.wizard1)
      } else if (Number(duelOnChainState.duel.wizard2_force) === 0) {
        setWinner(duelOnChainState.duel.wizard1)
        setLoser(duelOnChainState.duel.wizard2)
      } else if (
        Number(duelOnChainState.duel.wizard1_force) > Number(duelOnChainState.duel.wizard2_force)
      ) {
        setWinner(duelOnChainState.duel.wizard1)
        setLoser(duelOnChainState.duel.wizard2)
      } else if (
        Number(duelOnChainState.duel.wizard2_force) > Number(duelOnChainState.duel.wizard1_force)
      ) {
        setWinner(duelOnChainState.duel.wizard2)
        setLoser(duelOnChainState.duel.wizard1)
      }
    } else if (duelOnChainState.duel.started_at !== '0') {
      setDuelState('started')
    } else {
      setDuelState('pending')
    }
  }, [duelOnChainState])

  const { mutate: signAndExecute } = useSignAndExecuteTransaction()
  const startDuel: DuelContextValue['startDuel'] = (args, opts = {}) => {
    if (!duelData) {
      toast.error('Duel data not available')
      return
    }

    const tx = new Transaction()
    tx.moveCall({
      target: `${PACKAGE_ID_LATEST}::duel::start`,
      arguments: [
        tx.object(duelId),
        tx.pure.u64(args.countdownSeconds),
        tx.object('0x6'), // Clock object
      ],
    })

    signAndExecute(
      { transaction: tx },
      opts
    )
  }

  const isCurrentUserWizard1 = currentUser?.id === duelData?.wizard1

  return (
    <DuelContext.Provider
      value={{
        duelId,
        duel: duelData,
        duelData,
        duelState,
        startDuel,
        isCurrentUserWizard1,
        duelistCap: duelistCapState.duelistCap,
        refetchDuelistCap: duelistCapState.refetch,
        spells: spellsState.spells,
        refetchSpells: spellsState.refetch,
        winner,
        loser,
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
