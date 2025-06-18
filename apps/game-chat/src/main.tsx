import { createNetworkConfig, SuiClientProvider, WalletProvider } from '@mysten/dapp-kit'
import { getFullnodeUrl } from '@mysten/sui/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import { EnokiSetup } from './auth/EnokiProvider'
import { appUrl } from './lib/utils.ts'

import '@mysten/dapp-kit/dist/index.css'
import './index.css'

const NETWORK = import.meta.env.VITE_DEFAULT_NETWORK || 'localnet'

const ENOKI_API_KEY = import.meta.env.VITE_ENOKI_API_KEY
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID
const TWITTER_CLIENT_ID = import.meta.env.VITE_TWITTER_CLIENT_ID
if (!ENOKI_API_KEY || typeof GOOGLE_CLIENT_ID !== 'string' || GOOGLE_CLIENT_ID.length === 0 || typeof TWITTER_CLIENT_ID !== 'string' || TWITTER_CLIENT_ID.length === 0) {
  throw new Error('missing configuration for ZKLogin')
}

// instantiate SuiClient from env
const { networkConfig } = createNetworkConfig({
  localnet: { url: getFullnodeUrl('localnet') },
  mainnet: { url: getFullnodeUrl('mainnet') },
  testnet: { url: getFullnodeUrl('testnet') },
  devnet: { url: getFullnodeUrl('devnet') },
})

const authProviders = {
  google: { clientId: GOOGLE_CLIENT_ID, redirectUrl: appUrl('/d') },
  twitter: { clientId: TWITTER_CLIENT_ID, redirectUrl: appUrl('/d') },
}

const queryClient = new QueryClient()
const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('#root element not found in the HTML file')
}

createRoot(rootElement).render(
  <QueryClientProvider client={queryClient}>
    <SuiClientProvider networks={networkConfig} defaultNetwork={NETWORK}>
      <EnokiSetup apiKey={ENOKI_API_KEY} providers={authProviders} />
      <WalletProvider autoConnect>
        <App />
      </WalletProvider>
    </SuiClientProvider>
  </QueryClientProvider>
)

