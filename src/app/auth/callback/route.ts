import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = createClient()
    
    try {
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (!error) {
        // Successful authentication - redirect to intended destination
        const forwardedHost = request.headers.get('x-forwarded-host')
        const isLocalEnv = process.env.NODE_ENV === 'development'
        
        if (isLocalEnv) {
          // Development environment
          return NextResponse.redirect(`${origin}${next}`)
        } else if (forwardedHost) {
          // Production environment with forwarded host
          return NextResponse.redirect(`https://${forwardedHost}${next}`)
        } else {
          // Fallback to origin
          return NextResponse.redirect(`${origin}${next}`)
        }
      }
    } catch (error) {
      console.error('Auth callback error:', error)
    }
  }

  // Authentication failed - redirect to auth error page
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
