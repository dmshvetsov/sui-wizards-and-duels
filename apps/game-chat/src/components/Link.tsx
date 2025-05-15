import { Link as RouterLink } from 'react-router-dom'
import { cn } from '@/lib/utils'

export function Link({
  className,
  ...props
}: React.ComponentProps<typeof RouterLink>) {
  return (
    <RouterLink
      className={cn(
        'text-primary hover:underline',
        className
      )}
      {...props}
    />
  )
}
