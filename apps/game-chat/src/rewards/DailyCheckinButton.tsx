import { Button, ButtonWithFx } from '@/components/ui/button'
import { AppError } from '@/lib/error'
import type { DailyCheckinStatusResult } from '@/lib/supabase/api'
import * as api from '@/lib/supabase/api'
import { useMutation, useQuery } from '@tanstack/react-query'
import { ClockAlert, SquareCheckBig } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

function isWithinDuelgroundSlot(date: Date) {
  const hour = date.getUTCHours()
  return (hour >= 11 && hour < 12) || (hour >= 20 && hour < 21)
}

export function DailyCheckinButton() {
  const [, setRerenderAt] = useState(Date.now())

  const checkinQuery = useQuery({
    queryKey: ['daily-checkin-status'],
    queryFn: async () => {
      return api.get<DailyCheckinStatusResult>('checkin')
    },
    refetchOnWindowFocus: false,
    staleTime: 60 * 1000,
  })

  const checkinMut = useMutation({
    mutationFn: async () => {
      return api.post<{ message: string }>('checkin', {})
    },
    onSuccess: (res) => {
      toast.success(res.message)
      checkinQuery.refetch()
    },
    onError: (err: unknown) => {
      const appErr = new AppError('DailyCheckinButton POST checkin', err)
      appErr.log()
      appErr.deriveUserMessage().then(toast.error)
    },
  })

  const now = new Date()
  const isClaimed = checkinQuery.data?.claimed
  const isLoading = checkinQuery.isPending || checkinMut.isPending

  if (!isWithinDuelgroundSlot(now)) {
    return (
      <Button
        variant="secondary"
        onClick={() => {
          toast('You can get 10 Mint Essence when you check-in during Duelground gatherings')
          setRerenderAt(Date.now())
        }}
      >
        <ClockAlert />
        Check-in (wait for the next Duelground gathering)
      </Button>
    )
  }

  if (isClaimed) {
    return (
      <Button
        variant="secondary"
        onClick={() =>
          toast('Come back tomorrow during Duelground gatherings to get additional 10 Mint Essence')
        }
      >
        <SquareCheckBig />
        Checked in Today
      </Button>
    )
  }

  return (
    <ButtonWithFx
      disabled={isClaimed || isLoading}
      isLoading={isLoading}
      onClick={() => checkinMut.mutate()}
      title="Check-in Daily during Duelground gatherings time for 10 Mint Essence reward"
    >
      Check-in
    </ButtonWithFx>
  )
}
