import { useCurrentAccount } from '@mysten/dapp-kit'
import { useMemo } from 'react'

export function useCurrentUser() {
  const account = useCurrentAccount()
  const address = account?.address

  return useMemo(() => {
    if (!address) return null

    return {
      username: address,
      // displayName: useResolveSuiNSName(address).data,
      displayName: address?.slice(0, 6) + '..' + address?.slice(-4),
    }
  }, [address])
}
