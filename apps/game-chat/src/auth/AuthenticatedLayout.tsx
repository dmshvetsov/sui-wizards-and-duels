import { Loader } from '@/components/Loader'
import { AppError } from '@/lib/error.ts'
import { getClient } from '@/lib/supabase/client.ts'
import { createOrUpdateUserAccount } from '@/lib/supabase/users.ts'
import { displayName } from '@/lib/user'
import { useCurrentAccount, useCurrentWallet, useDisconnectWallet, useSuiClientContext } from '@mysten/dapp-kit'
import { createDefaultEncryption } from '@mysten/enoki'
import { useEffect, useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'

const ENOKI_API_KEY = import.meta.env.VITE_ENOKI_API_KEY ?? ''
if (!ENOKI_API_KEY) {
  throw new Error('missing configuration for ZKLogin')
}

export function AuthenticatedLayout() {
  const [isInitialized, setInitialized] = useState(false)
  const network = useSuiClientContext().network
  const wallet = useCurrentWallet()
  const account = useCurrentAccount()
  const navigate = useNavigate()
  const { mutate: disconnect } = useDisconnectWallet()

  const address = account?.address ?? null
  const { connectionStatus } = wallet

  console.log({ wallet, account })
  useEffect(() => {
    if (!network) {
      console.debug(`sui client network is misconfigured, current value ${network}`)
      return
    }
    if (!address) {
      return
    }

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
              createOrUpdateUserAccount(address, displayName(address))
                .then(() => {
                  console.log('INITIALIZED')
                  setInitialized(true)
                })
                .catch((err) => {
                  new AppError('createOrUpdateUserAccount', err).log()
                })
            }
          })
          .catch((err) => {
            disconnect()
            new AppError('signInWithIdToken', err).log()
          })
      })
      .catch((err) => {
        new AppError('createOrUpdateUserAccount', err).log()
      })
  }, [address, disconnect, network])

  useEffect(() => {
    console.log('log out handler', { connectionStatus })
    if (connectionStatus === 'disconnected') {
      getClient()
        .auth.getSession()
        .then((res) => {
          if (res.data.session) {
            getClient().auth.signOut()
          }
        }).finally(() => {
          navigate('/signin')
        })
    }
  }, [connectionStatus, navigate])

  if (!address || !network || !isInitialized) {
    return <Loader />
  }

  return <Outlet />
}
