import { AlertTriangle, ArrowLeft, ClipboardList } from 'lucide-react'
import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { usePlo } from '@/hooks/usePLOs'
import { usePloInspectionItems } from '@/hooks/useInspectionItems'
import { formatPloScheduledDisplay } from '@/lib/plo-format'
import { cn } from '@/lib/utils'
import type { InspectionItem, Room } from '@/lib/types'
import { Badge } from '@/components/ui/Badge'
import { Button, buttonVariants } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { EmptyState } from '@/components/shared/EmptyState'
import { LoadingState } from '@/components/shared/LoadingState'
import { StatCard } from '@/components/shared/StatCard'
import { PloStatusBadge } from '@/components/builder/PloStatusBadge'

const ROOM_ORDER: Room[] = [
  'Kitchen',
  'Living Room',
  'Master Bedroom',
  'Bedroom 2',
  'Bedroom 3',
  'Bathroom',
  'Master Bath',
  'Laundry',
  'Garage',
  'Basement',
  'Exterior',
  'Roof',
  'Other',
]

function groupItemsByRoom(items: InspectionItem[]): Map<Room, InspectionItem[]> {
  const map = new Map<Room, InspectionItem[]>()
  for (const item of items) {
    const list = map.get(item.room) ?? []
    list.push(item)
    map.set(item.room, list)
  }
  return map
}

export function PLODetailPage() {
  const { id } = useParams()
  const ploQuery = usePlo(id)
  const itemsQuery = usePloInspectionItems(id)

  const plo = ploQuery.data
  const items = useMemo(() => itemsQuery.data ?? [], [itemsQuery.data])

  const stats = useMemo(() => {
    const openish = (i: InspectionItem) => i.item_status !== 'Resolved'
    return {
      total: items.length,
      urgent: items.filter((i) => i.severity === 'Urgent' && openish(i)).length,
      hazards: items.filter((i) => i.is_hazard && openish(i)).length,
    }
  }, [items])

  const grouped = useMemo(() => groupItemsByRoom(items), [items])
  const roomKeys = useMemo(() => {
    const keys = [...grouped.keys()]
    keys.sort((a, b) => ROOM_ORDER.indexOf(a) - ROOM_ORDER.indexOf(b))
    return keys
  }, [grouped])

  if (ploQuery.isLoading) {
    return <LoadingState className="min-h-[40vh]" label="Loading PLO…" />
  }

  if (ploQuery.error || !plo || !plo.property) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-danger">{ploQuery.error?.message ?? 'PLO not found.'}</p>
        <Button type="button" variant="secondary" onClick={() => void ploQuery.refetch()}>
          Retry
        </Button>
      </div>
    )
  }

  const prop = plo.property

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 print:hidden sm:flex-row sm:items-center sm:justify-between">
        <Link
          to="/builder/plos"
          className="inline-flex min-h-12 items-center gap-2 text-sm font-medium text-foreground-secondary hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          All PLOs
        </Link>
        <div className="flex flex-wrap gap-2">
          <Link
            to={`/builder/plos/${plo.id}/workorder`}
            className={cn(buttonVariants({ variant: 'secondary' }))}
          >
            Work order
          </Link>
          {plo.status === 'Closed' ? (
            <Link to={`/builder/plos/${plo.id}/report`} className={cn(buttonVariants({ variant: 'primary' }))}>
              View report
            </Link>
          ) : null}
        </div>
      </div>

      <Card className="mb-8">
        <CardContent className="space-y-4 pt-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-3xl font-bold text-foreground">LOT {prop.lot_number}</p>
              <span className="text-lg font-semibold text-accent">{plo.plo_id}</span>
              <PloStatusBadge status={plo.status} />
            </div>
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-foreground-secondary">
            <p>
              <span className="text-foreground-muted">Type: </span>
              <span className="font-medium text-foreground">{plo.inspection_type}</span>
            </p>
            <p>
              <span className="text-foreground-muted">Scheduled: </span>
              <span className="font-medium text-foreground">{formatPloScheduledDisplay(plo)}</span>
            </p>
            <p>
              <span className="text-foreground-muted">Inspector: </span>
              <span className="font-medium text-foreground">{plo.inspector?.full_name ?? '—'}</span>
            </p>
          </div>
          <p className="text-sm text-foreground-secondary">
            {prop.homeowner_name} · {prop.address}
          </p>
        </CardContent>
      </Card>

      <div className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Items" value={stats.total} icon={<ClipboardList className="h-6 w-6 text-info" />} />
        <StatCard
          label="Urgent"
          value={stats.urgent}
          icon={<AlertTriangle className={cn('h-6 w-6', stats.urgent > 0 ? 'text-danger' : 'text-foreground-muted')} />}
        />
        <StatCard
          label="Hazards"
          value={stats.hazards}
          icon={<AlertTriangle className={cn('h-6 w-6', stats.hazards > 0 ? 'text-danger' : 'text-foreground-muted')} />}
        />
      </div>

      <div className="space-y-6">
        <h2 className="text-lg font-semibold text-foreground">Inspection items</h2>

        {itemsQuery.isLoading ? (
          <LoadingState label="Loading items…" />
        ) : items.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="No items yet"
            description="Findings from the inspector will appear here, grouped by room."
          />
        ) : (
          roomKeys.map((room) => (
            <section key={room} className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground">{room}</h3>
              <ul className="space-y-3">
                {(grouped.get(room) ?? []).map((item) => (
                  <li key={item.id}>
                    <Card
                      className={cn(
                        'border border-border border-l-4 bg-white shadow-card',
                        item.severity === 'Urgent' && 'border-l-red-500',
                        item.severity === 'Medium' && 'border-l-amber-400',
                        item.severity === 'Low' && 'border-l-gray-300',
                      )}
                    >
                      <CardContent className="space-y-3 pt-4">
                        <p className="text-sm text-foreground">{item.description}</p>
                        <div className="flex flex-wrap items-center gap-2">
                          {item.trade_type ? (
                            <Badge variant="secondary">{item.trade_type}</Badge>
                          ) : null}
                          <Badge variant="outline">{item.severity}</Badge>
                          <Badge variant="outline">{item.item_status}</Badge>
                          {item.is_hazard ? (
                            <span className="inline-flex items-center gap-1 text-sm font-medium text-danger">
                              <AlertTriangle className="h-4 w-4" />
                              Hazard
                            </span>
                          ) : null}
                        </div>
                      </CardContent>
                    </Card>
                  </li>
                ))}
              </ul>
            </section>
          ))
        )}
      </div>
    </>
  )
}
