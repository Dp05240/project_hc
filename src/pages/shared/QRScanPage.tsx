import { Html5Qrcode } from 'html5-qrcode'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { parsePloIdFromQr } from '@/lib/qr-parse'
import { Button } from '@/components/ui/Button'

const READER_ID = 'inspector-qr-reader'

export function QRScanPage() {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const stoppingRef = useRef(false)

  const stopScanner = useCallback(async () => {
    const q = scannerRef.current
    scannerRef.current = null
    if (!q) return
    try {
      if (q.isScanning) await q.stop()
    } catch {
      /* ignore */
    }
    try {
      q.clear()
    } catch {
      /* ignore */
    }
  }, [])

  const handleCancel = useCallback(async () => {
    stoppingRef.current = true
    await stopScanner()
    navigate('/inspector', { replace: true })
  }, [navigate, stopScanner])

  useEffect(() => {
    stoppingRef.current = false
    let cancelled = false

    const run = async () => {
      try {
        const q = new Html5Qrcode(READER_ID, false)
        scannerRef.current = q
        await q.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: (w, h) => {
              const s = Math.floor(Math.min(w, h) * 0.65)
              return { width: s, height: s }
            },
          },
          (decodedText) => {
            const id = parsePloIdFromQr(decodedText)
            if (!id || stoppingRef.current) return
            stoppingRef.current = true
            void (async () => {
              await stopScanner()
              navigate(`/inspect/${id}`, { replace: true })
            })()
          },
          () => {},
        )
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Camera could not start')
        }
      }
    }

    void run()

    return () => {
      cancelled = true
      stoppingRef.current = true
      void stopScanner()
    }
  }, [navigate, stopScanner])

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-black text-white">
      <div className="relative min-h-0 flex-1">
        <div id={READER_ID} className="absolute inset-0 h-full w-full opacity-90" />

        <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-6">
          <div
            className="aspect-square w-[min(72vw,320px)] rounded-2xl border-2 border-white/60 shadow-[0_0_0_9999px_rgba(0,0,0,0.72)]"
            aria-hidden
          />
        </div>

        <div className="pointer-events-none absolute inset-x-0 top-6 flex justify-center">
          <p className="rounded-full bg-black/50 px-4 py-2 text-sm font-medium text-white/90 backdrop-blur-sm">
            Scanning for QR code…
          </p>
        </div>
      </div>

      <div className="pointer-events-auto flex flex-col gap-3 border-t border-white/10 bg-black/70 px-6 py-5">
        {error ? <p className="text-center text-sm text-red-300">{error}</p> : null}
        <Button type="button" variant="secondary" className="min-h-14 w-full" onClick={() => void handleCancel()}>
          Cancel
        </Button>
      </div>
    </div>
  )
}
