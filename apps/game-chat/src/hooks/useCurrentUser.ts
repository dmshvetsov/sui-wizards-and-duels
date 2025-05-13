import { displayName } from '@/lib/user'
import { useCurrentAccount } from '@mysten/dapp-kit'
import { Ed25519PublicKey } from '@mysten/sui/keypairs/ed25519'
import { isEnokiWallet } from '@mysten/enoki'
import { PublicKey } from '@mysten/sui/cryptography'
import { useMemo } from 'react'

export function useCurrentUser() {
  const account = useCurrentAccount()
  const address = account?.address
  const publicKey = account?.publicKey ? account.publicKey.slice(0, 32) : null
  const isZkLogin = account?.wallet ? isEnokiWallet(account.wallet) : false

  console.log({ address, publicKey, isZkLogin })

  return useMemo(() => {
    if (!address) return null

    // For zkLogin accounts, we don't have a publicKey in the same format
    // but we still need to create a UserAccount object
    if (isZkLogin) {
      return {
        id: address,
        username: address,
        displayName: displayName(address),
        // For zkLogin, we use a placeholder PublicKey since we don't need the actual key
        // The actual signing is handled by the wallet adapter
        publicKey: publicKey ? new Ed25519PublicKey(publicKey) : ({} as PublicKey),
        isZkLogin: true,
      }
    }

    // For regular wallets, we need the publicKey
    if (!publicKey) return null

    return {
      id: address,
      username: address,
      displayName: displayName(address),
      publicKey: new Ed25519PublicKey(publicKey),
      isZkLogin: false,
    }
  }, [address, publicKey, isZkLogin])
}
