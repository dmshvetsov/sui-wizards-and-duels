import { AuthenticatedComponentProps } from '../components/Authenticated';
import { useParams } from 'react-router-dom';
import { displayName } from '@/lib/user';

export function NewDuel({ userAccount }: AuthenticatedComponentProps) {
  const { player1Id, player2Id } = useParams<{ player1Id: string; player2Id: string }>()
  const opponent = (player1Id === userAccount.id ? player2Id : player1Id) || 'opponent'

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <h1 className="text-2xl font-semibold mb-2">New Duel</h1>
      <div className="mt-8 flex flex-col items-center">
        <p className="text-lg font-medium mb-4">Ready to begin your magical duel?</p>
        
        <div className="flex space-x-4 mb-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-2">
              <span className="text-2xl">🧙</span>
            </div>
            <p className="font-medium">You</p>
          </div>
          
          <div className="flex items-center">
            <span className="text-xl font-bold">vs</span>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-2">
              <span className="text-2xl">🧙‍♂️</span>
            </div>
            <p className="font-medium">{displayName(opponent)}</p>
          </div>
        </div>
        
        <p className="mt-6 text-sm text-gray-500">
          Prepare your spells and strategy. The duel will begin shortly.
        </p>
      </div>
    </div>
  )
}