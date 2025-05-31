import { useSuiClientQuery } from '@mysten/dapp-kit';
import { useMemo } from 'react';
import { Duel, getInitialSharedVersion, WithOnChainRef } from '@/lib/protocol/duel';

export type DuelOnChaiState = {
  duel: WithOnChainRef<Duel> | null;
  isPending: boolean;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
};

/**
 * React hook to fetch duel object fields from the Sui blockchain
 * 
 * @param duelId - The ID of the duel object on the Sui blockchain
 * @param refetchInterval - Optional interval in milliseconds to refetch the duel data (default: 1000ms)
 * @returns duel fields and interface ot observe the query state an refetch the state
 */
export function useDuelOnChainState(duelId: string, opts: { refetchInterval?: number }): DuelOnChaiState {
  const {
    data: objectData,
    isPending,
    isLoading,
    isError,
    error,
    refetch
  } = useSuiClientQuery(
    'getObject',
    { id: duelId, options: { showContent: true, showOwner: true } },
    { refetchInterval: opts.refetchInterval, enabled: !!duelId }
  );

  const duelFields = useMemo(() => {
    if (objectData?.data?.content?.dataType !== 'moveObject' || !objectData?.data?.content?.fields) {
      return null;
    }

    // Extract the duel data from the Sui object response
    const fields = objectData.data.content.fields as unknown as Duel;
    const initialShardVer = getInitialSharedVersion(objectData)
    if (!initialShardVer) {
      throw new Error('no intial shared version found for duel')
    }

    return {
      // fields
      started_at: Number(fields.started_at),
      wizard1: fields.wizard1,
      wizard2: fields.wizard2,
      wizard1_force: Number(fields.wizard1_force),
      wizard2_force: Number(fields.wizard2_force),
      wizard1_effects: fields.wizard1_effects,
      wizard2_effects: fields.wizard2_effects,
      prize_pool: fields.prize_pool,
      // on chain ref
      id: duelId,
      /** initial shared version */
      _version: initialShardVer,
      _digest: objectData.data.digest
    };
  }, [objectData, duelId]);

  return {
    duel: duelFields,
    isPending,
    isLoading,
    isError,
    error,
    refetch
  };
}
