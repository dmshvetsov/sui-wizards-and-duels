import { AppError } from '@/lib/error'
import { useSuiClientContext } from '@mysten/dapp-kit'
import { isEnokiNetwork, registerEnokiWallets } from '@mysten/enoki'
import { useEffect } from 'react'

interface EnokiProviderProps {
  apiKey: string
  providers: {
    google?: {
      clientId: string
      redirectUrl?: string
    },
    twitter?: {
      clientId: string
      redirectUrl?: string
    }
  }
}

/**
 * Registers Enoki wallets for zkLogin authentication
 * This component should be rendered before the WalletProvider in the component tree
 */
export function EnokiSetup({ apiKey, providers }: EnokiProviderProps) {
  const { client, network } = useSuiClientContext()

  useEffect(() => {
    if (!isEnokiNetwork(network)) {
      new AppError('EnokiProvider', `"${network}" newtowrk is not supported by Enoki`).log()
      return
    }

    // Register Enoki wallets with the provided configuration
    const { unregister } = registerEnokiWallets({
      apiKey,
      providers,
      client,
      network,
    })

    // Clean up by unregistering wallets when the component unmounts
    // or when dependencies change
    return unregister
  }, [client, network, apiKey, providers])

  console.debug(`Enoki wallets registered for network ${network}`)
  // This component doesn't render anything
  return null
}
