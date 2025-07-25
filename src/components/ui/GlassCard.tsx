'use client'

import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'interactive'
  blur?: 'sm' | 'md' | 'lg' | 'xl'
  opacity?: 'low' | 'medium' | 'high'
  border?: boolean
  shadow?: 'sm' | 'md' | 'lg' | 'xl'
  children: React.ReactNode
}

const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({ 
    className, 
    variant = 'default',
    blur = 'md',
    opacity = 'medium',
    border = true,
    shadow = 'md',
    children,
    ...props 
  }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          // Base glass morphism styles
          'relative overflow-hidden rounded-xl',
          
          // Backdrop blur
          {
            'backdrop-blur-sm': blur === 'sm',
            'backdrop-blur-md': blur === 'md',
            'backdrop-blur-lg': blur === 'lg',
            'backdrop-blur-xl': blur === 'xl',
          },
          
          // Background opacity
          {
            'bg-white/40 dark:bg-gray-900/40': opacity === 'low',
            'bg-white/60 dark:bg-gray-900/60': opacity === 'medium',
            'bg-white/80 dark:bg-gray-900/80': opacity === 'high',
          },
          
          // Border
          border && 'border border-white/20 dark:border-gray-700/30',
          
          // Shadow
          {
            'shadow-sm': shadow === 'sm',
            'shadow-md': shadow === 'md',
            'shadow-lg': shadow === 'lg',
            'shadow-xl': shadow === 'xl',
          },
          
          // Variant-specific styles
          {
            // Default variant
            'transition-all duration-200': variant === 'default',
            
            // Elevated variant
            'shadow-lg shadow-blue-500/10 dark:shadow-purple-500/10': variant === 'elevated',
            
            // Interactive variant
            'transition-all duration-200 hover:scale-[1.02] hover:shadow-lg hover:shadow-blue-500/20 dark:hover:shadow-purple-500/20 active:scale-[0.98] cursor-pointer': variant === 'interactive',
          },
          
          className
        )}
        {...props}
      >
        {/* Gradient overlay for enhanced glass effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/5 dark:from-white/5 dark:to-black/10 pointer-events-none" />
        
        {/* Content */}
        <div className="relative z-10">
          {children}
        </div>
      </div>
    )
  }
)

GlassCard.displayName = 'GlassCard'

export { GlassCard }