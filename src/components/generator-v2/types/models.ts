/**
 * Model Type Definitions - Minu.AI Generator V2
 * Clean, comprehensive type definitions for all supported models
 */

export type GenerationMode = 'images' | 'video' | 'enhance'

export type AspectRatio = 
  | '1:1' | '16:9' | '9:16' | '4:3' | '3:4' | '3:2' | '2:3' 
  | '4:5' | '5:4' | '21:9' | '9:21' | '2:1' | '1:2'
  | 'match_input_image'

export type OutputFormat = 'jpg' | 'png' | 'webp' | 'mp4'

export type VideoResolution = '480p' | '720p' | '1080p'

export type VideoDuration = 5 | 10

export interface ModelParameter {
  name: string
  type: 'string' | 'number' | 'boolean' | 'select' | 'file'
  required: boolean
  default?: any
  min?: number
  max?: number
  options?: string[] | number[]
  description: string
  order: number
}

export interface ModelPricing {
  costPerImage?: number
  costPerSecond?: number
  costPerUpscale?: number
  currency: 'USD'
}

export interface ModelCapabilities {
  supportsImageInput: boolean
  supportsMultipleImages: boolean
  maxImages: number
  supportedFormats: OutputFormat[]
  maxResolution: string
  supportedAspectRatios: AspectRatio[]
}

export interface ModelPerformance {
  speed: 'fast' | 'medium' | 'slow'
  averageTime: number // seconds
  reliability: number // 0-1 score
}

export interface ModelSchema {
  id: string
  name: string
  description: string
  owner: string
  replicateModel: string
  category: 'image-generation' | 'video-generation' | 'image-enhancement' | 'image-editing' | 'upscaling'
  supportedModes: GenerationMode[]
  provider: string
  version?: string
  
  // Configuration
  parameters: ModelParameter[]
  pricing: ModelPricing
  capabilities: ModelCapabilities
  performance: ModelPerformance
  
  // Metadata
  isActive: boolean
  isPriority: boolean
  tags: string[]
  createdAt: string
  updatedAt: string
}

// Specific parameter interfaces for different model types
export interface ImageGenerationParams {
  prompt: string
  aspect_ratio?: AspectRatio
  output_format?: OutputFormat
  seed?: number
  safety_tolerance?: number
  prompt_upsampling?: boolean
  input_image?: string
}

export interface VideoGenerationParams {
  prompt: string
  image?: string
  last_frame_image?: string
  duration?: VideoDuration
  resolution?: VideoResolution
  aspect_ratio?: AspectRatio
  fps?: number
  camera_fixed?: boolean
  seed?: number
}

export interface EnhanceParams {
  image: string
  scale?: number
  face_enhance?: boolean
  background_enhance?: boolean
}

// Union type for all parameter types
export type GenerationParams = 
  | ImageGenerationParams 
  | VideoGenerationParams 
  | EnhanceParams

// Model validation result
export interface ModelValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

// Model selection state
export interface ModelSelectionState {
  selectedModelId: string | null
  availableModels: ModelSchema[]
  currentMode: GenerationMode
  isLoading: boolean
  error: string | null
}

// Priority model IDs (the 5 main models we're focusing on)
export const PRIORITY_MODEL_IDS = [
  'flux-schnell',
  'flux-ultra', 
  'flux-kontext-pro',
  'flux-kontext-max',
  'seedream-3'
] as const

export type PriorityModelId = typeof PRIORITY_MODEL_IDS[number]

// Model categories for organization
export const MODEL_CATEGORIES = {
  'image-generation': 'Image Generation',
  'video-generation': 'Video Generation', 
  'image-enhancement': 'Image Enhancement'
} as const

// Default parameter values
export const DEFAULT_PARAMS = {
  aspect_ratio: '1:1' as AspectRatio,
  output_format: 'jpg' as OutputFormat,
  safety_tolerance: 2,
  prompt_upsampling: false,
  duration: 5 as VideoDuration,
  resolution: '720p' as VideoResolution,
  fps: 24,
  camera_fixed: false
} as const
