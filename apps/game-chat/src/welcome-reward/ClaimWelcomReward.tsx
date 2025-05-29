import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { UserAccount } from '../components/Authenticated'
import { useMutation, useQuery } from '@tanstack/react-query'
import * as api from '@/lib/supabase/api'
import { useSuiClientContext } from '@mysten/dapp-kit'
import { ButtonWithFx } from '@/components/ui/button'
import { Loader } from '@/components/Loader'
import { useNavigate } from 'react-router-dom'

export function ClaimWelcomeReward({ userAccount }: { userAccount: UserAccount }) {
  const suiClientContext = useSuiClientContext()
  const navigate = useNavigate()

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
    }
  })

  if (rewardCheckQuery.isPending || rewardCheckQuery.data?.funded == null) {
    return <Loader />
  }

  const isClaimed = rewardCheckQuery.data.funded
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
          <ButtonWithFx onClick={() => navigate('/d')}>Step in to Duelground</ButtonWithFx>
        </>
      ) : (
        <>
          <div className="mt-4">
            <p>We welcome you in Wizards and Duels game.</p>
            <p>This reward will set you for the smooth start.</p>
          </div>
          <Card className="w-[150px] h-auto mt-4 mb-8">
            <CardHeader>
              <CardTitle>{suiClientContext.network} Sui tokens</CardTitle>
              <CardDescription>2 Sui</CardDescription>
            </CardHeader>
          </Card>
          <ButtonWithFx isLoading={claimMut.isPending} onClick={() => claimMut.mutate()}>Claim</ButtonWithFx>
        </>
      )}
    </div>
  )
}
