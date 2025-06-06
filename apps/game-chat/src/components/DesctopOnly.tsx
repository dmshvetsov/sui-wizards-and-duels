import { Outlet } from 'react-router-dom'
import { useUserAgent } from '@/hooks/useUserAgent'

export function DesktopOnly() {
  const { isMobile } = useUserAgent()
  if (isMobile) {
    return (
      <div className="flex flex-col justify-center items-center w-screen h-screen text-center p-4">
        <h1>Desktop Required</h1>
        <p className="mt-4 text-gray-600">
          Wizards and Duels requires a desktop or laptop computer for the best gaming experience.
          Please switch to a desktop device to continue.
        </p>
      </div>
    )
  }

  return <Outlet />
}
