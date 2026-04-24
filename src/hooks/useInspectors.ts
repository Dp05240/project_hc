import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Profile } from '@/lib/types'

export function useInspectors() {
  return useQuery({
    queryKey: ['profiles', 'inspectors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'inspector')
        .order('full_name', { ascending: true })
      if (error) throw error
      return (data ?? []) as Profile[]
    },
  })
}
