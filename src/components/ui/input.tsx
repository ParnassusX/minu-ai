'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
  variant?: 'default' | 'glass' | 'minimal'
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, helperText, variant = 'glass', ...props }, ref) => {
    const [isFocused, setIsFocused] = React.useState(false)
    const [hasValue, setHasValue] = React.useState(false)

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true)
      props.onFocus?.(e)
    }

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false)
      setHasValue(e.target.value.length > 0)
      props.onBlur?.(e)
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setHasValue(e.target.value.length > 0)
      props.onChange?.(e)
    }

    React.useEffect(() => {
      if (props.value || props.defaultValue) {
        setHasValue(true)
      }
    }, [props.value, props.defaultValue])

    const inputVariants = {
      default: 'border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800',
      glass: 'bg-white/60 dark:bg-gray-800/60 backdrop-blur-md border border-white/20 dark:border-gray-700/30 shadow-md',
      minimal: 'border-b-2 border-gray-300 dark:border-gray-600 bg-transparent'
    }

    const focusVariants = {
      default: 'focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20',
      glass: 'focus:bg-white/80 dark:focus:bg-gray-800/80 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20',
      minimal: 'focus:border-blue-500'
    }

    return (
      <div className="relative">
        {/* Floating Label */}
        {label && (
          <label
            className={cn(
              'absolute left-3 transition-all duration-200 pointer-events-none text-gray-500 dark:text-gray-400',
              variant === 'minimal' ? 'left-0' : 'left-3',
              (isFocused || hasValue)
                ? 'top-0 text-xs bg-white dark:bg-gray-900 px-1 -translate-y-1/2 text-blue-600 dark:text-blue-400'
                : 'top-1/2 -translate-y-1/2 text-sm'
            )}
          >
            {label}
          </label>
        )}

        <input
          type={type}
          className={cn(
            'flex h-12 w-full px-3 py-2 text-sm transition-all duration-200',
            'placeholder:text-gray-400 dark:placeholder:text-gray-500',
            'focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
            'text-gray-900 dark:text-gray-100',
            
            // Variant styles
            inputVariants[variant],
            focusVariants[variant],
            
            // Rounded corners
            variant === 'minimal' ? 'rounded-none' : 'rounded-xl',
            
            // Error state
            error && 'border-red-500 focus:border-red-500 focus:ring-red-500/20',
            
            // Label spacing
            label && 'pt-6',
            
            className
          )}
          ref={ref}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onChange={handleChange}
          {...props}
        />

        {/* Helper text or error */}
        {(helperText || error) && (
          <p className={cn(
            'mt-1 text-xs',
            error ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'
          )}>
            {error || helperText}
          </p>
        )}
      </div>
    )
  }
)
Input.displayName = 'Input'

export { Input }