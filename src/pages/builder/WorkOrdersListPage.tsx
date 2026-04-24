import { format } from 'date-fns'
import { Briefcase, Eye } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useWorkOrders, useUpdateWorkOrderStatus } from '@/hooks/useWorkOrders'
import type { WorkOrder } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { LoadingState } from '@/components/shared/LoadingState'
import { EmptyState } from '@/components/shared/EmptyState'
import { PageHeader } from '@/components/layout/PageHeader'
import { useToast } from '@/components/ui/Toast'

const STATUS_OPTIONS: WorkOrder['status'][] = ['Open', 'In Progress', 'Closed']

const statusClass: Record<WorkOrder['status'], string> = {
  Open: 'bg-amber-50 text-amber-700 border-amber-200',
  'In Progress': 'bg-blue-50 text-blue-700 border-blue-200',
  Closed: 'bg-green-50 text-green-700 border-green-200',
}

export function WorkOrdersListPage({ readOnly = false }: { readOnly?: boolean }) {
  const { data: workOrders = [], isLoading, error, refetch } = useWorkOrders()
  const updateStatus = useUpdateWorkOrderStatus()
  const { toast } = useToast()

  const handleStatusChange = async (wo: WorkOrder, status: WorkOrder['status']) => {
    if (readOnly) return
    try {
      await updateStatus.mutateAsync({ id: wo.id, status })
    } catch (e) {
      toast({ title: 'Could not update status', description: (e as Error).message, variant: 'destructive' })
    }
  }

  if (isLoading) return <LoadingState className="min-h-[40vh]" label="Loading work orders…" />
  if (error) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-danger">{error.message}</p>
        <Button type="button" variant="secondary" onClick={() => void refetch()}>Retry</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Work Orders"
        subtitle={`${workOrders.length} total`}
      />

      {workOrders.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="No work orders yet"
          description="Work orders are created automatically when a PLO moves to Under Review."
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-white shadow-card">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-border bg-surface/60">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-foreground-muted">WO ID</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-foreground-muted">PLO ID</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-foreground-muted">Created</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-foreground-muted">Lot #</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-foreground-muted">Homeowner</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-foreground-muted">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-foreground-muted">View</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {workOrders.map((wo) => {
                const prop = wo.plo?.property
                return (
                  <tr key={wo.id} className="transition-colors hover:bg-surface/40">
                    <td className="px-4 py-3 font-mono font-semibold text-foreground">{wo.work_order_id}</td>
                    <td className="px-4 py-3 text-accent font-medium">{wo.plo?.plo_id ?? '—'}</td>
                    <td className="px-4 py-3 text-foreground-secondary">
                      {format(new Date(wo.created_at), 'MMM d, yyyy')}
                    </td>
                    <td className="px-4 py-3 font-semibold text-foreground">
                      {prop?.lot_number ? `LOT ${prop.lot_number}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-foreground">{prop?.homeowner_name ?? '—'}</td>
                    <td className="px-4 py-3">
                      {readOnly ? (
                        <Badge className={cn('border text-xs', statusClass[wo.status])}>{wo.status}</Badge>
                      ) : (
                        <select
                          value={wo.status}
                          onChange={(e) => void handleStatusChange(wo, e.target.value as WorkOrder['status'])}
                          disabled={updateStatus.isPending}
                          className={cn(
                            'rounded-full border px-3 py-1.5 text-xs font-medium outline-none ring-navy focus:ring-2',
                            statusClass[wo.status],
                          )}
                        >
                          {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {wo.plo ? (
                        <Link
                          to={readOnly ? `/contractor/plos/${wo.plo.id}` : `/property-manager/plos/${wo.plo.id}`}
                          className="inline-flex h-9 min-w-9 items-center justify-center rounded-lg border border-border bg-white px-2 text-foreground-secondary hover:text-foreground"
                          aria-label="View PLO"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                      ) : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
