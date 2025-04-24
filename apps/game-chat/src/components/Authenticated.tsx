import { useCurrentUser } from '@/hooks/useCurrentUser'
import { ConnectButton } from '@mysten/dapp-kit'

export type UserAccount = {
  id: string
  username: string
  displayName: string
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