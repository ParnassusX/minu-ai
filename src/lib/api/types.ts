/**
 * API Types for Minu.AI - Replicate and Gemini API Integration
 * Comprehensive type definitions for all API interactions
 */

// Base API Response Types
export interface APIResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface APIError {
  code: string
  message: string
  details?: any
  status?: number
}

// Replicate API Types
export interface ReplicateModel {
  owner: string
  name: string
  version: string
  description?: string
}

export interface ReplicatePrediction {
  id: string
  version: string
  status: 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled'
  input: Record<string, any>
  output?: any
  error?: string
  logs?: string
  metrics?: {
    predict_time?: number
  }
  created_at: string
  started_at?: string
  completed_at?: string
  urls?: {
    get: string
    cancel: string
    stream?: string
  }
}

export interface ReplicateCreatePredictionRequest {
  version: string
  input: Record<string, any>
  webhook?: string
  webhook_events_filter?: ('start' | 'output' | 'logs' | 'completed')[]
}

// Gemini API Types
export interface GeminiGenerateRequest {
  contents: {
    parts: {
      text: string
    }[]
  }[]
  generationConfig?: {
    temperature?: number
    topK?: number
    topP?: number
    maxOutputTokens?: number
    stopSequences?: string[]
  }
  safetySettings?: {
    category: string
    threshold: string
  }[]
}

export interface GeminiGenerateResponse {
  candidates: {
    content: {
      parts: {
        text: string
      }[]
      role: string
    }
    finishReason: string
    index: number
    safetyRatings: {
      category: string
      probability: string
    }[]
  }[]
  promptFeedback?: {
    safetyRatings: {
      category: string
      probability: string
    }[]
  }
}

// Generation Request Types
export interface GenerationRequest {
  mode: 'images' | 'video' | 'enhance'
  model: string
  prompt: string
  settings: GenerationSettings
  files?: File[]
}

export interface GenerationSettings {
  aspectRatio?: string
  numImages?: number
  guidanceScale?: number
  inferenceSteps?: number
  seed?: number
  // Mode-specific settings
  strength?: number // for video mode (image-to-video strength)
  upscaleFactor?: number // for enhance mode
  duration?: number // for video mode (seconds)
  fps?: number // for video mode (frames per second)
}

export interface GenerationResult {
  id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  mode: 'images' | 'video' | 'enhance'
  model: string
  prompt: string
  originalPrompt?: string
  enhancedPrompt?: string
  settings: GenerationSettings
  files?: {
    id: string
    name: string
    url: string
    type: string
  }[]
  outputs?: {
    id: string
    url: string
    type: 'image' | 'video'
    format: string
    width?: number
    height?: number
    fileSize?: number
  }[]
  error?: string
  metrics?: {
    processingTime?: number
    cost?: number
  }
  createdAt: Date
  completedAt?: Date
}

// API Client Configuration
export interface APIClientConfig {
  baseURL: string
  apiKey: string
  timeout?: number
  retries?: number
  retryDelay?: number
}

export interface ReplicateClientConfig extends APIClientConfig {
  baseURL: 'https://api.replicate.com/v1'
}

export interface GeminiClientConfig extends APIClientConfig {
  baseURL: 'https://generativelanguage.googleapis.com/v1beta'
  model?: string
}

// API State Types
export interface APIState {
  isLoading: boolean
  error: string | null
  lastRequest?: GenerationRequest
  currentGeneration?: GenerationResult
  generationHistory: GenerationResult[]
  promptEnhancement: {
    isEnhancing: boolean
    originalPrompt?: string
    enhancedPrompt?: string
    error?: string
  }
}

export interface APIActions {
  // Generation actions
  generateImage: (request: GenerationRequest) => Promise<GenerationResult>
  generateVideo: (request: GenerationRequest) => Promise<GenerationResult>
  enhanceImage: (request: GenerationRequest) => Promise<GenerationResult>
  
  // Prompt enhancement
  enhancePrompt: (prompt: string) => Promise<string>
  
  // Status management
  checkGenerationStatus: (id: string) => Promise<GenerationResult>
  cancelGeneration: (id: string) => Promise<void>
  
  // History management
  getGenerationHistory: () => GenerationResult[]
  clearHistory: () => void
  removeFromHistory: (id: string) => void
  
  // Error handling
  clearError: () => void
  setError: (error: string) => void
}

export type APIStore = APIState & APIActions

// Utility Types
export type GenerationMode = 'images' | 'video' | 'enhance'
export type GenerationStatus = 'pending' | 'processing' | 'completed' | 'failed'

// Model-specific input types
export interface ImageGenerationInput {
  prompt: string
  aspect_ratio?: string
  num_outputs?: number
  guidance_scale?: number
  num_inference_steps?: number
  seed?: number
}

export interface VideoGenerationInput {
  prompt: string
  input_image?: string // base64 or URL for image-to-video
  aspect_ratio?: string
  duration?: number // seconds
  fps?: number // frames per second
  seed?: number
}

export interface ImageEnhanceInput {
  image: string // base64 or URL
  scale?: number
  face_enhance?: boolean
}

// Response validation schemas
export const isReplicatePrediction = (obj: any): obj is ReplicatePrediction => {
  return obj && typeof obj.id === 'string' && typeof obj.status === 'string'
}

export const isGeminiResponse = (obj: any): obj is GeminiGenerateResponse => {
  return obj && Array.isArray(obj.candidates)
}

// Error types
export class APIClientError extends Error {
  constructor(
    message: string,
    public code: string,
    public status?: number,
    public details?: any
  ) {
    super(message)
    this.name = 'APIClientError'
  }
}

export class ReplicateAPIError extends APIClientError {
  constructor(message: string, status?: number, details?: any) {
    super(message, 'REPLICATE_API_ERROR', status, details)
    this.name = 'ReplicateAPIError'
  }
}

export class GeminiAPIError extends APIClientError {
  constructor(message: string, status?: number, details?: any) {
    super(message, 'GEMINI_API_ERROR', status, details)
    this.name = 'GeminiAPIError'
  }
}

// Constants
export const API_ENDPOINTS = {
  REPLICATE: {
    PREDICTIONS: '/predictions',
    MODELS: '/models',
    ACCOUNT: '/account'
  },
  GEMINI: {
    GENERATE: '/models/gemini-pro:generateContent'
  }
} as const

export const API_TIMEOUTS = {
  DEFAULT: 30000, // 30 seconds
  GENERATION: 300000, // 5 minutes
  ENHANCEMENT: 10000 // 10 seconds
} as const

export const API_RETRY_CONFIG = {
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000,
  BACKOFF_MULTIPLIER: 2
} as const
