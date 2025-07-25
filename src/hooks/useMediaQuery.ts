'use client'

import { useState, useEffect } from 'react'

/**
 * Custom hook for responsive media queries
 * Matches the standardized breakpoints: 375px (mobile), 768px (tablet), 1920px (desktop)
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
      return
    }

    const mediaQuery = window.matchMedia(query)
    
    // Set initial value
    setMatches(mediaQuery.matches)

    // Create event listener
    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches)
    }

    // Add listener
    mediaQuery.addEventListener('change', handler)

    // Cleanup
    return () => {
      mediaQuery.removeEventListener('change', handler)
    }
  }, [query])

  return matches
}

/**
 * Predefined breakpoint hooks for standardized responsive design
 */
export const useIsMobile = () => useMediaQuery('(max-width: 767px)')
export const useIsTablet = () => useMediaQuery('(min-width: 768px) and (max-width: 1919px)')
export const useIsDesktop = () => useMediaQuery('(min-width: 1920px)')

/**
 * Utility hooks for common responsive patterns
 */
export const useIsTabletOrLarger = () => useMediaQuery('(min-width: 768px)')
export const useIsMobileOrTablet = () => useMediaQuery('(max-width: 1919px)')

/**
 * Navigation-specific responsive hook for UnifiedNavigation component
 */
export function useNavigationMode() {
  const isMobileMode = useIsMobile()
  const isTabletMode = useIsTablet()
  const isDesktopMode = useIsDesktop()

  return {
    isMobileMode,
    isTabletMode,
    isDesktopMode,
    shouldShowOverlay: isMobileMode, // Show overlay only on mobile
    shouldShowSidebar: !isMobileMode, // Show sidebar on tablet and desktop
    sidebarWidth: isMobileMode ? '320px' : '256px'
  }
}
