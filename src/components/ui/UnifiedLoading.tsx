'use client'

import { cn } from '@/lib/utils'
import '@/styles/unified-design-system.css'

interface UnifiedLoadingProps {
  variant?: 'spinner' | 'dots' | 'pulse' | 'skeleton'
  size?: 'sm' | 'md' | 'lg'
  text?: string
  className?: string
  fullScreen?: boolean
}

/**
 * UnifiedLoading - Consolidated loading component with consistent animations
 * 
 * Features:
 * - Multiple loading variants
 * - Consistent sizing and styling
 * - Accessibility compliant
 * - Integrates with unified design system
 */
export const UnifiedLoading = ({ 
  variant = 'spinner',
  size = 'md',
  text,
  className,
  fullScreen = false
}: UnifiedLoadingProps) => {
  
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'text-sm'
      case 'lg':
        return 'text-lg'
      default:
        return 'text-base'
    }
  }

  const getSpinnerSize = () => {
    switch (size) {
      case 'sm':
        return 'w-4 h-4'
      case 'lg':
        return 'w-8 h-8'
      default:
        return 'w-6 h-6'
    }
  }

  const LoadingSpinner = () => (
    <div className={cn('unified-loading-spinner', getSpinnerSize())} />
  )

  const LoadingDots = () => (
    <div className="flex gap-1">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={cn(
            'rounded-full bg-current animate-pulse',
            size === 'sm' && 'w-1 h-1',
            size === 'md' && 'w-2 h-2',
            size === 'lg' && 'w-3 h-3'
          )}
          style={{
            animationDelay: `${i * 0.2}s`,
            animationDuration: '1s'
          }}
        />
      ))}
    </div>
  )

  const LoadingPulse = () => (
    <div className={cn(
      'rounded-full bg-current animate-pulse',
      size === 'sm' && 'w-8 h-8',
      size === 'md' && 'w-12 h-12',
      size === 'lg' && 'w-16 h-16'
    )} />
  )

  const LoadingSkeleton = () => (
    <div className="space-y-3 animate-pulse">
      <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
      <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
      <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-5/6"></div>
    </div>
  )

  const renderLoadingVariant = () => {
    switch (variant) {
      case 'dots':
        return <LoadingDots />
      case 'pulse':
        return <LoadingPulse />
      case 'skeleton':
        return <LoadingSkeleton />
      default:
        return <LoadingSpinner />
    }
  }

  const content = (
    <div className={cn(
      'unified-loading',
      getSizeClasses(),
      variant === 'skeleton' ? 'block' : 'flex items-center justify-center',
      className
    )}>
      {variant !== 'skeleton' && renderLoadingVariant()}
      {variant === 'skeleton' && renderLoadingVariant()}
      {text && variant !== 'skeleton' && (
        <span className="ml-2">{text}</span>
      )}
    </div>
  )

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm z-50 flex items-center justify-center">
        {content}
      </div>
    )
  }

  return content
}

/**
 * Specialized loading components for common use cases
 * Note: GenerationLoading is now provided by OptimizedLoading.tsx for consistency
 */

interface PageLoadingProps {
  title?: string
  description?: string
}

export const PageLoading = ({ 
  title = 'Loading...',
  description 
}: PageLoadingProps) => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-center space-y-4">
      <UnifiedLoading size="lg" />
      <div className="space-y-2">
        <h2 className="unified-heading-2">{title}</h2>
        {description && (
          <p className="unified-body">{description}</p>
        )}
      </div>
    </div>
  </div>
)

interface CardLoadingProps {
  lines?: number
  className?: string
}

export const CardLoading = ({ 
  lines = 3,
  className 
}: CardLoadingProps) => (
  <div className={cn('space-y-3 animate-pulse', className)}>
    {Array.from({ length: lines }).map((_, i) => (
      <div
        key={i}
        className={cn(
          'h-4 bg-gray-300 dark:bg-gray-600 rounded',
          i === 0 && 'w-3/4',
          i === 1 && 'w-1/2',
          i === 2 && 'w-5/6',
          i > 2 && 'w-2/3'
        )}
      />
    ))}
  </div>
)

interface ButtonLoadingProps {
  size?: 'sm' | 'md' | 'lg'
  text?: string
}

export const ButtonLoading = ({ 
  size = 'md',
  text = 'Loading...' 
}: ButtonLoadingProps) => (
  <div className="unified-loading">
    <UnifiedLoading variant="spinner" size={size} />
    <span className="ml-2">{text}</span>
  </div>
)

interface ImageLoadingProps {
  aspectRatio?: 'square' | 'video' | 'portrait'
  className?: string
}

export const ImageLoading = ({ 
  aspectRatio = 'square',
  className 
}: ImageLoadingProps) => {
  const getAspectClasses = () => {
    switch (aspectRatio) {
      case 'video':
        return 'aspect-video'
      case 'portrait':
        return 'aspect-[3/4]'
      default:
        return 'aspect-square'
    }
  }

  return (
    <div className={cn(
      'bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse flex items-center justify-center',
      getAspectClasses(),
      className
    )}>
      <div className="text-gray-400 dark:text-gray-500">
        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
        </svg>
      </div>
    </div>
  )
}

interface ListLoadingProps {
  items?: number
  showAvatar?: boolean
  className?: string
}

export const ListLoading = ({ 
  items = 5,
  showAvatar = false,
  className 
}: ListLoadingProps) => (
  <div className={cn('space-y-4', className)}>
    {Array.from({ length: items }).map((_, i) => (
      <div key={i} className="flex items-center gap-4 animate-pulse">
        {showAvatar && (
          <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-full" />
        )}
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4" />
          <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/2" />
        </div>
      </div>
    ))}
  </div>
)

/**
 * Loading overlay component for existing content
 */
interface LoadingOverlayProps {
  loading: boolean
  children: React.ReactNode
  text?: string
  variant?: 'spinner' | 'dots' | 'pulse'
}

export const LoadingOverlay = ({ 
  loading,
  children,
  text = 'Loading...',
  variant = 'spinner'
}: LoadingOverlayProps) => (
  <div className="relative">
    {children}
    {loading && (
      <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm flex items-center justify-center z-10">
        <UnifiedLoading variant={variant} text={text} />
      </div>
    )}
  </div>
)
