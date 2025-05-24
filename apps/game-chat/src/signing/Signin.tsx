import { LoginMenu } from '@/auth/LoginButton'

export function Signing() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="flex flex-col items-center gap-4">
        <h1 className="mb-4">Wizards n Duels</h1>

        {/* Enoki zkLogin */}
        <div className="mb-4">
          <LoginMenu redirectOnLgoin="/d" />
        </div>
      </div>
    </div>
  )
}
