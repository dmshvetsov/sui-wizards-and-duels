import { Loader } from '@/components/Loader'
import * as api from '@/lib/supabase/api'
import { useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export function WithRewardClaim(props: { children: React.ReactNode }) {
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

  useEffect(() => {
    if (rewarchCheckQuery.data && !rewarchCheckQuery.data.funded) {
      navigate('/d/welcome-reward')
    }
  }, [rewarchCheckQuery.data, navigate])

  if (rewarchCheckQuery.isPending) {
    return <Loader />
  }

  return props.children
}
