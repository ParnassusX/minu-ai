'use client'

import { cn } from '@/lib/utils'
import { Sparkles, Zap, Wand2, Image, Video, Layers, AlertTriangle } from 'lucide-react'
import { useEffect, useState } from 'react'
import '@/styles/unified-design-system.css'

interface OptimizedLoadingProps {
  variant?: 'generation' | 'upload' | 'processing' | 'enhancement' | 'grid'
  title?: string
  subtitle?: string
  progress?: number
  stage?: string
  className?: string
  showProgress?: boolean
  animated?: boolean
  size?: 'sm' | 'md' | 'lg'
  fullScreen?: boolean
}

/**
 * OptimizedLoading - Enhanced loading component with square grid animated dots pattern
 * 
 * Features:
 * - Square grid animated dots pattern as requested
 * - Integrates with unified design system
 * - Multiple variants for different use cases
 * - Progress tracking and stage updates
 * - Responsive sizing and glassmorphism effects
 * - Performance optimized animations
 */
export function OptimizedLoading({
  variant = 'generation',
  title,
  subtitle,
  progress,
  stage,
  className,
  showProgress = true,
  animated = true,
  size = 'md',
  fullScreen = false
}: OptimizedLoadingProps) {
  const [animationPhase, setAnimationPhase] = useState(0)

  useEffect(() => {
    if (!animated) return
    
    const interval = setInterval(() => {
      setAnimationPhase(prev => (prev + 1) % 9) // 9 dots in 3x3 grid
    }, 200) // Faster animation for better UX
    
    return () => clearInterval(interval)
  }, [animated])

  const getVariantConfig = () => {
    switch (variant) {
      case 'generation':
        return {
          icon: Sparkles,
          color: 'from-blue-500 to-purple-600',
          bgColor: 'from-blue-50 to-purple-50',
          darkBgColor: 'from-blue-900/20 to-purple-900/20',
          title: title || 'Generating...',
          subtitle: subtitle || 'Creating your image with AI'
        }
      case 'upload':
        return {
          icon: Zap,
          color: 'from-green-500 to-emerald-600',
          bgColor: 'from-green-50 to-emerald-50',
          darkBgColor: 'from-green-900/20 to-emerald-900/20',
          title: title || 'Uploading...',
          subtitle: subtitle || 'Preparing your files'
        }
      case 'processing':
        return {
          icon: Wand2,
          color: 'from-orange-500 to-red-600',
          bgColor: 'from-orange-50 to-red-50',
          darkBgColor: 'from-orange-900/20 to-red-900/20',
          title: title || 'Processing...',
          subtitle: subtitle || 'Applying transformations'
        }
      case 'enhancement':
        return {
          icon: Layers,
          color: 'from-purple-500 to-pink-600',
          bgColor: 'from-purple-50 to-pink-50',
          darkBgColor: 'from-purple-900/20 to-pink-900/20',
          title: title || 'Enhancing...',
          subtitle: subtitle || 'Improving image quality'
        }
      default:
        return {
          icon: Sparkles,
          color: 'from-blue-500 to-purple-600',
          bgColor: 'from-blue-50 to-purple-50',
          darkBgColor: 'from-blue-900/20 to-purple-900/20',
          title: title || 'Loading...',
          subtitle: subtitle || 'Please wait'
        }
    }
  }

  const config = getVariantConfig()
  const Icon = config.icon

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return {
          container: 'py-8 px-4',
          grid: 'w-16 h-16',
          icon: 'h-6 w-6',
          title: 'unified-heading-3',
          subtitle: 'unified-caption'
        }
      case 'lg':
        return {
          container: 'py-24 px-8',
          grid: 'w-32 h-32',
          icon: 'h-10 w-10',
          title: 'unified-heading-1',
          subtitle: 'unified-body'
        }
      default:
        return {
          container: 'py-16 px-6',
          grid: 'w-24 h-24',
          icon: 'h-8 w-8',
          title: 'unified-heading-2',
          subtitle: 'unified-body'
        }
    }
  }

  const sizeClasses = getSizeClasses()

  const content = (
    <div className={cn(
      'flex flex-col items-center justify-center',
      sizeClasses.container,
      className
    )}>
      {/* Square Grid Animated Dots Pattern */}
      <div className="relative mb-8">
        <SquareGridAnimation 
          color={config.color}
          size={sizeClasses.grid}
          animationPhase={animationPhase}
          animated={animated}
        />
        
        {/* Central Icon with Glassmorphism */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className={cn(
            'relative p-4 rounded-2xl backdrop-blur-md',
            `bg-gradient-to-br ${config.bgColor} dark:${config.darkBgColor}`,
            'border border-white/20 dark:border-gray-700/30 shadow-lg'
          )}>
            <Icon className={cn(
              sizeClasses.icon,
              'animate-pulse',
              `bg-gradient-to-r ${config.color} bg-clip-text text-transparent`
            )} />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="text-center space-y-3 max-w-md">
        <h3 className={cn(sizeClasses.title, 'text-gray-900 dark:text-white')}>
          {stage || config.title}
        </h3>
        
        {config.subtitle && (
          <p className={cn(sizeClasses.subtitle, 'text-gray-600 dark:text-gray-400')}>
            {config.subtitle}
          </p>
        )}

        {/* Progress Bar */}
        {showProgress && progress !== undefined && (
          <div className="w-full max-w-xs mx-auto space-y-2">
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
              <span>Progress</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className={cn(
                  'h-2 rounded-full transition-all duration-500 ease-out',
                  `bg-gradient-to-r ${config.color}`
                )}
                style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm z-50 flex items-center justify-center">
        {content}
      </div>
    )
  }

  return content
}

/**
 * Square Grid Animation Component - The requested animated dots pattern
 */
interface SquareGridAnimationProps {
  color: string
  size: string
  animationPhase: number
  animated: boolean
}

function SquareGridAnimation({ color, size, animationPhase, animated }: SquareGridAnimationProps) {
  return (
    <div className={cn('relative', size)}>
      {/* 3x3 Grid of animated dots */}
      <div className="grid grid-cols-3 gap-2 w-full h-full">
        {Array.from({ length: 9 }).map((_, i) => {
          const isActive = animated && i === animationPhase
          const row = Math.floor(i / 3)
          const col = i % 3
          
          return (
            <div
              key={i}
              className={cn(
                'rounded-lg transition-all duration-300 ease-out',
                `bg-gradient-to-br ${color}`,
                isActive ? 'opacity-100 scale-110' : 'opacity-30 scale-100'
              )}
              style={{
                animationDelay: `${(row + col) * 0.1}s`,
              }}
            />
          )
        })}
      </div>
      
      {/* Shimmer overlay effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
    </div>
  )
}

/**
 * Specialized loading components for common use cases
 */

interface GenerationLoadingProps {
  progress?: number
  stage?: string
  model?: string
  className?: string
}

export const GenerationLoading = ({ 
  progress,
  stage = 'Generating image...',
  model,
  className 
}: GenerationLoadingProps) => (
  <OptimizedLoading
    variant="generation"
    progress={progress}
    stage={stage}
    subtitle={model ? `Using ${model}` : undefined}
    showProgress={progress !== undefined}
    className={className}
  />
)

interface UploadLoadingProps {
  fileName?: string
  progress?: number
  className?: string
}

export const UploadLoading = ({ 
  fileName,
  progress,
  className 
}: UploadLoadingProps) => (
  <OptimizedLoading
    variant="upload"
    progress={progress}
    stage="Uploading file..."
    subtitle={fileName ? `Uploading ${fileName}` : undefined}
    showProgress={progress !== undefined}
    className={className}
  />
)

interface ProcessingLoadingProps {
  operation?: string
  progress?: number
  className?: string
}

export const ProcessingLoading = ({ 
  operation = 'Processing',
  progress,
  className 
}: ProcessingLoadingProps) => (
  <OptimizedLoading
    variant="processing"
    progress={progress}
    stage={`${operation}...`}
    showProgress={progress !== undefined}
    className={className}
  />
)

/**
 * Inline loading components for smaller spaces
 */
interface InlineLoadingProps {
  text?: string
  size?: 'sm' | 'md'
  className?: string
}

export const InlineLoading = ({ 
  text = 'Loading...',
  size = 'sm',
  className 
}: InlineLoadingProps) => (
  <div className={cn('unified-loading', className)}>
    <div className={cn(
      'unified-loading-spinner',
      size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'
    )} />
    <span className="ml-2 unified-caption">{text}</span>
  </div>
)

/**
 * Button loading state
 */
interface ButtonLoadingProps {
  text?: string
  className?: string
}

export const ButtonLoading = ({ 
  text = 'Loading...',
  className 
}: ButtonLoadingProps) => (
  <div className={cn('flex items-center gap-2', className)}>
    <div className="unified-loading-spinner w-4 h-4" />
    <span>{text}</span>
  </div>
)
