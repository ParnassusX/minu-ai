/**
 * Configuration - Minu.AI Generator V2
 * Central configuration for the generator system
 */

import { GeneratorSettings } from '../types/generator'
import { RateLimit } from '../types/api'

// Environment Configuration
export const ENV = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  REPLICATE_API_TOKEN: process.env.REPLICATE_API_TOKEN || '',
  SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  CLOUDINARY_CLOUD_NAME: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || '',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
} as const

// API Configuration
export const API_CONFIG = {
  BASE_URL: '/api',
  TIMEOUT: 30000, // 30 seconds
  RETRIES: 3,
  RETRY_DELAY: 1000, // 1 second
  
  ENDPOINTS: {
    GENERATE: '/api/generate-v2',
    MODELS: '/api/models-v2',
    ENHANCE_PROMPT: '/api/enhance-prompt-v2',
    UPLOAD: '/api/upload-v2',
    COST_ESTIMATE: '/api/cost-estimate-v2'
  }
} as const

// Replicate Configuration
export const REPLICATE_CONFIG = {
  BASE_URL: 'https://api.replicate.com/v1',
  TIMEOUT: 60000, // 60 seconds for generation
  WEBHOOK_URL: process.env.REPLICATE_WEBHOOK_URL,
  
  // Model versions (will be updated with actual versions)
  MODEL_VERSIONS: {
    'flux-schnell': 'black-forest-labs/flux-schnell',
    'flux-ultra': 'black-forest-labs/flux-1.1-pro-ultra',
    'flux-kontext-pro': 'black-forest-labs/flux-kontext-pro',
    'flux-kontext-max': 'black-forest-labs/flux-kontext-max',
    'seedream-3': 'seedream/seedream-3',
    'seedance-1-lite': 'bytedance/seedance-1-lite',
    'seedance-1-pro': 'bytedance/seedance-1-pro'
  }
} as const

// Rate Limiting Configuration
export const RATE_LIMITS: Record<string, RateLimit> = {
  generation: {
    requests: 10,
    window: 60, // 1 minute
    burst: 3
  },
  prompt_enhancement: {
    requests: 20,
    window: 60,
    burst: 5
  },
  upload: {
    requests: 50,
    window: 60,
    burst: 10
  }
} as const

// File Upload Configuration
export const UPLOAD_CONFIG = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_IMAGE_TYPES: [
    'image/jpeg',
    'image/png', 
    'image/webp',
    'image/gif'
  ],
  MAX_IMAGES_PER_REQUEST: 3,
  
  // Image processing
  MAX_DIMENSION: 2048,
  QUALITY: 90,
  AUTO_RESIZE: true
} as const

// Generation Configuration
export const GENERATION_CONFIG = {
  DEFAULT_TIMEOUT: 300000, // 5 minutes
  MAX_RETRIES: 2,
  PROGRESS_POLL_INTERVAL: 2000, // 2 seconds
  
  // Cost limits
  MAX_COST_PER_GENERATION: 1.0, // $1.00
  DAILY_COST_LIMIT: 50.0, // $50.00
  
  // Quality settings
  DEFAULT_OUTPUT_FORMAT: 'jpg',
  DEFAULT_QUALITY: 90,
  
  // Safety
  DEFAULT_SAFETY_TOLERANCE: 2,
  MAX_SAFETY_TOLERANCE: 6
} as const

// UI Configuration
export const UI_CONFIG = {
  // Animation durations (ms)
  ANIMATION_FAST: 150,
  ANIMATION_NORMAL: 300,
  ANIMATION_SLOW: 500,
  
  // Debounce delays (ms)
  SEARCH_DEBOUNCE: 300,
  PARAMETER_DEBOUNCE: 500,
  
  // Pagination
  RESULTS_PER_PAGE: 12,
  MAX_HISTORY_ITEMS: 100,
  
  // Image display
  THUMBNAIL_SIZE: 256,
  PREVIEW_SIZE: 512,
  
  // Responsive breakpoints
  BREAKPOINTS: {
    SM: 640,
    MD: 768,
    LG: 1024,
    XL: 1280
  }
} as const

// Default Settings
export const DEFAULT_GENERATOR_SETTINGS: GeneratorSettings = {
  autoSave: true,
  showAdvancedParams: false,
  defaultAspectRatio: '1:1',
  defaultOutputFormat: 'jpg',
  maxHistoryItems: 50,
  enableNotifications: true
}

// Error Messages
export const ERROR_MESSAGES = {
  // Authentication
  UNAUTHORIZED: 'Please sign in to use the generator',
  FORBIDDEN: 'You do not have permission to perform this action',
  
  // Validation
  PROMPT_REQUIRED: 'Please enter a prompt',
  MODEL_REQUIRED: 'Please select a model',
  INVALID_ASPECT_RATIO: 'Invalid aspect ratio selected',
  INVALID_OUTPUT_FORMAT: 'Invalid output format selected',
  
  // File upload
  FILE_TOO_LARGE: 'File size exceeds the maximum limit',
  INVALID_FILE_TYPE: 'Invalid file type. Please upload an image',
  UPLOAD_FAILED: 'Failed to upload image. Please try again',
  
  // Generation
  GENERATION_FAILED: 'Generation failed. Please try again',
  MODEL_UNAVAILABLE: 'Selected model is currently unavailable',
  TIMEOUT: 'Generation timed out. Please try again',
  COST_LIMIT_EXCEEDED: 'Cost limit exceeded. Please check your usage',
  
  // Network
  NETWORK_ERROR: 'Network error. Please check your connection',
  SERVER_ERROR: 'Server error. Please try again later',
  
  // Generic
  UNKNOWN_ERROR: 'An unexpected error occurred'
} as const

// Success Messages
export const SUCCESS_MESSAGES = {
  GENERATION_COMPLETED: 'Generation completed successfully!',
  IMAGE_UPLOADED: 'Image uploaded successfully',
  SETTINGS_SAVED: 'Settings saved successfully',
  PROMPT_ENHANCED: 'Prompt enhanced successfully'
} as const

// Feature Flags
export const FEATURE_FLAGS = {
  ENABLE_VIDEO_GENERATION: true,
  ENABLE_IMAGE_ENHANCEMENT: true,
  ENABLE_PROMPT_ENHANCEMENT: true,
  ENABLE_COST_TRACKING: true,
  ENABLE_WEBHOOKS: false,
  ENABLE_BATCH_GENERATION: false,
  ENABLE_ADVANCED_PARAMS: true,
  ENABLE_HISTORY_EXPORT: true
} as const

// Debug Configuration
export const DEBUG_CONFIG = {
  ENABLE_LOGGING: ENV.NODE_ENV === 'development',
  LOG_LEVEL: ENV.NODE_ENV === 'development' ? 'debug' : 'error',
  ENABLE_PERFORMANCE_MONITORING: true,
  ENABLE_ERROR_REPORTING: ENV.NODE_ENV === 'production'
} as const

// Validation helpers
export const validateConfig = () => {
  const errors: string[] = []
  
  if (!ENV.REPLICATE_API_TOKEN) {
    errors.push('REPLICATE_API_TOKEN is required')
  }
  
  if (!ENV.SUPABASE_URL) {
    errors.push('NEXT_PUBLIC_SUPABASE_URL is required')
  }
  
  if (!ENV.SUPABASE_ANON_KEY) {
    errors.push('NEXT_PUBLIC_SUPABASE_ANON_KEY is required')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

// Export validation result
export const CONFIG_VALIDATION = validateConfig()
