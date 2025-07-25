'use client'

import React from 'react'
import { AlertTriangle, RefreshCw, Bug, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { GlassCard } from '@/components/ui/glass'
import { toastHelpers } from '@/lib/hooks/useToast'

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
  errorInfo?: React.ErrorInfo
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{ error: Error; retry: () => void }>
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo })
    this.props.onError?.(error, errorInfo)

    // Show error toast
    toastHelpers.error('Component Error', error.message)

    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo)
    }
  }

  retry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback
        return <FallbackComponent error={this.state.error!} retry={this.retry} />
      }

      return <DefaultErrorFallback error={this.state.error!} retry={this.retry} />
    }

    return this.props.children
  }
}

interface ErrorFallbackProps {
  error: Error
  retry: () => void
}

function DefaultErrorFallback({ error, retry }: ErrorFallbackProps) {
  const handleReportError = () => {
    toastHelpers.info('Error Reported', 'Thank you for reporting this issue')
  }

  return (
    <GlassCard variant="premium" className="max-w-md mx-auto mt-8 shadow-glass-xl">
      <CardHeader>
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-full bg-red-100 dark:bg-red-900/20">
            <AlertTriangle className="h-5 w-5 text-red-500" />
          </div>
          <div>
            <CardTitle className="text-red-700 dark:text-red-400">Something went wrong</CardTitle>
            <CardDescription className="text-sm opacity-80">
              An unexpected error occurred in this component
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {process.env.NODE_ENV === 'development' && (
          <details className="text-sm">
            <summary className="cursor-pointer text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 flex items-center gap-2">
              <Bug className="h-4 w-4" />
              Error details (development only)
            </summary>
            <pre className="mt-3 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg text-xs overflow-auto border border-gray-200 dark:border-gray-700">
              {error.stack}
            </pre>
          </details>
        )}
        <div className="flex flex-col gap-2">
          <div className="flex space-x-2">
            <Button onClick={retry} size="sm" variant="default">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
            <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
              <Home className="h-4 w-4 mr-2" />
              Refresh Page
            </Button>
          </div>
          <Button variant="ghost" size="sm" onClick={handleReportError} className="text-xs">
            Report this issue
          </Button>
        </div>
      </CardContent>
    </GlassCard>
  )
}

// Hook for handling async errors
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null)

  const handleError = React.useCallback((error: Error | string) => {
    const errorObj = typeof error === 'string' ? new Error(error) : error
    setError(errorObj)
    
    // Log error
    console.error('Async error:', errorObj)
  }, [])

  const clearError = React.useCallback(() => {
    setError(null)
  }, [])

  return { error, handleError, clearError }
}
