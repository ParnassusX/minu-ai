'use client'

import { useState, useEffect } from 'react'

/**
 * Custom hook for responsive media query detection
 * Matches the standardized Minu.AI breakpoint system
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    // Handle SSR - return false during server-side rendering
    if (typeof window === 'undefined') {
      return
    }

    const mediaQuery = window.matchMedia(query)
    setMatches(mediaQuery.matches)

    const handleChange = (event: MediaQueryListEvent) => {
      setMatches(event.matches)
    }

    // Use the newer addEventListener if available, fallback to addListener
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange)
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(handleChange)
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange)
      } else {
        // Fallback for older browsers
        mediaQuery.removeListener(handleChange)
      }
    }
  }, [query])

  return matches
}

/**
 * Standardized breakpoint hooks for Minu.AI
 * Based on: 375px (mobile), 768px (tablet), 1920px (desktop)
 */
export function useBreakpoint() {
  const isMobile = useMediaQuery('(max-width: 767px)')
  const isTablet = useMediaQuery('(min-width: 768px) and (max-width: 1919px)')
  const isDesktop = useMediaQuery('(min-width: 1920px)')
  const isTabletOrDesktop = useMediaQuery('(min-width: 768px)')

  return {
    isMobile,
    isTablet,
    isDesktop,
    isTabletOrDesktop,
    // Convenience getters
    breakpoint: isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop'
  } as const
}

/**
 * Hook specifically for navigation responsive behavior
 * Returns whether the navigation should use mobile overlay mode
 */
export function useNavigationMode() {
  const { isMobile } = useBreakpoint()
  
  return {
    isMobileMode: isMobile,
    shouldShowOverlay: isMobile,
    shouldShowSidebar: !isMobile
  }
}
