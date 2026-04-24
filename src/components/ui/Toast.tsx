import * as ToastPrimitive from '@radix-ui/react-toast'
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

type ToastVariant = 'default' | 'destructive'

export interface ShowToastInput {
  title: string
  description?: string
  variant?: ToastVariant
}

interface ToastContextValue {
  toast: (input: ShowToastInput) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    throw new Error('useToast must be used within ToastProvider')
  }
  return ctx
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const [payload, setPayload] = useState<ShowToastInput | null>(null)

  const toast = useCallback((input: ShowToastInput) => {
    setPayload(input)
    setOpen(true)
  }, [])

  const value = useMemo(() => ({ toast }), [toast])

  return (
    <ToastPrimitive.Provider swipeDirection="right" duration={5000}>
      <ToastContext.Provider value={value}>{children}</ToastContext.Provider>
      <ToastPrimitive.Root
        open={open}
        onOpenChange={setOpen}
        className={cn(
          'fixed bottom-24 right-6 z-[100] flex w-[min(100%,360px)] items-start gap-3 rounded-xl border border-border bg-white p-4 shadow-lg transition-all duration-150 data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] md:bottom-8',
          payload?.variant === 'destructive' && 'border-danger/30 bg-red-50',
        )}
      >
        <div className="flex-1 space-y-1">
          {payload?.title ? (
            <ToastPrimitive.Title className="text-sm font-semibold text-foreground">
              {payload.title}
            </ToastPrimitive.Title>
          ) : null}
          {payload?.description ? (
            <ToastPrimitive.Description className="text-sm text-foreground-secondary">
              {payload.description}
            </ToastPrimitive.Description>
          ) : null}
        </div>
        <ToastPrimitive.Close
          className="rounded-md p-1 text-foreground-muted transition-colors hover:bg-surface hover:text-foreground"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </ToastPrimitive.Close>
      </ToastPrimitive.Root>
      <ToastPrimitive.Viewport className="fixed bottom-0 right-0 z-[100] m-0 flex w-[420px] max-w-[100vw] list-none flex-col gap-2 p-6 outline-none" />
    </ToastPrimitive.Provider>
  )
}
