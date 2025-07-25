// Core Replicate Types for Minu.AI
// Modular, extensible type system for all image generation models

import { GeneratorMode } from '@/lib/types/modes'

// Standardized parameter schema for consistent UI generation
export interface ParameterSchema {
  name: string
  type: 'string' | 'number' | 'boolean' | 'select' | 'file' | 'range'
  required: boolean
  default?: any
  min?: number
  max?: number
  step?: number
  options?: string[] | { value: string; label: string }[]
  description?: string
  category?: 'basic' | 'intermediate' | 'advanced'
}

export interface BaseModelConfig {
  id: string
  name: string
  description: string
  provider: string
  category: 'image-generation' | 'image-editing' | 'video-generation' | 'upscaling' | 'style-transfer'
  replicateModel: string // Replicate model identifier
  supportedModes: GeneratorMode[]
  pricing: {
    costPerImage?: number
    costPerSecond?: number
    costPerUpscale?: number
    currency: 'USD'
  }
  capabilities: {
    maxResolution: string
    aspectRatios: string[]
    styles?: string[]
    features: string[]
  }
  performance: {
    speed: 'fast' | 'medium' | 'slow'
    quality: 'standard' | 'high' | 'premium'
    averageTime: number // seconds
  }
  available: boolean
  requiresInputImage?: boolean // For image-editing models
  supportsMultipleImages?: boolean // For models that accept multiple image inputs
  requiresTwoImages?: boolean // For models that require exactly two images
  experimental?: boolean // For experimental models
  parameterSchema?: ParameterSchema[] // Standardized parameter definitions
  defaultParams?: Record<string, any>
  parameterLimits?: Record<string, any>
}

export interface BaseGenerationParams {
  prompt: string
  negativePrompt?: string
  width?: number
  height?: number
  aspectRatio?: string
  numOutputs?: number
  seed?: number
}

export interface BaseGenerationResult {
  id: string
  url: string
  prompt: string
  model: string
  timestamp: Date
  metadata: {
    width: number
    height: number
    generationTime: number
    cost?: number
    seed?: number
    [key: string]: any
  }
}

// FLUX Model Types
export interface FluxGenerationParams extends BaseGenerationParams {
  guidanceScale?: number // Legacy parameter name (for UI compatibility)
  guidance?: number // FLUX-dev/pro API parameter name
  numInferenceSteps?: number
  outputFormat?: 'jpg' | 'png' | 'webp'
  outputQuality?: number
  disableSafetyChecker?: boolean
  // FLUX-specific parameters
  goFast?: boolean
  megapixels?: '0.25' | '1'
  raw?: boolean // Enable raw mode for maximum quality (FLUX Ultra)
  aspectRatioMode?: string // Ultra mode for highest resolution
  // Image-to-image parameters (FLUX-dev/pro only)
  image?: string
  inputImage?: string // For FLUX Kontext models
  promptStrength?: number
  // FLUX Kontext Pro specific parameters
  safetyTolerance?: number
  // FLUX Kontext Haircut specific parameters
  gender?: 'none' | 'male' | 'female'
  haircut?: string
  hairColor?: string
  // Multi-Image Kontext Pro parameters
  inputImage1?: string
  inputImage2?: string
  aspectRatio?: 'match_input_image' | '1:1' | '16:9' | '9:16' | '4:3' | '3:4' | '3:2' | '2:3' | '4:5' | '5:4' | '21:9' | '9:21' | '2:1' | '1:2'
  // Portrait Series parameters
  numImages?: number
  background?: 'white' | 'black' | 'gray' | 'green screen' | 'neutral' | 'original'
  randomizeImages?: boolean
}

export interface FluxModelConfig extends BaseModelConfig {
  replicateModel: string
  defaultParams: Partial<FluxGenerationParams>
  parameterLimits: {
    guidanceScale?: { min: number; max: number; default: number } // Optional for FLUX-schnell
    guidance?: { min: number; max: number; default: number } // For FLUX-dev/pro
    numInferenceSteps: { min: number; max: number; default: number }
    outputQuality: { min: number; max: number; default: number }
    numOutputs?: { min: number; max: number; default: number }
    promptStrength?: { min: number; max: number; default: number }
    safetyTolerance?: { min: number; max: number; default: number } // For FLUX Kontext models
    numImages?: { min: number; max: number; default: number } // For Portrait Series
  }
  specialParams?: {
    gender?: string[]
    haircut?: string[]
    hairColor?: string[]
    [key: string]: string[] | undefined
  }
  // Multi-image support flags
  requiresTwoImages?: boolean // For multi-image models like flux-multi-image-kontext-pro
  requiresSingleImage?: boolean // For single-image models like flux-portrait-series
}

