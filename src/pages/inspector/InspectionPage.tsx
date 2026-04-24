import { ArrowLeft, Check, Mic } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useCallback, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { usePlo } from '@/hooks/usePLOs'
import { usePloInspectionItems } from '@/hooks/useInspectionItems'
import { formatPloScheduledDisplay } from '@/lib/plo-format'
import type { InspectionItem, PLO, Room } from '@/lib/types'
import { INSPECTION_ROOMS } from '@/lib/types'
import { cn } from '@/lib/utils'
import { FindingRow } from '@/pages/inspector/FindingRow'
import { Badge } from '@/components/ui/Badge'
import { Button, buttonVariants } from '@/components/ui/Button'
import { LoadingState } from '@/components/shared/LoadingState'
import { useToast } from '@/components/ui/Toast'
import { supabase } from '@/lib/supabase'

const TOTAL_ROOMS = INSPECTION_ROOMS.length

function isItemLogged(item: InspectionItem): boolean {
  return Boolean(item.description?.trim() || item.photo_url)
}

function isRoomVisited(plo: PLO, room: Room, items: InspectionItem[]): boolean {
  if (plo.rooms_completed?.[room]) return true
  return items.some((i) => i.room === room && isItemLogged(i))
}

function roomHasUrgentOrHazard(items: InspectionItem[], room: Room): boolean {
  return items.some((i) => i.room === room && (i.severity === 'Urgent' || i.is_hazard))
}

function roomItemCount(items: InspectionItem[], room: Room): number {
  return items.filter((i) => i.room === room).length
}

function nextLineOrderForRoom(items: InspectionItem[], room: Room): number {
  const forRoom = items.filter((i) => i.room === room)
  if (forRoom.length === 0) return 0
  return Math.max(...forRoom.map((i) => i.line_order ?? 0)) + 1
}

