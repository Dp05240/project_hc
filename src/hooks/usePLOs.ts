import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { PLO, Profile, Property } from '@/lib/types'

function mapPloRows(
  plos: PLO[],
  properties: Property[],
  profiles: Profile[],
): PLO[] {
  const propById = new Map(properties.map((p) => [p.id, p]))
  const profById = new Map(profiles.map((p) => [p.id, p]))
  return plos.map((plo) => ({
    ...plo,
    property: propById.get(plo.property_id),
    inspector: plo.assigned_inspector_id ? profById.get(plo.assigned_inspector_id) : undefined,
  }))
}

async function fetchPlosWithRelations(filterPropertyId?: string): Promise<PLO[]> {
  let q = supabase.from('plos').select('*').order('created_at', { ascending: false })
  if (filterPropertyId) {
    q = q.eq('property_id', filterPropertyId)
  }
  const { data: plos, error } = await q
  if (error) throw error
  const list = (plos ?? []) as PLO[]
  if (list.length === 0) return []

  const propIds = [...new Set(list.map((p) => p.property_id))]
  const inspectorIds = [
    ...new Set(list.map((p) => p.assigned_inspector_id).filter((id): id is string => Boolean(id))),
  ]

  const [{ data: properties, error: pe }, { data: profiles, error: fe }] = await Promise.all([
    supabase.from('properties').select('*').in('id', propIds),
    inspectorIds.length
      ? supabase.from('profiles').select('*').in('id', inspectorIds)
      : Promise.resolve({ data: [] as Profile[], error: null }),
  ])

  if (pe) throw pe
  if (fe) throw fe

  return mapPloRows(list, (properties ?? []) as Property[], (profiles ?? []) as Profile[])
}

/** All PLOs for builder dashboards / lists (RLS should scope to allowed rows). */
export function useBuilderPloRows() {
  return useQuery({
    queryKey: ['plos', 'list', 'builder'],
    queryFn: () => fetchPlosWithRelations(),
  })
}

export function usePropertyPloRows(propertyId: string | undefined) {
  return useQuery({
    queryKey: ['plos', 'list', 'property', propertyId],
    enabled: Boolean(propertyId),
    queryFn: () => fetchPlosWithRelations(propertyId),
  })
}

export function usePlo(id: string | undefined) {
  return useQuery({
    queryKey: ['plos', 'detail', id],
    enabled: Boolean(id),
    queryFn: async (): Promise<PLO> => {
      const { data: plo, error } = await supabase.from('plos').select('*').eq('id', id!).single()
      if (error) throw error
      const base = plo as PLO
      const [{ data: property, error: pe }, inspectorRes] = await Promise.all([
        supabase.from('properties').select('*').eq('id', base.property_id).single(),
        base.assigned_inspector_id
          ? supabase.from('profiles').select('*').eq('id', base.assigned_inspector_id).single()
          : Promise.resolve({ data: null as Profile | null, error: null }),
      ])
      if (pe) throw pe
      if (inspectorRes.error) throw inspectorRes.error
      return {
        ...base,
        property: property as Property,
        inspector: (inspectorRes.data ?? undefined) as Profile | undefined,
      }
    },
  })
}
