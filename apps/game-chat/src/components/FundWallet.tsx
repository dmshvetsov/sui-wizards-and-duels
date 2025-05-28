import { useSuiClientContext } from '@mysten/dapp-kit'
import { SquareArrowOutUpRight } from 'lucide-react'
import { Button } from './ui/button'
import { toast } from 'sonner'

export function FundWallet({ walletAddress }: { walletAddress: string }) {
  const suiClientContext = useSuiClientContext()

  const handleFundWallet = () => {
    if (suiClientContext.network !== 'devnet' && suiClientContext.network !== 'testnet') {
      toast.error('Fund wallet is only available on devnet and testnet')
      return
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
        Whoa, your wallet doesn't have enough Sui to play the game.
      </p>
      <p className="mt-2">
        No problem, you can get some free tokens.
      </p>
      <Button className="mt-4" onClick={handleFundWallet}>
        Get {suiClientContext.network} Sui Tokens <SquareArrowOutUpRight />
      </Button>
      <p className="mt-2">
        Follow the instructions on the next page to get {suiClientContext.network} Sui tokens.
      </p>
    </div>
  )
}
