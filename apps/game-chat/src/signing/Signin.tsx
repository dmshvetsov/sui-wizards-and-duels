import { LoginMenu } from '@/auth/LoginButton'

export function SignIn() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="flex flex-col items-center gap-4 pt-8">
        <h1 className="mb-4">Wizards n Duels</h1>

        {/* Enoki zkLogin */}
        <LoginMenu redirectOnLgoin="/d" />
      </div>
    </div>
  )
}
