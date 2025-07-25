'use client'

import { forwardRef } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const glassVariants = cva(
  "relative rounded-xl transition-all duration-300",
  {
    variants: {
      variant: {
        default: "glass-effect",
        premium: "glass-card-premium",
        subtle: "glass-panel-subtle",
        elevated: "glass-panel-elevated",
        card: "glass-card",
      },
      size: {
        sm: "p-3",
        md: "p-4",
        lg: "p-6",
        xl: "p-8",
      },
      interactive: {
        none: "",
        hover: "hover-glass",
        focus: "glass-focus",
        both: "hover-glass glass-focus",
      },
      shadow: {
        none: "",
        sm: "shadow-sm",
        md: "shadow-md",
        lg: "shadow-lg",
        xl: "shadow-xl",
        premium: "shadow-2xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
      interactive: "hover",
      shadow: "md",
    },
  }
)

export interface GlassProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof glassVariants> {
  asChild?: boolean
}

const Glass = forwardRef<HTMLDivElement, GlassProps>(
  ({ className, variant, size, interactive, shadow, ...props }, ref) => {
    return (
      <div
        className={cn(glassVariants({ variant, size, interactive, shadow, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Glass.displayName = "Glass"

// Specialized Glass Components
const GlassCard = forwardRef<HTMLDivElement, GlassProps>(
  ({ className, variant = "card", ...props }, ref) => {
    return (
      <Glass
        className={cn("overflow-hidden", className)}
        variant={variant}
        ref={ref}
        {...props}
      />
    )
  }
)
GlassCard.displayName = "GlassCard"

const GlassPanel = forwardRef<HTMLDivElement, GlassProps>(
  ({ className, variant = "elevated", ...props }, ref) => {
    return (
      <Glass
        className={cn("border-0", className)}
        variant={variant}
        ref={ref}
        {...props}
      />
    )
  }
)
GlassPanel.displayName = "GlassPanel"

const GlassButton = forwardRef<HTMLButtonElement, 
  React.ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof glassVariants>
>(
  ({ className, variant = "subtle", size = "md", interactive = "both", ...props }, ref) => {
    return (
      <button
        className={cn(
          glassVariants({ variant, size, interactive }),
          "cursor-pointer disabled:cursor-not-allowed disabled:opacity-50",
          "focus:outline-none transition-all duration-200",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
GlassButton.displayName = "GlassButton"

// Glass Input Component
const GlassInput = forwardRef<HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & {
    variant?: 'default' | 'subtle' | 'elevated'
  }
>(
  ({ className, variant = 'default', ...props }, ref) => {
    const inputVariants = {
      default: "glass-panel-subtle",
      subtle: "glass-panel-subtle",
      elevated: "glass-panel-elevated"
    }

    return (
      <input
        className={cn(
          inputVariants[variant],
          "glass-focus",
          "w-full px-4 py-3 text-sm rounded-xl border-0",
          "placeholder:text-gray-500 dark:placeholder:text-gray-400",
          "transition-all duration-200",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
GlassInput.displayName = "GlassInput"

// Glass Modal/Dialog Backdrop
const GlassBackdrop = forwardRef<HTMLDivElement, GlassProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        className={cn(
          "fixed inset-0 z-50",
          "backdrop-blur-md bg-black/20 dark:bg-black/40",
          "transition-all duration-300",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
GlassBackdrop.displayName = "GlassBackdrop"

export {
  Glass,
  GlassCard,
  GlassPanel,
  GlassButton,
  GlassInput,
  GlassBackdrop,
  glassVariants,
}
