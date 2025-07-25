'use client'

import { cn } from '@/lib/utils'
import { Sparkles, Zap, Wand2 } from 'lucide-react'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'default' | 'premium' | 'gradient' | 'pulse'
  className?: string
}

export function LoadingSpinner({ 
  size = 'md', 
  variant = 'default',
  className 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12'
  }

  const variants = {
    default: 'border-gray-300 border-t-blue-500',
    premium: 'border-gray-200 border-t-indigo-500',
    gradient: 'border-transparent bg-gradient-to-r from-indigo-500 to-purple-500',
    pulse: 'border-gray-300 border-t-emerald-500'
  }

  if (variant === 'gradient') {
    return (
      <div className={cn(
        'rounded-full animate-spin',
        sizeClasses[size],
        className
      )}>
        <div className="h-full w-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 p-0.5">
          <div className="h-full w-full rounded-full bg-white" />
        </div>
      </div>
    )
  }

  return (
    <div className={cn(
      'border-2 rounded-full animate-spin',
      sizeClasses[size],
      variants[variant],
      className
    )} />
  )
}

interface PremiumLoadingProps {
  title?: string
  subtitle?: string
  progress?: number
  className?: string
  variant?: 'generation' | 'upload' | 'processing'
}

export function PremiumLoading({ 
  title = 'Loading...',
  subtitle,
  progress,
  className,
  variant = 'generation'
}: PremiumLoadingProps) {
  const icons = {
    generation: Sparkles,
    upload: Zap,
    processing: Wand2
  }

  const Icon = icons[variant]

  return (
    <div className={cn(
      'flex flex-col items-center justify-center py-16 px-6',
      className
    )}>
      {/* Premium Loading Icon */}
      <div className="relative mb-6">
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 animate-spin opacity-30" />
        <div className="absolute inset-2 rounded-full bg-white shadow-inner" />
        <div className="absolute inset-0 flex items-center justify-center">
          <Icon className="h-8 w-8 text-indigo-500 animate-pulse" />
        </div>
        <div className="h-20 w-20" />
      </div>

      {/* Content */}
      <div className="text-center space-y-3 max-w-md">
        <h3 className="text-xl font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          {title}
        </h3>
        {subtitle && (
          <p className="text-gray-600 dark:text-gray-400">{subtitle}</p>
        )}
      </div>

      {/* Progress Bar */}
      {progress !== undefined && (
        <div className="mt-8 w-full max-w-xs">
          <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
          </div>
          <div className="mt-2 text-center">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {Math.round(progress)}%
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

interface SkeletonProps {
  className?: string
  variant?: 'text' | 'image' | 'card' | 'button'
}

export function Skeleton({ className, variant = 'text' }: SkeletonProps) {
  const variants = {
    text: 'h-4 w-full',
    image: 'aspect-square w-full',
    card: 'h-32 w-full',
    button: 'h-10 w-24'
  }

  return (
    <div className={cn(
      'bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse loading-shimmer',
      variants[variant],
      className
    )} />
  )
}

interface LoadingDotsProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function LoadingDots({ size = 'md', className }: LoadingDotsProps) {
  const sizeClasses = {
    sm: 'h-1 w-1',
    md: 'h-2 w-2',
    lg: 'h-3 w-3'
  }

  return (
    <div className={cn('flex items-center gap-1', className)}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={cn(
            'bg-current rounded-full animate-pulse',
            sizeClasses[size]
          )}
          style={{
            animationDelay: `${i * 0.2}s`,
            animationDuration: '1s'
          }}
        />
      ))}
    </div>
  )
}
