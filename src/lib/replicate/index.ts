// Main Replicate Integration for Minu.AI
// Central export point for all Replicate functionality

// Core exports
export * from './types'
export * from './config'
export * from './client'
export * from './models'

// Re-export key classes and functions for convenience
export { ReplicateClient, getReplicateClient, generateWithReplicate, estimateReplicateCost } from './client'
export { ModelFactory, ModelUtils, generateImage, estimateCost, getModelOptions } from './models'
export { FluxModel, createFluxModel, getBestFluxModel } from './models/flux'

// Main Replicate service class - High-level interface
import {
  GenerationRequest,
  GenerationResponse,
  BaseGenerationResult,
  ModelOption,
  CostEstimate
} from './types'
import { getReplicateClient } from './client'
import { ModelFactory, ModelUtils } from './models'
import { RECOMMENDED_MODELS } from './config'

export class ReplicateService {
  private client: ReturnType<typeof getReplicateClient>

  constructor(apiToken?: string) {
    this.client = getReplicateClient(apiToken)
  }

  /**
   * Generate images with automatic model selection and optimization
   */
  async generateImages(
    prompt: string,
    options: {
      modelId?: string
      numOutputs?: number
      aspectRatio?: string
      quality?: 'standard' | 'high' | 'premium'
      speed?: 'fast' | 'medium' | 'slow'
      maxCost?: number
      seed?: number
      [key: string]: any
    } = {}
  ): Promise<GenerationResponse> {
    try {
      // Auto-select model if not specified
      let modelId = options.modelId
      if (!modelId) {
        const bestModel = ModelUtils.findBestModel({
          maxCost: options.maxCost,
          minQuality: options.quality,
          maxTime: options.speed === 'fast' ? 5 : options.speed === 'medium' ? 15 : undefined
        })
        
        if (!bestModel) {
          throw new Error('No suitable model found for the given criteria')
        }
        
        modelId = bestModel.id
      }

      // Prepare generation request
      const request: GenerationRequest = {
        modelId,
        params: {
          prompt,
          numOutputs: options.numOutputs || 1,
          aspectRatio: options.aspectRatio,
          seed: options.seed,
          ...options
        }
      }

      // Generate images
      return await this.client.generateImage(request)

    } catch (error) {
      console.error('ReplicateService generation error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  /**
   * Generate videos with automatic model selection and optimization
   */
  async generateVideos(
    prompt: string,
    options: {
      modelId?: string
      duration?: number
      fps?: number
      aspectRatio?: string
      // Schema-compliant parameter names
      image?: string
      last_frame_image?: string
      // Legacy support
      first_frame_image?: string
      subject_reference?: string
      seed?: number
      [key: string]: any
    } = {}
  ): Promise<GenerationResponse> {
    try {
      // Auto-select model if not specified
      let modelId = options.modelId
      if (!modelId) {
        // Default to a good video model
        modelId = 'minimax-video-01'
      }

      // Map legacy parameters to schema-compliant names
      const image = options.image || options.first_frame_image
      const lastFrameImage = options.last_frame_image || options.subject_reference

      // Prepare base parameters
      const baseParams = {
        prompt,
        duration: options.duration || 5,
        fps: options.fps || 24,
        aspect_ratio: options.aspectRatio || '16:9',
        seed: options.seed,
        ...(image && { image }),
        ...(lastFrameImage && { last_frame_image: lastFrameImage }),
        ...options
      }

      // Use base parameters directly (V2 system handles transformations)
      const transformedParams = baseParams

      // Prepare generation request
      const request: GenerationRequest = {
        modelId,
        params: transformedParams
      }

      // Generate videos using the same client method (it handles both images and videos)
      return await this.client.generateImage(request)

    } catch (error) {
      console.error('ReplicateService video generation error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  /**
   * Enhance/upscale images with automatic model selection and optimization
   */
  async enhanceImages(
    imageUrl: string,
    options: {
      modelId?: string
      scale?: number
      faceEnhance?: boolean
      denoise?: boolean
      [key: string]: any
    } = {}
  ): Promise<GenerationResponse> {
    try {
      // Auto-select model if not specified
      let modelId = options.modelId
      if (!modelId) {
        // Default to a good upscaling model
        modelId = 'real-esrgan'
      }

      // Prepare enhancement request
      const request: GenerationRequest = {
        modelId,
        params: {
          prompt: `Enhance image with ${modelId}`, // Required prompt field
          image: imageUrl,
          scale: options.scale || 4,
          faceEnhance: options.faceEnhance,
          denoise: options.denoise,
          ...options
        }
      }

      // Enhance images using the same client method
      return await this.client.generateImage(request)

    } catch (error) {
      console.error('ReplicateService enhancement error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  /**
   * Generate with a specific model using direct Replicate API
   * Used by the new CompactGenerator for model-aware generation
   */
  async generateWithModel(
    model: string, // owner/model format
    input: Record<string, any>
  ): Promise<GenerationResponse> {
    try {
      console.log('Generating with model:', model, 'Input:', input)

      // Access the API token from the ReplicateClient instance
      const apiToken = (this.client as any).apiToken || process.env.REPLICATE_API_TOKEN

      // Call Replicate API directly using model name format
      const response = await fetch('https://api.replicate.com/v1/models/' + model + '/predictions', {
        method: 'POST',
        headers: {
          'Authorization': `Token ${apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: input
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(`Replicate API error: ${errorData.detail || response.statusText}`)
      }

      const result = await response.json()
      console.log('🔍 Replicate API raw response:', JSON.stringify(result, null, 2))

      // Wait for the prediction to complete
      let prediction = result
      const maxWaitTime = 300000 // 5 minutes
      const startTime = Date.now()

      while (prediction.status === 'starting' || prediction.status === 'processing') {
        if (Date.now() - startTime > maxWaitTime) {
          throw new Error('Generation timeout after 5 minutes')
        }

        console.log(`🔄 Waiting for prediction ${prediction.id}, status: ${prediction.status}`)
        await new Promise(resolve => setTimeout(resolve, 2000)) // Wait 2 seconds

        // Get updated prediction status
        const statusResponse = await fetch(`https://api.replicate.com/v1/predictions/${prediction.id}`, {
          headers: {
            'Authorization': `Token ${apiToken}`,
            'Content-Type': 'application/json'
          }
        })

        if (!statusResponse.ok) {
          throw new Error(`Failed to get prediction status: ${statusResponse.statusText}`)
        }

        prediction = await statusResponse.json()
        console.log(`📊 Prediction ${prediction.id} status: ${prediction.status}`)
      }

      if (prediction.status === 'failed') {
        throw new Error(prediction.error || 'Generation failed')
      }

      if (prediction.status === 'canceled') {
        throw new Error('Generation was canceled')
      }

      // Extract the generated image URLs
      const imageUrls = Array.isArray(prediction.output) ? prediction.output : [prediction.output]
      console.log('🖼️ Generated image URLs:', imageUrls)

      return {
        success: true,
        data: imageUrls.filter((url: string) => url).map((url: string, index: number) => ({
          id: `${prediction.id}-${index}`,
          url: url,
          prompt: input.prompt || '',
          model: model,
          timestamp: new Date(),
          metadata: {
            width: 1024, // Default width
            height: 1024, // Default height
            generationTime: Date.now() - startTime,
            model,
            input,
            created_at: prediction.created_at,
            prediction_id: prediction.id
          }
        }))
      }

    } catch (error) {
      console.error('ReplicateService generateWithModel error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  /**
   * Get cost estimate for generation
   */
  estimateGenerationCost(
    modelId: string,
    numOutputs: number = 1
  ): CostEstimate {
    return this.client.estimateCost(modelId, { numOutputs })
  }

  /**
   * Get all available models
   */
  getAvailableModels(): ModelOption[] {
    return ModelUtils.getModelOptions()
  }

  /**
   * Get models organized by category
   */
  getModelsByCategory(): Record<string, ModelOption[]> {
    return ModelUtils.getModelsByCategory()
  }

  /**
   * Find best model for specific requirements
   */
  findBestModel(criteria: {
    maxCost?: number
    minQuality?: 'standard' | 'high' | 'premium'
    maxTime?: number
    features?: string[]
  }): ModelOption | null {
    return ModelUtils.findBestModel(criteria)
  }

  /**
   * Get model configuration
   */
  getModelConfig(modelId: string) {
    return ModelFactory.getModelConfig(modelId)
  }

  /**
   * Check if model is available
   */
  isModelAvailable(modelId: string): boolean {
    return ModelFactory.isModelAvailable(modelId)
  }

  /**
   * Get recommended models for common use cases
   */
  getRecommendedModels() {
    return RECOMMENDED_MODELS
  }

  /**
   * Check if Replicate service is available
   */
  isAvailable(): boolean {
    try {
      // Check if we have a valid API token
      if (!this.client) {
        return false
      }

      // Check if we have models available
      const models = this.getAvailableModels()
      return models.length > 0
    } catch (error) {
      console.error('Error checking Replicate availability:', error)
      return false
    }
  }
}

// Create singleton instance
let replicateService: ReplicateService | null = null

export function getReplicateService(apiToken?: string): ReplicateService {
  if (!replicateService || apiToken) {
    replicateService = new ReplicateService(apiToken)
  }
  return replicateService
}

// Convenience functions for common operations
export async function quickGenerate(
  prompt: string,
  modelId?: string,
  options?: any
): Promise<BaseGenerationResult[]> {
  const service = getReplicateService()
  const response = await service.generateImages(prompt, { modelId, ...options })
  
  if (!response.success) {
    throw new Error(response.error || 'Generation failed')
  }
  
  return response.data || []
}

export function quickEstimate(modelId: string, numOutputs: number = 1): number {
  const service = getReplicateService()
  const estimate = service.estimateGenerationCost(modelId, numOutputs)
  return estimate.estimatedCost
}

// Export default service instance
export default getReplicateService
