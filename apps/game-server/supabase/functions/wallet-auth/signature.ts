import { verifyPersonalMessageSignature } from '@mysten/sui/verify';
import { Network } from './constants.ts'

export async function verifySignature(
  walletAddress: string,
  message: string,
  signature: string
): Promise<boolean> {
  try {
    const messageBytes = new TextEncoder().encode(message);
    const publicKey = await verifyPersonalMessageSignature(messageBytes, signature);
    return publicKey.verifyAddress(walletAddress);
  } catch (err) {
    console.error('Error verifying Sui signature:', err)
    return false
  }
}

export function getNetwork(): Network {
  const network = Deno.env.get('NETWORK') 
  if (!network || !['mainnet', 'devnet', 'testnet', 'localnet'].includes(network)) {
    throw new Error(`Invalid env varibale NETWORK`)
  }
  return network as Network || 'localnet'
}
