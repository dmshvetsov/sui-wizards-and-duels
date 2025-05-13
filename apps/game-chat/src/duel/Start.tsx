import { UserAccount } from '@/components/Authenticated'
import { Button } from '@/components/ui/button'
import { useDuel } from '@/context/DuelContext'
import { displayName } from '@/lib/user'
import { useState } from 'react'

export function Start(props: { userAccount: UserAccount }) {
  const { duel, startDuel } = useDuel()
  const [isStarting, setIsStarting] = useState(false)
  // const autoSignWallet = useAutosignWallet(props.userAccount.publicKey)

  if (!duel) {
    return (
      <div className="flex flex-col items-center justify-center p-6 bg-white rounded-lg shadow-md">
        <p className="text-lg font-semibold text-gray-700">Loading duel data...</p>
      </div>
    )
  }

  const handleStartDuel = () => {
    setIsStarting(true)
    startDuel(
      { countdownSeconds: 10 },
      {
        onSuccess: (result) => {
          console.debug('Start duel transaction result:', result)
        },
        onError: (error) => {
          console.error('Start duel transaction error:', error)
        },
        onSettled: () => {
          setIsStarting(false)
        },
      }
    )
  }

  const wizard1 = duel.wizard1
  const wizard2 = duel.wizard2
  const wizard1Force = Number(duel.wizard1_force)
  const wizard2Force = Number(duel.wizard2_force)

  const isCurrentUserInDuel = props.userAccount.id === wizard1 || props.userAccount.id === wizard2
  const canStartDuel = isCurrentUserInDuel && !isStarting

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">Get ready for the Duel!</h2>

      <div className="w-full flex justify-between items-center mb-8">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-2">
            <span className="text-2xl">🧙</span>
          </div>
          <p className="font-semibold">
            {props.userAccount.id === wizard1 ? 'You' : displayName(wizard1)}
          </p>
          <p className="text-sm text-gray-600">Force: {wizard1Force}</p>
        </div>

        <div className="text-xl font-bold">VS</div>

        <div className="flex flex-col items-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-2">
            <span className="text-2xl">🧙‍♂️</span>
          </div>
          <p className="font-semibold">
            {props.userAccount.id === wizard2 ? 'You' : displayName(wizard2)}
          </p>
          <p className="text-sm text-gray-600">Force: {wizard2Force}</p>
        </div>
      </div>

      <div className="text-center mb-6">
        <p className="text-gray-700 mb-2">
          Both wizards have prepared their spells and are ready to duel.
        </p>
        <p className="text-gray-700">
          The first wizard to reduce their opponent's force to zero wins!
        </p>
      </div>

      {canStartDuel ? (
        <Button onClick={handleStartDuel} disabled={isStarting} className="w-full">
          {isStarting ? 'Starting Duel...' : 'Start Duel'}
        </Button>
      ) : (
        <p className="text-sm text-gray-500 italic">
          {isCurrentUserInDuel
            ? 'Waiting for the duel to start...'
            : 'You are spectating this duel'}
        </p>
      )}
    </div>
  )
}
