/**
 * Instant Navigation System
 * Provides instant switching between app sections like modern AI platforms
 */

'use client'

import { useEffect, useCallback, useState, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/lib/auth/AuthProvider'

// Navigation state management
interface NavigationState {
  currentRoute: string
  previousRoute: string | null
  isNavigating: boolean
  preloadedRoutes: Set<string>
  routeData: Map<string, any>
}

// Global navigation state
let navigationState: NavigationState = {
  currentRoute: '/',
  previousRoute: null,
  isNavigating: false,
  preloadedRoutes: new Set(),
  routeData: new Map()
}

// Navigation event listeners
const navigationListeners = new Set<(state: NavigationState) => void>()

/**
 * Instant Navigation Manager
 */
class InstantNavigationManager {
  private router: any
  private preloadQueue: string[] = []
  private isPreloading = false

  constructor(router: any) {
    this.router = router
    this.initializePreloading()
  }

  /**
   * Navigate instantly to a route
   */
  async navigateInstantly(href: string): Promise<void> {
    const startTime = performance.now()
    
    // Update navigation state
    this.updateNavigationState({
      previousRoute: navigationState.currentRoute,
      currentRoute: href,
      isNavigating: true
    })

    try {
      // Check if route is preloaded
      if (navigationState.preloadedRoutes.has(href)) {
        // Use cached route data for instant navigation
        const routeData = navigationState.routeData.get(href)
        if (routeData) {
          // Apply cached data immediately
          this.applyCachedRouteData(href, routeData)
        }
      }

      // Perform the actual navigation
      await this.router.push(href)

      const endTime = performance.now()
      const navigationTime = endTime - startTime

      // Log performance
      if (navigationTime > 100) {
        console.warn(`Navigation to ${href} took ${navigationTime}ms`)
      } else {
        console.log(`✅ Instant navigation to ${href}: ${navigationTime}ms`)
      }

    } catch (error) {
      console.error('Navigation failed:', error)
    } finally {
      this.updateNavigationState({ isNavigating: false })
    }
  }

  /**
   * Preload a route for instant navigation
   */
  async preloadRoute(href: string): Promise<void> {
    if (navigationState.preloadedRoutes.has(href)) {
      return // Already preloaded
    }

    try {
      // Prefetch the route
      await this.router.prefetch(href)
      
      // Preload route-specific data
      const routeData = await this.preloadRouteData(href)
      
      // Mark as preloaded
      navigationState.preloadedRoutes.add(href)
      if (routeData) {
        navigationState.routeData.set(href, routeData)
      }

      console.log(`✅ Preloaded route: ${href}`)
      
    } catch (error) {
      console.warn(`Failed to preload route ${href}:`, error)
    }
  }

  /**
   * Preload route-specific data
   */
  private async preloadRouteData(href: string): Promise<any> {
    const routeDataLoaders: Record<string, () => Promise<any>> = {
      '/gallery': () => this.preloadGalleryData(),
      '/generator': () => this.preloadGeneratorData(),
      '/dashboard': () => this.preloadDashboardData(),
      '/settings': () => this.preloadSettingsData()
    }

    const loader = routeDataLoaders[href]
    if (loader) {
      return await loader()
    }

    return null
  }

  /**
   * Apply cached route data for instant display
   */
  private applyCachedRouteData(href: string, data: any): void {
    // This would integrate with your state management to show cached data immediately
    // while the actual route loads in the background
    
    // Example: Update global state with cached data
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('route-data-cached', {
        detail: { route: href, data }
      }))
    }
  }

  /**
   * Initialize background preloading
   */
  private initializePreloading(): void {
    // Preload critical routes in background
    const criticalRoutes = ['/generator', '/gallery', '/dashboard']
    
    criticalRoutes.forEach((route, index) => {
      setTimeout(() => {
        this.preloadRoute(route)
      }, index * 500) // Stagger preloading
    })
  }

  /**
   * Preload gallery data
   */
  private async preloadGalleryData(): Promise<any> {
    try {
      const response = await fetch('/api/gallery?limit=12&page=1', {
        headers: { 'Cache-Control': 'max-age=30' }
      })
      return response.ok ? await response.json() : null
    } catch (error) {
      return null
    }
  }

  /**
   * Preload generator data
   */
  private async preloadGeneratorData(): Promise<any> {
    try {
      const response = await fetch('/api/models-v2', {
        headers: { 'Cache-Control': 'max-age=300' }
      })
      return response.ok ? await response.json() : null
    } catch (error) {
      return null
    }
  }

  /**
   * Preload dashboard data
   */
  private async preloadDashboardData(): Promise<any> {
    // Dashboard might not have specific API
    return { preloaded: true, timestamp: Date.now() }
  }

  /**
   * Preload settings data
   */
  private async preloadSettingsData(): Promise<any> {
    return { preloaded: true, timestamp: Date.now() }
  }

  /**
   * Update navigation state and notify listeners
   */
  private updateNavigationState(updates: Partial<NavigationState>): void {
    navigationState = { ...navigationState, ...updates }
    
    navigationListeners.forEach(listener => {
      try {
        listener(navigationState)
      } catch (error) {
        console.error('Navigation listener error:', error)
      }
    })
  }
}

