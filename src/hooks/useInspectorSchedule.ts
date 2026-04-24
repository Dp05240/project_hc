import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { PLO, Property } from '@/lib/types'

function mapPloRows(plos: PLO[], properties: Property[]): PLO[] {
  const propById = new Map(properties.map((p) => [p.id, p]))
  return plos.map((plo) => ({
    ...plo,
    property: propById.get(plo.property_id),
  }))
}

async function fetchInspectorPlos(userId: string): Promise<PLO[]> {
  const { data: plos, error } = await supabase
    .from('plos')
    .select('*')
    .eq('assigned_inspector_id', userId)
    .not('scheduled_date', 'is', null)
    .order('scheduled_date', { ascending: true })
    .order('created_at', { ascending: true })
  if (error) throw error
  const list = (plos ?? []) as PLO[]
  if (list.length === 0) return []
  const propIds = [...new Set(list.map((p) => p.property_id))]
  const { data: properties, error: pe } = await supabase.from('properties').select('*').in('id', propIds)
  if (pe) throw pe
  return mapPloRows(list, (properties ?? []) as Property[])
}

export function useInspectorSchedule(userId: string | undefined) {
  const queryClient = useQueryClient()
  const query = useQuery({
    queryKey: ['plos', 'inspector', userId],
    enabled: Boolean(userId),
    queryFn: () => fetchInspectorPlos(userId!),
  })

  useEffect(() => {
    if (!userId) return
    const channel = supabase
      .channel(`inspector-plos-${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'plos', filter: `assigned_inspector_id=eq.${userId}` },
        () => {
          void queryClient.invalidateQueries({ queryKey: ['plos', 'inspector', userId] })
        },
      )
      .subscribe()
    return () => {
      void supabase.removeChannel(channel)
    }
  }, [userId, queryClient])

  return query
}
