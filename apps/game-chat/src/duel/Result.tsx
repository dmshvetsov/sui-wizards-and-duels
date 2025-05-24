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
import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

export function Result(props: { userAccount: UserAccount }) {
  const { duel, duelistCap, refetchDuelistCap, winner, loser } = useDuel()
  const navigate = useNavigate()
  const client = useSuiClient()
  const { mutate: signAndExecute, isPending: isTxInProgress } = useSignAndExecuteTransaction({
    execute: executeWith(client, { showRawEffects: true, showObjectChanges: true }),
  })

  // Calculate prize information early so it's available in callbacks
  const prizePool = duel ? mistToSui(duel.prize_pool|| '0') : 0
  const isCurrentUserWinner = props.userAccount.id === winner
  const isCurrentUserLoser = props.userAccount.id === loser

  const handleEndDuel = useCallback(() => {
    if (!duel || !duelistCap) {
      toast.error('Something went wrong')
      new AppError('handleEndDuel', new Error('duel or duelistCap is null')).log()
      return
    }

    const tx = new Transaction()
    tx.moveCall({
      target: `${getPidLatest()}::duel::end`,
      arguments: [
        tx.object(duel.id),
        tx.object(duelistCap.id),
      ],
    })

    signAndExecute(
      {
        transaction: tx,
      },
      {
        onSuccess: (result) => {
          if (isCurrentUserWinner && prizePool > 0) {
            toast.success(`Successfully claimed ${prizePool} SUI prize!`)
          } else {
            toast.success(`Duel ended successfully!`)
          }
          console.debug('End duel transaction result:', result)
        },
        onError: (err) => {
          const appErr = new AppError('handleEndDuel', err)
          toast.error(`Failed to duel: ${appErr.message}`)
          appErr.log()
        },
        onSettled: () => {
          refetchDuelistCap()
        },
      }
    )
  }, [duel, duelistCap, refetchDuelistCap, signAndExecute, isCurrentUserWinner, prizePool])

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
          <div className="w-full flex items-center mb-6">
            <div className="flex flex-col items-center w-1/3">
              <div
                className={`w-16 h-16 ${wizard1 === winner ? 'bg-yellow-300' : 'bg-gray-100'} rounded-full flex items-center justify-center mb-2`}
              >
                <span className="text-2xl">🧙</span>
              </div>
              <p className="font-semibold">{wizard1 === props.userAccount.id ? 'You' : displayName(wizard1)}</p>
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
              <p className="font-semibold">{wizard2 === props.userAccount.id ? 'You' : displayName(wizard2)}</p>
              <p className="text-sm text-gray-600">Final Force: {wizard2Force}</p>
              {wizard2 === winner && (
                <p className="text-xs font-semibold mt-1">WINNER</p>
              )}
              {wizard2 === loser && (
                <p className="text-xs text-red-800 font-semibold mt-1">DEFEATED</p>
              )}
            </div>
          </div>

          {/* Prize Information */}
          {prizePool > 0 && (
            <h3 className="text-lg font-semibold mt-8 text-center">Prize Pool {prizePool} Sui</h3>
          )}

          <div className="text-center mb-6">
            {isCurrentUserWinner ? (
              <div>
                <p className="mb-2">
                  Congratulations! You have won the duel and gained magical force!
                </p>
              </div>
            ) : isCurrentUserLoser ? (
              <div>
                <p className="mb-2">
                  You have been defeated. Train harder for the next duel.
                </p>
              </div>
            ) : (
              <p className="text-gray-600">
                The duel has concluded. {displayName(winner)} has emerged victorious!
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="text-center mb-6">
          <p className="text-gray-700">The duel has ended, but no clear winner was determined.</p>
        </div>
      )}

      {duelistCap != null ? (
        <ButtonWithFx onClick={handleEndDuel} disabled={isTxInProgress} isLoading={isTxInProgress}>
          {isCurrentUserWinner
            ? prizePool > 0
              ? `Claim ${prizePool} Sui Prize`
              : 'Claim Victory'
            : 'End Duel'}
        </ButtonWithFx>
      ) : (
        <Button onClick={handleNavigateToDuelgound}>
          Back to Duelground
        </Button>
      )}
    </div>
  )
}
