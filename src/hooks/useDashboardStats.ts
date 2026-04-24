import { useQuery } from '@tanstack/react-query'
import { endOfMonth, startOfMonth } from 'date-fns'
import { supabase } from '@/lib/supabase'

export interface DashboardStats {
  totalProperties: number
  activePlos: number
  urgentItems: number
  closedThisMonth: number
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async (): Promise<DashboardStats> => {
      const monthStart = startOfMonth(new Date()).toISOString()
      const monthEnd = endOfMonth(new Date()).toISOString()

      const [totalProps, activePlos, urgentItems, closedThisMonth] = await Promise.all([
        supabase.from('properties').select('id', { count: 'exact', head: true }),
        supabase.from('plos').select('id', { count: 'exact', head: true }).neq('status', 'Closed'),
        supabase
          .from('inspection_items')
          .select('id', { count: 'exact', head: true })
          .eq('severity', 'Urgent')
          .neq('item_status', 'Resolved'),
        supabase
          .from('plos')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'Closed')
          .gte('created_at', monthStart)
          .lte('created_at', monthEnd),
      ])

      const firstError =
        totalProps.error ?? activePlos.error ?? urgentItems.error ?? closedThisMonth.error
      if (firstError) {
        throw firstError
      }

      return {
        totalProperties: totalProps.count ?? 0,
        activePlos: activePlos.count ?? 0,
        urgentItems: urgentItems.count ?? 0,
        closedThisMonth: closedThisMonth.count ?? 0,
      }
    },
  })
}
