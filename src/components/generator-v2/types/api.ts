/**
 * API Type Definitions - Minu.AI Generator V2
 * Clean, comprehensive type definitions for API interactions
 */

import { GenerationParams, GenerationMode } from './models'

// API Response Types
export interface APIResponse<T = any> {
  success: boolean
  data?: T
  error?: APIError
  timestamp: string
  requestId: string
}

export interface APIError {
  code: string
  message: string
  details?: any
  userMessage: string
  statusCode: number
  retryable: boolean
}

// Generation Request Types
export interface GenerationRequest {
  model: string
  mode: GenerationMode
  input: GenerationParams
  options?: GenerationOptions
}

export interface GenerationOptions {
  webhook?: string
  priority?: 'low' | 'normal' | 'high'
  timeout?: number
  retries?: number
  saveToGallery?: boolean
  metadata?: Record<string, any>
}

// Generation Response Types
export interface GenerationResult {
  id: string
  status: GenerationStatus
  model: string
  mode: GenerationMode
  input: GenerationParams
  output?: GenerationOutput
  error?: APIError
  progress?: number
  estimatedTime?: number
  cost?: number
  createdAt: string
  completedAt?: string
}

export type GenerationStatus = 
  | 'pending'
  | 'processing' 
  | 'completed'
  | 'failed'
  | 'cancelled'

export interface GenerationOutput {
  urls: string[]
  metadata: {
    width?: number
    height?: number
    duration?: number
    format: string
    size: number
  }
  storage: {
    supabaseUrl?: string
    cloudinaryUrl?: string
    publicUrl: string
  }
}

// Replicate API Types
export interface ReplicatePrediction {
  id: string
  status: 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled'
  input: Record<string, any>
  output?: any
  error?: string
  logs?: string
  created_at: string
  started_at?: string
  completed_at?: string
  urls: {
    get: string
    cancel: string
  }
}

export interface ReplicateCreateRequest {
  version?: string
  input: Record<string, any>
  webhook?: string
  webhook_events_filter?: string[]
}

// Validation Types
export interface ValidationSchema {
  [key: string]: {
    type: 'string' | 'number' | 'boolean' | 'array' | 'object'
    required?: boolean
    min?: number
    max?: number
    pattern?: string
    enum?: any[]
    items?: ValidationSchema
    properties?: ValidationSchema
  }
}

export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
}

export interface ValidationError {
  field: string
  message: string
  code: string
  value?: any
}

export interface ValidationWarning {
  field: string
  message: string
  suggestion?: string
}

// API Client Configuration
export interface APIClientConfig {
  baseUrl: string
  apiKey: string
  timeout: number
  retries: number
  retryDelay: number
}

export interface ReplicateClientConfig extends APIClientConfig {
  webhookUrl?: string
  defaultModel?: string
}

// Rate Limiting Types
export interface RateLimit {
  requests: number
  window: number // seconds
  burst?: number
}

export interface RateLimitStatus {
  remaining: number
  reset: number
  limit: number
}

// Cost Tracking Types
export interface CostEstimate {
  model: string
  mode: GenerationMode
  estimatedCost: number
  currency: 'USD'
  breakdown: {
    base: number
    parameters: number
    priority: number
  }
}

export interface CostTracking {
  totalCost: number
  monthlyLimit: number
  remaining: number
  currency: 'USD'
  lastUpdated: string
}

// Webhook Types
export interface WebhookPayload {
  event: 'generation.started' | 'generation.completed' | 'generation.failed'
  data: GenerationResult
  timestamp: string
}

// Error Codes
export const API_ERROR_CODES = {
  // Authentication
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  
  // Validation
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  INVALID_MODEL: 'INVALID_MODEL',
  
  // Rate Limiting
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  QUOTA_EXCEEDED: 'QUOTA_EXCEEDED',
  
  // Generation
  GENERATION_FAILED: 'GENERATION_FAILED',
  MODEL_UNAVAILABLE: 'MODEL_UNAVAILABLE',
  TIMEOUT: 'TIMEOUT',
  
  // Storage
  STORAGE_FAILED: 'STORAGE_FAILED',
  UPLOAD_FAILED: 'UPLOAD_FAILED',
  
  // System
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE'
} as const

export type APIErrorCode = typeof API_ERROR_CODES[keyof typeof API_ERROR_CODES]

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503
} as const
