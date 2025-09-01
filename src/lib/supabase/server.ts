import { createServerClient as createSupabaseServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Database } from '@/types/database'
import { Environment } from '@/lib/config/environment'

export const createClient = () => {
  const cookieStore = cookies()
  const config = Environment.getInstance().getSupabaseConfig()

  return createSupabaseServerClient<Database>(
    config.url,
    config.anonKey,
    {
      cookies: {
        async get(name: string) {
          const store = await cookieStore
          return store.get(name)?.value
        },
        async set(name: string, value: string, options: any) {
          try {
            const store = await cookieStore
            store.set({ name, value, ...options })
          } catch (error) {
            // Ignore cookie errors in server context
          }
        },
        async remove(name: string, options: any) {
          try {
            const store = await cookieStore
            store.set({ name, value: '', ...options })
          } catch (error) {
            // Ignore cookie errors in server context
          }
        },
      },
    }
  )
}

// Service role client for development (bypasses RLS)
export const createServiceClient = () => {
  const config = Environment.getInstance().getSupabaseConfig()

  return createSupabaseServerClient<Database>(
    config.url,
    config.serviceRoleKey!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      },
      cookies: {
        get() { return undefined },
        set() {},
        remove() {}
      }
    }
  )
}
