import { Camera, Check, Flag } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useRef, useState } from 'react'
import { compressImageFile } from '@/lib/image-compress'
import { supabase } from '@/lib/supabase'
import type { InspectionItem, Severity, TradeType } from '@/lib/types'
import { TRADE_TYPE_OPTIONS } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Select } from '@/components/ui/Select'
import { useToast } from '@/components/ui/Toast'

const BUCKET = import.meta.env.VITE_STORAGE_BUCKET || 'inspection-photos'

const SEVERITY_CYCLE: Severity[] = ['Low', 'Medium', 'Urgent']

function nextSeverity(s: Severity): Severity {
  const i = SEVERITY_CYCLE.indexOf(s)
  return SEVERITY_CYCLE[(i + 1) % SEVERITY_CYCLE.length] ?? 'Low'
}

export interface FindingRowProps {
  ploId: string
  item: InspectionItem
  lineNumber: number
  onPersisted: () => void
}

export function FindingRow({ ploId, item, lineNumber, onPersisted }: FindingRowProps) {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const fileRef = useRef<HTMLInputElement>(null)
  const [text, setText] = useState(item.description ?? '')
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    setText(item.description ?? '')
  }, [item.id, item.description])

  const invalidate = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['inspection_items', 'plo', ploId] })
    await queryClient.invalidateQueries({ queryKey: ['plos'] })
    await queryClient.invalidateQueries({ queryKey: ['plos', 'detail', ploId] })
  }, [ploId, queryClient])

  const updateMutation = useMutation({
    mutationFn: async (patch: {
      description?: string
      trade_type?: TradeType | null
      severity?: Severity
      is_hazard?: boolean
      photo_url?: string | null
    }) => {
      const { error } = await supabase.from('inspection_items').update(patch).eq('id', item.id)
      if (error) throw error
    },
    onSuccess: async () => {
      await invalidate()
      onPersisted()
    },
    onError: (e: Error) => {
      toast({ title: 'Could not save', description: e.message, variant: 'destructive' })
    },
  })

  const savePatch = (patch: Parameters<typeof updateMutation.mutate>[0]) => {
    updateMutation.mutate(patch)
  }

  const onDescriptionBlur = () => {
    const next = text.trim()
    if (next === (item.description ?? '').trim()) return
    savePatch({ description: next })
  }

  const onTradeChange = (v: string) => {
    savePatch({ trade_type: v === '' ? null : (v as TradeType) })
  }

  const cycleSeverity = () => {
    savePatch({ severity: nextSeverity(item.severity) })
  }

  const toggleHazard = () => {
    savePatch({ is_hazard: !item.is_hazard })
  }

  const onPhotoPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (!f) return
    setUploading(true)
    try {
      const blob = await compressImageFile(f)
      const path = `${ploId}/${crypto.randomUUID()}.jpg`
      const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, blob, {
        contentType: 'image/jpeg',
        upsert: false,
      })
      if (upErr) throw new Error(upErr.message)
      const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
      savePatch({ photo_url: data.publicUrl })
    } catch (err) {
      toast({
        title: 'Photo upload failed',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'destructive',
      })
    } finally {
      setUploading(false)
    }
  }

  const dotClass =
    item.severity === 'Urgent'
      ? 'bg-danger'
      : item.severity === 'Medium'
        ? 'bg-accent'
        : 'bg-gray-300'

  return (
    <div className={cn('border-b border-border bg-white', item.is_hazard && 'border-l-4 border-l-danger')}>
      <div className="-mx-1 overflow-x-auto overflow-y-visible pb-1">
        <div className="flex min-h-14 min-w-[min(100%,520px)] items-center gap-2 px-2 py-1">
          <span className="w-6 shrink-0 text-center text-xs font-semibold text-foreground-muted">{lineNumber}</span>
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onBlur={() => onDescriptionBlur()}
            placeholder="Add finding…"
            className="min-h-11 min-w-[140px] flex-1 rounded-md border border-transparent bg-surface/80 px-2 text-sm text-foreground outline-none ring-navy focus:border-border focus:bg-white focus:ring-1"
            autoComplete="off"
          />
          <Select
            aria-label="Trade"
            value={item.trade_type ?? ''}
            onChange={(e) => onTradeChange(e.target.value)}
            className="h-11 w-[6.75rem] min-h-11 shrink-0 rounded-full border-border py-0 text-xs font-medium"
          >
            <option value="">Trade</option>
            {TRADE_TYPE_OPTIONS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
          <button
            type="button"
            onClick={() => cycleSeverity()}
            className="flex h-14 w-11 shrink-0 flex-col items-center justify-center rounded-lg border border-border bg-white"
            aria-label={`Severity ${item.severity}, tap to change`}
          >
            <span className={cn('h-3.5 w-3.5 rounded-full', dotClass)} />
          </button>
          <button
            type="button"
            onClick={() => toggleHazard()}
            className={cn(
              'flex h-14 w-11 shrink-0 items-center justify-center rounded-lg border-2 transition-colors',
              item.is_hazard ? 'border-danger bg-red-50 text-danger' : 'border-border bg-white text-foreground-muted',
            )}
            aria-label={item.is_hazard ? 'Hazard on' : 'Hazard off'}
            aria-pressed={item.is_hazard}
          >
            <Flag className={cn('h-5 w-5', item.is_hazard && 'fill-current')} strokeWidth={2} />
          </button>
          <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => void onPhotoPick(e)} />
          <button
            type="button"
            disabled={uploading || updateMutation.isPending}
            onClick={() => fileRef.current?.click()}
            className="relative flex h-14 w-11 shrink-0 items-center justify-center rounded-lg border border-border bg-white text-foreground-secondary"
            aria-label={item.photo_url ? 'Change photo' : 'Add photo'}
          >
            {item.photo_url ? (
              <>
                <img src={item.photo_url} alt="" className="h-10 w-10 rounded-md object-cover" />
                <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-success text-white">
                  <Check className="h-2.5 w-2.5" strokeWidth={3} />
                </span>
              </>
            ) : (
              <Camera className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
