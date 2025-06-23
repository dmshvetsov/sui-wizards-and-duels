import { formatMistBalance } from '@/lib/sui/coin'
import { getClient } from '@/lib/supabase/client'
import { useSuiClientContext, useDisconnectWallet, useSuiClientQuery } from '@mysten/dapp-kit'
import { UserAccount } from './Authenticated'
import { Button } from './ui/button'
import { ClaimRewardButton } from '@/rewards/ClaimRewardButton'
import { DailyCheckinButton } from '@/rewards/DailyCheckinButton'

export function UserAccountMenu({ userAccount }: { userAccount: UserAccount }) {
  const suiClientContext = useSuiClientContext()
  const { mutate: disconnect } = useDisconnectWallet({
    onSuccess() {
      return getClient().auth.signOut()
    },
  })

  const balanceQuery = useSuiClientQuery(
    'getBalance', 
    {
      owner: userAccount.id,
      coinType: '0x2::sui::SUI',
    }
  )

  const balanceMist = balanceQuery.data ? balanceQuery.data.totalBalance : '0'

  const handleSignOut = async () => {
    disconnect()
  }

  return (
    <div className="fixed bottom-0 left-0 w-full flex gap-4 justify-center items-center animate-in fade-in slide-in-from-bottom-4 duration-580 px-12 py-8">
      <ClaimRewardButton />
      <DailyCheckinButton />
      <div>
        <span className="bg-gray-100 p-2 rounded-lg text-sm font-mono text-gray-500 ">{suiClientContext.network}</span>
      </div>
      <div>
        <span className="bg-gray-100 p-2 rounded-lg text-sm font-mono text-gray-500 ">{userAccount.id}</span>
      </div>
      <div className="flex items-center gap-2 font-mono">
        <span className="text-lg font-medium">{formatMistBalance(balanceMist)}</span>
        <span className="text-sm text-gray-600">Sui</span>
      </div>
      <Button variant="secondary" onClick={handleSignOut}>
        Sign Out
      </Button>
    </div>
  )
}
