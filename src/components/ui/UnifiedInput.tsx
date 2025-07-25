'use client'

import { forwardRef, InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'
import '@/styles/unified-design-system.css'

interface UnifiedInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  success?: string
  hint?: string
  icon?: React.ReactNode
  iconPosition?: 'left' | 'right'
  fullWidth?: boolean
}

/**
 * UnifiedInput - Consolidated input component with consistent styling
 * 
 * Features:
 * - Consistent glassmorphism styling
 * - Validation states (error, success)
 * - Icon support
 * - Responsive sizing
 * - Accessibility compliant
 */
export const UnifiedInput = forwardRef<HTMLInputElement, UnifiedInputProps>(
  ({ 
    label,
    error,
    success,
    hint,
    icon,
    iconPosition = 'left',
    fullWidth = true,
    className,
    id,
    ...props 
  }, ref) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`
    
    const getStateClasses = () => {
      if (error) return 'unified-input-error'
      if (success) return 'unified-input-success'
      return ''
    }

    return (
      <div className={cn('space-y-2', fullWidth && 'w-full')}>
        {label && (
          <label 
            htmlFor={inputId}
            className="unified-caption font-medium text-gray-700 dark:text-gray-300"
          >
            {label}
          </label>
        )}
        
        <div className="relative">
          {icon && iconPosition === 'left' && (
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              {icon}
            </div>
          )}
          
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'unified-input',
              getStateClasses(),
              icon && iconPosition === 'left' && 'pl-10',
              icon && iconPosition === 'right' && 'pr-10',
              className
            )}
            {...props}
          />
          
          {icon && iconPosition === 'right' && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              {icon}
            </div>
          )}
        </div>
        
        {(error || success || hint) && (
          <div className="space-y-1">
            {error && (
              <p className="unified-caption text-red-600 dark:text-red-400">
                {error}
              </p>
            )}
            {success && (
              <p className="unified-caption text-green-600 dark:text-green-400">
                {success}
              </p>
            )}
            {hint && !error && !success && (
              <p className="unified-caption text-gray-500 dark:text-gray-400">
                {hint}
              </p>
            )}
          </div>
        )}
      </div>
    )
  }
)

UnifiedInput.displayName = 'UnifiedInput'

/**
 * Unified Textarea component
 */
interface UnifiedTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  success?: string
  hint?: string
  fullWidth?: boolean
  resize?: boolean
}

export const UnifiedTextarea = forwardRef<HTMLTextAreaElement, UnifiedTextareaProps>(
  ({ 
    label,
    error,
    success,
    hint,
    fullWidth = true,
    resize = true,
    className,
    id,
    ...props 
  }, ref) => {
    const textareaId = id || `textarea-${Math.random().toString(36).substr(2, 9)}`
    
    const getStateClasses = () => {
      if (error) return 'unified-input-error'
      if (success) return 'unified-input-success'
      return ''
    }

    return (
      <div className={cn('space-y-2', fullWidth && 'w-full')}>
        {label && (
          <label 
            htmlFor={textareaId}
            className="unified-caption font-medium text-gray-700 dark:text-gray-300"
          >
            {label}
          </label>
        )}
        
        <textarea
          ref={ref}
          id={textareaId}
          className={cn(
            'unified-input min-h-[100px]',
            getStateClasses(),
            !resize && 'resize-none',
            className
          )}
          {...props}
        />
        
        {(error || success || hint) && (
          <div className="space-y-1">
            {error && (
              <p className="unified-caption text-red-600 dark:text-red-400">
                {error}
              </p>
            )}
            {success && (
              <p className="unified-caption text-green-600 dark:text-green-400">
                {success}
              </p>
            )}
            {hint && !error && !success && (
              <p className="unified-caption text-gray-500 dark:text-gray-400">
                {hint}
              </p>
            )}
          </div>
        )}
      </div>
    )
  }
)

UnifiedTextarea.displayName = 'UnifiedTextarea'

/**
 * Unified Select component
 */
interface UnifiedSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  success?: string
  hint?: string
  fullWidth?: boolean
  options: Array<{ value: string; label: string; disabled?: boolean }>
  placeholder?: string
}

export const UnifiedSelect = forwardRef<HTMLSelectElement, UnifiedSelectProps>(
  ({ 
    label,
    error,
    success,
    hint,
    fullWidth = true,
    options,
    placeholder,
    className,
    id,
    ...props 
  }, ref) => {
    const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`
    
    const getStateClasses = () => {
      if (error) return 'unified-input-error'
      if (success) return 'unified-input-success'
      return ''
    }

    return (
      <div className={cn('space-y-2', fullWidth && 'w-full')}>
        {label && (
          <label 
            htmlFor={selectId}
            className="unified-caption font-medium text-gray-700 dark:text-gray-300"
          >
            {label}
          </label>
        )}
        
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            className={cn(
              'unified-input appearance-none pr-10 cursor-pointer',
              getStateClasses(),
              className
            )}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option 
                key={option.value} 
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </option>
            ))}
          </select>
          
          {/* Dropdown arrow */}
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
            <svg 
              className="w-4 h-4 text-gray-400" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
        
        {(error || success || hint) && (
          <div className="space-y-1">
            {error && (
              <p className="unified-caption text-red-600 dark:text-red-400">
                {error}
              </p>
            )}
            {success && (
              <p className="unified-caption text-green-600 dark:text-green-400">
                {success}
              </p>
            )}
            {hint && !error && !success && (
              <p className="unified-caption text-gray-500 dark:text-gray-400">
                {hint}
              </p>
            )}
          </div>
        )}
      </div>
    )
  }
)

