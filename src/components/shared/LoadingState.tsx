import { Spinner } from '@/components/ui/Spinner'
import { cn } from '@/lib/utils'

export function LoadingState({ className, label }: { className?: string; label?: string }) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3 py-16', className)}>
      <Spinner className="h-8 w-8" />
      {label ? <p className="text-sm text-foreground-secondary">{label}</p> : null}
    </div>
  )
}
