'use client'

import { forwardRef, HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'
import '@/styles/unified-design-system.css'

interface UnifiedCardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'interactive'
  padding?: 'sm' | 'md' | 'lg' | 'none'
  glass?: boolean
  children: React.ReactNode
}

/**
 * UnifiedCard - Consolidated card component that replaces all existing card variants
 * 
 * Features:
 * - Consistent glassmorphism styling
 * - Responsive padding
 * - Interactive states
 * - Accessibility compliant
 * - Integrates with unified design system
 */
export const UnifiedCard = forwardRef<HTMLDivElement, UnifiedCardProps>(
  ({ 
    variant = 'default',
    padding = 'md',
    glass = true,
    className,
    children,
    ...props 
  }, ref) => {
    
    const getVariantClasses = () => {
      switch (variant) {
        case 'elevated':
          return 'unified-card-elevated'
        case 'interactive':
          return 'unified-card-interactive'
        default:
          return ''
      }
    }

    const getPaddingClasses = () => {
      switch (padding) {
        case 'sm':
          return 'p-4'
        case 'lg':
          return 'p-8'
        case 'none':
          return 'p-0'
        default:
          return '' // Uses default from unified-card class
      }
    }

    return (
      <div
        ref={ref}
        className={cn(
          glass && 'unified-card',
          !glass && 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl',
          getVariantClasses(),
          getPaddingClasses(),
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)

UnifiedCard.displayName = 'UnifiedCard'

/**
 * Card header component for consistent card headers
 */
interface UnifiedCardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  title?: string
  subtitle?: string
  icon?: React.ReactNode
  action?: React.ReactNode
  children?: React.ReactNode
}

export const UnifiedCardHeader = forwardRef<HTMLDivElement, UnifiedCardHeaderProps>(
  ({ title, subtitle, icon, action, children, className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'flex items-start justify-between gap-4 mb-6',
        className
      )}
      {...props}
    >
      <div className="flex-1 min-w-0">
        {title && (
          <div className="flex items-center gap-2">
            {icon && <div className="flex-shrink-0">{icon}</div>}
            <h3 className="unified-heading-3 truncate">
              {title}
            </h3>
          </div>
        )}
        {subtitle && (
          <p className="unified-caption mt-1">
            {subtitle}
          </p>
        )}
        {children}
      </div>
      
      {action && (
        <div className="flex-shrink-0">
          {action}
        </div>
      )}
    </div>
  )
)

UnifiedCardHeader.displayName = 'UnifiedCardHeader'

/**
 * Card content component for consistent card content
 */
interface UnifiedCardContentProps extends HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

export const UnifiedCardContent = forwardRef<HTMLDivElement, UnifiedCardContentProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('unified-body', className)}
      {...props}
    >
      {children}
    </div>
  )
)

UnifiedCardContent.displayName = 'UnifiedCardContent'

/**
 * Card footer component for consistent card footers
 */
interface UnifiedCardFooterProps extends HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  align?: 'left' | 'center' | 'right' | 'between'
}

export const UnifiedCardFooter = forwardRef<HTMLDivElement, UnifiedCardFooterProps>(
  ({ align = 'right', className, children, ...props }, ref) => {
    const getAlignClasses = () => {
      switch (align) {
        case 'left':
          return 'justify-start'
        case 'center':
          return 'justify-center'
        case 'between':
          return 'justify-between'
        default:
          return 'justify-end'
      }
    }

    return (
      <div
        ref={ref}
        className={cn(
          'flex items-center gap-3 mt-6 pt-4 border-t border-gray-200/50 dark:border-gray-700/50',
          getAlignClasses(),
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)

UnifiedCardFooter.displayName = 'UnifiedCardFooter'

/**
 * Specialized card variants for common use cases
 */

interface GeneratorCardProps extends Omit<UnifiedCardProps, 'variant'> {
  title: string
  description?: string
  status?: 'idle' | 'generating' | 'complete' | 'error'
  onGenerate?: () => void
}

export const GeneratorCard = forwardRef<HTMLDivElement, GeneratorCardProps>(
  ({ title, description, status = 'idle', onGenerate, children, ...props }, ref) => {
    const getStatusColor = () => {
      switch (status) {
        case 'generating':
          return 'text-blue-600 dark:text-blue-400'
        case 'complete':
          return 'text-green-600 dark:text-green-400'
        case 'error':
          return 'text-red-600 dark:text-red-400'
        default:
          return 'text-gray-600 dark:text-gray-400'
      }
    }

    const getStatusText = () => {
      switch (status) {
        case 'generating':
          return 'Generating...'
        case 'complete':
          return 'Complete'
        case 'error':
          return 'Error'
        default:
          return 'Ready'
      }
    }

    return (
      <UnifiedCard ref={ref} variant="interactive" {...props}>
        <UnifiedCardHeader
          title={title}
          subtitle={description}
          action={
            <span className={cn('unified-caption font-medium', getStatusColor())}>
              {getStatusText()}
            </span>
          }
        />
        
        <UnifiedCardContent>
          {children}
        </UnifiedCardContent>
        
        {onGenerate && (
          <UnifiedCardFooter>
            <button
              onClick={onGenerate}
              disabled={status === 'generating'}
              className="unified-button unified-button-primary"
            >
              {status === 'generating' ? 'Generating...' : 'Generate'}
            </button>
          </UnifiedCardFooter>
        )}
      </UnifiedCard>
    )
  }
)

GeneratorCard.displayName = 'GeneratorCard'

interface GalleryCardProps extends Omit<UnifiedCardProps, 'variant'> {
  image: string
  title: string
  subtitle?: string
  onView?: () => void
  onDownload?: () => void
  onDelete?: () => void
}

export const GalleryCard = forwardRef<HTMLDivElement, GalleryCardProps>(
  ({ image, title, subtitle, onView, onDownload, onDelete, ...props }, ref) => (
    <UnifiedCard ref={ref} variant="interactive" padding="none" {...props}>
      <div className="aspect-square overflow-hidden rounded-t-2xl">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
        />
      </div>
      
      <div className="p-4">
        <UnifiedCardHeader
          title={title}
          subtitle={subtitle}
        />
        
        <UnifiedCardFooter align="between">
          <div className="flex gap-2">
            {onView && (
              <button
                onClick={onView}
                className="unified-button unified-button-ghost unified-button-sm"
              >
                View
              </button>
            )}
            {onDownload && (
              <button
                onClick={onDownload}
                className="unified-button unified-button-secondary unified-button-sm"
              >
                Download
              </button>
            )}
          </div>
          
          {onDelete && (
            <button
              onClick={onDelete}
              className="unified-button unified-button-ghost unified-button-sm text-red-600 hover:text-red-700"
            >
              Delete
            </button>
          )}
        </UnifiedCardFooter>
      </div>
    </UnifiedCard>
  )
)

GalleryCard.displayName = 'GalleryCard'

interface SettingsCardProps extends Omit<UnifiedCardProps, 'variant'> {
  title: string
  description?: string
  icon?: React.ReactNode
}

export const SettingsCard = forwardRef<HTMLDivElement, SettingsCardProps>(
  ({ title, description, icon, children, ...props }, ref) => (
    <UnifiedCard ref={ref} {...props}>
      <UnifiedCardHeader
        title={title}
        subtitle={description}
        action={icon && (
          <div className="w-8 h-8 flex items-center justify-center text-gray-500 dark:text-gray-400">
            {icon}
          </div>
        )}
      />
      
      <UnifiedCardContent>
        {children}
      </UnifiedCardContent>
    </UnifiedCard>
  )
)

SettingsCard.displayName = 'SettingsCard'
