import { AlertTriangle, ArrowLeft, Plus } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { usePlo } from '@/hooks/usePLOs'
import { usePloInspectionItems } from '@/hooks/useInspectionItems'
import { formatPloScheduledDisplay } from '@/lib/plo-format'
import type { InspectionItem, Room } from '@/lib/types'
import { INSPECTION_ROOMS } from '@/lib/types'
import { cn } from '@/lib/utils'
import { AddItemDrawer } from '@/pages/inspector/AddItemDrawer'
import { Badge } from '@/components/ui/Badge'
import { Button, buttonVariants } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { LoadingState } from '@/components/shared/LoadingState'
import { useToast } from '@/components/ui/Toast'
import { supabase } from '@/lib/supabase'

export function InspectionPage() {
  const { plo_id } = useParams()
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const ploQuery = usePlo(plo_id)
  const itemsQuery = usePloInspectionItems(plo_id)

  const [selectedRoom, setSelectedRoom] = useState<Room>('Kitchen')
  const [drawerOpen, setDrawerOpen] = useState(false)

  const plo = ploQuery.data
  const items = useMemo(() => itemsQuery.data ?? [], [itemsQuery.data])

  const countsByRoom = useMemo(() => {
    const m = new Map<Room, number>()
    for (const r of INSPECTION_ROOMS) m.set(r, 0)
    for (const it of items) {
      m.set(it.room, (m.get(it.room) ?? 0) + 1)
    }
    return m
  }, [items])

  const roomItems = useMemo(
    () => items.filter((i) => i.room === selectedRoom),
    [items, selectedRoom],
  )

  const startMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('plos')
        .update({ status: 'In Progress' })
        .eq('id', plo_id!)
      if (error) throw error
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['plos', 'detail', plo_id] })
      await queryClient.invalidateQueries({ queryKey: ['plos'] })
    },
    onError: (e: Error) => {
      toast({ title: 'Could not start inspection', description: e.message, variant: 'destructive' })
    },
  })

  if (ploQuery.isLoading) {
    return <LoadingState className="min-h-svh" label="Loading inspection…" />
  }

  if (ploQuery.error || !plo || !plo.property) {
    return (
      <div className="min-h-svh bg-background px-4 py-8">
        <p className="text-sm text-danger">{ploQuery.error?.message ?? 'Inspection not found.'}</p>
        <Link to="/inspector" className={cn(buttonVariants({ variant: 'secondary' }), 'mt-4 inline-flex')}>
          Back to jobs
        </Link>
      </div>
    )
  }

  const prop = plo.property
  const showComplete = items.length >= 1
  const canStart = plo.status === 'Scheduled'

  return (
    <div className="min-h-svh bg-background pb-40">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-navy px-4 py-3 text-white">
        <div className="mx-auto flex max-w-content items-center gap-3">
          <Link
            to="/inspector"
            className="flex min-h-14 min-w-14 items-center justify-center rounded-lg text-white/90 transition-colors hover:bg-white/10"
            aria-label="Back to jobs"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-lg font-bold">LOT {prop.lot_number}</span>
              <span className="text-sm font-medium text-accent">{plo.plo_id}</span>
              <Badge variant="secondary" className="border-0 bg-white/15 text-white">
                {items.length} items
              </Badge>
            </div>
            <p className="mt-0.5 text-xs text-white/70">{plo.status}</p>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-content space-y-4 px-4 py-4">
        <div>
          <p className="text-base font-semibold text-foreground">{prop.homeowner_name}</p>
          <p className="text-sm text-foreground-secondary">
            {plo.inspection_type} · {formatPloScheduledDisplay(plo)}
          </p>
        </div>

        {canStart ? (
          <Button
            type="button"
            variant="accent"
            className="min-h-14 w-full"
            loading={startMutation.isPending}
            onClick={() => startMutation.mutate()}
          >
            Start inspection
          </Button>
        ) : null}

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-foreground-muted">Room</p>
          <div className="grid grid-cols-2 gap-2">
            {INSPECTION_ROOMS.map((room) => {
              const count = countsByRoom.get(room) ?? 0
              const selected = selectedRoom === room
              return (
                <button
                  key={room}
                  type="button"
                  onClick={() => setSelectedRoom(room)}
                  className={cn(
                    'relative flex min-h-[72px] items-center justify-center rounded-xl border px-2 text-center text-sm font-medium transition-all duration-150',
                    selected
                      ? 'border-navy bg-navy text-white'
                      : 'border-border bg-white text-foreground hover:bg-surface',
                  )}
                >
                  <span>{room}</span>
                  {count > 0 ? (
                    <span className="absolute right-2 top-2 flex h-6 min-w-6 items-center justify-center rounded-full bg-accent px-1 text-xs font-bold text-white">
                      {count}
                    </span>
                  ) : null}
                </button>
              )
            })}
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground">Items in {selectedRoom}</h2>
          {roomItems.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border bg-surface/50 px-4 py-8 text-center text-sm text-foreground-secondary">
              No items in this room yet.
            </p>
          ) : (
            <ul className="space-y-3">
              {roomItems.map((item) => (
                <ItemRow key={item.id} item={item} />
              ))}
            </ul>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={() => setDrawerOpen(true)}
        className={cn(
          'fixed right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-white shadow-lg transition-transform hover:scale-105 active:scale-95 print:hidden',
          showComplete ? 'bottom-32' : 'bottom-24',
        )}
        aria-label="Add item"
      >
        <Plus className="h-7 w-7" />
      </button>

      {showComplete ? (
        <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-border bg-white p-4 print:hidden">
          <Link
            to={`/inspect/${plo.id}/complete`}
            className={cn(buttonVariants({ variant: 'primary' }), 'flex min-h-14 w-full items-center justify-center')}
          >
            Complete inspection
          </Link>
        </div>
      ) : null}

      <AddItemDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        ploId={plo.id}
        room={selectedRoom}
        onSaved={() => void itemsQuery.refetch()}
      />
    </div>
  )
}

function ItemRow({ item }: { item: InspectionItem }) {
  return (
    <Card
      className={cn(
        'border border-border border-l-4 bg-white shadow-card',
        item.severity === 'Urgent' && 'border-l-red-500',
        item.severity === 'Medium' && 'border-l-amber-400',
        item.severity === 'Low' && 'border-l-gray-300',
      )}
    >
      <CardContent className="space-y-2 pt-4">
        <p className="text-sm text-foreground">{item.description}</p>
        <div className="flex flex-wrap items-center gap-2">
          {item.trade_type ? <Badge variant="secondary">{item.trade_type}</Badge> : null}
          {item.is_hazard ? (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-danger">
              <AlertTriangle className="h-4 w-4" />
              Hazard
            </span>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}
