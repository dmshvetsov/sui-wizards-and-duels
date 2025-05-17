import { LoginMenu } from '@/auth/LoginButton'

export function Signing() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="flex flex-col items-center">
        <LoginMenu redirectOnLgoin="/d" />
      </div>
    </div>
  )
}
