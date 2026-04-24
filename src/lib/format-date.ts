import { format, isValid, parseISO } from 'date-fns'

export function formatDisplayDate(value?: string | null): string {
  if (!value) return '—'
  const parsed = parseISO(value)
  return isValid(parsed) ? format(parsed, 'MMM d, yyyy') : value
}
