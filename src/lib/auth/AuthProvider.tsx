'use client'

import { createContext, useContext, useEffect, useState, useMemo } from 'react'
import { User } from '@supabase/auth-helpers-nextjs'
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
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const getSession = async () => {
      console.log('🔄 AuthProvider: Starting session check...')
      try {
        console.log('🔄 AuthProvider: Calling supabase.auth.getSession()...')
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()

        if (sessionError) {
          console.error('🔄 AuthProvider: Session error:', sessionError)
          setLoading(false)
          return
        }

        console.log('🔄 AuthProvider: Session result:', session?.user ? 'User found' : 'No user')
        setUser(session?.user ?? null)

        if (session?.user) {
          console.log('🔄 AuthProvider: Fetching profile for user:', session.user.id)
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()

          if (profileError) {
            console.error('🔄 AuthProvider: Profile fetch error:', profileError)
          } else {
            console.log('🔄 AuthProvider: Profile fetched successfully')
          }

          setProfile(profile)
        }

        console.log('🔄 AuthProvider: Setting loading to false')
        setLoading(false)
      } catch (error) {
        console.error('🔄 AuthProvider: Unexpected error:', error)
        setLoading(false)
      }
    }

    // Add timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      console.error('🔄 AuthProvider: Session check timed out after 10 seconds')
      setLoading(false)
    }, 10000)

    getSession().finally(() => {
      clearTimeout(timeoutId)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)
        
        if (session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()
          setProfile(profile)
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
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      return { error }
    } catch (err) {
      console.error('Sign in error:', err)
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
    loading,
    isAuthenticated: !!user,
    signIn,
    signUp,
    signOut,
    resetPassword,
  }), [user, profile, loading])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
