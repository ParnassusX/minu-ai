/**
 * API Module Index - Minu.AI API Integration
 * Central export point for all API functionality
 */

// Type exports
export type {
  APIResponse,
  APIError,
  ReplicatePrediction,
  ReplicateCreatePredictionRequest,
  GeminiGenerateRequest,
  GeminiGenerateResponse,
  GenerationRequest,
  GenerationResult,
  GenerationSettings,
  APIState,
  APIActions,
  APIStore,
  GenerationMode,
  GenerationStatus,
  ImageGenerationInput,
  VideoGenerationInput,
  ImageEnhanceInput,
  APIClientConfig,
  ReplicateClientConfig,
  GeminiClientConfig,
  APIClientError
} from './types'

// Error class exports
export {
  ReplicateAPIError,
  GeminiAPIError
} from './types'

// Client exports
export {
  ReplicateClient,
  getReplicateClient,
  initializeReplicateClient
} from './replicate'

export {
  GeminiClient,
  getGeminiClient,
  initializeGeminiClient
} from './gemini'

// Store exports
export {
  useAPIStore
} from '@/lib/stores/apiStore'

// Service layer exports
export {
  createGenerationRequest,
  generateContent,
  enhancePrompt,
  validateAPIConfiguration,
  getModelVersion,
  downloadImageAsJPEG,
  getGenerationStats,
  clearAllGenerationData,
  exportGenerationHistory,
  estimateGenerationCost,
  useAPIState,
  usePromptEnhancement,
  useAPIActions
} from './service'

// Configuration exports
export {
  API_KEYS,
  API_ENDPOINTS,
  API_TIMEOUTS,
  API_RETRY_CONFIG,
  RATE_LIMITS,
  DEFAULT_GENERATION_SETTINGS,
  MODEL_VERSIONS,
  QUALITY_SETTINGS,
  FEATURE_FLAGS,
  DEBUG_CONFIG,
  ENVIRONMENT,
  API_CONFIG,
  validateAPIKey,
  isAPIKeyConfigured
} from './config'

// Error messages
export const API_ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error occurred',
  TIMEOUT_ERROR: 'Request timed out',
  UNKNOWN_ERROR: 'An unknown error occurred'
} as const

// Constants
export {
  API_ENDPOINTS as ENDPOINTS,
  API_TIMEOUTS as TIMEOUTS,
  API_RETRY_CONFIG as RETRY_CONFIG
} from './types'

// Utility functions
export const API_UTILS = {
  /**
   * Check if an error is a network error
   */
  isNetworkError: (error: any): boolean => {
    return error instanceof TypeError && error.message.includes('fetch')
  },

  /**
   * Check if an error is a timeout error
   */
  isTimeoutError: (error: any): boolean => {
    return error instanceof Error && error.name === 'AbortError'
  },

  /**
   * Check if an error is a rate limit error
   */
  isRateLimitError: (error: any): boolean => {
    return error && error.status === 429
  },

  /**
   * Check if an error is an authentication error
   */
  isAuthError: (error: any): boolean => {
    return error && (error.status === 401 || error.status === 403)
  },

  /**
   * Get user-friendly error message
   */
  getErrorMessage: (error: any): string => {
    if (error && error.message) {
      return error.message
    }
    
    if (API_UTILS.isNetworkError(error)) {
      return API_ERROR_MESSAGES.NETWORK_ERROR
    }
    
    if (API_UTILS.isTimeoutError(error)) {
      return API_ERROR_MESSAGES.TIMEOUT_ERROR
    }
    
    return API_ERROR_MESSAGES.UNKNOWN_ERROR
  },

  /**
   * Format generation time
   */
  formatGenerationTime: (seconds: number): string => {
    if (seconds < 60) {
      return `${Math.round(seconds)}s`
    }
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.round(seconds % 60)
    return `${minutes}m ${remainingSeconds}s`
  },

  /**
   * Format file size
   */
  formatFileSize: (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  },

  /**
   * Generate unique request ID
   */
  generateRequestId: (): string => {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  },

  /**
   * Validate generation settings
   */
  validateGenerationSettings: (settings: Partial<any>): string[] => {
    const errors: string[] = []
    
    if (settings.numImages && (settings.numImages < 1 || settings.numImages > 4)) {
      errors.push('Number of images must be between 1 and 4')
    }
    
    if (settings.guidanceScale && (settings.guidanceScale < 1 || settings.guidanceScale > 20)) {
      errors.push('Guidance scale must be between 1 and 20')
    }
    
    if (settings.inferenceSteps && (settings.inferenceSteps < 1 || settings.inferenceSteps > 100)) {
      errors.push('Inference steps must be between 1 and 100')
    }
    
    if (settings.strength && (settings.strength < 0 || settings.strength > 1)) {
      errors.push('Strength must be between 0 and 1')
    }
    
    return errors
  }
} as const

// Re-export commonly used items for convenience
// API_ERROR_MESSAGES already exported above from config
