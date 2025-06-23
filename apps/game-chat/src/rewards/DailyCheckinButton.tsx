import { ButtonWithFx } from '@/components/ui/button'
import { useMutation, useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import * as api from '@/lib/supabase/api'
import type { DailyCheckinStatusResult } from '@/lib/supabase/api'

function isWithinDuelgroundSlot(date: Date) {
  const hour = date.getUTCHours()
  return (hour >= 11 && hour < 12) || (hour >= 20 && hour < 21)
}

function getTodayUtc() {
  const now = new Date()
  return now.toISOString().slice(0, 10)
}

export function DailyCheckinButton() {
  // Query to check if already claimed today
  const checkinQuery = useQuery({
    queryKey: ['daily-checkin-status'],
    queryFn: async () => {
      return api.get<DailyCheckinStatusResult>('rewards/checkins')
    },
    refetchOnWindowFocus: false,
    staleTime: 60 * 1000,
  })

  const checkinMut = useMutation({
    mutationFn: async () => {
      return api.post('rewards/checkins', {})
    },
    onSuccess: () => {
      toast.success('Daily check-in successful!')
      checkinQuery.refetch()
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Check-in failed')
    },
  })

  const now = new Date()
  const isSlot = isWithinDuelgroundSlot(now)
  const isClaimed = checkinQuery.data?.claimed
  const isLoading = checkinQuery.isPending || checkinMut.isPending

  return (
    <ButtonWithFx
      disabled={!isSlot || isClaimed || isLoading}
      isLoading={isLoading}
      onClick={() => checkinMut.mutate()}
    >
      {isClaimed ? 'Checked in today' : 'Daily Check-in'}
    </ButtonWithFx>
  )
} 