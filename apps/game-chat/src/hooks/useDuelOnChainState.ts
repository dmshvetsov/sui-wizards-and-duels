import { useSuiClientQuery } from '@mysten/dapp-kit';
import { useMemo } from 'react';
import { Duel } from '@/lib/protocol/duel';

export type DuelOnChaiState = {
  duel: Duel | null;
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
    { id: duelId, options: { showContent: true } },
    { refetchInterval: opts.refetchInterval, enabled: !!duelId }
  );

  const duelFields = useMemo(() => {
    if (objectData?.data?.content?.dataType !== 'moveObject' || !objectData?.data?.content?.fields) {
      return null;
    }

    // Extract the duel data from the Sui object response
    const fields = objectData.data.content.fields as unknown as Duel;
    
    return {
      id: duelId,
      started_at: fields.started_at,
      ended_at: fields.ended_at,
      wizard1: fields.wizard1,
      wizard2: fields.wizard2,
      wizard1_force: Number(fields.wizard1_force),
      wizard2_force: Number(fields.wizard2_force)
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
