import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import type { Property } from '@/lib/types'

export interface PropertyWithPloCount extends Property {
  plo_count: number
}

async function fetchPloCountsByProperty(): Promise<Map<string, number>> {
  const { data, error } = await supabase.from('plos').select('property_id')
  if (error) throw error
  const map = new Map<string, number>()
  for (const row of data ?? []) {
    const pid = (row as { property_id: string }).property_id
    map.set(pid, (map.get(pid) ?? 0) + 1)
  }
  return map
}

export function usePropertiesList() {
  return useQuery({
    queryKey: ['properties', 'list'],
    queryFn: async (): Promise<PropertyWithPloCount[]> => {
      const [{ data: properties, error: propError }, counts] = await Promise.all([
        supabase.from('properties').select('*').order('created_at', { ascending: false }),
        fetchPloCountsByProperty(),
      ])
      if (propError) throw propError
      const list = (properties ?? []) as Property[]
      return list.map((p) => ({
        ...p,
        plo_count: counts.get(p.id) ?? 0,
      }))
    },
  })
}

export function useFilteredProperties(search: string) {
  const query = usePropertiesList()
  const raw = useMemo(() => query.data ?? [], [query.data])
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return raw
    return raw.filter(
      (p) =>
        p.lot_number.toLowerCase().includes(q) || p.homeowner_name.toLowerCase().includes(q),
    )
  }, [raw, search])
  return { ...query, data: filtered, totalLoaded: raw.length }
}

export function useProperty(id: string | undefined) {
  return useQuery({
    queryKey: ['properties', 'detail', id],
    enabled: Boolean(id),
    queryFn: async (): Promise<Property> => {
      const { data, error } = await supabase.from('properties').select('*').eq('id', id!).single()
      if (error) throw error
      return data as Property
    },
  })
}
