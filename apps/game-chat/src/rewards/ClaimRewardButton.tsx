import { ButtonWithFx } from '@/components/ui/button'
import * as api from '@/lib/supabase/api'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'

export function ClaimRewardButton() {
  const navigate = useNavigate()
  const rewarchCheckQuery = useQuery({
    queryKey: ['fund'],
    queryFn: () => api.get('fund'),
    retry: 2,
    retryOnMount: false,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: Infinity
  })

  if (rewarchCheckQuery.isPending) {
    return null
  }

  if (rewarchCheckQuery.data && rewarchCheckQuery.data.funded) {
    return null
  }

  return <ButtonWithFx onClick={() => navigate('/d/welcome-reward')}>Claim Reward</ButtonWithFx>
}
