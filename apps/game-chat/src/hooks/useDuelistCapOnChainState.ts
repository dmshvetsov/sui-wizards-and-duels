import { useSuiClientQuery } from '@mysten/dapp-kit'
import { useMemo } from 'react'
import { DUEL, DuelistCap } from '@/lib/protocol/duel'

export type DuelistCapOnChainState = {
  duelistCap: DuelistCap | null
  isPending: boolean
  isLoading: boolean
  isError: boolean
  error: Error | null
  refetch: () => void
}

/**
 * React hook to fetch the latest DuelistCap object owned by an address from the Sui blockchain
 *
 * @param owner - The address of the owner of the DuelistCap objects
 * @param opts - Optional configuration including refetch interval
 * @returns Latest DuelistCap object and query state information
 */
export function useDuelistCapOnChainState(
  owner: string,
  opts: { refetchInterval?: number; enabled?: boolean } = {}
): DuelistCapOnChainState {
  // TODO: store duelistCap object id in localstorage and use it to fetch the object directly with getObject
  const { data, isPending, isLoading, isError, error, refetch } = useSuiClientQuery(
    'getOwnedObjects',
    {
      owner,
      filter: { StructType: DUEL.type.duelCap },
      options: { showContent: true },
    },
    {
      refetchInterval: opts.refetchInterval ?? 0,
      refetchOnWindowFocus: false,
      enabled: !!owner && (opts.enabled ?? true),
    }
  )

  const duelistCap = useMemo(() => {
    if (!data?.data || data.data.length === 0) {
      return null
    }

    // Get the last object in the array (most recent DuelistCap)
    const lastItem = data.data[data.data.length - 1]

    if (lastItem.data?.content?.dataType !== 'moveObject') {
      return null
    }

    const fields = lastItem.data?.content?.fields as DuelistCap

    return {
      id: lastItem.data.objectId,
      duel: fields.duel,
      wizard: fields.wizard,
      opponent: fields.opponent,
    }
  }, [data])

  return {
    duelistCap,
    isPending,
    isLoading,
    isError,
    error,
    refetch,
  }
}
