/**
 * Storage Error Handling and Validation
 * Comprehensive error handling for storage operations with fallback mechanisms
 */

export enum StorageErrorCode {
  // Network errors
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  CONNECTION_FAILED = 'CONNECTION_FAILED',
  
  // File errors
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  INVALID_FILE_TYPE = 'INVALID_FILE_TYPE',
  CORRUPTED_FILE = 'CORRUPTED_FILE',
  FILE_NOT_FOUND = 'FILE_NOT_FOUND',
  
  // Storage errors
  BUCKET_NOT_FOUND = 'BUCKET_NOT_FOUND',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  STORAGE_QUOTA_EXCEEDED = 'STORAGE_QUOTA_EXCEEDED',
  UPLOAD_FAILED = 'UPLOAD_FAILED',
  
  // Authentication errors
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  UNAUTHORIZED = 'UNAUTHORIZED',
  
  // Configuration errors
  INVALID_CONFIG = 'INVALID_CONFIG',
  MISSING_ENVIRONMENT = 'MISSING_ENVIRONMENT',
  
  // General errors
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR'
}

export interface StorageError {
  code: StorageErrorCode
  message: string
  details?: any
  retryable: boolean
  timestamp: string
  operation: string
}

export interface RetryConfig {
  maxAttempts: number
  baseDelay: number // milliseconds
  maxDelay: number // milliseconds
  backoffMultiplier: number
}

export interface FallbackConfig {
  enableFallback: boolean
  fallbackUrl?: string
  fallbackMessage?: string
}

export class StorageErrorHandler {
  private static readonly DEFAULT_RETRY_CONFIG: RetryConfig = {
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2
  }

  private static readonly DEFAULT_FALLBACK_CONFIG: FallbackConfig = {
    enableFallback: true,
    fallbackMessage: 'Using temporary URL due to storage issues'
  }

  /**
   * Create a standardized storage error
   */
  static createError(
    code: StorageErrorCode,
    message: string,
    operation: string,
    details?: any
  ): StorageError {
    return {
      code,
      message,
      details,
      retryable: this.isRetryable(code),
      timestamp: new Date().toISOString(),
      operation
    }
  }

  /**
   * Determine if an error is retryable
   */
  static isRetryable(code: StorageErrorCode): boolean {
    const retryableCodes = [
      StorageErrorCode.NETWORK_ERROR,
      StorageErrorCode.TIMEOUT_ERROR,
      StorageErrorCode.CONNECTION_FAILED,
      StorageErrorCode.UPLOAD_FAILED
    ]
    return retryableCodes.includes(code)
  }

