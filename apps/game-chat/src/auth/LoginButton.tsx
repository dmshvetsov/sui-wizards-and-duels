import { useConnectWallet, useCurrentAccount, useWallets } from '@mysten/dapp-kit'
import { isEnokiWallet, type EnokiWallet, type AuthProvider } from '@mysten/enoki'
import { Button } from '@/components/ui/button'

interface LoginButtonProps {
  provider: AuthProvider
  label?: string
  className?: string
}

/**
 * Custom login button for a specific authentication provider
 * This component renders a button that initiates the zkLogin flow for the specified provider
 */
export function LoginButton({ provider, label, className }: LoginButtonProps) {
  const { mutate: connect } = useConnectWallet()
  const wallets = useWallets().filter(isEnokiWallet)
  console.debug('wallets', wallets)
  
  // Find the wallet for the specified provider
  const wallet = wallets.find(wallet => wallet.provider === provider)
  
  if (!wallet) {
    return null
  }
  
  return (
    <Button
      className={className}
      onClick={() => {
        connect({ wallet }, { onSettled(res, err) {
          if (err) {
            console.error('Login error:', err)
          } else {
            console.log('Login result:', res)
          }
        }
      })}}
    >
      {label || `Sign in with ${provider.charAt(0).toUpperCase() + provider.slice(1)}`}
    </Button>
  )
}

/**
 * Component that displays login buttons for all available Enoki providers
 */
export function LoginMenu() {
  const currentAccount = useCurrentAccount()
  const wallets = useWallets().filter(isEnokiWallet)
  
  // Group wallets by provider
  const walletsByProvider = wallets.reduce(
    (map, wallet) => map.set(wallet.provider, wallet),
    new Map<AuthProvider, EnokiWallet>(),
  )
  
  // If user is already connected, don't show login buttons
  if (currentAccount) {
    return null
  }
  
  return (
    <div className="flex flex-col gap-2">
      {Array.from(walletsByProvider.keys()).map((provider) => (
        <LoginButton key={provider} provider={provider} />
      ))}
    </div>
  )
}
