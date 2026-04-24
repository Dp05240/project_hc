import { supabase } from '@/lib/supabase'

/** Next display id: PLO-YYYY-001 (increments within calendar year). */
export async function generateNextPloId(): Promise<string> {
  const year = new Date().getFullYear()
  const prefix = `PLO-${year}-`
  const { data, error } = await supabase.from('plos').select('plo_id').like('plo_id', `${prefix}%`)
  if (error) throw error

  let maxSeq = 0
  for (const row of data ?? []) {
    const id = (row as { plo_id: string }).plo_id
    if (!id.startsWith(prefix)) continue
    const suffix = id.slice(prefix.length)
    const n = Number.parseInt(suffix, 10)
    if (!Number.isNaN(n)) maxSeq = Math.max(maxSeq, n)
  }
  const next = maxSeq + 1
  return `${prefix}${String(next).padStart(3, '0')}`
}