// Stable Diffusion Types
export interface StableDiffusionParams extends BaseGenerationParams {
  guidanceScale?: number
  numInferenceSteps?: number
  scheduler?: string
  refine?: 'no_refiner' | 'expert_ensemble_refiner' | 'base_image_refiner'
  highNoiseFrac?: number
  refineSteps?: number
}

export interface StableDiffusionConfig extends BaseModelConfig {
  replicateModel: string
  defaultParams: Partial<StableDiffusionParams>
  schedulers: string[]
}

// Ideogram Types
export interface IdeogramParams extends BaseGenerationParams {
  style?: 'auto' | 'general' | 'realistic' | 'design' | 'render_3d' | 'anime'
  magicPromptOption?: 'Auto' | 'On' | 'Off'
  colorPalette?: string
}

export interface IdeogramConfig extends BaseModelConfig {
  replicateModel: string
  defaultParams: Partial<IdeogramParams>
  styles: string[]
}

// ByteDance Types
export interface ByteDanceParams extends BaseGenerationParams {
  num_inference_steps?: number
  guidance_scale?: number
  duration?: string
  resolution?: string
  quality?: string
  fps?: number
  first_frame_image?: string
  subject_reference?: string
  prompt_optimizer?: boolean
}

export interface ByteDanceConfig extends BaseModelConfig {
  replicateModel: string
  defaultParams: Partial<ByteDanceParams>
  parameterLimits: {
    width?: { min: number, max: number, default: number }
    height?: { min: number, max: number, default: number }
    num_inference_steps?: { min: number, max: number, default: number }
    duration?: { options: string[], default: string }
    resolution?: { options: string[], default: string }
    quality?: { options: string[], default: string }
    fps?: { min: number, max: number, default: number }
  }
}

// Video Generation Configuration
export interface VideoConfig extends BaseModelConfig {
  replicateModel: string
  defaultParams: Partial<VideoGenerationParams>
  parameterLimits?: {
    duration?: { min: number; max: number; default: number }
    fps?: { min: number; max: number; default: number }
    motionBucketId?: { min: number; max: number; default: number }
  }
}

export interface VideoGenerationParams extends BaseGenerationParams {
  duration?: number // seconds
  fps?: number // frames per second
  aspectRatio?: string
  motionBucketId?: number // for Stable Video Diffusion
  promptOptimizer?: boolean // for MiniMax
}

// Upscaler Configuration
export interface UpscalerConfig extends Omit<BaseModelConfig, 'replicateModel'> {
  replicateModel?: string
  upscaleFactor?: number
  supportedFormats?: string[]
}

// Generic Model Types (for easy extension)
export type ModelParams = FluxGenerationParams | StableDiffusionParams | IdeogramParams | ByteDanceParams | VideoGenerationParams
export type ModelConfig = FluxModelConfig | StableDiffusionConfig | IdeogramConfig | ByteDanceConfig | VideoConfig | UpscalerConfig

// API Response Types
export interface ReplicateResponse {
  id: string
  status: 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled'
  input: Record<string, any>
  output?: string | string[]
  error?: string
  logs?: string
  metrics?: {
    predict_time?: number
    total_time?: number
  }
  urls?: {
    get: string
    cancel: string
  }
}

// Error Types
export class ReplicateAPIError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string,
    public details?: any
  ) {
    super(message)
    this.name = 'ReplicateAPIError'
  }
}

// Model Registry Types
export interface ModelRegistry {
  [category: string]: {
    [modelId: string]: ModelConfig
  }
}

// Generation Request Types
export interface GenerationRequest {
  modelId: string
  params: ModelParams
  userId?: string
  sessionId?: string
}

export interface GenerationResponse {
  success: boolean
  data?: BaseGenerationResult[]
  error?: string
  cost?: number
  estimatedTime?: number
}

// Cost Tracking Types
export interface CostEstimate {
  modelId: string
  estimatedCost: number
  currency: 'USD'
  breakdown: {
    baseImageCost?: number
    processingCost?: number
    additionalFeatures?: number
  }
}

// Model Selection Types
export interface ModelOption {
  id: string
  name: string
  description: string
  provider: string
  category: string
  pricing: {
    display: string
    costPerImage?: number
  }
  capabilities: {
    maxResolution: string
    features: string[]
  }
  performance: {
    speed: 'fast' | 'medium' | 'slow'
    quality: 'standard' | 'high' | 'premium'
  }
  available: boolean
  recommended?: boolean
  popular?: boolean
}

// UI State Types
export interface GenerationState {
  isGenerating: boolean
  selectedModel: string
  generatedImages: BaseGenerationResult[]
  error: string | null
  progress?: {
    status: string
    percentage?: number
  }
}
