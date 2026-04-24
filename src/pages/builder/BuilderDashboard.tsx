import { AlertTriangle, Building2, CheckCircle, ClipboardList } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useBuilderPloRows } from '@/hooks/usePLOs'
import { useDashboardStats } from '@/hooks/useDashboardStats'
import { cn } from '@/lib/utils'
import { PageHeader } from '@/components/layout/PageHeader'
import { StatCard } from '@/components/shared/StatCard'
import { Button, buttonVariants } from '@/components/ui/Button'
import { StatCardSkeleton } from '@/components/ui/Skeleton'
import { BuilderPloTable, NewPloEmptyButton } from '@/components/builder/BuilderPloTable'

export function BuilderDashboard() {
  const stats = useDashboardStats()
  const plos = useBuilderPloRows()

  const statsError = stats.error ?? plos.error
  const refetchAll = () => {
    void stats.refetch()
    void plos.refetch()
  }

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle="Manage your properties and inspections"
        actions={
          <div className="flex flex-wrap gap-2">
            <Link
              to="/property-manager/properties/new"
              className={cn(buttonVariants({ variant: 'secondary' }))}
            >
              + New Property
            </Link>
            <Link to="/property-manager/plos/new" className={cn(buttonVariants({ variant: 'accent' }))}>
              + New PLO
            </Link>
          </div>
        }
      />

      {statsError ? (
        <div className="mb-8 rounded-xl border border-danger/30 bg-red-50 px-4 py-3 text-sm text-danger">
          <p className="font-medium">Could not load dashboard data.</p>
          <p className="mt-1 text-foreground-secondary">{statsError.message}</p>
          <Button type="button" variant="secondary" className="mt-3" onClick={() => refetchAll()}>
            Retry
          </Button>
        </div>
      ) : null}

      <div className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.isLoading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <StatCard
              label="Total Properties"
              value={stats.data?.totalProperties ?? 0}
              icon={<Building2 className="h-6 w-6 text-info" />}
            />
            <StatCard
              label="Active PLOs"
              value={stats.data?.activePlos ?? 0}
              icon={<ClipboardList className="h-6 w-6 text-accent" />}
            />
            <StatCard
              label="Urgent Items"
              value={stats.data?.urgentItems ?? 0}
              icon={<AlertTriangle className="h-6 w-6 text-danger" />}
            />
            <StatCard
              label="Closed This Month"
              value={stats.data?.closedThisMonth ?? 0}
              icon={<CheckCircle className="h-6 w-6 text-success" />}
            />
          </>
        )}
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Punch list orders</h2>
        <BuilderPloTable
          plos={plos.data ?? []}
          isLoading={plos.isLoading}
          emptyAction={<NewPloEmptyButton />}
        />
      </div>
    </>
  )
}
