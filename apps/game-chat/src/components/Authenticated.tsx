import { useCurrentUser } from '@/hooks/useCurrentUser'
import { PublicKey } from '@mysten/sui/cryptography'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { GameMenu } from './GameMenu'
import { Loader } from './Loader'

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

type AuthenticatedProps = {
  component: React.ComponentType<{ userAccount: UserAccount }>
}

export function Authenticated({ component: Component }: AuthenticatedProps) {
  const userAccount = useCurrentUser()
  const navigate = useNavigate()

  useEffect(() => {
    if (!userAccount) {
      navigate('/signin')
    }
  }, [userAccount, navigate])

  if (!userAccount) {
    return <Loader />
  }

  return (
    <>
      <GameMenu userAccount={userAccount} />
      <Component userAccount={userAccount} />
    </>
  )
}
