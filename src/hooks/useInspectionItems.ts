import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { InspectionItem } from '@/lib/types'

export function usePloInspectionItems(ploId: string | undefined) {
  return useQuery({
    queryKey: ['inspection_items', 'plo', ploId],
    enabled: Boolean(ploId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inspection_items')
        .select('*')
        .eq('plo_id', ploId!)
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data ?? []) as InspectionItem[]
    },
  })
}
