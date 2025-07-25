'use client'

import React, { forwardRef } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

// Typography component variants
const typographyVariants = cva(
  "font-primary", // Base font family
  {
    variants: {
      variant: {
        // Display text
        'display': 'text-4xl font-bold tracking-tight lg:text-5xl',
        'display-1': 'text-display-1',
        'display-2': 'text-display-2',

        // Headings
        'h1': 'text-h1',
        'h2': 'text-h2',
        'h3': 'text-h3',
        'h4': 'text-h4',
        'h5': 'text-h5',
        'h6': 'text-h6',

        // Body text
        'body-lg': 'text-body-lg',
        'body': 'text-body',
        'body-sm': 'text-body-sm',
        'body-xs': 'text-xs',

        // UI text
        'label': 'text-label',
        'caption': 'text-caption',
        'overline': 'text-overline',
        'code': 'text-code',
        'code-inline': 'text-code-inline',
      },
      color: {
        default: '',
        primary: 'text-primary',
        secondary: 'text-secondary',
        muted: 'text-muted',
        subtle: 'text-subtle',
        success: 'text-success',
        warning: 'text-warning',
        error: 'text-error',
        info: 'text-info',
        'high-contrast': 'text-accessible-high',
        'medium-contrast': 'text-accessible-medium',
        'low-contrast': 'text-accessible-low',
      },
      weight: {
        thin: 'font-thin',
        light: 'font-light',
        normal: 'font-normal',
        medium: 'font-medium',
        semibold: 'font-semibold',
        bold: 'font-bold',
        extrabold: 'font-extrabold',
        black: 'font-black',
      },
      align: {
        left: 'text-left',
        center: 'text-center',
        right: 'text-right',
        justify: 'text-justify',
      },
    },
    defaultVariants: {
      variant: 'body',
      color: 'default',
      weight: 'normal',
      align: 'left',
    },
  }
)

interface TypographyProps
  extends Omit<React.HTMLAttributes<HTMLElement>, 'color'>,
    VariantProps<typeof typographyVariants> {
  as?: keyof JSX.IntrinsicElements
  children: React.ReactNode
}

const Typography = forwardRef<HTMLElement, TypographyProps>(
  ({ className, variant, color, weight, align, as, children, ...props }, ref) => {
    // Determine the HTML element based on variant or explicit 'as' prop
    const Component = as || getDefaultElement(variant)

    return React.createElement(
      Component,
      {
        ref,
        className: cn(typographyVariants({ variant, color, weight, align }), className),
        ...props
      },
      children
    )
  }
)

Typography.displayName = 'Typography'

// Helper function to determine default HTML element
function getDefaultElement(variant: string | null | undefined): keyof JSX.IntrinsicElements {
  switch (variant) {
    case 'display':
    case 'display-1':
    case 'display-2':
    case 'h1':
      return 'h1'
    case 'h2':
      return 'h2'
    case 'h3':
      return 'h3'
    case 'h4':
      return 'h4'
    case 'h5':
      return 'h5'
    case 'h6':
      return 'h6'
    case 'label':
      return 'label'
    case 'caption':
      return 'small'
    case 'code':
      return 'pre'
    case 'code-inline':
      return 'code'
    default:
      return 'p'
  }
}

// Convenience components for common use cases
const Heading = forwardRef<HTMLHeadingElement, Omit<TypographyProps, 'variant'> & { level: 1 | 2 | 3 | 4 | 5 | 6 }>(
  ({ level, ...props }, ref) => {
    const variant = `h${level}` as const
    return <Typography ref={ref} variant={variant} {...props} />
  }
)
Heading.displayName = 'Heading'

const Text = forwardRef<HTMLParagraphElement, Omit<TypographyProps, 'variant'> & { size?: 'sm' | 'base' | 'lg' }>(
  ({ size = 'base', ...props }, ref) => {
    const variant = size === 'sm' ? 'body-sm' : size === 'lg' ? 'body-lg' : 'body'
    return <Typography ref={ref} variant={variant} {...props} />
  }
)
Text.displayName = 'Text'

const Label = forwardRef<HTMLLabelElement, Omit<TypographyProps, 'variant' | 'as'>>(
  (props, ref) => {
    return <Typography ref={ref} variant="label" as="label" {...props} />
  }
)
Label.displayName = 'Label'

const Caption = forwardRef<HTMLElement, Omit<TypographyProps, 'variant'>>(
  (props, ref) => {
    return <Typography ref={ref} variant="caption" {...props} />
  }
)
Caption.displayName = 'Caption'

const Code = forwardRef<HTMLElement, Omit<TypographyProps, 'variant'> & { inline?: boolean }>(
  ({ inline = false, ...props }, ref) => {
    const variant = inline ? 'code-inline' : 'code'
    return <Typography ref={ref} variant={variant} {...props} />
  }
)
Code.displayName = 'Code'

// Spacing component for consistent layout
interface SpacingProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl'
  direction?: 'vertical' | 'horizontal' | 'both'
  children: React.ReactNode
  className?: string
}

const Spacing = forwardRef<HTMLDivElement, SpacingProps>(
  ({ size = 'md', direction = 'vertical', children, className }, ref) => {
    const spacingClass = direction === 'vertical' 
      ? `stack stack-${size}`
      : direction === 'horizontal'
      ? `cluster cluster-${size}`
      : `space-${size}`
    
    return (
      <div ref={ref} className={cn(spacingClass, className)}>
        {children}
      </div>
    )
  }
)
Spacing.displayName = 'Spacing'

// Container component with consistent spacing
interface ContainerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  spacing?: 'compact' | 'comfortable' | 'spacious'
  children: React.ReactNode
  className?: string
}

const Container = forwardRef<HTMLDivElement, ContainerProps>(
  ({ size = 'lg', spacing = 'comfortable', children, className }, ref) => {
    const sizeClasses = {
      sm: 'max-w-sm',
      md: 'max-w-md',
      lg: 'max-w-4xl',
      xl: 'max-w-6xl',
      full: 'max-w-full'
    }
    
    const spacingClasses = {
      compact: 'p-4',
      comfortable: 'p-6 md:p-8',
      spacious: 'p-8 md:p-12'
    }
    
    return (
      <div 
        ref={ref} 
        className={cn(
          'layout-container',
          sizeClasses[size],
          spacingClasses[spacing],
          className
        )}
      >
        {children}
      </div>
    )
  }
)
Container.displayName = 'Container'

// Section component for consistent page layout
interface SectionProps {
  spacing?: 'compact' | 'comfortable' | 'spacious'
  children: React.ReactNode
  className?: string
}

const Section = forwardRef<HTMLElement, SectionProps>(
  ({ spacing = 'comfortable', children, className }, ref) => {
    const spacingClasses = {
      compact: 'py-8',
      comfortable: 'py-12',
      spacious: 'py-16'
    }
    
    return (
      <section 
        ref={ref} 
        className={cn(
          'layout-section',
          spacingClasses[spacing],
          className
        )}
      >
        {children}
      </section>
    )
  }
)
Section.displayName = 'Section'

export {
  Typography,
  Heading,
  Text,
  Label,
  Caption,
  Code,
  Spacing,
  Container,
  Section,
  typographyVariants,
}
