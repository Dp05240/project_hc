import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getAdminClient } from '@/lib/supabase-admin'
import { supabase } from '@/lib/supabase'
import type { Contractor } from '@/lib/types'

const QK = ['contractors']
const QK_ACTIVE = ['contractors', 'active']

async function fetchContractors(activeOnly?: boolean): Promise<Contractor[]> {
  let q = supabase.from('contractors').select('*').order('full_name', { ascending: true })
  if (activeOnly) q = q.eq('is_active', true)
  const { data, error } = await q
  if (error) throw error
  return (data ?? []) as Contractor[]
}

export function useContractors() {
  return useQuery({ queryKey: QK, queryFn: () => fetchContractors() })
}

export function useActiveContractors() {
  return useQuery({ queryKey: QK_ACTIVE, queryFn: () => fetchContractors(true) })
}

export function useCreateContractor() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: {
      full_name: string
      company_name?: string
      trade_type?: string
      email?: string
      phone?: string
      created_by: string
    }) => {
      let auth_user_id: string | null = null

      // Create Supabase auth user with default password
      if (payload.email) {
        const admin = getAdminClient()
        const { data: authData, error: authErr } = await admin.auth.admin.createUser({
          email: payload.email,
          password: 'contract2024',
          email_confirm: true,
          user_metadata: { full_name: payload.full_name, role: 'contractor' },
        })
        if (authErr) throw new Error(`Auth user creation failed: ${authErr.message}`)
        auth_user_id = authData.user?.id ?? null
      }

      const { error } = await supabase.from('contractors').insert({
        full_name: payload.full_name,
        company_name: payload.company_name ?? null,
        trade_type: payload.trade_type ?? null,
        email: payload.email ?? null,
        phone: payload.phone ?? null,
        created_by: payload.created_by,
        is_active: true,
        auth_user_id,
      })
      if (error) throw error
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: QK })
      void qc.invalidateQueries({ queryKey: QK_ACTIVE })
    },
  })
}

export function useUpdateContractor() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...patch }: Partial<Contractor> & { id: string }) => {
      const { error } = await supabase.from('contractors').update(patch).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: QK })
      void qc.invalidateQueries({ queryKey: QK_ACTIVE })
    },
  })
}
