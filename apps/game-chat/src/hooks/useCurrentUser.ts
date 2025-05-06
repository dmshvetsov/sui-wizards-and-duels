import { displayName } from '@/lib/user'
import { useCurrentAccount } from '@mysten/dapp-kit'
import { useMemo } from 'react'

export function useCurrentUser() {
  const account = useCurrentAccount()
  const address = account?.address

  return useMemo(() => {
    if (!address) return null

    return {
      id: address,
      username: address,
      // displayName: useResolveSuiNSName(address).data,
      displayName: displayName(address),
    }
  }, [address])
}
