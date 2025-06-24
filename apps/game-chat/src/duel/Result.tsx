import { UserAccount } from '@/components/Authenticated'
import { Button, ButtonWithFx } from '@/components/ui/button'
import { useDuel } from '@/context/DuelContext'
import { AppError } from '@/lib/error'
import { getPidLatest } from '@/lib/protocol/package'
import { executeWith } from '@/lib/sui/client'
import { mistToSui } from '@/lib/sui/coin'
import { displayName } from '@/lib/user'
import { useSignAndExecuteTransaction, useSuiClient } from '@mysten/dapp-kit'
import { Transaction } from '@mysten/sui/transactions'
import { useCallback, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import * as api from '@/lib/supabase/api'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { LootCard } from '@/components/LootCard'
import { timeInLocal } from '@/lib/rewards'

export function Result(props: { userAccount: UserAccount }) {
  const { duel, duelistCap, refetchDuelistCap, winner, loser } = useDuel()
  const navigate = useNavigate()
  const client = useSuiClient()
  const { mutate: signAndExecute, isPending: isTxInProgress } = useSignAndExecuteTransaction({
    execute: executeWith(client, { showRawEffects: true, showObjectChanges: true }),
  })

  const availableRewardQuery = useQuery({
    queryKey: ['available-reward', duel?.id],
    enabled: !!duel?.id,
    queryFn: () => api.getAvailableReward(duel!.id),
    staleTime: Infinity,
    refetchInterval: 0,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  })

  const duelRewardPointsMut = useMutation({
    mutationKey: ['duel-reward', duel?.id],
    mutationFn: (duelId: string) =>
      api.post<{ totalReward: number; points: number; message: string }>('duel-reward', { duelId }),
  })

  const prizePool = duel ? mistToSui(duel.prize_pool || '0') : 0
  const isCurrentUserWinner = props.userAccount.id === winner
  const isCurrentUserLoser = props.userAccount.id === loser
  const [isEndTxSent, setEndTxSent] = useState(false)

  const handleEndDuel = useCallback(() => {
    if (!duel || !duelistCap) {
      toast.error('Something went wrong')
      new AppError('handleEndDuel', new Error('duel or duelistCap is null')).log()
      return
    }

    duelRewardPointsMut.mutate(duel.id, {
      onSuccess(data) {
        toast.success(data.message)
      },
      onError(err) {
        const appErr = new AppError('Result POST duel-reward', err)
        appErr.log()
        appErr.deriveUserMessage().then(toast.error)
      },
    })

    const tx = new Transaction()
    tx.moveCall({
      target: `${getPidLatest()}::duel::end`,
      arguments: [tx.object(duel.id), tx.object(duelistCap.id)],
    })
    tx.setGasBudget(2_000_000)

    signAndExecute(
      {
        transaction: tx,
      },
      {
        onSuccess(result) {
          if (isCurrentUserWinner && prizePool > 0) {
            toast.success(`Successfully claimed ${prizePool} SUI prize!`)
          } else {
            toast.success(`Duel ended successfully!`)
          }
          setEndTxSent(true)
          console.debug('End duel transaction result:', result)
        },
        onError(err) {
          const appErr = new AppError('handleEndDuel', err)
          toast.error(`Failed to duel: ${appErr.message}`)
          appErr.log()
        },
        onSettled() {
          refetchDuelistCap()
        },
      }
    )
  }, [
    duel,
    duelistCap,
    refetchDuelistCap,
    signAndExecute,
    isCurrentUserWinner,
    prizePool,
    duelRewardPointsMut,
  ])

  const handleNavigateToDuelgound = useCallback(() => {
    navigate('/d')
  }, [navigate])

  if (!duel) {
    return (
      <div className="flex flex-col items-center justify-center p-6 bg-white rounded-lg shadow-md">
        <p className="text-lg font-semibold text-gray-700">Loading duel results...</p>
      </div>
    )
  }

  const wizard1 = duel.wizard1
  const wizard2 = duel.wizard2
  const wizard1Force = Number(duel.wizard1_force)
  const wizard2Force = Number(duel.wizard2_force)

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-white rounded-lg shadow-md h-screen">
      <h2 className="text-2xl font-bold text-center mb-8">Duel Results</h2>

      {winner ? (
        <div className="w-full mb-8">
          <div className="w-full flex items-center mb-8">
            <div className="flex flex-col items-center w-1/3">
              <div
                className={`w-16 h-16 ${wizard1 === winner ? 'bg-yellow-300' : 'bg-gray-100'} rounded-full flex items-center justify-center mb-2`}
              >
                <span className="text-2xl">🧙</span>
              </div>
              <p className="font-semibold">
                {wizard1 === props.userAccount.id ? 'You' : displayName(wizard1)}
              </p>
              <p className="text-sm text-gray-600">Final Force: {wizard1Force}</p>
              {wizard1 === winner && (
                <p className="text-xs text-lime-800 font-semibold mt-1">WINNER</p>
              )}
              {wizard1 === loser && (
                <p className="text-xs text-red-800 font-semibold mt-1">DEFEATED</p>
              )}
            </div>

            <div className="text-xl font-bold grow text-center">VS</div>

            <div className="flex flex-col items-center w-1/3">
              <div
                className={`w-16 h-16 ${wizard2 === winner ? 'bg-yellow-300' : 'bg-gray-100'} rounded-full flex items-center justify-center mb-2`}
              >
                <span className="text-2xl">🧙‍♂️</span>
              </div>
              <p className="font-semibold">
                {wizard2 === props.userAccount.id ? 'You' : displayName(wizard2)}
              </p>
              <p className="text-sm text-gray-600">Final Force: {wizard2Force}</p>
              {wizard2 === winner && <p className="text-xs font-semibold mt-1">WINNER</p>}
              {wizard2 === loser && (
                <p className="text-xs text-red-800 font-semibold mt-1">DEFEATED</p>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center mb-6">
          <p className="text-gray-700">The duel has ended, but no clear winner was determined.</p>
        </div>
      )}

      <div className="h-[500px] text-center">
        {duelistCap != null ? (
          <>
            <div className="flex flex-wrap justify-center items-center gap-4">
              {isCurrentUserWinner && prizePool > 0 && (
                <LootCard title={`${prizePool} Sui`} description="Prize pool of the duel" />
              )}
              {isCurrentUserLoser && prizePool > 0 && (
                <LootCard title={`-${prizePool / 2} Sui`} description="You have lost your bet" />
              )}
              <LootCard
                title={
                  availableRewardQuery.isSuccess
                    ? `${availableRewardQuery.data.availableReward} ESNC`
                    : '...'
                }
                description="Mint Essence reward"
              />
            </div>

            <div className="text-center mt-6 mb-12">
              {isCurrentUserWinner ? (
                <div>
                  <p className="mb-2">
                    Congratulations! You have won the duel and gained magical Sui force and earned
                    Mint Essence reward!
                  </p>
                </div>
              ) : isCurrentUserLoser ? (
                <div>
                  <p className="mb-2">
                    You have been defeated but earned Mint Essence reward! Keep pushing fight for
                    future prizes and guaranteed rewards!
                  </p>
                </div>
              ) : winner ? (
                <p className="text-gray-600">
                  The duel has concluded. {displayName(winner)} has emerged victorious!
                </p>
              ) : (
                <p className="text-gray-600">
                  The duel has ended, but no clear winner was determined.
                </p>
              )}
            </div>
            <ButtonWithFx
              onClick={handleEndDuel}
              disabled={isTxInProgress || (duelistCap != null && isEndTxSent)}
              isLoading={isTxInProgress || (duelistCap != null && isEndTxSent)}
            >
              {isCurrentUserWinner
                ? prizePool > 0
                  ? `Claim Prize and Mint Essence Reward`
                  : 'Claim Mint Essence Reward'
                : 'End Duel'}
            </ButtonWithFx>
            {/* Reward Explanation */}
            <p className="text-sm text-muted-foreground my-6">
              Ending the duel will grant Mint Essence (ESNC) points:
              <br />• 10 ESNC for participating in the duel
              <br />• +10 ESNC if this is your first duel versus this opponent
              <br />• +10 ESNC if the duel was fought during a Duelground gathering slot{' '}
              {timeInLocal[0].start}-{timeInLocal[0].end} or {timeInLocal[1].start}-
              {timeInLocal[1].end} ({Intl.DateTimeFormat().resolvedOptions().timeZone} time)
              <br />• you can earn as many ESNC without limits but can 5000 ESNC max is redeemable
            </p>
          </>
        ) : (
          <Button onClick={handleNavigateToDuelgound}>Back to Duelground</Button>
        )}
      </div>
    </div>
  )
}
