/**
 * Authentication Check API - Minu.AI Generator V2 (Optimized)
 * Fast authentication check with caching for improved navigation performance
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Cache the static config to avoid repeated environment variable reads
let cachedConfig: any = null
let configCacheTime = 0
const CONFIG_CACHE_DURATION = 60000 // 1 minute

function getAuthConfig() {
  const now = Date.now()
  if (cachedConfig && (now - configCacheTime) < CONFIG_CACHE_DURATION) {
    return cachedConfig
  }

  const isDev = process.env.NODE_ENV === 'development'
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  cachedConfig = {
    environment: process.env.NODE_ENV,
    isDevelopment: isDev,
    supabaseConfigured: !!(supabaseUrl && supabaseAnonKey),
    supabaseUrl: supabaseUrl ? `${supabaseUrl.substring(0, 20)}...` : 'Not set',
    hasAnonKey: !!supabaseAnonKey,
    hasServiceKey: !!supabaseServiceKey,
    timestamp: new Date().toISOString()
  }

  configCacheTime = now
  return cachedConfig
}

export async function GET(request: NextRequest) {
  const startTime = performance.now()

  try {
    // Simplified auth check using direct Supabase client
    const supabase = createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    const authConfig = getAuthConfig()

    const endTime = performance.now()
    const totalTime = Math.round(endTime - startTime)

    // Simplified response for faster performance
    const response: any = {
      success: true,
      authenticated: !!user && !error,
      environment: authConfig.environment,
      configured: authConfig.supabaseConfigured,
      performance: {
        totalTime,
        authTime: totalTime,
        fromCache: false,
        method: 'direct'
      }
    }



    return NextResponse.json(response)
    
  } catch (error: any) {
    const endTime = performance.now()
    const totalTime = Math.round(endTime - startTime)

    console.error('❌ Auth check failed:', error)

    return NextResponse.json(
      {
        success: false,
        authenticated: false,
        error: 'Auth check failed',
        performance: { totalTime, error: true }
      },
      { status: 500 }
    )
  }
}
