import { useEffect, useState } from "react"

interface CountdownTimerProps {
  to: number
  className?: string
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  animate?: boolean
}

/**
 * CountdownTimer component that displays time in minutes:seconds format
 *
 * @param to - Timestamp to count down
 * @param className - Additional CSS classes to apply
 * @param size - Size variant (sm, md, lg)
 * @param showLabel - Whether to show the "Minutes : Seconds" label
 * @param animate - Whether to apply a pulse animation
 */
export function CountdownTimer({
  to,
  className = '',
  size = 'md',
  showLabel = false,
  animate = false,
}: CountdownTimerProps) {
  const [secondsLeft, setCountdown] = useState<number | null>(null)

  useEffect(() => {
    const intervalId = setInterval(() => {
      const remainingSeconds = Math.max(0, Math.floor((to - Date.now()) / 1000))

      setCountdown(remainingSeconds)

      // Clear interval when countdown reaches 0
      if (remainingSeconds <= 0) {
        clearInterval(intervalId)
      }
    }, 1000)

    // Clean up interval on unmount or when duel state changes
    return () => clearInterval(intervalId)
  }, [to])

  const sizeClasses = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl',
  }[size]

  const animationClass = animate ? 'animate-pulse' : ''

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div
        className={`font-mono ${sizeClasses} ${animationClass} ${size !== 'lg' ? 'bg-gray-100 px-4 py-2 rounded-lg shadow-inner' : ''}`}
      >
        {formatTime(secondsLeft)}
      </div>

      {showLabel && <p className="text-sm text-gray-500 mt-1">Minutes : Seconds</p>}
    </div>
  )
}

const formatTime = (totalSeconds: number | null): string => {
  if (totalSeconds === null || totalSeconds <= 0) return '0:00'

  const minutes = Math.floor(totalSeconds / 60)
  const remainingSeconds = totalSeconds % 60

  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}
