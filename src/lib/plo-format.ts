import { format, parseISO, isValid } from 'date-fns'
import type { PLO } from '@/lib/types'

export function formatTimeOnly(time: string): string {
  const parts = time.split(':')
  if (parts.length >= 2) {
    const h = Number.parseInt(parts[0] ?? '0', 10)
    const m = Number.parseInt(parts[1] ?? '0', 10)
    const dt = new Date(1970, 0, 1, h, m, 0, 0)
    return format(dt, 'h:mm a')
  }
  return time
}

/** For “today” cards: show time when date is today; otherwise full schedule line. */
export function formatPloScheduleForJobCard(plo: PLO, todayIsoDate: string): string {
  if (!plo.scheduled_date) return '—'
  if (plo.scheduled_date === todayIsoDate && plo.scheduled_time) {
    return formatTimeOnly(plo.scheduled_time)
  }
  return formatPloScheduledDisplay(plo)
}

export function formatPloScheduledDisplay(plo: PLO): string {
  if (!plo.scheduled_date) return '—'
  try {
    const d = parseISO(plo.scheduled_date)
    if (!isValid(d)) return plo.scheduled_date
    const datePart = format(d, 'EEE, MMM d')
    if (plo.scheduled_time) {
      return `${datePart} at ${formatTimeOnly(plo.scheduled_time)}`
    }
    return datePart
  } catch {
    return plo.scheduled_date
  }
}
