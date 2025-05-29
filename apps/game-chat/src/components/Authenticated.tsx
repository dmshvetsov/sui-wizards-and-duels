import { useCurrentUser } from '@/hooks/useCurrentUser'
import { PublicKey } from '@mysten/sui/cryptography'
import { Session } from '@supabase/supabase-js'
import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { getClient } from '../lib/supabase/client'
import { Loader } from './Loader'
import { SignIn } from '@/signing/Signin'
import { logIn } from '@/lib/auth'
import { useSuiClientContext } from '@mysten/dapp-kit'
import { isDevnetEnv } from '@/lib/config'

export type UserAccount = {
  /** Uniq identifier of the user, piblic key address of the user account */
  id: string
  /** @deprecated in game username, public key address of the user account by default */
  username: string
  /** same as username but displayed in a more readable way, UI must use it */
  displayName: string
  /** Public key of the of the connected user account wallet */
  publicKey: PublicKey
}

export interface AuthenticatedComponentProps {
  userAccount: UserAccount
}

type WithUserAccountProps = {
  Component: React.ComponentType<{ userAccount: UserAccount }>
}

export function WithUserAccount({ Component }: WithUserAccountProps) {
  const userAccount = useCurrentUser()
  if (!userAccount) {
    return <Loader />
  }
  return <Component userAccount={userAccount} />
}

export function AuthenticatedPage() {
  const userAccount = useCurrentUser()
  const suiCLientContext = useSuiClientContext()
  const [session, setSession] = useState<Session | null>(null)

  const network = suiCLientContext.network
  const address = userAccount?.id ?? null
  useEffect(() => {
    console.log('AuthenticatedPage', { address })
    if (!address) {
      return
    }
    if (!session) {
      logIn(address, network).then(({ session }) => {
        setSession(session)
      })
    }
  }, [session, setSession, network, address])

  useEffect(() => {
    const listener = getClient().auth.onAuthStateChange((event, session) => {
      console.debug('AuthenticatedPage onAuthStateChange', { event, session })
      setSession(session)
    })
    return () => listener.data.subscription.unsubscribe()
  }, [])

  if (!userAccount) {
    return (
      <>
        {isDevnetEnv && (
          <div className="absolute top-0 left-0 text-sm font-mono p-4">
            <pre>{JSON.stringify({ userAccount, session }, null, 2)}</pre>
          </div>
        )}
        <SignIn />
      </>
    )
  }

  if (!session) {
    return <Loader />
  }

  return <Outlet />
}
