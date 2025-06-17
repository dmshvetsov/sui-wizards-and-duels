import { Loader } from '@/components/Loader'
import { ButtonWithFx } from '@/components/ui/button'
import { logIn } from '@/lib/auth'
import {
  useConnectWallet,
  useCurrentAccount,
  useDisconnectWallet,
  useSuiClientContext,
  useWallets,
} from '@mysten/dapp-kit'
import { isEnokiWallet, type AuthProvider, type EnokiWallet } from '@mysten/enoki'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

interface LoginButtonProps {
  provider: AuthProvider
  label?: string
}

const ENOKI_API_KEY = import.meta.env.VITE_ENOKI_API_KEY ?? ''
if (!ENOKI_API_KEY) {
  throw new Error('missing configuration for ZKLogin')
}

/**
 * Custom login button for a specific authentication provider
 * This component renders a button that initiates the zkLogin flow for the specified provider
 */
export function LoginButton({ provider, label }: LoginButtonProps) {
  const { mutate: connect } = useConnectWallet()
  const { mutate: disconnect } = useDisconnectWallet()
  const wallets = useWallets().filter(isEnokiWallet)
  const network = useSuiClientContext().network

  // Find the wallet for the specified provider
  const wallet = wallets.find((wallet) => wallet.provider === provider)

  if (!wallet) {
    return null
  }
  if (!network) {
    console.debug(`sui client network is misconfigured, current value ${network}`)
    return
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <ButtonWithFx
        onClick={() => {
          connect(
            { wallet },
            {
              onSuccess(res) {
                const account = getSelectedAccount(res.accounts)
                const address = account?.address ?? null
                if (!address) {
                  return
                }
                logIn(address, network).catch(() => disconnect())
              },
            }
          )
        }}
      >
        {label || `Sign in with ${provider.charAt(0).toUpperCase() + provider.slice(1)}`}
      </ButtonWithFx>
      {provider === 'google' && (
        <p className="text-gray-500 text-center max-w-xs">
          We do not store any information from your Google account. 'Sign in with Google' is only
          used to create an in-game non-custodial wallet that is controlled solely by you, ensuring
          the best in-game experience.
        </p>
      )}
    </div>
  )
}

/**
 * Component that displays login buttons for all available Enoki providers
 */
export function LoginMenu({ redirectOnLgoin }: { redirectOnLgoin: string }) {
  const currentAccount = useCurrentAccount()
  const wallets = useWallets().filter(isEnokiWallet)
  const navigate = useNavigate()

  // Group wallets by provider
  const walletsByProvider = wallets.reduce(
    (map, wallet) => map.set(wallet.provider, wallet),
    new Map<AuthProvider, EnokiWallet>()
  )

  useEffect(() => {
    if (currentAccount) {
      navigate(redirectOnLgoin)
    }
  }, [currentAccount, navigate, redirectOnLgoin])

  // If user is already connected, don't show login buttons
  if (currentAccount) {
    return <Loader />
  }

  return (
    <div className="flex flex-col gap-2">
      {Array.from(walletsByProvider.keys()).map((provider) => (
        <LoginButton key={provider} provider={provider} />
      ))}
    </div>
  )
}

function getSelectedAccount(accounts: any, accountAddress?: string) {
  if (accounts.length === 0) {
    return null
  }

  if (accountAddress) {
    const selectedAccount = accounts.find((account) => account.address === accountAddress)
    return selectedAccount ?? accounts[0]
  }

  return accounts[0]
}
