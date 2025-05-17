import { useCurrentUser } from '@/hooks/useCurrentUser'
import { useDisconnectWallet } from '@mysten/dapp-kit'
import { PublicKey } from '@mysten/sui/cryptography'
import { useNavigate } from 'react-router-dom'
import { Button } from './ui/button'
import { Loader } from './Loader'
import { useEffect } from 'react'

export type UserAccount = {
  /** Uniq identifier of the user, piblic key address of the user account */
  id: string
  /** @deprecated in game username, public key address of the user account by default */
  username: string
  /** same as username but displayed in a more readable way, UI must use it */
  displayName: string
  /** Public key of the of the connected user account wallet */
  publicKey: PublicKey
  /** Whether this account is using zkLogin */
  isZkLogin?: boolean
}

export interface AuthenticatedComponentProps {
  userAccount: UserAccount
}

type AuthenticatedProps = {
  component: React.ComponentType<{ userAccount: UserAccount }>
}

export function Authenticated({ component: Component }: AuthenticatedProps) {
  const user = useCurrentUser()
  const { mutate: disconnect } = useDisconnectWallet()
  const navigate = useNavigate()

  useEffect(() => {
    if (!user) {
      navigate('/signin')
    }
  }, [user, navigate])

  const handleSignOut = () => {
    disconnect()
    navigate('/d')
  }

  if (!user) {
    return <Loader />
  }

  return (
    <>
      <div className="absolute top-4 right-4">
        <Button onClick={handleSignOut}>Sign Out</Button>
      </div>
      <Component userAccount={user} />
    </>
  )
}
