import { ArrowLeft } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { useProperty } from '@/hooks/useProperties'
import { usePropertyPloRows } from '@/hooks/usePLOs'
import { cn } from '@/lib/utils'
import { formatDisplayDate } from '@/lib/format-date'
import { Badge } from '@/components/ui/Badge'
import { Button, buttonVariants } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { LoadingState } from '@/components/shared/LoadingState'
import { BuilderPloTable } from '@/components/builder/BuilderPloTable'

export function PropertyDetailPage() {
  const { id } = useParams()
  const propertyQuery = useProperty(id)
  const plosQuery = usePropertyPloRows(id)

  if (propertyQuery.isLoading) {
    return <LoadingState className="min-h-[40vh]" label="Loading property…" />
  }

  if (propertyQuery.error || !propertyQuery.data) {
    return (
      <div className="space-y-4">
        <Link
          to="/property-manager/properties"
          className="inline-flex min-h-12 items-center gap-2 text-sm font-medium text-foreground-secondary hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to properties
        </Link>
        <p className="text-sm text-danger">
          {propertyQuery.error?.message ?? 'Property not found.'}
        </p>
        <Button type="button" variant="secondary" onClick={() => void propertyQuery.refetch()}>
          Retry
        </Button>
      </div>
    )
  }

  const p = propertyQuery.data

  return (
    <>
      <div className="mb-6">
        <Link
          to="/property-manager/properties"
          className="inline-flex min-h-12 items-center gap-2 text-sm font-medium text-foreground-secondary hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to properties
        </Link>
      </div>

      <Card className="mb-10">
        <CardContent className="space-y-4 pt-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-3xl font-bold tracking-tight text-foreground">LOT {p.lot_number}</p>
              {p.community_name ? (
                <Badge variant="outline" className="text-sm">
                  {p.community_name}
                </Badge>
              ) : null}
            </div>
          </div>
          <div>
            <p className="text-lg font-semibold text-foreground">{p.homeowner_name}</p>
            <div className="mt-2 space-y-1 text-sm text-foreground-secondary">
              {p.homeowner_email ? <p>{p.homeowner_email}</p> : null}
              {p.homeowner_phone ? <p>{p.homeowner_phone}</p> : null}
              <p>{p.address}</p>
              {p.builder_name ? <p className="text-foreground-muted">Builder: {p.builder_name}</p> : null}
            </div>
          </div>
          <div className="grid gap-4 border-t border-border pt-4 sm:grid-cols-2">
            <p className="text-sm">
              <span className="text-foreground-muted">Last walkthrough: </span>
              <span className="font-medium text-foreground">{formatDisplayDate(p.last_walkthrough)}</span>
            </p>
            <p className="text-sm">
              <span className="text-foreground-muted">Next walkthrough: </span>
              <span className="font-medium text-foreground">{formatDisplayDate(p.next_walkthrough)}</span>
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold text-foreground">Punch list orders</h2>
          <Link
            to={`/property-manager/plos/new?property=${encodeURIComponent(p.id)}`}
            className={cn(buttonVariants({ variant: 'accent' }), 'sm:self-start')}
          >
            + New PLO
          </Link>
        </div>
        <BuilderPloTable
          plos={plosQuery.data ?? []}
          isLoading={plosQuery.isLoading}
          emptyTitle="No PLOs for this property"
          emptyDescription="Create a punch list order to schedule an inspection."
          emptyAction={
            <Link to={`/property-manager/plos/new?property=${encodeURIComponent(p.id)}`} className={cn(buttonVariants({ variant: 'accent' }))}>
              + New PLO
            </Link>
          }
        />
      </div>
    </>
  )
}
