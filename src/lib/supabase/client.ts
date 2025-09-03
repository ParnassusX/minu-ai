import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/database'
import { env } from '@/lib/config/environment'

export const createClient = () => {
  const config = env.getSupabaseConfig()
  return createBrowserClient<Database>(config.url, config.anonKey)
}
