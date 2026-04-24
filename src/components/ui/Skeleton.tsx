import { cn } from '@/lib/utils'

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-md bg-border/80', className)} />
}

export function StatCardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-white p-6 shadow-card">
      <Skeleton className="ml-auto h-6 w-6 rounded-lg" />
      <Skeleton className="mt-4 h-9 w-20" />
      <Skeleton className="mt-2 h-4 w-28" />
    </div>
  )
}

export function TableRowSkeleton({ cols = 7 }: { cols?: number }) {
  return (
    <tr className="border-b border-border">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <Skeleton className="h-4 w-full max-w-[8rem]" />
        </td>
      ))}
    </tr>
  )
}
