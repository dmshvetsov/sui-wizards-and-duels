import { AppError } from '@/lib/error.ts'
import { getClient } from '@/lib/supabase/client.ts'
import { createOrUpdateUserAccount } from '@/lib/supabase/users.ts'
import { displayName } from '@/lib/user'
import { useCurrentAccount, useCurrentWallet, useSuiClientContext } from '@mysten/dapp-kit'
import { createDefaultEncryption } from '@mysten/enoki'
import { useEffect } from 'react'

const ENOKI_API_KEY = import.meta.env.VITE_ENOKI_API_KEY ?? ''
if (!ENOKI_API_KEY) {
  throw new Error('missing configuration for ZKLogin')
}

/**
 * Setup application to communicate with API
 * interfeates wallet ZkLogin with API authentication
 */
export function AppClientSetup() {
  const network = useSuiClientContext().network
  const wallet = useCurrentWallet()
  const account = useCurrentAccount()

  const address = account?.address ?? null
  const { connectionStatus } = wallet
  useEffect(() => {
    if (!network) {
      console.debug(`sui client network is misconfigured, current value ${network}`)
      return
    }

    if (connectionStatus === 'disconnected') {
      getClient()
        .auth.getSession()
        .then((res) => {
          if (res.data.session) {
            getClient().auth.signOut()
          }
        })
    } else if (connectionStatus === 'connected') {
      const enc = createDefaultEncryption()
      const val = sessionStorage.getItem(`@enoki/flow/session/${ENOKI_API_KEY}/${network}`) ?? ''
      enc
        .decrypt(ENOKI_API_KEY, val)
        .then((res) => {
          if (!res) {
            throw new Error('failed to read zklogin token')
          }

          const session = JSON.parse(res) as { jwt?: string }
          if (!session.jwt) {
            throw new Error('current session missing token')
          }

          getClient()
            .auth.signInWithIdToken({ provider: 'google', token: session.jwt })
            .then((authRes) => {
              if (authRes.error) {
                throw authRes.error
              }

              if (address) {
                createOrUpdateUserAccount(address, displayName(address)).catch((err) => {
                  new AppError('createOrUpdateUserAccount', err).log()
                })
              }
            }).catch(err => {
              new AppError('signInWithIdToken', err).log()
            })
        })
        .catch(err => {
          new AppError('createOrUpdateUserAccount', err).log()
        })
    }
  }, [network, address, connectionStatus])

  return null
}
