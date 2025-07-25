'use client'

import { forwardRef } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

// Premium Glass Card Variants - Enhanced Phase 3 with Advanced Glassmorphism
const glassCardVariants = cva(
  "relative overflow-hidden transition-all duration-500 ease-out group",
  {
    variants: {
      variant: {
        default: "glass-effect",
        elevated: "glass-effect shadow-glass-lg hover:shadow-glass-xl",
        floating: "glass-effect shadow-glass-xl hover:shadow-glass-2xl hover:-translate-y-1",
        subtle: "bg-surface-glass/50 backdrop-blur-md border border-surface-border/50",
        premium: "bg-gradient-to-br from-surface-glass to-surface-glass/80 backdrop-blur-xl border border-surface-border shadow-glass-lg hover:shadow-glass-xl",
        interactive: "glass-effect hover:bg-surface-glass-hover hover:border-surface-border-hover hover:shadow-glass-lg cursor-pointer transform hover:scale-[1.02]",
        luxury: "bg-gradient-to-br from-surface-glass/90 via-surface-glass/70 to-surface-glass/90 backdrop-blur-2xl border border-surface-border/60 shadow-glass-2xl",
        skeleton: "bg-gradient-to-r from-surface-glass/30 via-surface-glass/50 to-surface-glass/30 animate-pulse backdrop-blur-sm",
      },
      size: {
        xs: "p-2 rounded-md",
        sm: "p-3 rounded-lg",
        md: "p-4 rounded-xl",
        lg: "p-6 rounded-2xl",
        xl: "p-8 rounded-3xl",
        "2xl": "p-10 rounded-[2rem]",
      },
      glow: {
        none: "",
        subtle: "before:absolute before:inset-0 before:rounded-[inherit] before:bg-gradient-to-r before:from-primary-500/10 before:to-primary-300/10 before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-500",
        prominent: "before:absolute before:inset-0 before:rounded-[inherit] before:bg-gradient-to-r before:from-primary-500/20 before:to-primary-300/20 before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-500",
        intense: "before:absolute before:inset-0 before:rounded-[inherit] before:bg-gradient-to-r before:from-primary-400/30 before:to-primary-600/30 before:opacity-0 hover:before:opacity-100 before:transition-all before:duration-500 hover:before:blur-sm",
      },
      animation: {
        none: "",
        fadeIn: "animate-in fade-in duration-700",
        slideUp: "animate-in slide-in-from-bottom-4 fade-in duration-700",
        slideDown: "animate-in slide-in-from-top-4 fade-in duration-700",
        scaleIn: "animate-in zoom-in-95 fade-in duration-500",
        float: "animate-pulse hover:animate-none",
      },
      focus: {
        none: "",
        ring: "focus-within:ring-2 focus-within:ring-primary-500/50 focus-within:ring-offset-2 focus-within:ring-offset-transparent",
        glow: "focus-within:shadow-lg focus-within:shadow-primary-500/25 focus-within:border-primary-500/50",
        premium: "focus-within:ring-2 focus-within:ring-primary-500/50 focus-within:ring-offset-2 focus-within:ring-offset-transparent focus-within:shadow-lg focus-within:shadow-primary-500/25",
      }
    },
    defaultVariants: {
      variant: "default",
      size: "md",
      glow: "none",
      animation: "fadeIn",
      focus: "none",
    },
  }
)

export interface GlassCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof glassCardVariants> {}

const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, variant, size, glow, animation, focus, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(glassCardVariants({ variant, size, glow, animation, focus }), className)}
        role={variant === 'interactive' ? 'button' : undefined}
        tabIndex={variant === 'interactive' ? 0 : undefined}
        aria-label={variant === 'skeleton' ? 'Loading content...' : undefined}
        {...props}
      >
        {children}
      </div>
    )
  }
)
GlassCard.displayName = "GlassCard"

