import { useSuiClientQuery } from '@mysten/dapp-kit'
import { useMemo } from 'react'
import { Duel } from '@/lib/protocol/duel'

export type DuelOnChaiState = {
  duel: Duel | null
  isPending: boolean
  isLoading: boolean
  isError: boolean
  error: Error | null
  refetch: () => void
}

const noOp = () => {}

/**
 * React hook to fetch duel object fields from the Sui blockchain
 *
 * @param duelId - The ID of the duel object on the Sui blockchain
 * @param refetchInterval - Optional interval in milliseconds to refetch the duel data (default: 1000ms)
 * @returns duel fields and interface ot observe the query state an refetch the state
 */
export function useDuelOnChainState(
  duelId: string,
  opts: { refetchInterval?: number }
): DuelOnChaiState {
  const {
    data: objectData,
    isPending,
    isLoading,
    isError,
    error,
    refetch,
  } = useSuiClientQuery(
    'getObject',
    { id: duelId, options: { showContent: true } },
    { refetchInterval: opts.refetchInterval, enabled: !!duelId && duelId !== 'demo' }
  )

  const duelFields = useMemo(() => {
    if (
      objectData?.data?.content?.dataType !== 'moveObject' ||
      !objectData?.data?.content?.fields
    ) {
      return null
    }

    // Extract the duel data from the Sui object response
    const fields = objectData.data.content.fields as unknown as Duel

    return {
      id: duelId,
      started_at: Number(fields.started_at),
      wizard1: fields.wizard1,
      wizard2: fields.wizard2,
      wizard1_force: Number(fields.wizard1_force),
      wizard2_force: Number(fields.wizard2_force),
      wizard1_effects: fields.wizard1_effects,
      wizard2_effects: fields.wizard2_effects,
      prize_pool: fields.prize_pool,
    }
  }, [objectData, duelId])

  if (duelId === 'demo') {
    return {
      duel: {
          id: duelId,
          started_at: 1751042259092,
          wizard1: '0x111',
          wizard2: '0x112',
          wizard1_force: 128,
          wizard2_force: 128,
          wizard1_effects: [2, 0, 0] as [number, number, number],
          wizard2_effects: [1, 0, 1] as [number, number, number],
          prize_pool: '0',
      },
      isPending: false,
      isLoading: false,
      isError: false,
      error: null,
      refetch: noOp
    }
  }

  return {
    duel: duelFields,
    isPending,
    isLoading,
    isError,
    error,
    refetch,
  }
}
