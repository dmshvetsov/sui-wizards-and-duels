import { Button } from '@/components/ui/button'
import { useDuel } from '@/context/DuelContext'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { getPidLatest } from '@/lib/protocol/package'
import { executeWith } from '@/lib/sui/client'
import { displayName } from '@/lib/user'
import { useSignAndExecuteTransaction, useSuiClient } from '@mysten/dapp-kit'
import { Transaction } from '@mysten/sui/transactions'
import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

export function Result() {
  const { duel, winner, loser } = useDuel()
  const currentUser = useCurrentUser()
  const navigate = useNavigate()

  const client = useSuiClient()
  const { mutate: signAndExecute } = useSignAndExecuteTransaction({
    execute: executeWith(client, { showRawEffects: true, showObjectChanges: true }),
  })
  const handleEndDuel = useCallback(() => {
    if (!duel) {
      toast.error('Duel data not available')
      return
    }

    const tx = new Transaction()
    tx.moveCall({
      target: `${getPidLatest()}::duel::end`,
      arguments: [tx.object(duel.id), tx.object('0x6')],
    })

    signAndExecute(
      {
        transaction: tx,
      },
      {
        onSuccess: (result) => {
          toast.success(`Successfully claimed reward!`)
          console.debug('End duel transaction result:', result)
          navigate('/d')
        },
        onError: (error) => {
          toast.error(`Failed to duel: ${error.message}`)
          console.error('End duel transaction error:', error)
        },
      }
    )
  }, [duel, signAndExecute, navigate])

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

  const isCurrentUserWinner = currentUser?.id === winner
  const isCurrentUserLoser = currentUser?.id === loser

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">Duel Results</h2>

      {winner ? (
        <div className="w-full mb-8">
          <div className="flex flex-col items-center mb-6">
            <div className="w-24 h-24 bg-yellow-100 rounded-full flex items-center justify-center mb-3 border-4 border-yellow-400">
              <span className="text-4xl">👑</span>
            </div>
            <p className="text-xl font-bold text-yellow-600">{displayName(winner)} Wins!</p>
          </div>

          <div className="w-full flex justify-between items-center mb-6">
            <div className="flex flex-col items-center">
              <div className={`w-16 h-16 ${wizard1 === winner ? 'bg-green-100' : 'bg-red-100'} rounded-full flex items-center justify-center mb-2`}>
                <span className="text-2xl">🧙</span>
              </div>
              <p className="font-semibold">{displayName(wizard1)}</p>
              <p className="text-sm text-gray-600">Final Force: {wizard1Force}</p>
              {wizard1 === winner && <p className="text-xs text-green-600 font-semibold mt-1">WINNER</p>}
              {wizard1 === loser && <p className="text-xs text-red-600 font-semibold mt-1">DEFEATED</p>}
            </div>

            <div className="text-xl font-bold">VS</div>

            <div className="flex flex-col items-center">
              <div className={`w-16 h-16 ${wizard2 === winner ? 'bg-green-100' : 'bg-red-100'} rounded-full flex items-center justify-center mb-2`}>
                <span className="text-2xl">🧙‍♂️</span>
              </div>
              <p className="font-semibold">{displayName(wizard2)}</p>
              <p className="text-sm text-gray-600">Final Force: {wizard2Force}</p>
              {wizard2 === winner && <p className="text-xs text-green-600 font-semibold mt-1">WINNER</p>}
              {wizard2 === loser && <p className="text-xs text-red-600 font-semibold mt-1">DEFEATED</p>}
            </div>
          </div>

          <div className="text-center mb-6">
            {isCurrentUserWinner ? (
              <p className="text-green-600 font-semibold">
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
          <p className="text-gray-700">
            The duel has ended, but no clear winner was determined.
          </p>
        </div>
      )}

      <Button
        onClick={handleEndDuel}
        className="w-full"
      >
        {isCurrentUserWinner ? 'Claim your opponent force and reward' : 'Claim participation reward'}
      </Button>
    </div>
  )
}
