/**
 * Optimized Navigation System for Instant Navigation
 * Implements client-side optimizations to eliminate navigation delays
 */

'use client'

import { useEffect, useCallback, useMemo } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/auth/AuthProvider'

// Navigation cache to store prefetched data
const navigationCache = new Map<string, { data: any, timestamp: number }>()
const CACHE_DURATION = 60000 // 1 minute

// Preload critical routes for instant navigation
const CRITICAL_ROUTES = ['/generator', '/gallery', '/dashboard', '/settings']

/**
 * Optimized Link component with instant navigation
 */
interface OptimizedLinkProps {
  href: string
  children: React.ReactNode
  className?: string
  onClick?: () => void
  prefetch?: boolean
}

export function OptimizedLink({ 
  href, 
  children, 
  className, 
  onClick, 
  prefetch = true 
}: OptimizedLinkProps) {
  const router = useRouter()
  const { user, loading } = useAuth()

  // Preload route data on hover for instant navigation
  const handleMouseEnter = useCallback(() => {
    if (prefetch && !loading && user) {
      // Prefetch the route
      router.prefetch(href)
      
      // Preload any API data that might be needed
      preloadRouteData(href)
    }
  }, [href, prefetch, loading, user, router])

  // Handle click with optimized navigation
  const handleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    
    // Call custom onClick if provided
    if (onClick) {
      onClick()
    }

    // Use instant client-side navigation
    router.push(href)
  }, [href, onClick, router])

  return (
    <Link
      href={href}
      className={className}
      onMouseEnter={handleMouseEnter}
      onClick={handleClick}
      prefetch={prefetch}
    >
      {children}
    </Link>
  )
}

/**
 * Preload route-specific data for instant navigation
 */
async function preloadRouteData(route: string) {
  try {
    const cacheKey = `route:${route}`
    const cached = navigationCache.get(cacheKey)
    
    // Return cached data if still valid
    if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
      return cached.data
    }

    // Preload data based on route
    let data = null
    
    switch (route) {
      case '/gallery':
        // Preload first page of gallery images
        data = await preloadGalleryData()
        break
      case '/generator':
        // Preload models and configuration
        data = await preloadGeneratorData()
        break
      case '/dashboard':
        // Preload dashboard stats
        data = await preloadDashboardData()
        break
    }

    // Cache the preloaded data
    if (data) {
      navigationCache.set(cacheKey, { data, timestamp: Date.now() })
    }

    return data
  } catch (error) {
    console.warn('Failed to preload route data:', error)
    return null
  }
}

/**
 * Preload gallery data
 */
async function preloadGalleryData() {
  try {
    const response = await fetch('/api/gallery?limit=12', {
      headers: { 'Cache-Control': 'max-age=30' }
    })
    if (response.ok) {
      return await response.json()
    }
  } catch (error) {
    console.warn('Failed to preload gallery data:', error)
  }
  return null
}

/**
 * Preload generator data
 */
async function preloadGeneratorData() {
  try {
    const response = await fetch('/api/models-v2', {
      headers: { 'Cache-Control': 'max-age=300' }
    })
    if (response.ok) {
      return await response.json()
    }
  } catch (error) {
    console.warn('Failed to preload generator data:', error)
  }
  return null
}

/**
 * Preload dashboard data
 */
async function preloadDashboardData() {
  try {
    // Dashboard might not have specific API, so just return placeholder
    return { preloaded: true }
  } catch (error) {
    console.warn('Failed to preload dashboard data:', error)
  }
  return null
}

/**
 * Navigation preloader hook
 */
export function useNavigationPreloader() {
  const { user, loading } = useAuth()
  const pathname = usePathname()

  // Preload critical routes when user is authenticated
  useEffect(() => {
    if (!loading && user) {
      // Preload critical routes in background
      const preloadCriticalRoutes = async () => {
        for (const route of CRITICAL_ROUTES) {
          if (route !== pathname) {
            // Small delay between preloads to avoid overwhelming the server
            setTimeout(() => {
              preloadRouteData(route)
            }, Math.random() * 1000)
          }
        }
      }

      // Start preloading after a short delay
      setTimeout(preloadCriticalRoutes, 500)
    }
  }, [user, loading, pathname])

  // Clean up old cache entries
  useEffect(() => {
    const cleanup = () => {
      const now = Date.now()
      for (const [key, value] of navigationCache.entries()) {
        if (now - value.timestamp > CACHE_DURATION * 2) {
          navigationCache.delete(key)
        }
      }
    }

    const interval = setInterval(cleanup, 60000) // Clean every minute
    return () => clearInterval(interval)
  }, [])

  return {
    preloadRoute: preloadRouteData,
    getCachedData: (route: string) => navigationCache.get(`route:${route}`)?.data,
    clearCache: () => navigationCache.clear()
  }
}

/**
 * Optimized navigation provider
 */
interface OptimizedNavigationProviderProps {
  children: React.ReactNode
}

export function OptimizedNavigationProvider({ children }: OptimizedNavigationProviderProps) {
  const router = useRouter()
  const { user, loading } = useAuth()

  // Optimize router for faster navigation
  useEffect(() => {
    if (!loading && user) {
      // Prefetch critical routes
      CRITICAL_ROUTES.forEach(route => {
        router.prefetch(route)
      })
    }
  }, [user, loading, router])

  return <>{children}</>
}

/**
 * Get cached navigation data
 */
export function getCachedNavigationData(route: string) {
  const cached = navigationCache.get(`route:${route}`)
  if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
    return cached.data
  }
  return null
}

/**
 * Navigation performance monitor
 */
export function useNavigationPerformance() {
  const pathname = usePathname()

  const navigationTimes = useMemo(() => {
    const times = new Map<string, number>()
    
    // Track navigation start time
    const startTime = performance.now()
    
    return {
      start: startTime,
      measure: (label: string) => {
        const endTime = performance.now()
        const duration = endTime - startTime
        times.set(label, duration)
        
        if (duration > 100) {
          console.warn(`Slow navigation to ${pathname}: ${label} took ${duration}ms`)
        }
        
        return duration
      },
      getTimes: () => times
    }
  }, [pathname])

  return navigationTimes
}
