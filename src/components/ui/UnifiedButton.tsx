'use client'

import { forwardRef, ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'
import '@/styles/unified-design-system.css'

interface UnifiedButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  icon?: React.ReactNode
  iconPosition?: 'left' | 'right'
  fullWidth?: boolean
  children: React.ReactNode
}

/**
 * UnifiedButton - Consolidated button component that replaces all existing button variants
 * 
 * Features:
 * - Consistent styling across all use cases
 * - Integrated glassmorphism effects
 * - Responsive touch targets
 * - Loading states
 * - Icon support
 * - Accessibility compliant
 */
export const UnifiedButton = forwardRef<HTMLButtonElement, UnifiedButtonProps>(
  ({ 
    variant = 'primary',
    size = 'md',
    loading = false,
    icon,
    iconPosition = 'left',
    fullWidth = false,
    className,
    disabled,
    children,
    ...props 
  }, ref) => {
    
    const getVariantClasses = () => {
      switch (variant) {
        case 'primary':
          return 'unified-button-primary'
        case 'secondary':
          return 'unified-button-secondary'
        case 'ghost':
          return 'unified-button-ghost'
        case 'danger':
          return 'unified-button-primary bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700'
        default:
          return 'unified-button-primary'
      }
    }

    const getSizeClasses = () => {
      switch (size) {
        case 'sm':
          return 'unified-button-sm'
        case 'lg':
          return 'unified-button-lg'
        default:
          return ''
      }
    }

    const LoadingSpinner = () => (
      <div className="unified-loading-spinner" />
    )

    return (
      <button
        ref={ref}
        className={cn(
          'unified-button',
          getVariantClasses(),
          getSizeClasses(),
          fullWidth && 'w-full',
          (loading || disabled) && 'opacity-50 cursor-not-allowed',
          className
        )}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <LoadingSpinner />}
        
        {!loading && icon && iconPosition === 'left' && (
          <span className="flex-shrink-0">
            {icon}
          </span>
        )}
        
        <span className={cn(
          'flex-1',
          fullWidth ? 'text-center' : 'text-left'
        )}>
          {children}
        </span>
        
        {!loading && icon && iconPosition === 'right' && (
          <span className="flex-shrink-0">
            {icon}
          </span>
        )}
      </button>
    )
  }
)

UnifiedButton.displayName = 'UnifiedButton'

/**
 * Specialized button variants for common use cases
 */

interface GenerateButtonProps extends Omit<UnifiedButtonProps, 'variant' | 'children'> {
  isGenerating?: boolean
}

export const GenerateButton = forwardRef<HTMLButtonElement, GenerateButtonProps>(
  ({ isGenerating = false, ...props }, ref) => (
    <UnifiedButton
      ref={ref}
      variant="primary"
      size="lg"
      loading={isGenerating}
      {...props}
    >
      {isGenerating ? 'Generating...' : 'Generate'}
    </UnifiedButton>
  )
)

GenerateButton.displayName = 'GenerateButton'

interface SaveButtonProps extends Omit<UnifiedButtonProps, 'variant' | 'children'> {
  isSaving?: boolean
}

export const SaveButton = forwardRef<HTMLButtonElement, SaveButtonProps>(
  ({ isSaving = false, ...props }, ref) => (
    <UnifiedButton
      ref={ref}
      variant="secondary"
      loading={isSaving}
      {...props}
    >
      {isSaving ? 'Saving...' : 'Save'}
    </UnifiedButton>
  )
)

SaveButton.displayName = 'SaveButton'

interface DeleteButtonProps extends Omit<UnifiedButtonProps, 'variant' | 'children'> {
  isDeleting?: boolean
}

export const DeleteButton = forwardRef<HTMLButtonElement, DeleteButtonProps>(
  ({ isDeleting = false, ...props }, ref) => (
    <UnifiedButton
      ref={ref}
      variant="danger"
      loading={isDeleting}
      {...props}
    >
      {isDeleting ? 'Deleting...' : 'Delete'}
    </UnifiedButton>
  )
)

DeleteButton.displayName = 'DeleteButton'

/**
 * Button group component for related actions
 */
interface UnifiedButtonGroupProps {
  children: React.ReactNode
  className?: string
  orientation?: 'horizontal' | 'vertical'
  spacing?: 'sm' | 'md' | 'lg'
}

export const UnifiedButtonGroup = ({ 
  children, 
  className,
  orientation = 'horizontal',
  spacing = 'md' 
}: UnifiedButtonGroupProps) => {
  const getSpacingClasses = () => {
    const spacingMap = {
      sm: 'gap-2',
      md: 'gap-3',
      lg: 'gap-4'
    }
    return spacingMap[spacing]
  }

  return (
    <div className={cn(
      'flex',
      orientation === 'horizontal' ? 'flex-row' : 'flex-col',
      getSpacingClasses(),
      className
    )}>
      {children}
    </div>
  )
}

/**
 * Icon button component for actions with only icons
 */
interface UnifiedIconButtonProps extends Omit<UnifiedButtonProps, 'children'> {
  icon: React.ReactNode
  'aria-label': string
}

export const UnifiedIconButton = forwardRef<HTMLButtonElement, UnifiedIconButtonProps>(
  ({ icon, size = 'md', ...props }, ref) => {
    const getIconSizeClasses = () => {
      switch (size) {
        case 'sm':
          return 'w-8 h-8'
        case 'lg':
          return 'w-12 h-12'
        default:
          return 'w-10 h-10'
      }
    }

    return (
      <UnifiedButton
        ref={ref}
        size={size}
        className={cn(
          'p-0',
          getIconSizeClasses(),
          props.className
        )}
        {...props}
      >
        {icon}
      </UnifiedButton>
    )
  }
)

UnifiedIconButton.displayName = 'UnifiedIconButton'

/**
 * Toggle button component for on/off states
 */
interface UnifiedToggleButtonProps extends Omit<UnifiedButtonProps, 'variant'> {
  pressed?: boolean
  onPressedChange?: (pressed: boolean) => void
}

export const UnifiedToggleButton = forwardRef<HTMLButtonElement, UnifiedToggleButtonProps>(
  ({ pressed = false, onPressedChange, onClick, ...props }, ref) => {
    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
      onPressedChange?.(!pressed)
      onClick?.(event)
    }

    return (
      <UnifiedButton
        ref={ref}
        variant={pressed ? 'primary' : 'secondary'}
        onClick={handleClick}
        aria-pressed={pressed}
        {...props}
      />
    )
  }
)

UnifiedToggleButton.displayName = 'UnifiedToggleButton'
