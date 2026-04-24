import { supabase } from '@/lib/supabase'

/** Next work order id: WO-YYYY-001 (increments within calendar year). */
export async function generateNextWorkOrderId(): Promise<string> {
  const year = new Date().getFullYear()
  const prefix = `WO-${year}-`
  const { data, error } = await supabase
    .from('work_orders')
    .select('work_order_id')
    .like('work_order_id', `${prefix}%`)
  if (error) throw error

  let maxSeq = 0
  for (const row of data ?? []) {
    const id = (row as { work_order_id: string }).work_order_id
    if (!id.startsWith(prefix)) continue
    const n = Number.parseInt(id.slice(prefix.length), 10)
    if (!Number.isNaN(n)) maxSeq = Math.max(maxSeq, n)
  }
  return `${prefix}${String(maxSeq + 1).padStart(3, '0')}`
}
