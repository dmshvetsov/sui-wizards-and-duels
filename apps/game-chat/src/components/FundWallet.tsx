import { useSuiClientContext } from '@mysten/dapp-kit'
import { SquareArrowOutUpRight } from 'lucide-react'
import { UserAccount } from './Authenticated'
import { Button } from './ui/button'

export function FundWallet({ userAccount }: { userAccount: UserAccount }) {
  const suiClientContext = useSuiClientContext()
  const walletAddress = userAccount.id

  const handleFundWallet = () => {
    if (suiClientContext.network !== 'devnet' && suiClientContext.network !== 'testnet') {
      throw new Error('Fund wallet is only available on devnetand testnet')
    }
    window.open(
      `https://faucet.sui.io/?network=${suiClientContext.network}&address=${walletAddress}`,
      '_blank'
    )
  }

  if (suiClientContext.network !== 'devnet' && suiClientContext.network !== 'testnet') {
    return null
  }

  return (
    <div className="bg-yellow-50 p-4 border border-yellow-500 rounded-md">
      <p className="mt-2">
        Whoa your wallet has not enough Sui to play the game.
      </p>
      <p className="mt-2">
        No problem, you can get some free tookens.
      </p>
      <Button className="mt-4" onClick={handleFundWallet}>
        Get {suiClientContext.network} Sui Tokens <SquareArrowOutUpRight />
      </Button>
      <p className="mt-2">
        Follow instructon on the next page to get {suiClientContext.network} Sui tokens.
      </p>
    </div>
  )
}
