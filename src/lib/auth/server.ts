import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Database } from '@/types/database'

export async function createServerSupabaseClient() {
  const cookieStore = cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
        remove(name: string, options: any) {
          try {
            cookieStore.set({ name, value: '', ...options })
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
