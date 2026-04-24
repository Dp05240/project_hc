import { ClipboardList } from 'lucide-react'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import type { PLO } from '@/lib/types'
import { formatPloScheduledDisplay } from '@/lib/plo-format'
import { EmptyState } from '@/components/shared/EmptyState'
import { PloStatusBadge } from '@/components/builder/PloStatusBadge'
import { TableRowSkeleton } from '@/components/ui/Skeleton'
import { Button } from '@/components/ui/Button'

interface BuilderPloTableProps {
  plos: PLO[]
  isLoading: boolean
  emptyTitle?: string
  emptyDescription?: string
  emptyAction?: ReactNode
  hideNew?: boolean
  basePath?: string
}

export function BuilderPloTable({
  plos,
  isLoading,
  emptyTitle = 'No PLOs yet',
  emptyDescription = 'Create your first punch list order to get started.',
  emptyAction,
  hideNew = false,
  basePath = '/property-manager',
}: BuilderPloTableProps) {
  const navigate = useNavigate()
  void hideNew

  if (isLoading) {
    return (
      <div className="overflow-hidden rounded-xl border border-border bg-white shadow-card">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-border bg-surface text-xs font-medium uppercase tracking-wide text-foreground-secondary">
            <tr>
              {['PLO ID', 'Lot #', 'Homeowner', 'Type', 'Inspector', 'Date', 'Status'].map((h) => (
                <th key={h} className="px-4 py-3">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRowSkeleton key={i} />
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  if (plos.length === 0) {
    return (
      <EmptyState
        icon={ClipboardList}
        title={emptyTitle}
        description={emptyDescription}
        action={emptyAction}
      />
    )
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-white shadow-card">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="border-b border-border bg-surface text-xs font-medium uppercase tracking-wide text-foreground-secondary">
          <tr>
            <th className="px-4 py-3">PLO ID</th>
            <th className="px-4 py-3">Lot #</th>
            <th className="px-4 py-3">Homeowner</th>
            <th className="px-4 py-3">Type</th>
            <th className="px-4 py-3">Inspector</th>
            <th className="px-4 py-3">Date</th>
            <th className="px-4 py-3">Status</th>
          </tr>
        </thead>
        <tbody>
          {plos.map((plo) => (
            <tr
              key={plo.id}
              className="cursor-pointer border-b border-border transition-colors duration-150 last:border-0 hover:bg-gray-50"
              onClick={() => navigate(`${basePath}/plos/${plo.id}`)}
            >
              <td className="px-4 py-3">
                <span className="font-medium text-accent">{plo.plo_id}</span>
              </td>
              <td className="px-4 py-3 font-semibold text-foreground">
                {plo.property?.lot_number ?? '—'}
              </td>
              <td className="px-4 py-3 text-foreground">{plo.property?.homeowner_name ?? '—'}</td>
              <td className="px-4 py-3 text-foreground-secondary">{plo.inspection_type}</td>
              <td className="px-4 py-3 text-foreground-secondary">
                {plo.inspector?.full_name ?? '—'}
              </td>
              <td className="px-4 py-3 text-foreground-secondary">{formatPloScheduledDisplay(plo)}</td>
              <td className="px-4 py-3">
                <PloStatusBadge status={plo.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function NewPloEmptyButton() {
  const navigate = useNavigate()
  return (
    <Button type="button" variant="accent" onClick={() => navigate('/property-manager/plos/new')}>
      Create your first PLO
    </Button>
  )
}
