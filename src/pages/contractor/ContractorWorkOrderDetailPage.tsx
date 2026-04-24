import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, AlertTriangle, Flag, Wrench } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import type { InspectionItem, WorkOrder, TradeType } from '@/lib/types'
import { cn } from '@/lib/utils'
import { LoadingState } from '@/components/shared/LoadingState'
import { EmptyState } from '@/components/shared/EmptyState'
import { Badge } from '@/components/ui/Badge'

const severityStyle: Record<InspectionItem['severity'], string> = {
  Low: 'bg-slate-100 text-slate-600',
  Medium: 'bg-amber-50 text-amber-700',
  Urgent: 'bg-red-50 text-red-700',
}

const itemStatusStyle: Record<InspectionItem['item_status'], string> = {
  Open: 'bg-amber-50 text-amber-700 border-amber-200',
  'In Progress': 'bg-blue-50 text-blue-700 border-blue-200',
  Resolved: 'bg-green-50 text-green-700 border-green-200',
}

export function ContractorWorkOrderDetailPage() {
  const { woId } = useParams<{ woId: string }>()
  const navigate = useNavigate()
  const { profile } = useAuth()

  const [workOrder, setWorkOrder] = useState<WorkOrder | null>(null)
  const [items, setItems] = useState<InspectionItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const tradeType = profile?.trade_type as TradeType | undefined

  useEffect(() => {
    if (!woId) return
    setLoading(true)

    async function load() {
      try {
        // Fetch work order + plo + property
        const { data: wo, error: woErr } = await supabase
          .from('work_orders')
          .select('*, plo:plos(*, property:properties(*))')
          .eq('id', woId!)
          .maybeSingle()
        if (woErr) throw woErr
        if (!wo) { setError('Work order not found'); return }
        setWorkOrder(wo as unknown as WorkOrder)

        // Fetch inspection items for this PLO, filtered to contractor's trade
        let q = supabase
          .from('inspection_items')
          .select('*')
          .eq('plo_id', (wo as { plo_id: string }).plo_id)
          .order('room', { ascending: true })
          .order('line_order', { ascending: true, nullsFirst: false })

        if (tradeType) {
          q = q.eq('trade_type', tradeType)
        }

        const { data: itemRows, error: itemErr } = await q
        if (itemErr) throw itemErr
        setItems((itemRows ?? []) as InspectionItem[])
      } catch (e) {
        setError((e as Error).message)
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [woId, tradeType])

  if (loading) return <LoadingState className="min-h-[50vh]" label="Loading items…" />

  if (error) {
    return <div className="p-6 text-sm text-danger">{error}</div>
  }

  const prop = (workOrder as unknown as { plo?: { property?: { lot_number?: string; homeowner_name?: string } } })?.plo?.property
  const ploId = (workOrder as unknown as { plo?: { plo_id?: string } })?.plo?.plo_id

  // Group items by room
  const byRoom = items.reduce<Record<string, InspectionItem[]>>((acc, item) => {
    if (!acc[item.room]) acc[item.room] = []
    acc[item.room].push(item)
    return acc
  }, {})

  const rooms = Object.keys(byRoom).sort()

  return (
    <div className="space-y-6">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 -mx-4 flex items-center gap-3 bg-navy px-4 py-3 sm:static sm:mx-0 sm:rounded-xl sm:px-5 sm:py-4">
        <button
          type="button"
          onClick={() => navigate('/contractor')}
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-white/10 text-white hover:bg-white/20"
          aria-label="Back"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="font-mono text-sm font-bold text-white">{workOrder?.work_order_id}</p>
          <p className="truncate text-xs text-white/70">
            {prop?.lot_number ? `LOT ${prop.lot_number}` : ''}{prop?.homeowner_name ? ` · ${prop.homeowner_name}` : ''}{ploId ? ` · ${ploId}` : ''}
          </p>
        </div>
        {tradeType && (
          <span className="rounded-full bg-accent/20 px-3 py-1 text-xs font-semibold text-amber-300">
            {tradeType}
          </span>
        )}
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={Wrench}
          title={`No ${tradeType ?? ''} items found`}
          description="There are no inspection items assigned to your trade for this work order."
        />
      ) : (
        <div className="space-y-6">
          {rooms.map((room) => (
            <div key={room}>
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-foreground-muted">{room}</h2>
              <div className="overflow-hidden rounded-xl border border-border bg-white shadow-card">
                {byRoom[room].map((item, idx) => (
                  <div
                    key={item.id}
                    className={cn(
                      'flex items-start gap-3 px-4 py-3',
                      idx > 0 && 'border-t border-border',
                    )}
                  >
                    {/* Severity dot */}
                    <span className={cn('mt-1 h-2.5 w-2.5 flex-shrink-0 rounded-full', {
                      'bg-slate-400': item.severity === 'Low',
                      'bg-amber-400': item.severity === 'Medium',
                      'bg-red-500': item.severity === 'Urgent',
                    })} />

                    <div className="min-w-0 flex-1 space-y-1">
                      <p className="text-sm leading-snug text-foreground">
                        {item.description || <span className="text-foreground-muted italic">No description</span>}
                      </p>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Badge className={cn('border text-xs', severityStyle[item.severity])}>
                          {item.severity}
                        </Badge>
                        <Badge className={cn('border text-xs', itemStatusStyle[item.item_status])}>
                          {item.item_status}
                        </Badge>
                        {item.is_hazard && (
                          <span className="flex items-center gap-0.5 rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-600">
                            <Flag className="h-3 w-3" />
                            Hazard
                          </span>
                        )}
                      </div>
                    </div>

                    {item.severity === 'Urgent' && (
                      <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
