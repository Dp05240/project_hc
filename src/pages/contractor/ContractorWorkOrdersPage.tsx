import { format } from 'date-fns'
import { Briefcase, ChevronRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useContractorWorkOrders } from '@/hooks/useWorkOrders'
import type { WorkOrder } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/Badge'
import { LoadingState } from '@/components/shared/LoadingState'
import { EmptyState } from '@/components/shared/EmptyState'
import { PageHeader } from '@/components/layout/PageHeader'

const statusClass: Record<WorkOrder['status'], string> = {
  Open: 'bg-amber-50 text-amber-700 border-amber-200',
  'In Progress': 'bg-blue-50 text-blue-700 border-blue-200',
  Closed: 'bg-green-50 text-green-700 border-green-200',
}

export function ContractorWorkOrdersPage() {
  const { profile } = useAuth()
  const navigate = useNavigate()

  // profile.id = contractor PK (the row id in public.contractors, spread from the contractor record)
  const { data: workOrders = [], isLoading, error } = useContractorWorkOrders(profile?.id)

  const tradeLabel = profile?.trade_type ?? 'your trade'

  if (isLoading) return <LoadingState className="min-h-[40vh]" label="Loading work orders…" />

  if (error) {
    return (
      <div className="p-6 text-sm text-danger">{(error as Error).message}</div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Work Orders"
        subtitle={`Showing work orders assigned to you · ${tradeLabel}`}
      />

      {workOrders.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="No work orders assigned"
          description="Work orders assigned to you will appear here."
        />
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-x-auto rounded-xl border border-border bg-white shadow-card sm:block">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-b border-border bg-surface/60">
                  {['WO ID', 'PLO ID', 'Lot #', 'Homeowner', 'Items', 'Status'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-foreground-muted">
                      {h}
                    </th>
                  ))}
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {workOrders.map((wo) => {
                  const prop = wo.plo?.property
                  return (
                    <tr
                      key={wo.id}
                      className="cursor-pointer transition-colors hover:bg-surface/60"
                      onClick={() => navigate(`/contractor/work-orders/${wo.id}`)}
                    >
                      <td className="px-4 py-3 font-mono font-semibold text-foreground">{wo.work_order_id}</td>
                      <td className="px-4 py-3 font-medium text-accent">{wo.plo?.plo_id ?? '—'}</td>
                      <td className="px-4 py-3 font-semibold text-foreground">
                        {prop?.lot_number ? `LOT ${prop.lot_number}` : '—'}
                      </td>
                      <td className="px-4 py-3 text-foreground">{prop?.homeowner_name ?? '—'}</td>
                      <td className="px-4 py-3 text-foreground-secondary">
                        <span className="rounded-full bg-navy/10 px-2 py-0.5 text-xs font-semibold text-navy">
                          {tradeLabel}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={cn('border text-xs', statusClass[wo.status])}>{wo.status}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <ChevronRight className="h-4 w-4 text-foreground-muted" />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="flex flex-col gap-3 sm:hidden">
            {workOrders.map((wo) => {
              const prop = wo.plo?.property
              return (
                <button
                  key={wo.id}
                  type="button"
                  className="w-full rounded-xl border border-border bg-white p-4 text-left shadow-card transition-colors active:bg-surface/60"
                  onClick={() => navigate(`/contractor/work-orders/${wo.id}`)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-mono font-semibold text-foreground">{wo.work_order_id}</p>
                      <p className="mt-0.5 text-sm text-foreground-secondary">
                        {prop?.lot_number ? `LOT ${prop.lot_number}` : '—'} · {prop?.homeowner_name ?? '—'}
                      </p>
                    </div>
                    <Badge className={cn('border text-xs', statusClass[wo.status])}>{wo.status}</Badge>
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-xs text-foreground-muted">
                    <span>{wo.plo?.plo_id ?? '—'}</span>
                    <span>·</span>
                    <span>{format(new Date(wo.created_at), 'MMM d, yyyy')}</span>
                  </div>
                </button>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
