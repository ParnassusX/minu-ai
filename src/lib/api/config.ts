/**
 * API Configuration for Minu.AI
 * Centralized configuration for all API clients and settings
 */

// API Keys (environment variables only - no hardcoded fallbacks for security)
export const API_KEYS = {
  REPLICATE: process.env.NEXT_PUBLIC_REPLICATE_API_TOKEN || process.env.REPLICATE_API_TOKEN,
  GEMINI: process.env.GEMINI_API_KEY,
  CLOUDINARY: process.env.CLOUDINARY_API_KEY
} as const

// API Endpoints
export const API_ENDPOINTS = {
  REPLICATE: {
    BASE_URL: 'https://api.replicate.com/v1',
    PREDICTIONS: '/predictions',
    MODELS: '/models',
    ACCOUNT: '/account'
  },
  GEMINI: {
    BASE_URL: 'https://generativelanguage.googleapis.com/v1beta',
    GENERATE: '/models/gemini-pro:generateContent'
  },
  CLOUDINARY: {
    BASE_URL: 'https://api.cloudinary.com/v1_1',
    UPLOAD: '/image/upload',
    ADMIN: '/resources'
  }
} as const

// Timeout configurations
export const API_TIMEOUTS = {
  DEFAULT: 30000, // 30 seconds
  GENERATION: 300000, // 5 minutes
  ENHANCEMENT: 10000, // 10 seconds
  UPLOAD: 60000 // 1 minute
} as const

// Retry configurations
export const API_RETRY_CONFIG = {
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000,
  BACKOFF_MULTIPLIER: 2,
  RETRY_STATUS_CODES: [408, 429, 500, 502, 503, 504]
} as const

// Rate limiting
export const RATE_LIMITS = {
  REPLICATE: {
    REQUESTS_PER_MINUTE: 60,
    CONCURRENT_PREDICTIONS: 5
  },
  GEMINI: {
    REQUESTS_PER_MINUTE: 60,
    REQUESTS_PER_DAY: 1500
  }
} as const

// Generation settings defaults
export const DEFAULT_GENERATION_SETTINGS = {
  images: {
    aspectRatio: '1:1',
    numImages: 1,
    guidanceScale: 3.5,
    inferenceSteps: 28
  },
  edit: {
    aspectRatio: '1:1',
    numImages: 1,
    guidanceScale: 3.5,
    inferenceSteps: 28,
    strength: 0.8
  },
  enhance: {
    upscaleFactor: 4,
    faceEnhance: true
  }
} as const

// Model version mappings (to be updated with actual versions)
export const MODEL_VERSIONS = {
  // Image Generation Models
  'ideogram-v2': 'ideogram-ai/ideogram-v2:...',
  'flux-schnell': 'black-forest-labs/flux-schnell:...',
  'flux-dev': 'black-forest-labs/flux-dev:...',
  'flux-pro': 'black-forest-labs/flux-pro:...',
  'flux-pro-ultra': 'black-forest-labs/flux-1.1-pro-ultra:...',
  
  // Edit Models
  'flux-kontext-dev': 'black-forest-labs/flux-kontext-dev:...',
  'flux-kontext-pro': 'black-forest-labs/flux-kontext-pro:...',
  'flux-kontext-max': 'black-forest-labs/flux-kontext-max:...',
  'flux-multi-image': 'black-forest-labs/flux-multi-image-kontext-pro:...',
  
  // Enhancement Models
  'real-esrgan': 'nightmareai/real-esrgan:...',
  'esrgan': 'xinntao/esrgan:...',
  'swinir': 'jingyunliang/swinir:...'
} as const

// Quality settings for different output types
export const QUALITY_SETTINGS = {
  PREVIEW: {
    format: 'webp',
    quality: 80,
    maxWidth: 512,
    maxHeight: 512
  },
  STANDARD: {
    format: 'jpeg',
    quality: 90,
    maxWidth: 1024,
    maxHeight: 1024
  },
  HIGH: {
    format: 'jpeg',
    quality: 95,
    maxWidth: 2048,
    maxHeight: 2048
  },
  LUXURY: {
    format: 'jpeg',
    quality: 100,
    maxWidth: 4096,
    maxHeight: 4096
  }
} as const

// Error messages
export const API_ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network connection failed. Please check your internet connection.',
  TIMEOUT_ERROR: 'Request timed out. Please try again.',
  RATE_LIMIT_ERROR: 'Rate limit exceeded. Please wait before making another request.',
  INVALID_API_KEY: 'Invalid API key. Please check your configuration.',
  INSUFFICIENT_CREDITS: 'Insufficient credits. Please check your account balance.',
  MODEL_NOT_FOUND: 'The requested model is not available.',
  INVALID_INPUT: 'Invalid input parameters provided.',
  GENERATION_FAILED: 'Generation failed. Please try again with different settings.',
  UNKNOWN_ERROR: 'An unexpected error occurred. Please try again.'
} as const

// Feature flags
export const FEATURE_FLAGS = {
  PROMPT_ENHANCEMENT: true,
  BATCH_GENERATION: false,
  REAL_TIME_PREVIEW: false,
  ADVANCED_SETTINGS: true,
  GENERATION_HISTORY: true,
  COST_ESTIMATION: false
} as const

// Development/Debug settings
export const DEBUG_CONFIG = {
  LOG_API_REQUESTS: process.env.NODE_ENV === 'development',
  LOG_API_RESPONSES: process.env.NODE_ENV === 'development',
  MOCK_API_RESPONSES: false,
  ENABLE_API_METRICS: true
} as const

// Validation functions
export function validateAPIKey(key: string, service: 'replicate' | 'gemini'): boolean {
  if (!key || typeof key !== 'string') return false
  
  switch (service) {
    case 'replicate':
      return key.startsWith('r8_') && key.length > 10
    case 'gemini':
      return key.startsWith('AIza') && key.length > 20
    default:
      return false
  }
}

export function isAPIKeyConfigured(service: 'replicate' | 'gemini'): boolean {
  switch (service) {
    case 'replicate':
      return validateAPIKey(API_KEYS.REPLICATE, 'replicate')
    case 'gemini':
      return validateAPIKey(API_KEYS.GEMINI, 'gemini')
    default:
      return false
  }
}

// Environment detection
export const ENVIRONMENT = {
  IS_DEVELOPMENT: process.env.NODE_ENV === 'development',
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
  IS_CLIENT: typeof window !== 'undefined',
  IS_SERVER: typeof window === 'undefined'
} as const

// Export configuration object
export const API_CONFIG = {
  keys: API_KEYS,
  endpoints: API_ENDPOINTS,
  timeouts: API_TIMEOUTS,
  retryConfig: API_RETRY_CONFIG,
  rateLimits: RATE_LIMITS,
  defaultSettings: DEFAULT_GENERATION_SETTINGS,
  modelVersions: MODEL_VERSIONS,
  qualitySettings: QUALITY_SETTINGS,
  errorMessages: API_ERROR_MESSAGES,
  featureFlags: FEATURE_FLAGS,
  debugConfig: DEBUG_CONFIG,
  environment: ENVIRONMENT
} as const

export default API_CONFIG
