'use client'

import { createContext, useContext, useEffect, useState, useMemo } from 'react'
import { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/types/database'

type Profile = Database['public']['Tables']['profiles']['Row']

interface AuthContextType {
  user: User | null
  profile: Profile | null
  loading: boolean
  isAuthenticated: boolean
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: any }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error: any }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Fix hydration error by ensuring consistent initial state
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const supabase = createClient()
  const AUTH_TIMEOUT_MS = 3000

  // Prevent hydration mismatch by only rendering after mount
  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const withTimeout = async <T,>(p: Promise<T>, ms: number, label: string): Promise<T> => {
      return await Promise.race([
        p,
        new Promise<T>((_, reject) => setTimeout(() => reject(new Error(`Timeout after ${ms}ms: ${label}`)), ms))
      ])
    }

    const getSession = async () => {
      try {
        console.log('🔐 AuthProvider:getSession start')
        const { data: { session }, error: sessionError } = await withTimeout(
          supabase.auth.getSession(), AUTH_TIMEOUT_MS, 'supabase.auth.getSession'
        )

        if (sessionError) {
          console.error('Auth session error:', sessionError)
          setLoading(false)
          return
        }

        setUser(session?.user ?? null)

        if (session?.user) {
          try {
            const { data: profile, error: profileError } = await withTimeout(
              supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single(),
              AUTH_TIMEOUT_MS,
              'profiles.fetch'
            )

            if (profileError && profileError.code !== 'PGRST116') {
              // PGRST116 is "not found" - acceptable for new users without profiles
              console.error('Profile fetch error:', profileError)
            } else {
              setProfile(profile || null)
            }
          } catch (pfErr) {
            console.warn('Profile fetch timed out or failed:', pfErr)
          }
        }

        setLoading(false)
      } catch (error) {
        console.error('Auth error:', error)
        setLoading(false)
      }
    }

    // Start session fetch with timeout safeguards
    getSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔐 onAuthStateChange:', event)
        setUser(session?.user ?? null)

        if (session?.user) {
          try {
            const { data: profile } = await withTimeout(
              supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single(),
              AUTH_TIMEOUT_MS,
              'profiles.fetch:onAuthStateChange'
            )
            setProfile(profile)
          } catch (pfErr) {
            console.warn('Profile fetch (onAuthStateChange) timed out or failed:', pfErr)
          }
        } else {
          setProfile(null)
        }

        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase])

  const signIn = async (email: string, password: string) => {
    try {
      console.log('🔐 Attempting sign in with:', email)
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
      })

      if (error) {
        console.error('🔐 Sign in error:', error)
        return { error }
      }

      console.log('🔐 Sign in successful:', data.user?.email)
      return { error: null }
    } catch (err) {
      console.error('🔐 Sign in exception:', err)
      return { error: err }
    }
  }

  const signUp = async (email: string, password: string, fullName?: string) => {
    console.log('📝 Attempting sign up with:', email, fullName)
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      })

      console.log('📝 Sign up result:', { data, error })

      if (!error && data.user) {
        // Create profile
        console.log('📝 Creating profile for user:', data.user.id)
        await supabase.from('profiles').insert({
          id: data.user.id,
          email: data.user.email!,
          full_name: fullName,
          role: 'user',
        })
      }

      return { error }
    } catch (err) {
      console.error('📝 Sign up error:', err)
      return { error: err }
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })
    return { error }
  }

  const value = useMemo(() => ({
    user,
    profile,
    loading: loading || !mounted, // Keep loading until mounted to prevent hydration mismatch
    isAuthenticated: !!user && mounted, // Only consider authenticated after mount
    signIn,
    signUp,
    signOut,
    resetPassword,
  }), [user, profile, loading, mounted])

  // Removed redundant auth cache initialization to eliminate triple-layer caching
  // AuthProvider now serves as the single source of truth for auth state

  // Prevent hydration mismatch by showing loading state until mounted
  if (!mounted) {
    return (
      <AuthContext.Provider value={{
        user: null,
        profile: null,
        loading: true,
        isAuthenticated: false,
        signIn,
        signUp,
        signOut,
        resetPassword,
      }}>
        {children}
      </AuthContext.Provider>
    )
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
