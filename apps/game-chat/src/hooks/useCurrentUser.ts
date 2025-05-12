import { displayName } from '@/lib/user'
import { useCurrentAccount } from '@mysten/dapp-kit'
import { Ed25519PublicKey } from '@mysten/sui/keypairs/ed25519'
import { useMemo } from 'react'

export function useCurrentUser() {
  const account = useCurrentAccount()
  const address = account?.address
  const publicKey = account?.publicKey ? account.publicKey.slice(0, 32) : null

  console.log({ address, publicKey })

  return useMemo(() => {
    if (!address || !publicKey) return null

    return {
      id: address,
      username: address,
      // displayName: useResolveSuiNSName(address).data,
      displayName: displayName(address),
      publicKey: new Ed25519PublicKey(publicKey),
    }
  }, [address, publicKey])
}
