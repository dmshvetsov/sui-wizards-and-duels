import { formatMistBalance } from '@/lib/sui/coin'
import { useDisconnectWallet, useSuiClientQuery } from '@mysten/dapp-kit'
import { useNavigate } from 'react-router-dom'
import { UserAccount } from './Authenticated'
import { Button } from './ui/button'

export function GameMenu({ userAccount }: { userAccount: UserAccount }) {
  const { mutate: disconnect } = useDisconnectWallet()
  const navigate = useNavigate()

  const balanceQuery = useSuiClientQuery(
    'getBalance',
    {
      owner: userAccount.id,
      coinType: '0x2::sui::SUI',
    },
  )

  const balanceMist = balanceQuery.data ? balanceQuery.data.totalBalance : '0'

  const handleSignOut = async () => {
    disconnect()
    navigate('/signin')
  }

  return (
    <div className="fixed bottom-0 left-0 w-full flex gap-4 justify-center items-center px-12 py-8">
      <div>
        <span className="bg-gray-100 p-2 rounded-lg text-sm font-mono text-gray-500 ">{userAccount.id}</span>
      </div>
      <div className="flex items-center gap-2 font-mono">
        <span className="text-lg font-medium">{formatMistBalance(balanceMist)}</span>
        <span className="text-sm text-gray-600">Sui</span>
      </div>
      <Button variant="secondary" onClick={handleSignOut}>Sign Out</Button>
    </div>
  )
}