// Premium Button Component - Enhanced Phase 3 with Advanced Interactions
const premiumButtonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-all duration-500 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed group relative overflow-hidden",
  {
    variants: {
      variant: {
        primary: "btn-primary text-white shadow-lg hover:shadow-xl hover:shadow-primary-500/25",
        secondary: "glass-effect text-text-primary hover:bg-surface-glass-hover hover:shadow-lg",
        ghost: "text-text-secondary hover:text-text-primary hover:bg-surface-glass/50 hover:backdrop-blur-md",
        outline: "border border-surface-border text-text-primary hover:bg-surface-glass hover:border-surface-border-hover hover:shadow-md",
        gradient: "bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg hover:from-primary-400 hover:to-primary-500 hover:shadow-xl hover:shadow-primary-500/30",
        luxury: "bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 text-white shadow-xl hover:shadow-2xl hover:shadow-primary-500/40 before:absolute before:inset-0 before:bg-gradient-to-r before:from-white/20 before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-500",
        glass: "glass-effect text-text-primary hover:bg-surface-glass-hover hover:shadow-lg hover:shadow-primary-500/10",
      },
      size: {
        xs: "h-6 px-2 text-xs rounded-md",
        sm: "h-8 px-3 text-sm rounded-lg",
        md: "h-10 px-4 text-base rounded-xl",
        lg: "h-12 px-6 text-lg rounded-2xl",
        xl: "h-14 px-8 text-xl rounded-3xl",
        icon: "h-10 w-10 rounded-xl",
        "icon-sm": "h-8 w-8 rounded-lg",
        "icon-lg": "h-12 w-12 rounded-2xl",
      },
      animation: {
        none: "",
        bounce: "hover:scale-105 active:scale-95 transition-transform duration-200",
        lift: "hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300",
        glow: "hover:shadow-primary-500/25 hover:shadow-lg transition-shadow duration-300",
        pulse: "hover:animate-pulse",
        float: "hover:animate-bounce",
        shimmer: "before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent before:-translate-x-full hover:before:translate-x-full before:transition-transform before:duration-700",
      },
      loading: {
        false: "",
        true: "cursor-wait opacity-75",
      }
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
      animation: "lift",
      loading: false,
    },
  }
)

export interface PremiumButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof premiumButtonVariants> {}

const PremiumButton = forwardRef<HTMLButtonElement, PremiumButtonProps>(
  ({ className, variant, size, animation, loading, children, disabled, ...props }, ref) => {
    const isDisabled = Boolean(disabled || loading)

    return (
      <button
        ref={ref}
        className={cn(premiumButtonVariants({ variant, size, animation, loading }), className)}
        disabled={isDisabled}
        aria-disabled={isDisabled}
        aria-busy={loading || undefined}
        {...props}
      >
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        <span className={loading ? "opacity-0" : ""}>{children}</span>
      </button>
    )
  }
)
PremiumButton.displayName = "PremiumButton"

// Premium Input Component - Modern AI Platform Style
const premiumInputVariants = cva(
  "flex w-full transition-all duration-300 ease-out file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-text-muted focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "input-premium",
        filled: "bg-bg-tertiary border border-surface-border rounded-xl text-text-primary focus:border-primary-500 focus:bg-bg-secondary",
        ghost: "bg-transparent border-0 border-b border-surface-border rounded-none focus:border-primary-500",
        premium: "glass-effect text-text-primary focus:border-primary-500 focus:shadow-lg focus:shadow-primary-500/10",
      },
      size: {
        sm: "h-8 px-3 text-sm rounded-lg",
        md: "h-10 px-4 text-base rounded-xl",
        lg: "h-12 px-6 text-lg rounded-2xl",
      }
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
)

export interface PremiumInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof premiumInputVariants> {}

const PremiumInput = forwardRef<HTMLInputElement, PremiumInputProps>(
  ({ className, variant, size, type, ...props }, ref) => {
    return (
      <input
        type={type}
        ref={ref}
        className={cn(premiumInputVariants({ variant, size }), className)}
        {...props}
      />
    )
  }
)
PremiumInput.displayName = "PremiumInput"