export function InspectionPage() {
  const { plo_id } = useParams()
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const ploQuery = usePlo(plo_id)
  const itemsQuery = usePloInspectionItems(plo_id)

  const [screen, setScreen] = useState<'rooms' | 'room'>('rooms')
  const [activeRoom, setActiveRoom] = useState<Room | null>(null)
  const [savedFlash, setSavedFlash] = useState(false)

  const plo = ploQuery.data
  const items = useMemo(() => itemsQuery.data ?? [], [itemsQuery.data])

  const roomItemsSorted = useMemo(() => {
    if (!activeRoom) return []
    return items
      .filter((i) => i.room === activeRoom)
      .slice()
      .sort((a, b) => (a.line_order ?? 0) - (b.line_order ?? 0) || a.created_at.localeCompare(b.created_at))
  }, [items, activeRoom])

  const flashSaved = useCallback(() => {
    setSavedFlash(true)
    window.setTimeout(() => setSavedFlash(false), 2000)
  }, [])

  const loggedCount = useMemo(() => items.filter(isItemLogged).length, [items])

  const visitedCount = useMemo(() => {
    if (!plo) return 0
    return INSPECTION_ROOMS.filter((r) => isRoomVisited(plo, r, items)).length
  }, [plo, items])

  const startMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('plos').update({ status: 'In Progress' }).eq('id', plo_id!)
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

  const markRoomCompleteMutation = useMutation({
    mutationFn: async (room: Room) => {
      const current = (plo?.rooms_completed ?? {}) as Record<string, boolean>
      const next = { ...current, [room]: true }
      const { error } = await supabase.from('plos').update({ rooms_completed: next }).eq('id', plo_id!)
      if (error) throw error
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['plos', 'detail', plo_id] })
      await queryClient.invalidateQueries({ queryKey: ['plos', 'inspector'] })
    },
    onError: (e: Error) => {
      toast({ title: 'Could not update room', description: e.message, variant: 'destructive' })
    },
  })

  const addLineMutation = useMutation({
    mutationFn: async (room: Room) => {
      const line_order = nextLineOrderForRoom(items, room)
      const { error } = await supabase.from('inspection_items').insert({
        plo_id: plo_id!,
        room,
        description: '',
        trade_type: null,
        severity: 'Low',
        is_hazard: false,
        item_status: 'Open',
        line_order,
      })
      if (error) throw error
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['inspection_items', 'plo', plo_id] })
    },
    onError: (e: Error) => {
      toast({ title: 'Could not add line', description: e.message, variant: 'destructive' })
    },
  })

  const openRoom = (room: Room) => {
    setActiveRoom(room)
    setScreen('room')
  }

  const backToRooms = () => {
    setScreen('rooms')
    setActiveRoom(null)
  }

  const onVoiceBeta = () => {
    toast({ title: 'Voice logging coming soon' })
  }

  if (ploQuery.isLoading) {
    return <LoadingState className="min-h-svh" label="Loading inspection…" />
  }

  if (ploQuery.error || !plo || !plo.property) {
    return (
      <div className="mx-auto min-h-svh w-full max-w-[390px] bg-background px-4 py-8">
        <p className="text-sm text-danger">{ploQuery.error?.message ?? 'Inspection not found.'}</p>
        <Link to="/inspector" className={cn(buttonVariants({ variant: 'secondary' }), 'mt-4 inline-flex min-h-14')}>
          Back to jobs
        </Link>
      </div>
    )
  }

  const prop = plo.property
  const canStart = plo.status === 'Scheduled'
  const showCompleteCta = loggedCount >= 1 && screen === 'rooms'
  const roomMode = screen === 'room' && activeRoom

  return (
    <div
      className={cn(
        'mx-auto min-h-svh w-full max-w-[390px] bg-background print:max-w-none',
        showCompleteCta ? 'pb-28' : 'pb-8',
      )}
    >
      <div className={cn('sticky top-0 z-30 print:relative', roomMode && 'shadow-md')}>
        <header className="border-b border-white/10 bg-navy text-white">
          <div className="flex items-center gap-2 px-3 py-3">
            {roomMode ? (
              <button
                type="button"
                onClick={backToRooms}
                className="flex min-h-14 min-w-14 shrink-0 items-center justify-center rounded-lg text-white/90 hover:bg-white/10"
                aria-label="Back to all rooms"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
            ) : (
              <Link
                to="/inspector"
                className="flex min-h-14 min-w-14 shrink-0 items-center justify-center rounded-lg text-white/90 hover:bg-white/10"
                aria-label="Back to jobs"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-lg font-bold">LOT {prop.lot_number}</span>
                <span className="text-sm font-medium text-accent">{plo.plo_id}</span>
                <Badge variant="secondary" className="border-0 bg-white/15 text-white">
                  {items.length} items
                </Badge>
              </div>
            </div>
          </div>
        </header>

        {roomMode ? (
          <div className="border-b border-border bg-white px-3 py-2">
            <div className="mb-2 flex min-h-14 items-center justify-between gap-2">
              <button type="button" onClick={backToRooms} className="min-w-0 flex-1 truncate text-left text-sm font-medium text-navy">
                ← All Rooms › <span className="text-foreground">{activeRoom}</span>
              </button>
              {savedFlash ? (
                <span className="flex shrink-0 items-center gap-1 text-xs font-medium text-success">
                  <Check className="h-4 w-4" strokeWidth={2.5} />
                  Saved
                </span>
              ) : (
                <span className="h-4 w-14 shrink-0" aria-hidden />
              )}
            </div>
            <div className="flex min-h-14 items-center justify-between gap-2">
              <h2 className="text-lg font-semibold text-foreground">{activeRoom}</h2>
              <button
                type="button"
                onClick={onVoiceBeta}
                className="relative flex min-h-14 min-w-14 items-center justify-center rounded-lg border border-dashed border-border bg-gray-100 text-foreground-muted opacity-90"
                aria-label="Voice logging beta"
              >
                <Mic className="h-5 w-5" />
                <span className="absolute -right-1 -top-1 rounded bg-gray-200 px-1 text-[9px] font-bold uppercase tracking-wide text-foreground-muted">
                  Beta
                </span>
              </button>
            </div>
          </div>
        ) : null}
      </div>

      {screen === 'rooms' ? (
        <>
          <div className="space-y-4 px-3 py-4">
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
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-foreground-muted">Progress</p>
                <p className="text-xs font-medium text-foreground-secondary">
                  {visitedCount} of {TOTAL_ROOMS} rooms visited
                </p>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-border">
                <div
                  className="h-full rounded-full bg-accent transition-all duration-300"
                  style={{ width: `${Math.min(100, Math.round((visitedCount / TOTAL_ROOMS) * 100))}%` }}
                />
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-foreground-muted">Rooms</p>
              <div className="grid grid-cols-2 gap-2">
                {INSPECTION_ROOMS.map((room) => {
                  const count = roomItemCount(items, room)
                  const completed = Boolean(plo.rooms_completed?.[room])
                  const urgent = roomHasUrgentOrHazard(items, room)
                  const hasItems = count > 0
                  return (
                    <button
                      key={room}
                      type="button"
                      onClick={() => openRoom(room)}
                      className={cn(
                        'relative flex min-h-16 flex-col items-center justify-center rounded-xl border-2 px-2 py-3 text-center text-sm font-medium transition-colors',
                        completed && 'border-success bg-success text-white',
                        !completed && urgent && 'border-danger bg-white text-foreground',
                        !completed && !urgent && hasItems && 'border-accent bg-white text-foreground',
                        !completed && !urgent && !hasItems && 'border-border bg-gray-50 text-foreground-secondary',
                      )}
                    >
                      <span className="line-clamp-2">{room}</span>
                      {hasItems ? (
                        <span className="absolute right-2 top-2 flex h-6 min-w-6 items-center justify-center rounded-full bg-accent px-1 text-xs font-bold text-white">
                          {count}
                        </span>
                      ) : null}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {showCompleteCta ? (
            <div className="fixed bottom-0 left-0 right-0 z-30 flex justify-center border-t border-border bg-white p-3 print:hidden">
              <div className="w-full max-w-[390px]">
                <Link
                  to={`/inspect/${plo.id}/complete`}
                  className={cn(
                    buttonVariants({ variant: 'primary' }),
                    'flex min-h-14 w-full items-center justify-center text-base',
                  )}
                >
                  Complete inspection
                </Link>
              </div>
            </div>
          ) : null}
        </>
      ) : activeRoom ? (
        <div className="flex min-h-[calc(100svh-8rem)] flex-col">
          <p className="px-3 py-2 text-xs text-foreground-secondary">
            {prop.homeowner_name} · {plo.inspection_type}
          </p>
          {roomItemsSorted.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-foreground-secondary">No lines yet. Add a line below.</p>
          ) : (
            <div className="flex-1 border-y border-border">
              {roomItemsSorted.map((item, idx) => (
                <FindingRow
                  key={item.id}
                  ploId={plo.id}
                  item={item}
                  lineNumber={idx + 1}
                  onPersisted={flashSaved}
                />
              ))}
            </div>
          )}

          <div className="mt-auto space-y-2 border-t border-border bg-background px-3 py-3 print:hidden">
            <Button
              type="button"
              variant="secondary"
              className="min-h-14 w-full"
              loading={addLineMutation.isPending}
              onClick={() => addLineMutation.mutate(activeRoom)}
            >
              + Add line
            </Button>
            <Button
              type="button"
              variant="primary"
              className="min-h-14 w-full"
              loading={markRoomCompleteMutation.isPending}
              onClick={() =>
                markRoomCompleteMutation.mutate(activeRoom, {
                  onSuccess: () => backToRooms(),
                })
              }
            >
              Mark room complete
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
