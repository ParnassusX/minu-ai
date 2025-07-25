// FLUX Model Implementation for Replicate
// Specialized handling for FLUX model family

import { FluxGenerationParams, FluxModelConfig, BaseGenerationResult } from '../types'
import { FLUX_MODELS } from '../config'
import { getReplicateClient } from '../client'

export class FluxModel {
  private modelId: string
  private config: FluxModelConfig

  constructor(modelId: keyof typeof FLUX_MODELS) {
    this.modelId = modelId
    this.config = FLUX_MODELS[modelId]
    
    if (!this.config) {
      throw new Error(`FLUX model ${modelId} not found`)
    }
  }

  /**
   * Generate images with FLUX model
   */
  async generate(params: FluxGenerationParams): Promise<BaseGenerationResult[]> {
    // Validate parameters
    this.validateParams(params)
    
    // Prepare FLUX-specific parameters
    const fluxParams = this.prepareFluxParams(params)
    
    // Generate using Replicate client
    const client = getReplicateClient()
    const response = await client.generateImage({
      modelId: this.modelId,
      params: fluxParams as any // Cast to any since FLUX params don't match the union type exactly
    })

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Generation failed')
    }

    return response.data
  }

  /**
   * Estimate cost for FLUX generation
   */
  estimateCost(params: FluxGenerationParams): number {
    const numOutputs = params.numOutputs || 1
    return this.config.pricing.costPerImage! * numOutputs
  }

  /**
   * Get model configuration
   */
  getConfig(): FluxModelConfig {
    return this.config
  }

  /**
   * Get available aspect ratios
   */
  getAspectRatios(): string[] {
    return this.config.capabilities.aspectRatios
  }

  /**
   * Get parameter limits
   */
  getParameterLimits() {
    return this.config.parameterLimits
  }

  /**
   * Validate FLUX parameters
   */
  private validateParams(params: FluxGenerationParams): void {
    if (!params.prompt || params.prompt.trim().length === 0) {
      throw new Error('Prompt is required')
    }

    if (params.prompt.length > 1000) {
      throw new Error('Prompt is too long (max 1000 characters)')
    }

    if (params.numOutputs && (params.numOutputs < 1 || params.numOutputs > 4)) {
      throw new Error('Number of outputs must be between 1 and 4')
    }

    // Validate guidance scale (only for models that support it)
    if (params.guidanceScale && this.config.parameterLimits.guidanceScale) {
      const limits = this.config.parameterLimits.guidanceScale
      if (params.guidanceScale < limits.min || params.guidanceScale > limits.max) {
        throw new Error(`Guidance scale must be between ${limits.min} and ${limits.max}`)
      }
    }

    if (params.numInferenceSteps) {
      const limits = this.config.parameterLimits.numInferenceSteps
      if (params.numInferenceSteps < limits.min || params.numInferenceSteps > limits.max) {
        throw new Error(`Inference steps must be between ${limits.min} and ${limits.max}`)
      }
    }

    if (params.outputQuality) {
      const limits = this.config.parameterLimits.outputQuality
      if (params.outputQuality < limits.min || params.outputQuality > limits.max) {
        throw new Error(`Output quality must be between ${limits.min} and ${limits.max}`)
      }
    }

    if (params.aspectRatio && !this.config.capabilities.aspectRatios.includes(params.aspectRatio)) {
      throw new Error(`Aspect ratio ${params.aspectRatio} is not supported`)
    }
  }

  /**
   * Prepare FLUX-specific parameters based on model capabilities
   */
  private prepareFluxParams(params: FluxGenerationParams): Record<string, any> {
    const fluxParams: Record<string, any> = {
      prompt: params.prompt.trim()
    }

    // Common parameters for all FLUX models
    if (params.aspectRatio) {
      fluxParams.aspect_ratio = params.aspectRatio
    }

    if (params.numOutputs) {
      fluxParams.num_outputs = params.numOutputs
    }

    if (params.seed !== undefined) {
      fluxParams.seed = params.seed
    }

    if (params.outputFormat) {
      fluxParams.output_format = params.outputFormat
    }

    if (params.outputQuality !== undefined) {
      fluxParams.output_quality = params.outputQuality
    }

    if (params.disableSafetyChecker !== undefined) {
      fluxParams.disable_safety_checker = params.disableSafetyChecker
    }

    // Model-specific parameters
    if (this.modelId === 'flux-schnell') {
      // FLUX-schnell specific parameters
      if (params.numInferenceSteps !== undefined) {
        // Ensure max 4 steps for schnell
        fluxParams.num_inference_steps = Math.min(params.numInferenceSteps, 4)
      } else {
        fluxParams.num_inference_steps = 4 // Always default to 4 for schnell
      }

      // Add schnell-specific parameters
      fluxParams.go_fast = true
      fluxParams.megapixels = '1'

      // NOTE: FLUX-schnell does NOT support guidance parameter
    } else {
      // FLUX-dev, FLUX-pro, etc. parameters
      if (params.numInferenceSteps !== undefined) {
        fluxParams.num_inference_steps = params.numInferenceSteps
      }

      // FLUX-dev uses 'guidance' not 'guidanceScale'
      if (params.guidanceScale !== undefined) {
        fluxParams.guidance = params.guidanceScale
      }

      // Image-to-image support for dev/pro models
      if (params.image) {
        fluxParams.image = params.image
      }

      // FLUX Kontext models use input_image instead of image
      if (params.inputImage) {
        fluxParams.input_image = params.inputImage
      }

      if (params.promptStrength !== undefined) {
        fluxParams.prompt_strength = params.promptStrength
      }

      // FLUX Kontext Pro specific parameters
      if (params.safetyTolerance !== undefined) {
        fluxParams.safety_tolerance = params.safetyTolerance
      }

      // FLUX Kontext Haircut specific parameters
      if (this.modelId === 'flux-kontext-haircut') {
        if (params.gender) {
          fluxParams.gender = params.gender
        }
        if (params.haircut) {
          fluxParams.haircut = params.haircut
        }
        if (params.hairColor) {
          fluxParams.hair_color = params.hairColor
        }
      }

      // Multi-Image Kontext Pro specific parameters
      if (this.modelId === 'flux-multi-image-kontext-pro') {
        if (params.inputImage1) {
          fluxParams.input_image_1 = params.inputImage1
        }
        if (params.inputImage2) {
          fluxParams.input_image_2 = params.inputImage2
        }
        if (params.aspectRatio) {
          fluxParams.aspect_ratio = params.aspectRatio
        }
      }

      // Portrait Series specific parameters
      if (this.modelId === 'flux-portrait-series') {
        if (params.numImages !== undefined) {
          fluxParams.num_images = params.numImages
        }
        if (params.background) {
          fluxParams.background = params.background
        }
        if (params.randomizeImages !== undefined) {
          fluxParams.randomize_images = params.randomizeImages
        }
      }

      // Add dev/pro specific parameters
      fluxParams.go_fast = true
      fluxParams.megapixels = '1'
    }

    return fluxParams
  }
}