// Premium Textarea - For Prompt Input (Freepik-style)
const premiumTextareaVariants = cva(
  "flex min-h-[80px] w-full transition-all duration-300 ease-out placeholder:text-text-muted focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 resize-none",
  {
    variants: {
      variant: {
        default: "input-premium",
        premium: "glass-effect text-text-primary focus:border-primary-500 focus:shadow-lg focus:shadow-primary-500/10",
        minimal: "bg-transparent border-0 text-text-primary text-lg leading-relaxed focus:outline-none",
      },
      size: {
        sm: "p-3 text-sm rounded-lg",
        md: "p-4 text-base rounded-xl",
        lg: "p-6 text-lg rounded-2xl",
      }
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
)

export interface PremiumTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    VariantProps<typeof premiumTextareaVariants> {}

const PremiumTextarea = forwardRef<HTMLTextAreaElement, PremiumTextareaProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(premiumTextareaVariants({ variant, size }), className)}
        {...props}
      />
    )
  }
)
PremiumTextarea.displayName = "PremiumTextarea"

// Modern Badge Component
const premiumBadgeVariants = cva(
  "inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-medium transition-all duration-200",
  {
    variants: {
      variant: {
        default: "bg-surface-glass text-text-secondary border border-surface-border rounded-full",
        primary: "bg-primary-500/20 text-primary-300 border border-primary-500/30 rounded-full",
        success: "bg-success-500/20 text-success-300 border border-success-500/30 rounded-full",
        warning: "bg-warning-500/20 text-warning-300 border border-warning-500/30 rounded-full",
        error: "bg-error-500/20 text-error-300 border border-error-500/30 rounded-full",
        glass: "glass-effect text-text-primary rounded-full",
      }
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface PremiumBadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof premiumBadgeVariants> {}

const PremiumBadge = forwardRef<HTMLDivElement, PremiumBadgeProps>(
  ({ className, variant, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(premiumBadgeVariants({ variant }), className)}
        {...props}
      >
        {children}
      </div>
    )
  }
)
PremiumBadge.displayName = "PremiumBadge"

// Premium Skeleton Component - Phase 3 Loading States
const premiumSkeletonVariants = cva(
  "animate-pulse rounded-lg bg-gradient-to-r from-surface-glass/30 via-surface-glass/50 to-surface-glass/30 backdrop-blur-sm",
  {
    variants: {
      variant: {
        default: "bg-gradient-to-r from-surface-glass/30 via-surface-glass/50 to-surface-glass/30",
        shimmer: "bg-gradient-to-r from-surface-glass/20 via-surface-glass/40 to-surface-glass/20",
        pulse: "bg-surface-glass/40 animate-pulse",
        wave: "bg-gradient-to-r from-surface-glass/30 via-surface-glass/60 to-surface-glass/30",
      },
      size: {
        sm: "h-4",
        md: "h-6",
        lg: "h-8",
        xl: "h-12",
        "2xl": "h-16",
      },
      shape: {
        rectangle: "rounded-lg",
        circle: "rounded-full aspect-square",
        pill: "rounded-full",
        square: "rounded-lg aspect-square",
      }
    },
    defaultVariants: {
      variant: "default",
      size: "md",
      shape: "rectangle",
    },
  }
)

export interface PremiumSkeletonProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof premiumSkeletonVariants> {}

const PremiumSkeleton = forwardRef<HTMLDivElement, PremiumSkeletonProps>(
  ({ className, variant, size, shape, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(premiumSkeletonVariants({ variant, size, shape }), className)}
        role="status"
        aria-label="Loading..."
        {...props}
      />
    )
  }
)

PremiumSkeleton.displayName = "PremiumSkeleton"

export {
  GlassCard,
  PremiumButton,
  PremiumInput,
  PremiumTextarea,
  PremiumBadge,
  PremiumSkeleton,
  glassCardVariants,
  premiumButtonVariants,
  premiumInputVariants,
  premiumTextareaVariants,
  premiumBadgeVariants,
  premiumSkeletonVariants,
}
