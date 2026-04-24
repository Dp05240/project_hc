import { cva, type VariantProps } from 'class-variance-authority'
import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'
import { Spinner } from '@/components/ui/Spinner'

const buttonVariants = cva(
  'inline-flex min-h-12 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-navy text-white hover:bg-navy-hover',
        secondary:
          'border border-border bg-white text-foreground hover:bg-gray-50',
        accent: 'bg-accent text-white hover:bg-accent-dark',
        ghost: 'text-foreground hover:bg-surface',
        link: 'min-h-0 p-0 text-navy underline-offset-4 hover:underline',
      },
      size: {
        default: 'px-4 py-2.5',
        sm: 'min-h-10 px-3 py-2 text-sm',
        lg: 'min-h-14 px-6 py-3 text-base',
        icon: 'h-12 w-12 min-h-12 p-0',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default',
    },
  },
)

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant, size, loading, disabled, children, type = 'button', ...props },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(buttonVariants({ variant, size, className }))}
        disabled={disabled ?? loading}
        {...props}
      >
        {loading ? <Spinner className="h-5 w-5 border-white border-t-transparent" /> : null}
        {children}
      </button>
    )
  },
)

Button.displayName = 'Button'