  /**
   * Parse and categorize errors from different sources
   */
  static parseError(error: any, operation: string): StorageError {
    // Supabase storage errors
    if (error?.error?.message) {
      return this.parseSupabaseError(error.error, operation)
    }

    // Network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return this.createError(
        StorageErrorCode.NETWORK_ERROR,
        'Network connection failed',
        operation,
        error.message
      )
    }

    // Timeout errors
    if (error.name === 'AbortError' || error.message?.includes('timeout')) {
      return this.createError(
        StorageErrorCode.TIMEOUT_ERROR,
        'Operation timed out',
        operation,
        error.message
      )
    }

    // File size errors
    if (error.message?.includes('file size') || error.message?.includes('too large')) {
      return this.createError(
        StorageErrorCode.FILE_TOO_LARGE,
        'File size exceeds maximum allowed',
        operation,
        error.message
      )
    }

    // Generic error
    return this.createError(
      StorageErrorCode.UNKNOWN_ERROR,
      error.message || 'Unknown error occurred',
      operation,
      error
    )
  }

  /**
   * Parse Supabase-specific errors
   */
  private static parseSupabaseError(error: any, operation: string): StorageError {
    const message = error.message || 'Supabase error'

    if (message.includes('not found') || message.includes('does not exist')) {
      return this.createError(
        StorageErrorCode.BUCKET_NOT_FOUND,
        'Storage bucket not found',
        operation,
        error
      )
    }

    if (message.includes('permission') || message.includes('unauthorized')) {
      return this.createError(
        StorageErrorCode.INSUFFICIENT_PERMISSIONS,
        'Insufficient permissions for storage operation',
        operation,
        error
      )
    }

    if (message.includes('quota') || message.includes('limit')) {
      return this.createError(
        StorageErrorCode.STORAGE_QUOTA_EXCEEDED,
        'Storage quota exceeded',
        operation,
        error
      )
    }

    return this.createError(
      StorageErrorCode.UPLOAD_FAILED,
      message,
      operation,
      error
    )
  }

  /**
   * Execute operation with retry logic
   */
  static async withRetry<T>(
    operation: () => Promise<T>,
    operationName: string,
    config: Partial<RetryConfig> = {}
  ): Promise<T> {
    const retryConfig = { ...this.DEFAULT_RETRY_CONFIG, ...config }
    let lastError: StorageError | null = null

    for (let attempt = 1; attempt <= retryConfig.maxAttempts; attempt++) {
      try {
        return await operation()
      } catch (error) {
        lastError = this.parseError(error, operationName)
        
        // Don't retry if error is not retryable or this is the last attempt
        if (!lastError.retryable || attempt === retryConfig.maxAttempts) {
          break
        }

        // Calculate delay with exponential backoff
        const delay = Math.min(
          retryConfig.baseDelay * Math.pow(retryConfig.backoffMultiplier, attempt - 1),
          retryConfig.maxDelay
        )

        console.warn(`Storage operation failed (attempt ${attempt}/${retryConfig.maxAttempts}):`, lastError)
        console.warn(`Retrying in ${delay}ms...`)

        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }

    throw lastError
  }

  /**
   * Execute operation with fallback
   */
  static async withFallback<T>(
    primaryOperation: () => Promise<T>,
    fallbackOperation: () => Promise<T>,
    operationName: string,
    config: Partial<FallbackConfig> = {}
  ): Promise<T> {
    const fallbackConfig = { ...this.DEFAULT_FALLBACK_CONFIG, ...config }

    try {
      return await primaryOperation()
    } catch (error) {
      const storageError = this.parseError(error, operationName)
      console.error('Primary storage operation failed:', storageError)

      if (fallbackConfig.enableFallback) {
        console.warn('Attempting fallback operation...')
        try {
          const result = await fallbackOperation()
          console.warn(fallbackConfig.fallbackMessage || 'Using fallback result')
          return result
        } catch (fallbackError) {
          console.error('Fallback operation also failed:', fallbackError)
          throw storageError // Throw original error
        }
      }

      throw storageError
    }
  }

  /**
   * Validate file before upload
   */
  static validateFile(
    file: ArrayBuffer | File,
    allowedTypes: string[],
    maxSize: number,
    filename?: string
  ): { valid: boolean; error?: StorageError } {
    const size = file instanceof File ? file.size : file.byteLength
    const type = file instanceof File ? file.type : 'application/octet-stream'
    const name = filename || (file instanceof File ? file.name : 'unknown')

    // Check file size
    if (size > maxSize) {
      return {
        valid: false,
        error: this.createError(
          StorageErrorCode.FILE_TOO_LARGE,
          `File size ${size} bytes exceeds maximum ${maxSize} bytes`,
          'file-validation',
          { size, maxSize, filename: name }
        )
      }
    }

    // Check file type
    if (!allowedTypes.includes(type)) {
      return {
        valid: false,
        error: this.createError(
          StorageErrorCode.INVALID_FILE_TYPE,
          `File type ${type} is not allowed`,
          'file-validation',
          { type, allowedTypes, filename: name }
        )
      }
    }

    // Check for empty file
    if (size === 0) {
      return {
        valid: false,
        error: this.createError(
          StorageErrorCode.CORRUPTED_FILE,
          'File is empty or corrupted',
          'file-validation',
          { size, filename: name }
        )
      }
    }

    return { valid: true }
  }

  /**
   * Validate URL before download
   */
  static validateUrl(url: string): { valid: boolean; error?: StorageError } {
    try {
      const parsedUrl = new URL(url)
      
      // Check protocol
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        return {
          valid: false,
          error: this.createError(
            StorageErrorCode.VALIDATION_ERROR,
            'Invalid URL protocol. Only HTTP/HTTPS are supported.',
            'url-validation',
            { url, protocol: parsedUrl.protocol }
          )
        }
      }

      // Check for trusted domains (Replicate)
      const trustedDomains = [
        'replicate.delivery',
        'pbxt.replicate.delivery',
        'tjzk.replicate.delivery'
      ]

      const isTrusted = trustedDomains.some(domain => 
        parsedUrl.hostname === domain || parsedUrl.hostname.endsWith(`.${domain}`)
      )

      if (!isTrusted) {
        return {
          valid: false,
          error: this.createError(
            StorageErrorCode.VALIDATION_ERROR,
            'URL is not from a trusted domain',
            'url-validation',
            { url, hostname: parsedUrl.hostname, trustedDomains }
          )
        }
      }

      return { valid: true }
    } catch (error) {
      return {
        valid: false,
        error: this.createError(
          StorageErrorCode.VALIDATION_ERROR,
          'Invalid URL format',
          'url-validation',
          { url, error: error instanceof Error ? error.message : 'Unknown error' }
        )
      }
    }
  }

  /**
   * Log error for monitoring
   */
  static logError(error: StorageError, context?: any): void {
    const logData = {
      ...error,
      context,
      environment: process.env.NODE_ENV,
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server'
    }

    // In production, you might want to send this to a monitoring service
    if (process.env.NODE_ENV === 'production') {
      console.error('Storage Error:', JSON.stringify(logData, null, 2))
      // TODO: Send to monitoring service (e.g., Sentry, LogRocket)
    } else {
      console.error('Storage Error:', logData)
    }
  }

  /**
   * Get user-friendly error message
   */
  static getUserMessage(error: StorageError): string {
    const userMessages: Record<StorageErrorCode, string> = {
      [StorageErrorCode.NETWORK_ERROR]: 'Network connection failed. Please check your internet connection and try again.',
      [StorageErrorCode.TIMEOUT_ERROR]: 'The operation timed out. Please try again.',
      [StorageErrorCode.FILE_TOO_LARGE]: 'The file is too large. Please choose a smaller file.',
      [StorageErrorCode.INVALID_FILE_TYPE]: 'This file type is not supported. Please choose a different file.',
      [StorageErrorCode.CORRUPTED_FILE]: 'The file appears to be corrupted. Please try a different file.',
      [StorageErrorCode.STORAGE_QUOTA_EXCEEDED]: 'Storage quota exceeded. Please contact support.',
      [StorageErrorCode.INSUFFICIENT_PERMISSIONS]: 'You don\'t have permission to perform this action.',
      [StorageErrorCode.UPLOAD_FAILED]: 'Upload failed. Please try again.',
      [StorageErrorCode.UNKNOWN_ERROR]: 'An unexpected error occurred. Please try again.',
      [StorageErrorCode.CONNECTION_FAILED]: 'Connection failed. Please check your internet connection.',
      [StorageErrorCode.FILE_NOT_FOUND]: 'File not found.',
      [StorageErrorCode.BUCKET_NOT_FOUND]: 'Storage location not found. Please contact support.',
      [StorageErrorCode.INVALID_CREDENTIALS]: 'Authentication failed. Please refresh the page.',
      [StorageErrorCode.TOKEN_EXPIRED]: 'Session expired. Please refresh the page.',
      [StorageErrorCode.UNAUTHORIZED]: 'You are not authorized to perform this action.',
      [StorageErrorCode.INVALID_CONFIG]: 'Configuration error. Please contact support.',
      [StorageErrorCode.MISSING_ENVIRONMENT]: 'Environment configuration missing. Please contact support.',
      [StorageErrorCode.VALIDATION_ERROR]: 'Validation failed. Please check your input.'
    }

    return userMessages[error.code] || error.message
  }
}

export default StorageErrorHandler
