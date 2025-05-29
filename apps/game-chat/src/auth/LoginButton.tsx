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
import {
  isEnokiWallet,
  type AuthProvider,
  type EnokiWallet,
} from '@mysten/enoki'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

interface LoginButtonProps {
  provider: AuthProvider
  label?: string
  className?: string
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
              // const enc = createDefaultEncryption()
              // const val =
              //   sessionStorage.getItem(`@enoki/flow/session/${ENOKI_API_KEY}/${network}`) ?? ''
              // enc
              //   .decrypt(ENOKI_API_KEY, val)
              //   .then((res) => {
              //     if (!res) {
              //       throw new Error('failed to read zklogin token')
              //     }
              //
              //     const session = JSON.parse(res) as { jwt?: string }
              //     if (!session.jwt) {
              //       throw new Error('current session missing token')
              //     }
              //
              //     getClient()
              //       .auth.signInWithIdToken({ provider: 'google', token: session.jwt })
              //       .then((authRes) => {
              //         if (authRes.error) {
              //           throw authRes.error
              //         }
              //
              //         createOrUpdateUserAccount(address)
              //           .then(() => {
              //             console.log('INITIALIZED')
              //           })
              //           .catch((err) => {
              //             disconnect()
              //             new AppError('createOrUpdateUserAccount', err).log()
              //           })
              //       })
              //       .catch((err) => {
              //         disconnect()
              //         new AppError('signInWithIdToken', err).log()
              //       })
              //   })
              //   .catch((err) => {
              //     disconnect()
              //     new AppError('createOrUpdateUserAccount', err).log()
              //   })
            },
          }
        )
      }}
    >
      {label || `Sign in with ${provider.charAt(0).toUpperCase() + provider.slice(1)}`}
    </ButtonWithFx>
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

function getSelectedAccount(connectedAccounts: readonly WalletAccount[], accountAddress?: string) {
  if (connectedAccounts.length === 0) {
    return null
  }

  if (accountAddress) {
    const selectedAccount = connectedAccounts.find((account) => account.address === accountAddress)
    return selectedAccount ?? connectedAccounts[0]
  }

  return connectedAccounts[0]
}
