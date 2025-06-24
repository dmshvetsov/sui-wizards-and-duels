import { UserAccount } from '../components/Authenticated'
import { useMutation, useQuery } from '@tanstack/react-query'
import * as api from '@/lib/supabase/api'
import { useSuiClientContext, useSuiClientQuery } from '@mysten/dapp-kit'
import { Button, ButtonWithFx } from '@/components/ui/button'
import { Loader } from '@/components/Loader'
import { useNavigate } from 'react-router-dom'
import { treasuryAddress, welcomeReward } from '@/lib/config'
import { mistToSui } from '@/lib/sui/coin'
import { LootCard } from '@/components/LootCard'

export function ClaimWelcomeReward({ userAccount }: { userAccount: UserAccount }) {
  const suiClientContext = useSuiClientContext()
  const navigate = useNavigate()

  const treasuryBalanceQuery = useSuiClientQuery(
    'getBalance',
    {
      owner: treasuryAddress,
      coinType: '0x2::sui::SUI',
    },
    { refetchInterval: 0 }
  )

  const rewardCheckQuery = useQuery({
    queryKey: ['fund'],
    queryFn: () => api.get('fund'),
    retry: 2,
    retryOnMount: false,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: Infinity,
  })

  const claimMut = useMutation({
    mutationKey: ['fuund'],
    mutationFn: () => api.post('fund', { address: userAccount.id }),
    onSettled: () => {
      rewardCheckQuery.refetch()
    },
  })

  if (
    treasuryBalanceQuery.isPending ||
    treasuryBalanceQuery.data == null ||
    rewardCheckQuery.isPending ||
    rewardCheckQuery.data?.funded == null
  ) {
    return <Loader />
  }

  const isClaimed = rewardCheckQuery.data.funded
  const isEnoughTreasuryBalance =
    mistToSui(treasuryBalanceQuery.data.totalBalance) > welcomeReward.sui

  return (
    <div className="flex flex-col justify-center items-center mt-4 p-4 border text-center w-[480px] mx-auto bg-white h-screen">
      <h2 className="text-lg">
        Claim <br />
        Welcome Reward
      </h2>
      {isClaimed ? (
        <>
          <div className="mt-4 mb-8">
            <p>You have claimed the reward.</p>
          </div>
          <Button onClick={() => navigate('/d')}>Step in to Duelground</Button>
        </>
      ) : (
        <>
          <div className="mt-4">
            <p>We welcome you in Wizards and Duels game.</p>
            <p>This reward will set you for the smooth start.</p>
          </div>
          <div className="flex flex-wrap gap-4 mt-4 mb-8">
            <LootCard title="50 Mint Essence" description="Soulbound Signup Reward" />
            <LootCard title={`${welcomeReward.sui} Sui`} description={`${suiClientContext.network} Sui tokens`} />
          </div>
          {isEnoughTreasuryBalance ? (
            <ButtonWithFx isLoading={claimMut.isPending} onClick={() => claimMut.mutate()}>
              Claim
            </ButtonWithFx>
          ) : (
            <>
              <p className="mb-4 text-yellow-600">
                Game Treasury is empty at this moment please come back later to claim your reward.
              </p>
              <Button onClick={() => navigate('/d')}>Back to Duelground</Button>
            </>
          )}
        </>
      )}
    </div>
  )
}
