import { Building2, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useFilteredProperties } from '@/hooks/useProperties'
import { cn } from '@/lib/utils'
import { formatDisplayDate } from '@/lib/format-date'
import { PageHeader } from '@/components/layout/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { Badge } from '@/components/ui/Badge'
import { Card, CardContent } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button, buttonVariants } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'

function PropertyCardSkeleton() {
  return (
    <Card>
      <CardContent className="space-y-3 pt-6">
        <div className="flex items-start justify-between gap-2">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-2/3" />
        <div className="flex gap-4 pt-2">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-3 w-28" />
        </div>
        <Skeleton className="h-3 w-24" />
      </CardContent>
    </Card>
  )
}

export function PropertiesPage() {
  const [search, setSearch] = useState('')
  const navigate = useNavigate()
  const { data: properties, isLoading, error, refetch, totalLoaded } = useFilteredProperties(search)

  const grid = useMemo(
    () => (
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 md:grid-cols-2">
        {properties.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => navigate(`/builder/properties/${p.id}`)}
            className="text-left transition-all duration-150"
          >
            <Card className="h-full cursor-pointer transition-all duration-150 hover:shadow-md">
              <CardContent className="space-y-3 pt-6">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="text-2xl font-bold text-foreground">{p.lot_number}</p>
                  {p.community_name ? (
                    <Badge variant="outline" className="shrink-0">
                      {p.community_name}
                    </Badge>
                  ) : null}
                </div>
                <p className="font-medium text-foreground">{p.homeowner_name}</p>
                <p className="text-sm text-foreground-secondary">{p.address}</p>
                <div className="grid gap-1 text-sm text-foreground-secondary sm:grid-cols-2">
                  <p>
                    <span className="text-foreground-muted">Last: </span>
                    {formatDisplayDate(p.last_walkthrough)}
                  </p>
                  <p>
                    <span className="text-foreground-muted">Next: </span>
                    {formatDisplayDate(p.next_walkthrough)}
                  </p>
                </div>
                <p className="text-sm font-medium text-foreground">
                  {p.plo_count} {p.plo_count === 1 ? 'PLO' : 'PLOs'}
                </p>
              </CardContent>
            </Card>
          </button>
        ))}
      </div>
    ),
    [properties, navigate],
  )

  return (
    <>
      <PageHeader
        title="Properties"
        actions={
          <Link to="/builder/properties/new" className={cn(buttonVariants({ variant: 'secondary' }))}>
            + New Property
          </Link>
        }
      />

      <div className="relative mb-6">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-foreground-muted" />
        <Input
          className="pl-10"
          placeholder="Search by lot number or homeowner…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search properties"
        />
      </div>

      {error ? (
        <div className="mb-6 rounded-xl border border-danger/30 bg-red-50 px-4 py-3 text-sm text-danger">
          <p className="font-medium">Could not load properties.</p>
          <p className="mt-1 text-foreground-secondary">{error.message}</p>
          <Button type="button" variant="secondary" className="mt-3" onClick={() => void refetch()}>
            Retry
          </Button>
        </div>
      ) : null}

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 md:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <PropertyCardSkeleton key={i} />
          ))}
        </div>
      ) : properties.length === 0 ? (
        totalLoaded > 0 && search.trim() ? (
          <p className="py-12 text-center text-sm text-foreground-secondary">No properties match your search.</p>
        ) : (
          <EmptyState
            icon={Building2}
            title="No properties yet"
            description="Add a lot to start tracking walkthroughs and PLOs."
            action={
              <Link to="/builder/properties/new" className={cn(buttonVariants({ variant: 'primary' }))}>
                + New Property
              </Link>
            }
          />
        )
      ) : (
        grid
      )}
    </>
  )
}