// Global navigation manager instance
let navigationManager: InstantNavigationManager | null = null

/**
 * Hook for instant navigation
 */
export function useInstantNavigation() {
  const router = useRouter()
  const pathname = usePathname()
  const { user, loading } = useAuth()
  const [navState, setNavState] = useState(navigationState)

  // Initialize navigation manager
  useEffect(() => {
    if (!navigationManager) {
      navigationManager = new InstantNavigationManager(router)
    }
  }, [router])

  // Subscribe to navigation state changes
  useEffect(() => {
    const listener = (state: NavigationState) => setNavState({ ...state })
    navigationListeners.add(listener)
    
    return () => {
      navigationListeners.delete(listener)
    }
  }, [])

  // Update current route when pathname changes
  useEffect(() => {
    if (navigationManager) {
      navigationManager['updateNavigationState']({ currentRoute: pathname })
    }
  }, [pathname])

  // Preload routes when user is authenticated
  useEffect(() => {
    if (!loading && user && navigationManager) {
      const routesToPreload = ['/generator', '/gallery', '/dashboard']
      routesToPreload.forEach(route => {
        if (route !== pathname) {
          navigationManager!.preloadRoute(route)
        }
      })
    }
  }, [user, loading, pathname])

  const navigateInstantly = useCallback((href: string) => {
    if (navigationManager) {
      return navigationManager.navigateInstantly(href)
    }
    return router.push(href)
  }, [router])

  const preloadRoute = useCallback((href: string) => {
    if (navigationManager) {
      return navigationManager.preloadRoute(href)
    }
  }, [])

  return {
    navigateInstantly,
    preloadRoute,
    navigationState: navState,
    isNavigating: navState.isNavigating,
    preloadedRoutes: Array.from(navState.preloadedRoutes)
  }
}

/**
 * Instant Navigation Link Component
 */
interface InstantLinkProps {
  href: string
  children: React.ReactNode
  className?: string
  onNavigate?: () => void
}

export function InstantLink({ href, children, className, onNavigate }: InstantLinkProps) {
  const { navigateInstantly, preloadRoute } = useInstantNavigation()
  const hoverTimeoutRef = useRef<NodeJS.Timeout>()

  const handleMouseEnter = useCallback(() => {
    // Preload on hover with slight delay
    hoverTimeoutRef.current = setTimeout(() => {
      preloadRoute(href)
    }, 100)
  }, [href, preloadRoute])

  const handleMouseLeave = useCallback(() => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
    }
  }, [])

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    
    if (onNavigate) {
      onNavigate()
    }
    
    navigateInstantly(href)
  }, [href, navigateInstantly, onNavigate])

  return (
    <a
      href={href}
      className={className}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
    >
      {children}
    </a>
  )
}

/**
 * Navigation performance metrics
 */
export function getNavigationMetrics() {
  return {
    preloadedRoutes: navigationState.preloadedRoutes.size,
    cachedRouteData: navigationState.routeData.size,
    currentRoute: navigationState.currentRoute,
    isNavigating: navigationState.isNavigating,
    listeners: navigationListeners.size
  }
}