UnifiedSelect.displayName = 'UnifiedSelect'

/**
 * Unified Checkbox component
 */
interface UnifiedCheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string
  description?: string
  error?: string
}

export const UnifiedCheckbox = forwardRef<HTMLInputElement, UnifiedCheckboxProps>(
  ({ label, description, error, className, id, ...props }, ref) => {
    const checkboxId = id || `checkbox-${Math.random().toString(36).substr(2, 9)}`

    return (
      <div className="space-y-2">
        <div className="flex items-start gap-3">
          <input
            ref={ref}
            type="checkbox"
            id={checkboxId}
            className={cn(
              'mt-1 w-4 h-4 rounded border-2 border-gray-300 dark:border-gray-600',
              'text-blue-600 focus:ring-blue-500 focus:ring-2 focus:ring-offset-0',
              'bg-white dark:bg-gray-800',
              error && 'border-red-500 focus:ring-red-500',
              className
            )}
            {...props}
          />
          
          {(label || description) && (
            <div className="flex-1">
              {label && (
                <label 
                  htmlFor={checkboxId}
                  className="unified-caption font-medium text-gray-700 dark:text-gray-300 cursor-pointer"
                >
                  {label}
                </label>
              )}
              {description && (
                <p className="unified-caption text-gray-500 dark:text-gray-400 mt-1">
                  {description}
                </p>
              )}
            </div>
          )}
        </div>
        
        {error && (
          <p className="unified-caption text-red-600 dark:text-red-400 ml-7">
            {error}
          </p>
        )}
      </div>
    )
  }
)

UnifiedCheckbox.displayName = 'UnifiedCheckbox'

/**
 * Unified Radio Group component
 */
interface RadioOption {
  value: string
  label: string
  description?: string
  disabled?: boolean
}

interface UnifiedRadioGroupProps {
  name: string
  label?: string
  options: RadioOption[]
  value?: string
  onChange?: (value: string) => void
  error?: string
  orientation?: 'horizontal' | 'vertical'
}

export const UnifiedRadioGroup = ({ 
  name,
  label,
  options,
  value,
  onChange,
  error,
  orientation = 'vertical'
}: UnifiedRadioGroupProps) => {
  return (
    <div className="space-y-3">
      {label && (
        <div className="unified-caption font-medium text-gray-700 dark:text-gray-300">
          {label}
        </div>
      )}
      
      <div className={cn(
        'flex gap-4',
        orientation === 'vertical' ? 'flex-col' : 'flex-row flex-wrap'
      )}>
        {options.map((option) => (
          <div key={option.value} className="flex items-start gap-3">
            <input
              type="radio"
              id={`${name}-${option.value}`}
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={(e) => onChange?.(e.target.value)}
              disabled={option.disabled}
              className={cn(
                'mt-1 w-4 h-4 border-2 border-gray-300 dark:border-gray-600',
                'text-blue-600 focus:ring-blue-500 focus:ring-2 focus:ring-offset-0',
                'bg-white dark:bg-gray-800',
                error && 'border-red-500 focus:ring-red-500'
              )}
            />
            
            <div className="flex-1">
              <label 
                htmlFor={`${name}-${option.value}`}
                className="unified-caption font-medium text-gray-700 dark:text-gray-300 cursor-pointer"
              >
                {option.label}
              </label>
              {option.description && (
                <p className="unified-caption text-gray-500 dark:text-gray-400 mt-1">
                  {option.description}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {error && (
        <p className="unified-caption text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  )
}
