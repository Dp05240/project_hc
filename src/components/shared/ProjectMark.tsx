import { cn } from '@/lib/utils'

export function ProjectMark({ className }: { className?: string }) {
  return (
    <span className={cn('font-semibold tracking-tight text-foreground', className)}>
      {'Project{'}
      <span className="text-accent">H</span>
      {'}C'}
    </span>
  )
}
