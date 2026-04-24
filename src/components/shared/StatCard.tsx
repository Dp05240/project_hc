import type { ReactNode } from 'react'
import { Card, CardContent } from '@/components/ui/Card'
import { cn } from '@/lib/utils'

interface StatCardProps {
  label: string
  value: string | number
  icon?: ReactNode
  className?: string
}

export function StatCard({ label, value, icon, className }: StatCardProps) {
  return (
    <Card className={cn('transition-all duration-150 hover:shadow-md', className)}>
      <CardContent className="relative pt-6">
        {icon ? <div className="absolute right-4 top-4 text-foreground-muted opacity-60">{icon}</div> : null}
        <p className="text-3xl font-semibold text-foreground">{value}</p>
        <p className="mt-1 text-sm text-foreground-secondary">{label}</p>
      </CardContent>
    </Card>
  )
}
