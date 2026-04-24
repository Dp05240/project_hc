import { useMemo, useState } from 'react'
import { useBuilderPloRows } from '@/hooks/usePLOs'
import type { PLOStatus } from '@/lib/types'
import { PageHeader } from '@/components/layout/PageHeader'
import { BuilderPloTable } from '@/components/builder/BuilderPloTable'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'

const STATUS_FILTER_OPTIONS: Array<{ value: '' | PLOStatus; label: string }> = [
  { value: '', label: 'All statuses' },
  { value: 'Scheduled', label: 'Scheduled' },
  { value: 'In Progress', label: 'In Progress' },
  { value: 'Under Review', label: 'Under Review' },
  { value: 'Closed', label: 'Closed' },
]

export function ContractorPLOsPage() {
  const [statusFilter, setStatusFilter] = useState<'' | PLOStatus>('')
  const { data: allPlos = [], isLoading, error, refetch } = useBuilderPloRows()

  const filtered = useMemo(() => {
    if (!statusFilter) return allPlos
    return allPlos.filter((p) => p.status === statusFilter)
  }, [allPlos, statusFilter])

  return (
    <>
      <PageHeader title="Punch list orders" subtitle="View only" />

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-foreground-secondary">Filter by status</p>
        <Select
          className="max-w-xs sm:ml-auto"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as '' | PLOStatus)}
          aria-label="Filter by status"
        >
          {STATUS_FILTER_OPTIONS.map((o) => (
            <option key={o.label} value={o.value}>{o.label}</option>
          ))}
        </Select>
      </div>

      {error ? (
        <div className="mb-6 rounded-xl border border-danger/30 bg-red-50 px-4 py-3 text-sm text-danger">
          <p className="font-medium">Could not load PLOs.</p>
          <Button type="button" variant="secondary" className="mt-3" onClick={() => void refetch()}>Retry</Button>
        </div>
      ) : null}

      <BuilderPloTable plos={filtered} isLoading={isLoading} hideNew basePath="/contractor" />
    </>
  )
}
