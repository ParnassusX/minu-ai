/**
 * Supabase Keep-Alive Ping API
 * Prevents Supabase database from going idle due to inactivity
 * This endpoint should be called periodically (e.g., weekly via cron job or external service)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Ping interval recommendation: weekly (604800000 ms)
const RECOMMENDED_PING_INTERVAL = 7 * 24 * 60 * 60 * 1000

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    const supabase = createClient()
    
    // Perform a lightweight query to keep the database active
    // Using select('id') with head:true for minimal overhead
    const { count, error } = await supabase
      .from('images')
      .select('id', { count: 'exact', head: true })
    
    const responseTime = Date.now() - startTime
    
    if (error) {
      console.error('Supabase ping failed:', error)
      return NextResponse.json({
        success: false,
        status: 'unhealthy',
        message: 'Database ping failed',
        error: error.message,
        responseTime,
        timestamp: new Date().toISOString(),
        nextPingRecommended: new Date(Date.now() + RECOMMENDED_PING_INTERVAL).toISOString()
      }, { status: 500 })
    }
    
    console.log(`🔔 Supabase keep-alive ping successful (${responseTime}ms, ${count ?? 0} images in DB)`)
    
    return NextResponse.json({
      success: true,
      status: 'healthy',
      message: 'Database is active and responding',
      responseTime,
      stats: {
        imagesInDatabase: count ?? 0
      },
      timestamp: new Date().toISOString(),
      nextPingRecommended: new Date(Date.now() + RECOMMENDED_PING_INTERVAL).toISOString(),
      pingInterval: {
        recommended: '7 days',
        milliseconds: RECOMMENDED_PING_INTERVAL
      }
    })
    
  } catch (error: unknown) {
    const responseTime = Date.now() - startTime
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    console.error('Supabase keep-alive ping error:', error)
    
    return NextResponse.json({
      success: false,
      status: 'error',
      message: 'Ping request failed',
      error: errorMessage,
      responseTime,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

// POST endpoint for triggering manual ping with optional metadata
export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    const body = await request.json().catch(() => ({}))
    const { source = 'manual', reason = 'keep-alive' } = body
    
    const supabase = createClient()
    
    // Perform comprehensive health check
    const checks = await Promise.allSettled([
      // Check images table
      supabase.from('images').select('*', { count: 'exact', head: true }),
      // Check profiles table
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      // Check folders table (if exists)
      supabase.from('folders').select('*', { count: 'exact', head: true })
    ])
    
    const responseTime = Date.now() - startTime
    
    const results = {
      images: checks[0].status === 'fulfilled' ? checks[0].value.count : null,
      profiles: checks[1].status === 'fulfilled' ? checks[1].value.count : null,
      folders: checks[2].status === 'fulfilled' ? checks[2].value.count : null
    }
    
    const allHealthy = checks.every(check => 
      check.status === 'fulfilled' && !check.value.error
    )
    
    console.log(`🔔 Supabase comprehensive ping (${source}): ${allHealthy ? 'healthy' : 'degraded'} (${responseTime}ms)`)
    
    return NextResponse.json({
      success: allHealthy,
      status: allHealthy ? 'healthy' : 'degraded',
      message: allHealthy ? 'All database tables are accessible' : 'Some tables may have issues',
      source,
      reason,
      responseTime,
      tableStats: results,
      timestamp: new Date().toISOString(),
      nextPingRecommended: new Date(Date.now() + RECOMMENDED_PING_INTERVAL).toISOString()
    })
    
  } catch (error: unknown) {
    const responseTime = Date.now() - startTime
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    return NextResponse.json({
      success: false,
      status: 'error',
      message: 'Comprehensive ping failed',
      error: errorMessage,
      responseTime,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
