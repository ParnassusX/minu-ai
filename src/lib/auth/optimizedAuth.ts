/**
 * Optimized Authentication for Navigation Performance
 * Implements caching and reduces redundant auth checks
 */

import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { User } from '@supabase/supabase-js'

// In-memory cache for auth results (for development - use Redis in production)
const authCache = new Map<string, { user: User | null, timestamp: number }>()
const CACHE_DURATION = 30000 // 30 seconds cache

// Cache for session validation
const sessionCache = new Map<string, { valid: boolean, user: User | null, timestamp: number }>()
const SESSION_CACHE_DURATION = 60000 // 1 minute cache

/**
 * Get cached authentication result or fetch fresh
 */
export async function getCachedAuth(request: NextRequest): Promise<{ user: User | null, error: string | null, fromCache: boolean }> {
  try {
    // Extract session token from cookies for cache key
    const cookies = request.headers.get('cookie') || ''
    const sessionMatch = cookies.match(/sb-[^=]+-auth-token=([^;]+)/)
    const sessionToken = sessionMatch ? sessionMatch[1] : 'anonymous'
    
    // Check cache first
    const cached = authCache.get(sessionToken)
    if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
      return { user: cached.user, error: null, fromCache: true }
    }

    // Fetch fresh auth data
    const supabase = createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    // Cache the result
    authCache.set(sessionToken, { user, timestamp: Date.now() })

    // Clean old cache entries (simple cleanup)
    if (authCache.size > 100) {
      const now = Date.now()
      for (const [key, value] of authCache.entries()) {
        if (now - value.timestamp > CACHE_DURATION * 2) {
          authCache.delete(key)
        }
      }
    }

    return { user, error: error?.message || null, fromCache: false }
  } catch (error: any) {
    console.error('Auth cache error:', error)
    return { user: null, error: error.message, fromCache: false }
  }
}

/**
 * Fast session validation without full user fetch
 */
export async function validateSession(request: NextRequest): Promise<{ valid: boolean, userId?: string, fromCache: boolean }> {
  try {
    const cookies = request.headers.get('cookie') || ''
    const sessionMatch = cookies.match(/sb-[^=]+-auth-token=([^;]+)/)
    const sessionToken = sessionMatch ? sessionMatch[1] : 'anonymous'
    
    // Check session cache
    const cached = sessionCache.get(sessionToken)
    if (cached && (Date.now() - cached.timestamp) < SESSION_CACHE_DURATION) {
      return { 
        valid: cached.valid, 
        userId: cached.user?.id, 
        fromCache: true 
      }
    }

    // Quick session validation
    const supabase = createClient()
    const { data: { session }, error } = await supabase.auth.getSession()
    
    const valid = !error && !!session?.user
    const user = session?.user || null

    // Cache the session validation result
    sessionCache.set(sessionToken, { valid, user, timestamp: Date.now() })

    return { valid, userId: user?.id, fromCache: false }
  } catch (error: any) {
    console.error('Session validation error:', error)
    return { valid: false, fromCache: false }
  }
}

/**
 * Clear auth cache (useful for logout or when auth state changes)
 */
export function clearAuthCache(sessionToken?: string) {
  if (sessionToken) {
    authCache.delete(sessionToken)
    sessionCache.delete(sessionToken)
  } else {
    authCache.clear()
    sessionCache.clear()
  }
}

/**
 * Get cache statistics for monitoring
 */
export function getAuthCacheStats() {
  return {
    authCacheSize: authCache.size,
    sessionCacheSize: sessionCache.size,
    authCacheEntries: Array.from(authCache.entries()).map(([key, value]) => ({
      key: key.substring(0, 10) + '...',
      age: Date.now() - value.timestamp,
      hasUser: !!value.user
    })),
    sessionCacheEntries: Array.from(sessionCache.entries()).map(([key, value]) => ({
      key: key.substring(0, 10) + '...',
      age: Date.now() - value.timestamp,
      valid: value.valid
    }))
  }
}

/**
 * Optimized auth middleware for API routes
 */
export async function withOptimizedAuth(
  request: NextRequest,
  options: {
    requireAuth?: boolean
    allowCache?: boolean
    fastValidation?: boolean
  } = {}
): Promise<{ user: User | null, error: string | null, performance: any }> {
  const startTime = performance.now()
  const { requireAuth = true, allowCache = true, fastValidation = false } = options

  try {
    let result: { user: User | null, error: string | null, fromCache: boolean }

    if (fastValidation) {
      // Use fast session validation for non-critical checks
      const sessionResult = await validateSession(request)
      result = {
        user: sessionResult.valid ? { id: sessionResult.userId } as User : null,
        error: sessionResult.valid ? null : 'Unauthorized',
        fromCache: sessionResult.fromCache
      }
    } else if (allowCache) {
      // Use cached auth for full user data
      result = await getCachedAuth(request)
    } else {
      // Fresh auth check (no cache)
      const supabase = createClient()
      const { data: { user }, error } = await supabase.auth.getUser()
      result = { user, error: error?.message || null, fromCache: false }
    }

    const endTime = performance.now()
    const duration = Math.round(endTime - startTime)

    const performance_data = {
      duration,
      fromCache: result.fromCache,
      method: fastValidation ? 'fast' : allowCache ? 'cached' : 'fresh',
      cacheStats: allowCache ? getAuthCacheStats() : null
    }

    // Check if auth is required
    if (requireAuth && (!result.user || result.error)) {
      return {
        user: null,
        error: result.error || 'Authentication required',
        performance: performance_data
      }
    }

    return {
      user: result.user,
      error: null,
      performance: performance_data
    }

  } catch (error: any) {
    const endTime = performance.now()
    const duration = Math.round(endTime - startTime)

    return {
      user: null,
      error: error.message,
      performance: { duration, error: true, method: 'error' }
    }
  }
}

/**
 * Preload auth state for faster navigation
 */
export async function preloadAuthState(request: NextRequest): Promise<void> {
  try {
    // Preload auth state in background without waiting
    getCachedAuth(request).catch(() => {
      // Ignore errors in preload
    })
  } catch (error) {
    // Ignore preload errors
  }
}
