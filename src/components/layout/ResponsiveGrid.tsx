'use client'

import { cn } from '@/lib/utils'
import { ReactNode } from 'react'

interface ResponsiveGridProps {
  children: ReactNode
  className?: string
  variant?: 'auto' | 'fixed' | 'masonry' | 'dashboard' | 'gallery' | 'three-column'
  gap?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  minItemWidth?: string
  maxColumns?: number
}

/**
 * ResponsiveGrid - CSS Grid system for different content types
 * 
 * Variants:
 * - auto: Auto-fit columns based on content
 * - fixed: Fixed number of columns at different breakpoints
 * - masonry: Pinterest-style masonry layout
 * - dashboard: Dashboard widget grid
 * - gallery: Image gallery grid
 * - three-column: Professional three-column layout
 */
export function ResponsiveGrid({
  children,
  className,
  variant = 'auto',
  gap = 'md',
  minItemWidth = '280px',
  maxColumns = 6
}: ResponsiveGridProps) {
  
  // Get gap classes
  const getGapClasses = () => {
    switch (gap) {
      case 'none':
        return 'gap-0'
      case 'sm':
        return 'gap-2 md:gap-3'
      case 'lg':
        return 'gap-6 md:gap-8'
      case 'xl':
        return 'gap-8 md:gap-12'
      default: // md
        return 'gap-4 md:gap-6'
    }
  }

  // Get grid classes based on variant
  const getGridClasses = () => {
    switch (variant) {
      case 'fixed':
        return cn(
          'grid',
          'grid-cols-1',
          'sm:grid-cols-2',
          'md:grid-cols-3',
          'lg:grid-cols-4',
          'xl:grid-cols-5',
          '2xl:grid-cols-6'
        )
      
      case 'masonry':
        return cn(
          'columns-1',
          'sm:columns-2',
          'md:columns-3',
          'lg:columns-4',
          'xl:columns-5',
          '2xl:columns-6',
          'break-inside-avoid'
        )
      
      case 'dashboard':
        return cn(
          'grid',
          'grid-cols-1',
          'sm:grid-cols-2',
          'lg:grid-cols-3',
          'xl:grid-cols-4',
          '2xl:grid-cols-5'
        )
      
      case 'gallery':
        return cn(
          'grid',
          'grid-cols-2',
          'sm:grid-cols-3',
          'md:grid-cols-4',
          'lg:grid-cols-5',
          'xl:grid-cols-6',
          '2xl:grid-cols-8'
        )
      
      case 'three-column':
        return cn(
          'grid',
          'grid-cols-1',
          'lg:grid-cols-[280px_1fr_320px]',
          'xl:grid-cols-[300px_1fr_360px]',
          '2xl:grid-cols-[320px_1fr_400px]',
          'min-h-screen'
        )
      
      default: // auto
        return cn(
          'grid',
          `grid-cols-[repeat(auto-fit,minmax(${minItemWidth},1fr))]`,
          maxColumns && `2xl:grid-cols-${maxColumns}`
        )
    }
  }

  return (
    <div className={cn(
      getGridClasses(),
      getGapClasses(),
      className
    )}>
      {children}
    </div>
  )
}

/**
 * Specialized grid components for common layouts
 */

// Three-column professional layout
export function ThreeColumnGrid({ 
  children, 
  className,
  leftWidth = '280px',
  rightWidth = '320px'
}: { 
  children: ReactNode
  className?: string
  leftWidth?: string
  rightWidth?: string
}) {
  return (
    <div className={cn(
      'grid grid-cols-1 min-h-screen',
      `lg:grid-cols-[${leftWidth}_1fr_${rightWidth}]`,
      `xl:grid-cols-[${leftWidth}_1fr_${rightWidth}]`,
      `2xl:grid-cols-[${leftWidth}_1fr_${rightWidth}]`,
      className
    )}>
      {children}
    </div>
  )
}

// Dashboard widget grid
export function DashboardGrid({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <ResponsiveGrid variant="dashboard" gap="lg" className={className}>
      {children}
    </ResponsiveGrid>
  )
}

// Gallery grid for images
export function GalleryGrid({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <ResponsiveGrid variant="gallery" gap="sm" className={className}>
      {children}
    </ResponsiveGrid>
  )
}

// Auto-fit grid with custom min width
export function AutoGrid({ 
  children, 
  className, 
  minWidth = '280px',
  maxColumns = 6
}: { 
  children: ReactNode
  className?: string
  minWidth?: string
  maxColumns?: number
}) {
  return (
    <ResponsiveGrid 
      variant="auto" 
      gap="md" 
      minItemWidth={minWidth}
      maxColumns={maxColumns}
      className={className}
    >
      {children}
    </ResponsiveGrid>
  )
}

// Masonry layout for Pinterest-style content
export function MasonryGrid({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <ResponsiveGrid variant="masonry" gap="md" className={className}>
      {children}
    </ResponsiveGrid>
  )
}
