import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { PLO, WorkOrder } from '@/lib/types'

async function enrichWithPlo(rows: WorkOrder[]): Promise<WorkOrder[]> {
  if (rows.length === 0) return []
  const ploIds = [...new Set(rows.map((w) => w.plo_id))]
  const { data: plos, error: pe } = await supabase
    .from('plos')
    .select('*, property:properties(*)')
    .in('id', ploIds)
  if (pe) throw pe
  const plosById = new Map((plos ?? []).map((p) => [p.id, p as PLO]))
  return rows.map((w) => ({ ...w, plo: plosById.get(w.plo_id) }))
}

async function fetchWorkOrders(): Promise<WorkOrder[]> {
  const { data: rows, error } = await supabase
    .from('work_orders')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return enrichWithPlo((rows ?? []) as WorkOrder[])
}

async function fetchContractorWorkOrders(contractorId: string): Promise<WorkOrder[]> {
  const { data: rows, error } = await supabase
    .from('work_orders')
    .select('*')
    .eq('assigned_contractor_id', contractorId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return enrichWithPlo((rows ?? []) as WorkOrder[])
}

export function useWorkOrders() {
  return useQuery({
    queryKey: ['work_orders'],
    queryFn: fetchWorkOrders,
  })
}

export function useContractorWorkOrders(contractorId: string | undefined) {
  return useQuery({
    queryKey: ['work_orders', 'contractor', contractorId],
    enabled: Boolean(contractorId),
    queryFn: () => fetchContractorWorkOrders(contractorId!),
  })
}

export function useUpdateWorkOrderStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: WorkOrder['status'] }) => {
      const { error } = await supabase.from('work_orders').update({ status }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['work_orders'] }),
  })
}
