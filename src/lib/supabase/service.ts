import { createClient as createAdminClient } from '@supabase/supabase-js'

export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  if (!url || !serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY or URL is not configured')
  }
  return createAdminClient(url, serviceRoleKey, { auth: { persistSession: false } })
}


