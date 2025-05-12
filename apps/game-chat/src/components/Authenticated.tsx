import { useCurrentUser } from '@/hooks/useCurrentUser'
import { ConnectButton } from '@mysten/dapp-kit'
import { PublicKey } from '@mysten/sui/cryptography'

export type UserAccount = {
  /** address of the user account */
  id: string
  username: string
  displayName: string
  publicKey: PublicKey
}

export interface AuthenticatedComponentProps {
  userAccount: UserAccount
}

type AuthenticatedProps = {
  component: React.ComponentType<{ userAccount: UserAccount }>
}

export function Authenticated({ component: Component }: AuthenticatedProps) {
  const user = useCurrentUser()
  
  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <ConnectButton />
      </div>
    )
  }

  return <Component userAccount={user} />
}
