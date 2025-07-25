'use client'

import { cn } from '@/lib/utils'
import { ReactNode } from 'react'

interface AdaptiveContainerProps {
  children: ReactNode
  className?: string
  variant?: 'full-width' | 'content-width' | 'narrow' | 'wide' | 'ultra-wide'
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  responsive?: boolean
}

/**
 * AdaptiveContainer - Intelligent container that adapts width based on content needs
 * 
 * Variants:
 * - full-width: Uses entire viewport width (100vw)
 * - content-width: Responsive width based on content (default)
 * - narrow: Constrained width for reading content
 * - wide: Wider than content-width for dashboards
 * - ultra-wide: Maximum width for professional tools
 */
export function AdaptiveContainer({
  children,
  className,
  variant = 'content-width',
  padding = 'md',
  responsive = true
}: AdaptiveContainerProps) {
  
  // Get width classes based on variant
  const getWidthClasses = () => {
    if (!responsive) {
      // Non-responsive variants
      switch (variant) {
        case 'full-width':
          return 'w-full'
        case 'narrow':
          return 'max-w-4xl mx-auto'
        case 'wide':
          return 'max-w-6xl mx-auto'
        case 'ultra-wide':
          return 'max-w-none mx-auto'
        default:
          return 'max-w-5xl mx-auto'
      }
    }

    // Responsive variants following our new strategy
    switch (variant) {
      case 'full-width':
        return 'w-full max-w-full'
      
      case 'narrow':
        // Reading content - narrow on all screens
        return cn(
          'w-full max-w-2xl mx-auto',
          'sm:max-w-3xl',
          'md:max-w-4xl'
        )
      
      case 'wide':
        // Dashboard content - progressive expansion
        return cn(
          'w-full max-w-4xl mx-auto',
          'sm:max-w-5xl',
          'md:max-w-6xl',
          'lg:max-w-7xl',
          'xl:max-w-screen-xl xl:mx-8',
          '2xl:mx-12'
        )
      
      case 'ultra-wide':
        // Professional tools - full width on desktop
        return cn(
          'w-full max-w-4xl mx-auto',
          'sm:max-w-5xl',
          'md:max-w-6xl',
          'lg:max-w-screen-lg lg:mx-4',
          'xl:mx-6',
          '2xl:mx-8'
        )
      
      default: // content-width
        // Standard content - balanced approach
        return cn(
          'w-full max-w-3xl mx-auto',
          'sm:max-w-4xl',
          'md:max-w-5xl',
          'lg:max-w-6xl',
          'xl:max-w-7xl'
        )
    }
  }

  // Get padding classes
  const getPaddingClasses = () => {
    switch (padding) {
      case 'none':
        return ''
      case 'sm':
        return 'px-4 py-2'
      case 'lg':
        return 'px-6 py-6 lg:px-8 lg:py-8'
      case 'xl':
        return 'px-8 py-8 lg:px-12 lg:py-12'
      default: // md
        return 'px-4 py-4 lg:px-6 lg:py-6'
    }
  }

  return (
    <div className={cn(
      getWidthClasses(),
      getPaddingClasses(),
      className
    )}>
      {children}
    </div>
  )
}

/**
 * Specialized containers for common use cases
 */

// For reading content (articles, documentation)
export function ReadingContainer({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <AdaptiveContainer variant="narrow" padding="lg" className={className}>
      {children}
    </AdaptiveContainer>
  )
}

// For dashboard layouts
export function DashboardContainer({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <AdaptiveContainer variant="wide" padding="md" className={className}>
      {children}
    </AdaptiveContainer>
  )
}

// For professional tools (generators, editors)
export function ProfessionalContainer({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <AdaptiveContainer variant="ultra-wide" padding="sm" className={className}>
      {children}
    </AdaptiveContainer>
  )
}

// For full-width canvas areas
export function CanvasContainer({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <AdaptiveContainer variant="full-width" padding="none" className={className}>
      {children}
    </AdaptiveContainer>
  )
}
