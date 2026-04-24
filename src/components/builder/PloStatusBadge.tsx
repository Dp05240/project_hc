import type { PLOStatus } from '@/lib/types'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'

const styles: Record<PLOStatus, string> = {
  Scheduled: 'bg-blue-50 text-blue-700 border-transparent',
  'In Progress': 'bg-amber-50 text-amber-700 border-transparent',
  'Under Review': 'bg-purple-50 text-purple-700 border-transparent',
  Closed: 'bg-green-50 text-green-700 border-transparent',
}

export function PloStatusBadge({ status }: { status: PLOStatus }) {
  return (
    <Badge variant="outline" className={cn('border-0 font-medium', styles[status])}>
      {status}
    </Badge>
  )
}
