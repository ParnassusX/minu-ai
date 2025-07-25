'use client'

import React, { useEffect, useRef } from 'react'
import { GlassCard, PremiumButton } from '@/components/ui/premium-glass'
import { Icons } from '@/components/ui/premium-icons'
import { Typography } from '@/components/ui/typography'

// Enhanced Focus Management Hook
export function useFocusManagement() {
  const focusRef = useRef<HTMLElement>(null)

  const focusElement = () => {
    if (focusRef.current) {
      focusRef.current.focus()
    }
  }

  const trapFocus = (event: KeyboardEvent) => {
    if (event.key === 'Tab') {
      const focusableElements = focusRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      
      if (focusableElements && focusableElements.length > 0) {
        const firstElement = focusableElements[0] as HTMLElement
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

        if (event.shiftKey && document.activeElement === firstElement) {
          event.preventDefault()
          lastElement.focus()
        } else if (!event.shiftKey && document.activeElement === lastElement) {
          event.preventDefault()
          firstElement.focus()
        }
      }
    }
  }

  return { focusRef, focusElement, trapFocus }
}

// Accessible Glass Card with Enhanced Focus States
export function AccessibleGlassCard({
  children,
  title,
  description,
  interactive = false,
  onActivate,
  ...props
}: {
  children: React.ReactNode
  title?: string
  description?: string
  interactive?: boolean
  onActivate?: () => void
} & React.HTMLAttributes<HTMLDivElement>) {
  const cardRef = useRef<HTMLDivElement>(null)

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (interactive && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault()
      onActivate?.()
    }
  }

  return (
    <GlassCard
      ref={cardRef}
      variant={interactive ? 'interactive' : 'elevated'}
      focus="premium"
      role={interactive ? 'button' : 'region'}
      tabIndex={interactive ? 0 : undefined}
      aria-label={title}
      aria-describedby={description ? `${title}-desc` : undefined}
      onKeyDown={handleKeyDown}
      onClick={interactive ? onActivate : undefined}
      className="focus-ring-premium"
      {...props}
    >
      {title && (
        <div className="sr-only" id={`${title}-desc`}>
          {description}
        </div>
      )}
      {children}
    </GlassCard>
  )
}

// Enhanced Button with Loading States and Accessibility
export function AccessiblePremiumButton({
  children,
  loading = false,
  loadingText = 'Loading...',
  variant = 'primary',
  size = 'md',
  ...props
}: {
  children: React.ReactNode
  loading?: boolean
  loadingText?: string
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'gradient' | 'luxury' | 'glass'
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'icon' | 'icon-sm' | 'icon-lg'
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <PremiumButton
      variant={variant}
      size={size}
      loading={loading}
      animation="lift"
      aria-busy={loading}
      aria-label={loading ? loadingText : undefined}
      className="focus-ring-premium"
      {...props}
    >
      {children}
    </PremiumButton>
  )
}

// Keyboard Navigation Helper
export function KeyboardNavigationHelper() {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Skip to main content
      if (event.altKey && event.key === 'm') {
        event.preventDefault()
        const main = document.querySelector('main')
        if (main) {
          main.focus()
          main.scrollIntoView({ behavior: 'smooth' })
        }
      }

      // Skip to navigation
      if (event.altKey && event.key === 'n') {
        event.preventDefault()
        const nav = document.querySelector('nav')
        if (nav) {
          const firstLink = nav.querySelector('a, button')
          if (firstLink) {
            (firstLink as HTMLElement).focus()
          }
        }
      }

      // Escape key to close modals/overlays
      if (event.key === 'Escape') {
        const activeModal = document.querySelector('[role="dialog"][aria-modal="true"]')
        if (activeModal) {
          const closeButton = activeModal.querySelector('[aria-label*="close"], [aria-label*="Close"]')
          if (closeButton) {
            (closeButton as HTMLElement).click()
          }
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  return null
}

// Screen Reader Announcements
export function ScreenReaderAnnouncement({ 
  message, 
  priority = 'polite' 
}: { 
  message: string
  priority?: 'polite' | 'assertive' 
}) {
  return (
    <div
      role="status"
      aria-live={priority}
      aria-atomic="true"
      className="sr-only"
    >
      {message}
    </div>
  )
}

// Accessible Loading State
export function AccessibleLoadingState({
  title = 'Loading content',
  description = 'Please wait while we load your content',
}: {
  title?: string
  description?: string
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={title}
      className="flex flex-col items-center justify-center p-8"
    >
      <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mb-4" />
      <Typography variant="h6" color="medium-contrast" className="mb-2">
        {title}
      </Typography>
      <Typography variant="body-sm" color="low-contrast">
        {description}
      </Typography>
      <ScreenReaderAnnouncement message={`${title}. ${description}`} />
    </div>
  )
}

// Skip Links Component
export function SkipLinks() {
  return (
    <div className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50">
      <GlassCard variant="elevated" size="sm" className="flex gap-2">
        <a
          href="#main-content"
          className="px-3 py-2 text-sm font-medium text-primary-600 hover:text-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded"
        >
          Skip to main content
        </a>
        <a
          href="#navigation"
          className="px-3 py-2 text-sm font-medium text-primary-600 hover:text-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded"
        >
          Skip to navigation
        </a>
      </GlassCard>
    </div>
  )
}

// High Contrast Mode Detector
export function useHighContrastMode() {
  const [isHighContrast, setIsHighContrast] = React.useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-contrast: high)')
    setIsHighContrast(mediaQuery.matches)

    const handleChange = (e: MediaQueryListEvent) => {
      setIsHighContrast(e.matches)
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  return isHighContrast
}

// Reduced Motion Detector
export function useReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = React.useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mediaQuery.matches)

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches)
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  return prefersReducedMotion
}
