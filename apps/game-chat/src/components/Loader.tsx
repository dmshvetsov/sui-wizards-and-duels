import { LoaderPinwheel } from 'lucide-react'

export function Loader() {
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <div className="relative inline-flex">
        <div className="absolute transitiona-all -inset-2 bg-gradient-to-r from-[#44BCFF] via-[#FF44EC] to-[#FF675E] rounded-xl blur-lg animate-pulse"></div>
        <LoadingSpin />
      </div>
    </div>
  )
}

export function LoadingSpin() {
  return <LoaderPinwheel className="animate-spin" />
}
