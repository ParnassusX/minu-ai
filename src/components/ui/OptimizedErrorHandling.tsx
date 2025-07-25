'use client'

import { Component, ReactNode, ErrorInfo } from 'react'
import { AlertTriangle, RefreshCw, Bug, Home, Wifi, CreditCard, Clock, Shield } from 'lucide-react'
import { cn } from '@/lib/utils'
import { UnifiedButton } from './UnifiedButton'
import { UnifiedCard } from './UnifiedCard'
import '@/styles/unified-design-system.css'

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
  errorInfo?: ErrorInfo
  retryCount: number
}

interface OptimizedErrorBoundaryProps {
  children: ReactNode
  fallback?: React.ComponentType<{ error: Error; retry: () => void; errorInfo?: ErrorInfo }>
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  maxRetries?: number
  showDetails?: boolean
  className?: string
}

/**
 * OptimizedErrorBoundary - Comprehensive error boundary with unified design
 * 
 * Features:
 * - Integrates with unified design system
 * - Glassmorphism error displays
 * - Retry functionality with limits
 * - Detailed error information
 * - Different error types with appropriate messaging
 * - Responsive design
 */
export class OptimizedErrorBoundary extends Component<OptimizedErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: OptimizedErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      retryCount: 0
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('OptimizedErrorBoundary caught an error:', error, errorInfo)
    
    this.setState({
      error,
      errorInfo
    })

    // Call optional error handler
    this.props.onError?.(error, errorInfo)

    // Report to error tracking service in production
    if (process.env.NODE_ENV === 'production') {
      // TODO: Integrate with error tracking service (Sentry, etc.)
      console.error('Production error:', { error, errorInfo })
    }
  }

  handleRetry = () => {
    const maxRetries = this.props.maxRetries || 3
    
    if (this.state.retryCount < maxRetries) {
      this.setState(prevState => ({
        hasError: false,
        error: undefined,
        errorInfo: undefined,
        retryCount: prevState.retryCount + 1
      }))
    }
  }

  handleGoHome = () => {
    window.location.href = '/'
  }

  render() {
    if (this.state.hasError) {
      const { fallback: Fallback, maxRetries = 3, showDetails = false } = this.props
      
      if (Fallback) {
        return (
          <Fallback 
            error={this.state.error!} 
            retry={this.handleRetry}
            errorInfo={this.state.errorInfo}
          />
        )
      }

      return (
        <div className={cn('p-6', this.props.className)}>
          <ErrorDisplay
            error={this.state.error!}
            errorInfo={this.state.errorInfo}
            retryCount={this.state.retryCount}
            maxRetries={maxRetries}
            showDetails={showDetails}
            onRetry={this.handleRetry}
            onGoHome={this.handleGoHome}
          />
        </div>
      )
    }

    return this.props.children
  }
}

/**
 * Error Display Component with unified styling
 */
interface ErrorDisplayProps {
  error: Error
  errorInfo?: ErrorInfo
  retryCount: number
  maxRetries: number
  showDetails: boolean
  onRetry: () => void
  onGoHome: () => void
}

