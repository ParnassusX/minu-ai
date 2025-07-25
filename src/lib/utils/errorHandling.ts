/**
 * Comprehensive error handling utilities for production readiness
 */

export interface ErrorInfo {
  message: string
  code?: string
  statusCode?: number
  retryable?: boolean
  userMessage?: string
  technicalDetails?: string
}

export interface RetryConfig {
  maxRetries: number
  baseDelay: number
  maxDelay: number
  backoffMultiplier: number
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2
}

/**
 * Parse and categorize API errors
 */
export function parseApiError(error: any): ErrorInfo {
  // Handle fetch errors
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return {
      message: 'Network connection failed',
      code: 'NETWORK_ERROR',
      retryable: true,
      userMessage: 'Unable to connect to the server. Please check your internet connection and try again.',
      technicalDetails: error.message
    }
  }

  // Handle Response errors
  if (error instanceof Response) {
    const statusCode = error.status
    
    switch (statusCode) {
      case 400:
        return {
          message: 'Invalid request parameters',
          code: 'BAD_REQUEST',
          statusCode,
          retryable: false,
          userMessage: 'There was an issue with your request. Please check your inputs and try again.',
          technicalDetails: `HTTP ${statusCode}: Bad Request`
        }
      
      case 401:
        return {
          message: 'Authentication required',
          code: 'UNAUTHORIZED',
          statusCode,
          retryable: false,
          userMessage: 'Please log in to continue.',
          technicalDetails: `HTTP ${statusCode}: Unauthorized`
        }
      
      case 402:
        return {
          message: 'Insufficient funds',
          code: 'PAYMENT_REQUIRED',
          statusCode,
          retryable: false,
          userMessage: 'Insufficient credits. Please add funds to your account.',
          technicalDetails: `HTTP ${statusCode}: Payment Required`
        }
      
      case 422:
        return {
          message: 'Invalid model parameters',
          code: 'VALIDATION_ERROR',
          statusCode,
          retryable: false,
          userMessage: 'Invalid parameters for the selected model. Please adjust your settings.',
          technicalDetails: `HTTP ${statusCode}: Unprocessable Entity`
        }
      
      case 429:
        return {
          message: 'Rate limit exceeded',
          code: 'RATE_LIMITED',
          statusCode,
          retryable: true,
          userMessage: 'Too many requests. Please wait a moment and try again.',
          technicalDetails: `HTTP ${statusCode}: Too Many Requests`
        }
      
      case 500:
        return {
          message: 'Server error',
          code: 'SERVER_ERROR',
          statusCode,
          retryable: true,
          userMessage: 'Server error occurred. Please try again in a few moments.',
          technicalDetails: `HTTP ${statusCode}: Internal Server Error`
        }
      
      case 503:
        return {
          message: 'Service unavailable',
          code: 'SERVICE_UNAVAILABLE',
          statusCode,
          retryable: true,
          userMessage: 'Service is temporarily unavailable. Please try again later.',
          technicalDetails: `HTTP ${statusCode}: Service Unavailable`
        }
      
      default:
        return {
          message: `HTTP error ${statusCode}`,
          code: 'HTTP_ERROR',
          statusCode,
          retryable: statusCode >= 500,
          userMessage: 'An unexpected error occurred. Please try again.',
          technicalDetails: `HTTP ${statusCode}: ${error.statusText || 'Unknown error'}`
        }
    }
  }

  // Handle Error objects
  if (error instanceof Error) {
    // Check for specific error patterns
    if (error.message.includes('API token')) {
      return {
        message: 'API configuration error',
        code: 'API_CONFIG_ERROR',
        retryable: false,
        userMessage: 'Service configuration error. Please contact support.',
        technicalDetails: error.message
      }
    }
    
    if (error.message.includes('rate limit')) {
      return {
        message: 'Rate limit exceeded',
        code: 'RATE_LIMITED',
        retryable: true,
        userMessage: 'Too many requests. Please wait a moment and try again.',
        technicalDetails: error.message
      }
    }
    
    if (error.message.includes('insufficient funds')) {
      return {
        message: 'Insufficient funds',
        code: 'PAYMENT_REQUIRED',
        retryable: false,
        userMessage: 'Insufficient credits. Please add funds to your account.',
        technicalDetails: error.message
      }
    }
    
    return {
      message: error.message,
      code: 'UNKNOWN_ERROR',
      retryable: false,
      userMessage: 'An unexpected error occurred. Please try again.',
      technicalDetails: error.message
    }
  }

  // Handle string errors
  if (typeof error === 'string') {
    return {
      message: error,
      code: 'STRING_ERROR',
      retryable: false,
      userMessage: error,
      technicalDetails: error
    }
  }

  // Handle unknown errors
  return {
    message: 'Unknown error occurred',
    code: 'UNKNOWN_ERROR',
    retryable: false,
    userMessage: 'An unexpected error occurred. Please try again.',
    technicalDetails: String(error)
  }
}

/**
 * Retry function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const { maxRetries, baseDelay, maxDelay, backoffMultiplier } = { ...DEFAULT_RETRY_CONFIG, ...config }
  
  let lastError: any
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      
      const errorInfo = parseApiError(error)
      
      // Don't retry if error is not retryable
      if (!errorInfo.retryable || attempt === maxRetries) {
        throw error
      }
      
      // Calculate delay with exponential backoff
      const delay = Math.min(baseDelay * Math.pow(backoffMultiplier, attempt), maxDelay)
      
      console.warn(`Attempt ${attempt + 1} failed, retrying in ${delay}ms:`, errorInfo.message)
      
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  
  throw lastError
}

/**
 * Safe async function wrapper that handles errors gracefully
 */
export async function safeAsync<T>(
  fn: () => Promise<T>,
  fallback?: T
): Promise<{ data?: T; error?: ErrorInfo }> {
  try {
    const data = await fn()
    return { data }
  } catch (error) {
    const errorInfo = parseApiError(error)
    console.error('Safe async error:', errorInfo)
    return { error: errorInfo, data: fallback }
  }
}

/**
 * Log error with context for debugging
 */
export function logError(error: any, context: string, additionalInfo?: Record<string, any>) {
  const errorInfo = parseApiError(error)
  
  console.error(`[${context}] Error:`, {
    ...errorInfo,
    context,
    timestamp: new Date().toISOString(),
    ...additionalInfo
  })
}

/**
 * Create user-friendly error message
 */
export function getUserErrorMessage(error: any): string {
  const errorInfo = parseApiError(error)
  return errorInfo.userMessage || errorInfo.message || 'An unexpected error occurred'
}
