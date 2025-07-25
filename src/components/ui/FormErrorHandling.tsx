'use client'

import { cn } from '@/lib/utils'
import { AlertTriangle, XCircle, CheckCircle, Info } from 'lucide-react'
import { UnifiedButton } from './UnifiedButton'
import '@/styles/unified-design-system.css'

export interface FormError {
  field?: string
  message: string
  type?: 'validation' | 'server' | 'network' | 'auth'
}

interface FormErrorDisplayProps {
  errors: FormError[]
  className?: string
  onRetry?: () => void
  onDismiss?: () => void
}

/**
 * FormErrorDisplay - Unified form error display component
 * 
 * Features:
 * - Consistent error styling with glassmorphism effects
 * - Field-specific and general error handling
 * - Error type categorization with appropriate icons
 * - Retry and dismiss functionality
 * - Integration with unified design system
 */
export function FormErrorDisplay({ 
  errors, 
  className, 
  onRetry, 
  onDismiss 
}: FormErrorDisplayProps) {
  if (!errors || errors.length === 0) return null

  const getErrorIcon = (type?: FormError['type']) => {
    switch (type) {
      case 'validation': return AlertTriangle
      case 'server': return XCircle
      case 'network': return XCircle
      case 'auth': return XCircle
      default: return AlertTriangle
    }
  }

  const getErrorColor = (type?: FormError['type']) => {
    switch (type) {
      case 'validation': return 'text-yellow-600 dark:text-yellow-400'
      case 'server': return 'text-red-600 dark:text-red-400'
      case 'network': return 'text-orange-600 dark:text-orange-400'
      case 'auth': return 'text-purple-600 dark:text-purple-400'
      default: return 'text-red-600 dark:text-red-400'
    }
  }

  const getBgColor = (type?: FormError['type']) => {
    switch (type) {
      case 'validation': return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
      case 'server': return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
      case 'network': return 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800'
      case 'auth': return 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800'
      default: return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
    }
  }

  // Group errors by type
  const groupedErrors = errors.reduce((acc, error) => {
    const type = error.type || 'validation'
    if (!acc[type]) acc[type] = []
    acc[type].push(error)
    return acc
  }, {} as Record<string, FormError[]>)

  return (
    <div className={cn('space-y-3', className)}>
      {Object.entries(groupedErrors).map(([type, typeErrors]) => {
        const ErrorIcon = getErrorIcon(type as FormError['type'])
        
        return (
          <div
            key={type}
            className={cn(
              'p-4 rounded-2xl border backdrop-blur-md',
              getBgColor(type as FormError['type'])
            )}
          >
            <div className="flex items-start gap-3">
              <ErrorIcon className={cn('w-5 h-5 mt-0.5 flex-shrink-0', getErrorColor(type as FormError['type']))} />
              
              <div className="flex-1 min-w-0">
                <div className="space-y-2">
                  {typeErrors.map((error, index) => (
                    <div key={index}>
                      {error.field && (
                        <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                          {error.field}:
                        </div>
                      )}
                      <div className={cn('text-sm', getErrorColor(type as FormError['type']))}>
                        {error.message}
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Action buttons */}
                {(onRetry || onDismiss) && (
                  <div className="flex gap-2 mt-3">
                    {onRetry && type === 'network' && (
                      <UnifiedButton
                        variant="ghost"
                        size="sm"
                        onClick={onRetry}
                        className="text-orange-600 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900/20"
                      >
                        Retry
                      </UnifiedButton>
                    )}
                    
                    {onRetry && type === 'server' && (
                      <UnifiedButton
                        variant="ghost"
                        size="sm"
                        onClick={onRetry}
                        className="text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/20"
                      >
                        Try Again
                      </UnifiedButton>
                    )}
                    
                    {onDismiss && (
                      <UnifiedButton
                        variant="ghost"
                        size="sm"
                        onClick={onDismiss}
                        className="text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                      >
                        Dismiss
                      </UnifiedButton>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

interface FieldErrorProps {
  error?: string
  className?: string
}

/**
 * FieldError - Individual field error display
 */
export function FieldError({ error, className }: FieldErrorProps) {
  if (!error) return null

  return (
    <div className={cn('flex items-center gap-2 mt-1', className)}>
      <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
      <span className="text-sm text-red-600 dark:text-red-400">
        {error}
      </span>
    </div>
  )
}

interface FormSuccessProps {
  message: string
  className?: string
  onDismiss?: () => void
}

/**
 * FormSuccess - Success message display
 */
export function FormSuccess({ message, className, onDismiss }: FormSuccessProps) {
  return (
    <div className={cn(
      'p-4 rounded-2xl border backdrop-blur-md',
      'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
      className
    )}>
      <div className="flex items-start gap-3">
        <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
        
        <div className="flex-1">
          <div className="text-sm text-green-700 dark:text-green-300">
            {message}
          </div>
          
          {onDismiss && (
            <UnifiedButton
              variant="ghost"
              size="sm"
              onClick={onDismiss}
              className="mt-2 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/20"
            >
              Dismiss
            </UnifiedButton>
          )}
        </div>
      </div>
    </div>
  )
}

interface FormInfoProps {
  message: string
  className?: string
  onDismiss?: () => void
}

/**
 * FormInfo - Information message display
 */
export function FormInfo({ message, className, onDismiss }: FormInfoProps) {
  return (
    <div className={cn(
      'p-4 rounded-2xl border backdrop-blur-md',
      'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
      className
    )}>
      <div className="flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
        
        <div className="flex-1">
          <div className="text-sm text-blue-700 dark:text-blue-300">
            {message}
          </div>
          
          {onDismiss && (
            <UnifiedButton
              variant="ghost"
              size="sm"
              onClick={onDismiss}
              className="mt-2 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/20"
            >
              Dismiss
            </UnifiedButton>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * Form validation utilities
 */
export function createFormError(
  field: string,
  message: string,
  type: FormError['type'] = 'validation'
): FormError {
  return { field, message, type }
}

export function createServerError(message: string): FormError {
  return { message, type: 'server' }
}

export function createNetworkError(message: string = 'Network connection failed. Please check your internet connection and try again.'): FormError {
  return { message, type: 'network' }
}

export function createAuthError(message: string = 'Authentication required. Please sign in and try again.'): FormError {
  return { message, type: 'auth' }
}

/**
 * Form error hook for managing form errors
 */
export function useFormErrors() {
  const [errors, setErrors] = useState<FormError[]>([])

  const addError = (error: FormError) => {
    setErrors(prev => [...prev, error])
  }

  const removeError = (index: number) => {
    setErrors(prev => prev.filter((_, i) => i !== index))
  }

  const clearErrors = () => {
    setErrors([])
  }

  const clearFieldErrors = (field: string) => {
    setErrors(prev => prev.filter(error => error.field !== field))
  }

  const hasErrors = errors.length > 0
  const hasFieldError = (field: string) => errors.some(error => error.field === field)
  const getFieldError = (field: string) => errors.find(error => error.field === field)?.message

  return {
    errors,
    addError,
    removeError,
    clearErrors,
    clearFieldErrors,
    hasErrors,
    hasFieldError,
    getFieldError,
    setErrors
  }
}

// Import useState for the hook
import { useState } from 'react'
