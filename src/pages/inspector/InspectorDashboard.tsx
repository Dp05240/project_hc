import { format, addDays } from 'date-fns'
import { QrCode } from 'lucide-react'
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useInspectorSchedule } from '@/hooks/useInspectorSchedule'
import { formatPloScheduledDisplay } from '@/lib/plo-format'
import type { PLO } from '@/lib/types'
import { cn } from '@/lib/utils'
import { PloStatusBadge } from '@/components/builder/PloStatusBadge'
import { Badge } from '@/components/ui/Badge'
import { Card, CardContent } from '@/components/ui/Card'
import { buttonVariants } from '@/components/ui/Button'
import { LoadingState } from '@/components/shared/LoadingState'

function firstName(full: string) {
  return full.trim().split(/\s+/)[0] ?? full
}

function groupByDate(plos: PLO[]): Map<string, PLO[]> {
  const map = new Map<string, PLO[]>()
  for (const p of plos) {
    const key = p.scheduled_date ?? ''
    const list = map.get(key) ?? []
    list.push(p)
    map.set(key, list)
  }
  return map
}

export function InspectorDashboard() {
  const { profile, user } = useAuth()
  const schedule = useInspectorSchedule(user?.id)

  const todayStr = format(new Date(), 'yyyy-MM-dd')
  const upcomingEndStr = format(addDays(new Date(), 7), 'yyyy-MM-dd')

  const { todayJobs, upcomingJobs } = useMemo(() => {
    const all = schedule.data ?? []
    const today: PLO[] = []
    const upcoming: PLO[] = []
    for (const p of all) {
      if (!p.scheduled_date) continue
      if (p.scheduled_date === todayStr) {
        today.push(p)
      } else if (p.scheduled_date > todayStr && p.scheduled_date <= upcomingEndStr) {
        upcoming.push(p)
      }
    }
    return { todayJobs: today, upcomingJobs: upcoming }
  }, [schedule.data, todayStr, upcomingEndStr])

  const upcomingByDate = useMemo(() => groupByDate(upcomingJobs), [upcomingJobs])
  const upcomingDateKeys = useMemo(() => [...upcomingByDate.keys()].sort(), [upcomingByDate])

  const todayLabel = format(new Date(), 'EEEE, MMMM d, yyyy')

  if (schedule.isLoading) {
    return <LoadingState className="min-h-[40vh]" label="Loading your schedule…" />
  }

  if (schedule.error) {
    return (
      <p className="text-sm text-danger">
        Could not load schedule: {schedule.error.message}
      </p>
    )
  }

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
            Good morning{profile?.full_name ? `, ${firstName(profile.full_name)}` : ''}
          </h1>
          <p className="mt-1 text-sm text-foreground-secondary">{todayLabel}</p>
        </div>
        <Link
          to="/scan"
          className={cn(
            buttonVariants({ variant: 'accent', size: 'lg' }),
            'inline-flex min-h-14 w-full items-center justify-center gap-2 sm:w-auto sm:min-w-[200px]',
          )}
        >
          <QrCode className="h-6 w-6" />
          Scan QR
        </Link>
      </div>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Today&apos;s jobs</h2>
        {todayJobs.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border bg-surface/60 px-4 py-10 text-center text-sm text-foreground-secondary">
            No inspections scheduled for today
          </p>
        ) : (
          <ul className="flex flex-col gap-4">
            {todayJobs.map((plo) => (
              <li key={plo.id}>
                <JobCard plo={plo} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Upcoming</h2>
        {upcomingDateKeys.length === 0 ? (
          <p className="text-sm text-foreground-secondary">No upcoming jobs in the next 7 days.</p>
        ) : (
          <div className="space-y-6">
            {upcomingDateKeys.map((dateKey) => {
              const rows = upcomingByDate.get(dateKey) ?? []
              const label = format(new Date(`${dateKey}T12:00:00`), 'EEEE, MMM d')
              return (
                <div key={dateKey}>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-foreground-muted">
                    {label}
                  </p>
                  <ul className="flex flex-col gap-3">
                    {rows.map((plo) => (
                      <li key={plo.id}>
                        <UpcomingCard plo={plo} />
                      </li>
                    ))}
                  </ul>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}

function JobCard({ plo }: { plo: PLO }) {
  const prop = plo.property
  const scheduleLine = formatPloScheduledDisplay(plo)

  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-2xl font-bold text-foreground">LOT {prop?.lot_number ?? '—'}</p>
            <Badge variant="outline" className="text-xs font-medium">
              {plo.inspection_type}
            </Badge>
          </div>
          <PloStatusBadge status={plo.status} />
        </div>
        <p className="font-medium text-foreground">{prop?.homeowner_name ?? '—'}</p>
        <p className="text-sm text-foreground-secondary">{prop?.address ?? '—'}</p>
        <p className="text-xl font-semibold text-foreground">{scheduleLine}</p>
        <Link
          to={`/inspect/${plo.id}`}
          className={cn(
            buttonVariants({ variant: 'accent' }),
            'flex min-h-14 w-full items-center justify-center gap-2 text-base',
          )}
        >
          Start inspection →
        </Link>
      </CardContent>
    </Card>
  )
}

function UpcomingCard({ plo }: { plo: PLO }) {
  const prop = plo.property
  return (
    <Link to={`/inspect/${plo.id}`}>
      <Card className="transition-all duration-150 hover:shadow-md">
        <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
          <div>
            <p className="font-semibold text-foreground">LOT {prop?.lot_number ?? '—'}</p>
            <p className="text-sm text-foreground-secondary">{plo.inspection_type}</p>
          </div>
          <div className="text-right text-sm text-foreground-secondary">
            <p className="font-medium text-foreground">{formatPloScheduledDisplay(plo)}</p>
            <PloStatusBadge status={plo.status} />
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
