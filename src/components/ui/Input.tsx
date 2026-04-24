import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export type InputProps = InputHTMLAttributes<HTMLInputElement>

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'min-h-12 w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-foreground transition-all duration-150 placeholder:text-foreground-muted focus:border-transparent focus:outline-none focus:ring-2 focus:ring-navy disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
        ref={ref}
        {...props}
      />
    )
  },
)

Input.displayName = 'Input'
