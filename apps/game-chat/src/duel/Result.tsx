import { UserAccount } from '@/components/Authenticated'
import { Button, ButtonWithFx } from '@/components/ui/button'
import { useDuel } from '@/context/DuelContext'
import { AppError } from '@/lib/error'
import { getPidLatest } from '@/lib/protocol/package'
import { executeWith } from '@/lib/sui/client'
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
          toast.success(`Successfully claimed reward!`)
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
  }, [duel, duelistCap, refetchDuelistCap, signAndExecute])

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

  const isCurrentUserWinner = props.userAccount.id === winner
  const isCurrentUserLoser = props.userAccount.id === loser

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">Duel Results</h2>

      {winner ? (
        <div className="w-full mb-8">
          <div className="flex flex-col items-center mb-6">
            <div className="w-24 h-24 flex items-center justify-center mb-4">
              <span className="text-4xl">👑</span>
            </div>
            <p className="text-xl font-bold">{displayName(winner)} Wins!</p>
          </div>

          <div className="w-full flex justify-between items-center mb-6">
            <div className="flex flex-col items-center">
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

            <div className="text-xl font-bold">VS</div>

            <div className="flex flex-col items-center">
              <div
                className={`w-16 h-16 ${wizard2 === winner ? 'bg-yerllow-300' : 'bg-gray-100'} rounded-full flex items-center justify-center mb-2`}
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

          <div className="text-center mb-6">
            {isCurrentUserWinner ? (
              <p className="font-semibold">
                Congratulations! You have won the duel and gained magical force!
              </p>
            ) : isCurrentUserLoser ? (
              <p className="text-red-600 font-semibold">
                You have been defeated. Train harder for the next duel!
              </p>
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
            ? 'Claim your opponent force and reward'
            : 'Claim participation reward'}
        </ButtonWithFx>
      ) : (
        <Button onClick={handleNavigateToDuelgound}>
          Back to Duelground
        </Button>
      )}
    </div>
  )
}
