import { useSuiClientQuery } from '@mysten/dapp-kit'
import { useMemo } from 'react'
import { DUEL, Spell } from '@/lib/protocol/duel'

export type DuelistCapOnChainState = {
  spells: Spell[] | null
  isPending: boolean
  isLoading: boolean
  isError: boolean
  error: Error | null
  refetch: () => void
}

export function useSpellsOnChainState(
  owner: string,
  opts: { refetchInterval?: number; enabled?: boolean } = {}
): DuelistCapOnChainState {
  const { data, isPending, isLoading, isError, error, refetch } = useSuiClientQuery(
    'getOwnedObjects',
    {
      owner,
      filter: { StructType: DUEL.type.spell },
      options: { showContent: true },
    },
    {
      refetchInterval: opts.refetchInterval ?? 0,
      refetchOnWindowFocus: false,
      enabled: !!owner && (opts.enabled ?? true),
    }
  )

  const spells = useMemo(() => {
    if (!data?.data) {
      return null
    }

    const acc: Spell[] = []
    for (const item of data.data) {
      if (item.data?.content?.dataType === 'moveObject') {
        const fields = item.data?.content?.fields as Spell
        acc.push({
          id: item.data.objectId,
          damage: Number(fields.damage),
          cost: Number(fields.cost),
        })
      }
    }

    return acc
  }, [data])

  return {
    spells,
    isPending,
    isLoading,
    isError,
    error,
    refetch,
  }
}