function ErrorDisplay({
  error,
  errorInfo,
  retryCount,
  maxRetries,
  showDetails,
  onRetry,
  onGoHome
}: ErrorDisplayProps) {
  const errorType = getErrorType(error)
  const config = getErrorConfig(errorType)

  return (
    <UnifiedCard className="max-w-2xl mx-auto text-center">
      <div className="space-y-6">
        {/* Error Icon */}
        <div className="flex justify-center">
          <div className={cn(
            'p-4 rounded-full',
            `bg-gradient-to-br ${config.bgColor} dark:${config.darkBgColor}`,
            'border border-red-200 dark:border-red-800'
          )}>
            <config.icon className={cn(
              'h-8 w-8',
              `text-${config.color}-600 dark:text-${config.color}-400`
            )} />
          </div>
        </div>

        {/* Error Message */}
        <div className="space-y-2">
          <h3 className="unified-heading-2 text-gray-900 dark:text-white">
            {config.title}
          </h3>
          <p className="unified-body text-gray-600 dark:text-gray-400">
            {config.message}
          </p>
        </div>

        {/* Error Details (Development/Debug) */}
        {showDetails && (
          <details className="text-left">
            <summary className="unified-caption text-gray-500 cursor-pointer hover:text-gray-700 dark:hover:text-gray-300">
              Technical Details
            </summary>
            <div className="mt-3 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
              <div className="space-y-2">
                <div>
                  <strong className="unified-caption font-medium">Error:</strong>
                  <p className="unified-caption font-mono text-red-600 dark:text-red-400">
                    {error.message}
                  </p>
                </div>
                {error.stack && (
                  <div>
                    <strong className="unified-caption font-medium">Stack Trace:</strong>
                    <pre className="unified-caption font-mono text-gray-600 dark:text-gray-400 whitespace-pre-wrap overflow-x-auto">
                      {error.stack}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </details>
        )}

        {/* Retry Information */}
        {retryCount > 0 && (
          <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <p className="unified-caption text-yellow-800 dark:text-yellow-200">
              Retry attempt {retryCount} of {maxRetries}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {retryCount < maxRetries && (
            <UnifiedButton
              variant="primary"
              onClick={onRetry}
              icon={<RefreshCw className="w-4 h-4" />}
            >
              Try Again
            </UnifiedButton>
          )}
          
          <UnifiedButton
            variant="secondary"
            onClick={onGoHome}
            icon={<Home className="w-4 h-4" />}
          >
            Go Home
          </UnifiedButton>
        </div>

        {/* Help Text */}
        <p className="unified-caption text-gray-500 dark:text-gray-400">
          {config.helpText}
        </p>
      </div>
    </UnifiedCard>
  )
}

/**
 * Error Type Detection
 */
type ErrorType = 'network' | 'api' | 'auth' | 'payment' | 'timeout' | 'validation' | 'generic'

function getErrorType(error: Error): ErrorType {
  const message = error.message.toLowerCase()
  
  if (message.includes('network') || message.includes('fetch')) {
    return 'network'
  }
  
  if (message.includes('unauthorized') || message.includes('forbidden')) {
    return 'auth'
  }
  
  if (message.includes('payment') || message.includes('insufficient funds')) {
    return 'payment'
  }
  
  if (message.includes('timeout') || message.includes('aborted')) {
    return 'timeout'
  }
  
  if (message.includes('validation') || message.includes('invalid')) {
    return 'validation'
  }
  
  if (message.includes('api') || message.includes('server')) {
    return 'api'
  }
  
  return 'generic'
}

/**
 * Error Configuration
 */
function getErrorConfig(type: ErrorType) {
  switch (type) {
    case 'network':
      return {
        icon: Wifi,
        color: 'blue',
        bgColor: 'from-blue-50 to-blue-100',
        darkBgColor: 'from-blue-900/20 to-blue-800/20',
        title: 'Connection Problem',
        message: 'Unable to connect to our servers. Please check your internet connection.',
        helpText: 'If the problem persists, please try again in a few minutes.'
      }
    
    case 'auth':
      return {
        icon: Shield,
        color: 'yellow',
        bgColor: 'from-yellow-50 to-yellow-100',
        darkBgColor: 'from-yellow-900/20 to-yellow-800/20',
        title: 'Authentication Required',
        message: 'You need to be signed in to access this feature.',
        helpText: 'Please sign in to your account and try again.'
      }
    
    case 'payment':
      return {
        icon: CreditCard,
        color: 'purple',
        bgColor: 'from-purple-50 to-purple-100',
        darkBgColor: 'from-purple-900/20 to-purple-800/20',
        title: 'Payment Issue',
        message: 'There was a problem processing your request due to insufficient funds.',
        helpText: 'Please check your account balance or payment method.'
      }
    
    case 'timeout':
      return {
        icon: Clock,
        color: 'orange',
        bgColor: 'from-orange-50 to-orange-100',
        darkBgColor: 'from-orange-900/20 to-orange-800/20',
        title: 'Request Timeout',
        message: 'The request took too long to complete.',
        helpText: 'This usually happens with complex operations. Please try again.'
      }
    
    case 'validation':
      return {
        icon: AlertTriangle,
        color: 'yellow',
        bgColor: 'from-yellow-50 to-yellow-100',
        darkBgColor: 'from-yellow-900/20 to-yellow-800/20',
        title: 'Invalid Input',
        message: 'Please check your input and try again.',
        helpText: 'Make sure all required fields are filled correctly.'
      }
    
    case 'api':
      return {
        icon: Bug,
        color: 'red',
        bgColor: 'from-red-50 to-red-100',
        darkBgColor: 'from-red-900/20 to-red-800/20',
        title: 'Server Error',
        message: 'Our servers are experiencing issues. Please try again later.',
        helpText: 'If this continues, please contact support.'
      }
    
    default:
      return {
        icon: AlertTriangle,
        color: 'red',
        bgColor: 'from-red-50 to-red-100',
        darkBgColor: 'from-red-900/20 to-red-800/20',
        title: 'Something went wrong',
        message: 'An unexpected error occurred. Please try again.',
        helpText: 'If the problem persists, please refresh the page or contact support.'
      }
  }
}

/**
 * Specialized Error Components
 */

interface ApiErrorProps {
  error: Error
  onRetry?: () => void
  className?: string
}

export const ApiError = ({ error, onRetry, className }: ApiErrorProps) => (
  <div className={cn('p-4', className)}>
    <ErrorDisplay
      error={error}
      retryCount={0}
      maxRetries={3}
      showDetails={process.env.NODE_ENV === 'development'}
      onRetry={onRetry || (() => window.location.reload())}
      onGoHome={() => window.location.href = '/'}
    />
  </div>
)

interface NetworkErrorProps {
  onRetry?: () => void
  className?: string
}

export const NetworkError = ({ onRetry, className }: NetworkErrorProps) => (
  <ApiError
    error={new Error('Network connection failed')}
    onRetry={onRetry}
    className={className}
  />
)

interface GenerationErrorProps {
  error: Error
  onRetry?: () => void
  onGoBack?: () => void
  className?: string
}

export const GenerationError = ({ error, onRetry, onGoBack, className }: GenerationErrorProps) => (
  <UnifiedCard className={cn('max-w-md mx-auto text-center', className)}>
    <div className="space-y-4">
      <div className="flex justify-center">
        <div className="p-3 rounded-full bg-red-100 dark:bg-red-900/20">
          <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
        </div>
      </div>
      
      <div className="space-y-2">
        <h3 className="unified-heading-3 text-gray-900 dark:text-white">
          Generation Failed
        </h3>
        <p className="unified-body text-gray-600 dark:text-gray-400">
          {error.message || 'Unable to generate image. Please try again.'}
        </p>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-2">
        {onRetry && (
          <UnifiedButton
            variant="primary"
            onClick={onRetry}
            size="sm"
            icon={<RefreshCw className="w-4 h-4" />}
          >
            Try Again
          </UnifiedButton>
        )}
        
        {onGoBack && (
          <UnifiedButton
            variant="secondary"
            onClick={onGoBack}
            size="sm"
          >
            Go Back
          </UnifiedButton>
        )}
      </div>
    </div>
  </UnifiedCard>
)

/**
 * Error Hook for functional components
 */
export function useErrorHandler() {
  return {
    handleError: (error: Error, context?: string) => {
      console.error(`Error in ${context || 'component'}:`, error)
      
      // Could integrate with error reporting service here
      if (process.env.NODE_ENV === 'production') {
        // TODO: Send to error tracking service
      }
    },
    
    createErrorBoundary: (fallback?: React.ComponentType<any>) => {
      return ({ children }: { children: ReactNode }) => (
        <OptimizedErrorBoundary fallback={fallback}>
          {children}
        </OptimizedErrorBoundary>
      )
    }
  }
}
