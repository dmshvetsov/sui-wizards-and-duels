import { SquareArrowOutUpRight } from 'lucide-react'
import { Button } from './ui/button'
import { useSuiClientContext } from '@mysten/dapp-kit'

export function FundWallet({ walletAddress }: { walletAddress: string }) {
  const suiClientContext = useSuiClientContext()

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
    <>
      <div className="mt-4 p-4 border border-yellow-300 bg-yellow-50 rounded-md text-center">
        <h2 className="text-lg font-semibold text-yellow-800">Get Tokens to play</h2>
        <p className="mt-2 text-yellow-700">
          Whoops your wallet has not enough Sui to play. No problem, you can get some free tookens.
        </p>
      </div>
      <Button className="mt-4" onClick={handleFundWallet}>
        Get Test Sui Tokens <SquareArrowOutUpRight />
      </Button>
    </>
  )
}
