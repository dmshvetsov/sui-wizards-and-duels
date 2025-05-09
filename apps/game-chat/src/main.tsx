import { createNetworkConfig, SuiClientProvider, WalletProvider } from '@mysten/dapp-kit'
import { getFullnodeUrl } from '@mysten/sui/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'

const DEFAULT_NETWORK = import.meta.env.VITE_DEFAULT_NETWORK || 'localnet'

import '@mysten/dapp-kit/dist/index.css'
import './index.css'

// instantiate SuiClient from env
const { networkConfig } = createNetworkConfig({
  localnet: { url: getFullnodeUrl('localnet') },
  mainnet: { url: getFullnodeUrl('mainnet') },
  testnet: { url: getFullnodeUrl('testnet') },
  devnet: { url: getFullnodeUrl('devnet') },
})

const queryClient = new QueryClient()
const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('#root element not found in the HTML file')
}

createRoot(rootElement).render(
  <QueryClientProvider client={queryClient}>
    <SuiClientProvider networks={networkConfig} defaultNetwork={DEFAULT_NETWORK}>
      <WalletProvider>
        <App />
      </WalletProvider>
    </SuiClientProvider>
  </QueryClientProvider>
)
