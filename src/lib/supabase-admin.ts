import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const serviceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY as string | undefined

/**
 * Admin client using the service role key — bypasses RLS.
 * Only used server-side equivalent calls (create auth users for inspectors/contractors).
 * IMPORTANT: Only call from property-manager-authenticated contexts.
 * Never expose or log the service role key.
 */
export function getAdminClient() {
  if (!serviceRoleKey) {
    throw new Error(
      'VITE_SUPABASE_SERVICE_ROLE_KEY is not set. Add it to your .env file to enable user creation.',
    )
  }
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
