import { ArrowLeft, Printer } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { Link, useParams } from 'react-router-dom'
import { usePlo } from '@/hooks/usePLOs'
import { formatPloScheduledDisplay } from '@/lib/plo-format'
import { getInspectQrUrl } from '@/lib/inspect-qr-url'
import { ProjectMark } from '@/components/shared/ProjectMark'
import { Button } from '@/components/ui/Button'
import { LoadingState } from '@/components/shared/LoadingState'

export function WorkOrderPage() {
  const { id } = useParams()
  const { data: plo, isLoading, error, refetch } = usePlo(id)

  if (isLoading) {
    return <LoadingState className="min-h-[40vh]" label="Loading work order…" />
  }

  if (error || !plo || !plo.property) {
    return (
      <div className="space-y-4 print:hidden">
        <p className="text-sm text-danger">{error?.message ?? 'Work order not found.'}</p>
        <Button type="button" variant="secondary" onClick={() => void refetch()}>
          Retry
        </Button>
      </div>
    )
  }

  const p = plo.property
  const qrUrl = getInspectQrUrl(plo.id)
  const scheduledLabel = formatPloScheduledDisplay(plo)
  const phone = p.homeowner_phone ?? plo.inspector?.phone ?? '—'

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 print:hidden">
        <Link
          to={`/property-manager/plos/${plo.id}`}
          className="inline-flex min-h-12 items-center gap-2 text-sm font-medium text-foreground-secondary hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to PLO
        </Link>
        <Button type="button" variant="secondary" onClick={() => window.print()}>
          <Printer className="h-4 w-4" />
          Print work order
        </Button>
      </div>

      <div
        id="work-order-print-root"
        className="mx-auto max-w-3xl rounded-xl border border-border bg-white p-8 shadow-card print:mx-0 print:max-w-none print:rounded-none print:border-0 print:p-6 print:shadow-none"
      >
        <div className="flex flex-col gap-6 border-b border-border pb-6 md:flex-row md:items-start md:justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <ProjectMark className="text-lg" />
              <span className="text-xs font-medium uppercase tracking-wide text-foreground-muted">
                Inspection & warranty
              </span>
            </div>
            <p className="text-xs font-semibold uppercase tracking-wider text-foreground-secondary">
              Work order
            </p>
            <p className="text-2xl font-bold text-foreground">{plo.plo_id}</p>
            <p className="text-base font-medium text-foreground-secondary">{plo.inspection_type}</p>
          </div>
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-end sm:gap-8">
            <div className="text-7xl font-bold leading-none tracking-tight text-foreground">LOT {p.lot_number}</div>
            <div className="shrink-0 print:block">
              <QRCodeSVG value={qrUrl} size={120} level="M" className="rounded-md border border-border" />
            </div>
          </div>
        </div>

        <div className="grid gap-6 py-6 sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-foreground-muted">Homeowner</p>
            <p className="mt-1 text-base font-semibold text-foreground">{p.homeowner_name}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-foreground-muted">Scheduled</p>
            <p className="mt-1 text-base font-semibold text-foreground">{scheduledLabel}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-foreground-muted">Address</p>
            <p className="mt-1 text-base font-medium text-foreground">{p.address}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-foreground-muted">Inspector</p>
            <p className="mt-1 text-base font-medium text-foreground">{plo.inspector?.full_name ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-foreground-muted">Community</p>
            <p className="mt-1 text-base font-medium text-foreground">{p.community_name ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-foreground-muted">Phone</p>
            <p className="mt-1 text-base font-medium text-foreground">{phone}</p>
          </div>
        </div>

        <div className="border-t border-border pt-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-foreground-muted">Notes</p>
          <p className="mt-2 whitespace-pre-wrap text-sm text-foreground">{plo.notes?.trim() || '—'}</p>
        </div>

        <p className="mt-8 border-t border-border pt-6 text-center text-xs text-foreground-secondary">
          Scan the QR code to open this inspection in Project{'{'}H{'}'}C on your iPad or phone.
        </p>
      </div>
    </div>
  )
}
