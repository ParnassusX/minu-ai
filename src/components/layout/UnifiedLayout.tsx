'use client'

import { ReactNode } from 'react'
import { UnifiedNavigation } from '@/components/navigation/UnifiedNavigation'
import { cn } from '@/lib/utils'

interface UnifiedLayoutProps {
  children: ReactNode
  className?: string
  variant?: 'default' | 'full-width' | 'centered'
  showNavigation?: boolean
}

export function UnifiedLayout({ 
  children, 
  className,
  variant = 'default',
  showNavigation = true 
}: UnifiedLayoutProps) {
  
  const getContentClasses = () => {
    switch (variant) {
      case 'full-width':
        return 'w-full h-full min-w-0'
      case 'centered':
        return 'w-full max-w-none mx-auto px-3 sm:px-4 lg:px-6'
      default:
        return 'flex-1 overflow-hidden min-w-0'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/30 dark:from-gray-900 dark:via-gray-800/50 dark:to-gray-900/80">
      {/* Background Pattern */}
      <div className="fixed inset-0 opacity-30 dark:opacity-20 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.1),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(139,92,246,0.1),transparent_50%)]" />
      </div>

      <div className="relative flex h-screen w-full max-w-none overflow-x-hidden">
        {/* Navigation Sidebar */}
        {showNavigation && (
          <UnifiedNavigation className="nav-responsive" />
        )}

        {/* Main Content Area - Full Width Mobile */}
        <main className={cn(
          "flex-1 flex flex-col min-w-0 w-full",
          variant === 'full-width' ? "h-full overflow-y-auto overflow-x-hidden" : "overflow-auto",
          getContentClasses(),
          className
        )}>
          {children}
        </main>
      </div>
    </div>
  )
}

/**
 * Specialized layout variants for different page types
 */

// Generator Layout - Full width with integrated controls
export function GeneratorLayout({ children, className }: { children: ReactNode, className?: string }) {
  return (
    <UnifiedLayout 
      variant="full-width" 
      className={cn("bg-transparent", className)}
    >
      {children}
    </UnifiedLayout>
  )
}

// Dashboard Layout - Centered content with navigation
export function DashboardLayout({ children, className }: { children: ReactNode, className?: string }) {
  return (
    <UnifiedLayout 
      variant="centered" 
      className={cn("py-8", className)}
    >
      {children}
    </UnifiedLayout>
  )
}

// Gallery Layout - Full width grid with navigation
export function GalleryLayout({ children, className }: { children: ReactNode, className?: string }) {
  return (
    <UnifiedLayout 
      variant="default" 
      className={cn("p-6", className)}
    >
      {children}
    </UnifiedLayout>
  )
}

// Chat Layout - Centered with minimal navigation
export function ChatLayout({ children, className }: { children: ReactNode, className?: string }) {
  return (
    <UnifiedLayout 
      variant="centered" 
      className={cn("max-w-4xl", className)}
    >
      {children}
    </UnifiedLayout>
  )
}