// Factory functions for each FLUX model
export const createFluxSchnell = () => new FluxModel('flux-schnell')
export const createFluxDev = () => new FluxModel('flux-dev')
export const createFluxPro = () => new FluxModel('flux-pro')
export const createFluxUltra = () => new FluxModel('flux-ultra')

// Utility function to create any FLUX model
export function createFluxModel(modelId: keyof typeof FLUX_MODELS): FluxModel {
  return new FluxModel(modelId)
}

// Helper function to get best FLUX model for requirements
export function getBestFluxModel(requirements: {
  budget?: 'low' | 'medium' | 'high'
  speed?: 'fast' | 'medium' | 'slow'
  quality?: 'standard' | 'high' | 'premium'
}): keyof typeof FLUX_MODELS {
  const { budget = 'medium', speed = 'medium', quality = 'high' } = requirements

  // Budget-focused selection
  if (budget === 'low') {
    return 'flux-schnell'
  }

  // Speed-focused selection
  if (speed === 'fast') {
    return 'flux-schnell'
  }

  // Quality-focused selection
  if (quality === 'premium') {
    return 'flux-ultra'
  }

  // Balanced selection (default)
  return 'flux-dev'
}

// Export all FLUX models for easy access
export const FLUX_MODEL_INSTANCES = {
  'flux-schnell': createFluxSchnell,
  'flux-dev': createFluxDev,
  'flux-pro': createFluxPro,
  'flux-ultra': createFluxUltra
} as const
