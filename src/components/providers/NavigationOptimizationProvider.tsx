/**
 * Navigation Optimization Provider
 * Wraps the app with navigation performance optimizations
 */

'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/lib/auth/AuthProvider'
import { OptimizedNavigationProvider } from '@/lib/navigation/optimizedNavigation'

interface NavigationOptimizationProviderProps {
  children: React.ReactNode
}

export function NavigationOptimizationProvider({ children }: NavigationOptimizationProviderProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, loading } = useAuth()

  // Optimize Next.js router for faster navigation
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Prefetch critical routes when user is authenticated
      if (!loading && user) {
        const criticalRoutes = ['/generator', '/gallery', '/dashboard', '/settings']
        
        criticalRoutes.forEach(route => {
          if (route !== pathname) {
            router.prefetch(route)
          }
        })
      }

      // Optimize browser for faster navigation
      optimizeBrowserForNavigation()
    }
  }, [user, loading, pathname, router])

  return (
    <OptimizedNavigationProvider>
      {children}
    </OptimizedNavigationProvider>
  )
}

/**
 * Browser optimizations for faster navigation
 */
function optimizeBrowserForNavigation() {
  // Enable faster DNS lookups
  if (typeof document !== 'undefined') {
    // Add DNS prefetch for external resources
    const dnsHints = [
      'https://cloudinary.com',
      'https://replicate.com',
      'https://supabase.co'
    ]

    dnsHints.forEach(domain => {
      const link = document.createElement('link')
      link.rel = 'dns-prefetch'
      link.href = domain
      document.head.appendChild(link)
    })

    // Preconnect to critical domains
    const preconnectDomains = [
      'https://ygbagvxaplnwnmkgtjvi.supabase.co'
    ]

    preconnectDomains.forEach(domain => {
      const link = document.createElement('link')
      link.rel = 'preconnect'
      link.href = domain
      document.head.appendChild(link)
    })
  }

  // Optimize fetch for API calls
  if (typeof window !== 'undefined' && 'fetch' in window) {
    const originalFetch = window.fetch
    
    window.fetch = function(input, init = {}) {
      // Add performance optimizations to API calls
      const optimizedInit = {
        ...init,
        headers: {
          'Cache-Control': 'max-age=30',
          ...init.headers
        }
      }

      // Add timeout for faster failure detection
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

      const fetchPromise = originalFetch(input, {
        ...optimizedInit,
        signal: controller.signal
      })

      fetchPromise.finally(() => clearTimeout(timeoutId))

      return fetchPromise
    }
  }
}

/**
 * Navigation performance monitor component
 */
export function NavigationPerformanceMonitor() {
  const pathname = usePathname()

  useEffect(() => {
    if (typeof window !== 'undefined' && 'performance' in window) {
      // Monitor navigation performance
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        
        entries.forEach((entry) => {
          if (entry.entryType === 'navigation') {
            const navEntry = entry as PerformanceNavigationTiming
            
            // Log slow navigations
            if (navEntry.loadEventEnd - navEntry.fetchStart > 1000) {
              console.warn('Slow navigation detected:', {
                url: navEntry.name,
                totalTime: navEntry.loadEventEnd - navEntry.fetchStart,
                domContentLoaded: navEntry.domContentLoadedEventEnd - navEntry.fetchStart,
                loadComplete: navEntry.loadEventEnd - navEntry.fetchStart
              })
            }
          }
        })
      })

      observer.observe({ entryTypes: ['navigation'] })

      return () => observer.disconnect()
    }
  }, [pathname])

  return null
}

/**
 * Route preloader component
 */
export function RoutePreloader() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) {
      // Preload routes based on user behavior patterns
      const commonRoutes = ['/generator', '/gallery']
      
      // Stagger preloading to avoid overwhelming the server
      commonRoutes.forEach((route, index) => {
        setTimeout(() => {
          router.prefetch(route)
        }, index * 500)
      })
    }
  }, [user, loading, router])

  return null
}

/**
 * API cache warmer component
 */
export function APICacheWarmer() {
  const { user, loading } = useAuth()

  useEffect(() => {
    if (!loading && user) {
      // Warm up critical API endpoints
      const warmupEndpoints = [
        '/api/models-v2',
        '/api/auth-check'
      ]

      warmupEndpoints.forEach((endpoint, index) => {
        setTimeout(() => {
          fetch(endpoint, {
            headers: { 'Cache-Control': 'max-age=300' }
          }).catch(() => {
            // Ignore errors in cache warming
          })
        }, index * 200)
      })
    }
  }, [user, loading])

  return null
}

/**
 * Complete navigation optimization wrapper
 */
export function CompleteNavigationOptimization({ children }: { children: React.ReactNode }) {
  return (
    <NavigationOptimizationProvider>
      <NavigationPerformanceMonitor />
      <RoutePreloader />
      <APICacheWarmer />
      {children}
    </NavigationOptimizationProvider>
  )
}
