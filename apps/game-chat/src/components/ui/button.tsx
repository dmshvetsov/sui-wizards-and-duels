import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'
import { SFX } from '@/lib/sfx'

type WithLoading = {
  isLoading?: boolean
}

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-xl font-[Garamond] transition-all disabled:pointer-events-none disabled:bg-gray-500 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground shadow-xs hover:bg-primary/90',
        destructive:
          'bg-destructive text-white shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60',
        outline:
          'border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50',
        secondary: 'bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-9 px-4 py-2 has-[>svg]:px-3',
        sm: 'h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5',
        lg: 'h-10 rounded-md px-6 has-[>svg]:px-4',
        icon: 'size-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export function Button({
  className,
  variant,
  size,
  asChild = false,
  disableSfx = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
    disableSfx?: boolean
  }) {
  const Comp = asChild ? Slot : 'button'
  const { onClick, ...restProps } = props

  return (
    <Comp
      data-slot="button"
      {...restProps}
      onClick={(event) => {
        if (!disableSfx) SFX.buttonClick.play()
        if (onClick) {
          setTimeout(() => onClick(event), 200)
        }
      }}
      className={cn(buttonVariants({ variant, size, className }))}
    />
  )
}

export function ButtonWithLoading({
  isLoading = false,
  children,
  ...props
}: React.ComponentProps<'button'> &
  WithLoading &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  return (
    <Button {...props}>
      {isLoading ? <Loader2 className="animate-spin" /> : null} {children}
    </Button>
  )
}

export function ButtonWithFx(props: React.ComponentProps<'button'> & WithLoading) {
  const { onClick, children, isLoading, className, ...restProps } = props
  return (
    <div className={cn("relative inline-flex group", className)}>
      {!isLoading && <div className="absolute transition-all duration-1000 opacity-70 -inset-px bg-gradient-to-r from-[#44BCFF] via-[#FF44EC] to-[#FF675E] rounded-xl blur-lg group-hover:opacity-100 group-hover:-inset-1 group-hover:duration-200 animate-tilt"></div>}
      <button
        className={cn(
          'relative items-center justify-center bg-primary text-primary-foreground shadow-xs transition-all duration-200',
          buttonVariants({ variant: 'default', size: 'default' })
        )}
        role="button"
        {...restProps}
        onClick={(event) => {
          SFX.buttonClick.play()
          if (onClick) {
            setTimeout(() => onClick(event), 200)
          }
        }}
      >
        {isLoading ? <Loader2 className="animate-spin" /> : null} {children}
      </button>
    </div>
  )
}
