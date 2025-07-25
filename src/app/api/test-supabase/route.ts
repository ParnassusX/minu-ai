import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'

export async function GET(request: NextRequest) {
  console.log('🔧 Testing Supabase connection...')
  
  try {
    // Test 1: Create client
    console.log('🔧 Step 1: Creating Supabase client...')
    const supabase = createClient()
    console.log('🔧 Step 1: ✅ Client created successfully')

    // Test 2: Test auth session
    console.log('🔧 Step 2: Testing auth.getSession()...')
    const sessionStart = Date.now()
    
    // Add timeout to prevent hanging
    const sessionPromise = supabase.auth.getSession()
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Session timeout after 5 seconds')), 5000)
    )
    
    const { data: { session }, error: sessionError } = await Promise.race([
      sessionPromise,
      timeoutPromise
    ]) as any
    
    const sessionTime = Date.now() - sessionStart
    console.log(`🔧 Step 2: ✅ Session check completed in ${sessionTime}ms`)
    
    if (sessionError) {
      console.log('🔧 Step 2: ⚠️ Session error:', sessionError)
    } else {
      console.log('🔧 Step 2: ✅ Session result:', session ? 'User found' : 'No user')
    }

    // Test 3: Test database connection
    console.log('🔧 Step 3: Testing database connection...')
    const dbStart = Date.now()
    
    const dbPromise = supabase.from('profiles').select('count').limit(1)
    const dbTimeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Database timeout after 5 seconds')), 5000)
    )
    
    const { data: dbData, error: dbError } = await Promise.race([
      dbPromise,
      dbTimeoutPromise
    ]) as any
    
    const dbTime = Date.now() - dbStart
    console.log(`🔧 Step 3: Database query completed in ${dbTime}ms`)
    
    if (dbError) {
      console.log('🔧 Step 3: ⚠️ Database error:', dbError)
    } else {
      console.log('🔧 Step 3: ✅ Database connection successful')
    }

    return NextResponse.json({
      success: true,
      tests: {
        client: { status: 'success', time: 0 },
        session: { 
          status: sessionError ? 'error' : 'success', 
          time: sessionTime,
          error: sessionError?.message,
          hasUser: !!session?.user
        },
        database: { 
          status: dbError ? 'error' : 'success', 
          time: dbTime,
          error: dbError?.message
        }
      },
      environment: {
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing',
        supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Missing'
      }
    })

  } catch (error: any) {
    console.error('🔧 Supabase test failed:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}
