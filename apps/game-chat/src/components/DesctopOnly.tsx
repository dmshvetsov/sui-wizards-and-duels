import { Outlet } from 'react-router-dom'
import { useUserAgent } from '@/hooks/useUserAgent'

export function DesctopOnly() {
  const { isMobile } = useUserAgent()
  if (isMobile) {
    return (
      <div className="flex flex-col justify-center items-center w-[400px] h-screen m-auto text-center p-4">
        <h1>Use a Desktop device to play</h1>
        <p className="mt-4">Wizards and Duels is only available on Desktop for now</p>
      </div>
    )
  }

  return <Outlet />
}
