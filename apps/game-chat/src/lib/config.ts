type Network = 'mainnet' | 'testnet' | 'devnet' | 'localnet'

export const baseUrl = import.meta.env.VITE_APP_BASE_URL || 'http://localhost:3000'

export const network: Network = import.meta.env.VITE_DEFAULT_NETWORK || 'localnet'
if (network !== 'localnet' && network !== 'testnet' && network !== 'devnet' && network !== 'mainnet') {
  throw new Error(`[config] | Invalid network configuration`)
}

export const isLocalnetEnv = network === 'localnet'
export const isDevnetEnv = network === 'devnet'
export const isTestnetEnv = network === 'testnet'
export const isMainnetEnv = network === 'mainnet'

export const treasuryAddress = import.meta.env.VITE_TREASURY_ADDRESS || '0x0'

export const welcomeReward = Object.freeze({
  sui: 2,
  esnc: 50
})
