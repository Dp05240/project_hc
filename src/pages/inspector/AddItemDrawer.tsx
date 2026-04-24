import { Camera, Mic, X } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useRef, useState } from 'react'
import { compressImageFile } from '@/lib/image-compress'
import { supabase } from '@/lib/supabase'
import type { Room, Severity, TradeType } from '@/lib/types'
import { TRADE_TYPE_OPTIONS } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Textarea'
import { useToast } from '@/components/ui/Toast'

const BUCKET = import.meta.env.VITE_STORAGE_BUCKET || 'inspection-photos'

function getSpeechRecognition(): SpeechRecognition | null {
  const Ctor = window.SpeechRecognition ?? window.webkitSpeechRecognition
  return Ctor ? new Ctor() : null
}

export interface AddItemDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  ploId: string
  room: Room
  onSaved: () => void
}

export function AddItemDrawer({ open, onOpenChange, ploId, room, onSaved }: AddItemDrawerProps) {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const recognitionRef = useRef<SpeechRecognition | null>(null)

  const [description, setDescription] = useState('')
  const [trade, setTrade] = useState<TradeType | ''>('')
  const [severity, setSeverity] = useState<Severity>('Low')
  const [hazard, setHazard] = useState(false)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [listening, setListening] = useState(false)

  const releaseRecognition = useCallback(() => {
    const r = recognitionRef.current
    recognitionRef.current = null
    if (r) {
      try {
        r.onresult = null
        r.onerror = null
        r.onend = null
        r.stop()
      } catch {
        /* ignore */
      }
    }
  }, [])

  const stopRecognition = useCallback(() => {
    releaseRecognition()
    setListening(false)
  }, [releaseRecognition])

  useEffect(() => {
    if (open) return
    releaseRecognition()
    queueMicrotask(() => {
      setDescription('')
      setTrade('')
      setSeverity('Low')
      setHazard(false)
      setPhotoFile(null)
      setPhotoPreview((prev) => {
        if (prev) URL.revokeObjectURL(prev)
        return null
      })
    })
  }, [open, releaseRecognition])

  useEffect(() => {
    return () => stopRecognition()
  }, [stopRecognition])

  const toggleMic = useCallback(() => {
    if (listening) {
      stopRecognition()
      return
    }
    const Rec = getSpeechRecognition()
    if (!Rec) {
      toast({ title: 'Voice input not supported', variant: 'destructive' })
      return
    }
    const r = Rec
    recognitionRef.current = r
    r.continuous = true
    r.interimResults = true
    r.lang = 'en-US'
    r.onresult = (event: SpeechRecognitionEvent) => {
      let chunk = ''
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        chunk += event.results[i]?.[0]?.transcript ?? ''
      }
      if (chunk) setDescription((prev) => (prev ? `${prev} ${chunk}` : chunk).trimStart())
    }
    r.onerror = () => {
      setListening(false)
    }
    r.onend = () => {
      setListening(false)
      recognitionRef.current = null
    }
    try {
      r.start()
      setListening(true)
    } catch {
      toast({ title: 'Could not start microphone', variant: 'destructive' })
    }
  }, [listening, stopRecognition, toast])

  const onPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (!f) return
    if (photoPreview) URL.revokeObjectURL(photoPreview)
    setPhotoFile(f)
    setPhotoPreview(URL.createObjectURL(f))
  }

  const clearPhoto = () => {
    if (photoPreview) URL.revokeObjectURL(photoPreview)
    setPhotoPreview(null)
    setPhotoFile(null)
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      let photo_url: string | null = null
      if (photoFile) {
        const blob = await compressImageFile(photoFile)
        const path = `${ploId}/${crypto.randomUUID()}.jpg`
        const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, blob, {
          contentType: 'image/jpeg',
          upsert: false,
        })
        if (upErr) throw new Error(upErr.message)
        const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
        photo_url = data.publicUrl
      }

      const { error } = await supabase.from('inspection_items').insert({
        plo_id: ploId,
        room,
        description: description.trim() || 'No description',
        photo_url: photo_url ?? null,
        trade_type: trade || null,
        severity,
        is_hazard: hazard,
        item_status: 'Open',
      })
      if (error) throw error
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['inspection_items', 'plo', ploId] })
      await queryClient.invalidateQueries({ queryKey: ['plos'] })
      toast({ title: 'Item saved' })
      onSaved()
      onOpenChange(false)
    },
    onError: (e: Error) => {
      toast({ title: 'Could not save item', description: e.message, variant: 'destructive' })
    },
  })

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-black/50"
      role="presentation"
      onClick={() => onOpenChange(false)}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-lg flex-col rounded-t-2xl border border-border bg-white shadow-2xl"
        role="dialog"
        aria-labelledby="add-item-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-border px-4 py-4">
          <div>
            <h2 id="add-item-title" className="text-lg font-semibold text-foreground">
              Add item
            </h2>
            <p className="text-sm text-foreground-secondary">{room}</p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="min-h-14 min-w-14 shrink-0"
            aria-label="Close"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-6 w-6" />
          </Button>
        </div>

        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-4 py-4">
          <section className="space-y-2">
            <p className="text-sm font-medium text-foreground">Photo</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={onPhotoChange}
            />
            {!photoPreview ? (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex min-h-[120px] w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-surface/50 text-foreground-secondary transition-colors hover:border-navy hover:bg-surface"
              >
                <Camera className="h-8 w-8" />
                <span className="text-sm font-medium">Tap to take photo</span>
              </button>
            ) : (
              <div className="relative inline-block max-h-48 overflow-hidden rounded-xl border border-border">
                <img src={photoPreview} alt="" className="max-h-48 w-auto object-contain" />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-2 min-h-14 min-w-14 bg-white/90 shadow-sm"
                  aria-label="Remove photo"
                  onClick={clearPhoto}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            )}
          </section>

          <section className="space-y-2">
            <p className="text-sm font-medium text-foreground">Description</p>
            <div className="relative">
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the issue…"
                rows={4}
                className="pr-14"
              />
              <button
                type="button"
                onClick={() => void toggleMic()}
                className={cn(
                  'absolute bottom-3 right-3 flex min-h-14 min-w-14 items-center justify-center rounded-lg border border-border bg-white text-foreground transition-colors',
                  listening ? 'bg-red-50 text-danger' : 'hover:bg-surface',
                )}
                aria-label={listening ? 'Stop voice input' : 'Start voice input'}
              >
                <Mic className="h-5 w-5" />
              </button>
            </div>
          </section>

          <section className="space-y-2">
            <p className="text-sm font-medium text-foreground">Trade type</p>
            <div className="-mx-1 flex gap-2 overflow-x-auto pb-1">
              {TRADE_TYPE_OPTIONS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTrade((prev) => (prev === t ? '' : t))}
                  className={cn(
                    'shrink-0 rounded-full border px-4 py-3 text-sm font-medium transition-all duration-150',
                    trade === t
                      ? 'border-navy bg-navy text-white'
                      : 'border-border bg-white text-foreground hover:bg-surface',
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </section>

          <section className="space-y-2">
            <p className="text-sm font-medium text-foreground">Severity</p>
            <div className="grid grid-cols-3 gap-2">
              {(['Low', 'Medium', 'Urgent'] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSeverity(s)}
                  className={cn(
                    'min-h-14 rounded-xl text-sm font-semibold transition-all duration-150',
                    s === 'Low' && severity === 'Low' && 'bg-gray-200 text-foreground',
                    s === 'Low' && severity !== 'Low' && 'border border-border bg-white text-foreground-secondary',
                    s === 'Medium' && severity === 'Medium' && 'bg-accent text-white',
                    s === 'Medium' && severity !== 'Medium' && 'border border-border bg-white text-foreground-secondary',
                    s === 'Urgent' && severity === 'Urgent' && 'bg-danger text-white',
                    s === 'Urgent' && severity !== 'Urgent' && 'border border-border bg-white text-foreground-secondary',
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </section>

          <section>
            <button
              type="button"
              role="switch"
              aria-checked={hazard}
              onClick={() => setHazard((h) => !h)}
              className={cn(
                'flex min-h-14 w-full items-center justify-between gap-4 rounded-xl border border-border px-4 py-3 text-left transition-colors',
                hazard ? 'border-danger/40 bg-red-50' : 'bg-white',
              )}
            >
              <span className="flex items-center gap-2 font-medium text-danger">
                <span aria-hidden>⚠</span>
                Safety hazard
              </span>
              <span
                className={cn(
                  'relative inline-flex h-8 w-14 shrink-0 rounded-full transition-colors',
                  hazard ? 'bg-danger' : 'bg-gray-200',
                )}
              >
                <span
                  className={cn(
                    'absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-transform',
                    hazard ? 'left-7' : 'left-1',
                  )}
                />
              </span>
            </button>
          </section>
        </div>

        <div className="border-t border-border bg-white p-4">
          <Button
            type="button"
            variant="primary"
            className="min-h-14 w-full"
            loading={saveMutation.isPending}
            onClick={() => saveMutation.mutate()}
          >
            Save item
          </Button>
        </div>
      </div>
    </div>
  )
}
