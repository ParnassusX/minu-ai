import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Database } from '@/types/database'
import { Environment } from '@/lib/config/environment'

export async function createServerSupabaseClient() {
  const cookieStore = cookies()
  const config = Environment.getInstance().getSupabaseConfig()

  return createServerClient<Database>(
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
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
        async remove(name: string, options: any) {
          try {
            const store = await cookieStore
            store.set({ name, value: '', ...options })
          } catch (error) {
            // The `delete` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}

export async function getAuthenticatedUser() {
  const supabase = await createServerSupabaseClient()

  try {
    const { data: { user }, error } = await supabase.auth.getUser()

    // In development mode, use the real authenticated user if available
    if (process.env.NODE_ENV === 'development') {
      console.log('Development mode: Using real authenticated user for server auth')
      // Don't override with mock user - use the real authenticated user
    }

    if (error || !user) {
      return { user: null, profile: null, error }
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    return {
      user,
      profile,
      error: null
    }
  } catch (error) {
    console.error('Error getting authenticated user:', error)
    return { user: null, profile: null, error }
  }
}

export async function requireAuth() {
  const authData = await getAuthenticatedUser()

  if (!authData.user || authData.error) {
    throw new Error('Authentication required')
  }

  return authData
}
