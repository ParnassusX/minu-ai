// Core Replicate API Client for Minu.AI
// Handles all communication with Replicate API

import Replicate from 'replicate'
import { 
  ReplicateResponse, 
  ReplicateAPIError, 
  GenerationRequest, 
  GenerationResponse,
  BaseGenerationResult,
  CostEstimate
} from './types'
import { REPLICATE_CONFIG, MODEL_REGISTRY } from './config'
export class ReplicateClient {
  private client: Replicate
  private apiToken: string

  constructor(apiToken?: string) {
    this.apiToken = apiToken || REPLICATE_CONFIG.apiToken || ''
    
    if (!this.apiToken) {
      throw new ReplicateAPIError('Replicate API token is required')
    }

    this.client = new Replicate({
      auth: this.apiToken
    })
  }

  /**
   * Generate images using specified model
   */
  async generateImage(request: GenerationRequest): Promise<GenerationResponse> {
    try {
      // Find model configuration
      const modelConfig = this.findModelConfig(request.modelId)
      if (!modelConfig) {
        throw new ReplicateAPIError(`Model ${request.modelId} not found`)
      }

      if (!modelConfig.available) {
        throw new ReplicateAPIError(`Model ${request.modelId} is not available`)
      }

      // Prepare input parameters
      const input = this.prepareModelInput(modelConfig, request.params)
      
      // Estimate cost
      const costEstimate = this.estimateCost(request.modelId, request.params)

      // Run the model
      const startTime = Date.now()

      // Prepare options - only add webhook if it's a valid HTTPS URL
      const options: any = { input }
      if (REPLICATE_CONFIG.webhookUrl && REPLICATE_CONFIG.webhookUrl.startsWith('https://')) {
        options.webhook = REPLICATE_CONFIG.webhookUrl
        options.webhook_events_filter = ['completed']
      }

      // Use predictions.create for better control over the prediction lifecycle
      const prediction = await this.client.predictions.create({
        model: modelConfig.replicateModel,
        input: options.input,
        ...(options.webhook && { webhook: options.webhook }),
        ...(options.webhook_events_filter && { webhook_events_filter: options.webhook_events_filter })
      })

      // Wait for completion if no webhook
      let output = prediction.output
      if (prediction.status !== 'succeeded' && prediction.status !== 'failed') {
        const completedPrediction = await this.client.wait(prediction)
        output = completedPrediction.output
      }

      const generationTime = (Date.now() - startTime) / 1000

      // Process output
      const results = await this.processModelOutput(
        output,
        request,
        modelConfig,
        generationTime,
        costEstimate.estimatedCost
      )

      return {
        success: true,
        data: results,
        cost: costEstimate.estimatedCost,
        estimatedTime: generationTime
      }

    } catch (error) {
      console.error('Replicate generation error:', error)
      
      if (error instanceof ReplicateAPIError) {
        throw error
      }

      // Handle Replicate-specific errors
      if (error && typeof error === 'object' && 'message' in error) {
        throw new ReplicateAPIError(
          `Generation failed: ${error.message}`,
          undefined,
          'GENERATION_ERROR',
          error
        )
      }

      throw new ReplicateAPIError('Unknown generation error occurred')
    }
  }

  /**
   * Get prediction status (for async operations)
   */
  async getPredictionStatus(predictionId: string): Promise<ReplicateResponse> {
    try {
      const prediction = await this.client.predictions.get(predictionId)
      return prediction as ReplicateResponse
    } catch (error) {
      throw new ReplicateAPIError(`Failed to get prediction status: ${error}`)
    }
  }

  /**
   * Cancel a running prediction
   */
  async cancelPrediction(predictionId: string): Promise<void> {
    try {
      await this.client.predictions.cancel(predictionId)
    } catch (error) {
      throw new ReplicateAPIError(`Failed to cancel prediction: ${error}`)
    }
  }

  /**
   * Estimate generation cost
   */
  estimateCost(modelId: string, params: any): CostEstimate {
    const modelConfig = this.findModelConfig(modelId)
    if (!modelConfig) {
      throw new ReplicateAPIError(`Model ${modelId} not found`)
    }

    const numOutputs = params.numOutputs || 1
    let estimatedCost = 0

    if (modelConfig.pricing.costPerImage) {
      estimatedCost = modelConfig.pricing.costPerImage * numOutputs
    } else if (modelConfig.pricing.costPerSecond) {
      // Estimate based on average generation time
      const estimatedTime = modelConfig.performance.averageTime
      estimatedCost = modelConfig.pricing.costPerSecond * estimatedTime * numOutputs
    }

    return {
      modelId,
      estimatedCost: Math.round(estimatedCost * 1000) / 1000, // Round to 3 decimal places
      currency: 'USD',
      breakdown: {
        baseImageCost: estimatedCost
      }
    }
  }

  /**
   * List available models
   */
  getAvailableModels(): string[] {
    const models: string[] = []

    Object.values(MODEL_REGISTRY).forEach(category => {
      Object.keys(category).forEach(modelId => {
        const model = (category as any)[modelId]
        if (model && model.available) {
          models.push(modelId)
        }
      })
    })

    return models
  }

  /**
   * Get model configuration
   */
  getModelConfig(modelId: string) {
    return this.findModelConfig(modelId)
  }

  // Private helper methods

  private findModelConfig(modelId: string) {
    for (const category of Object.values(MODEL_REGISTRY)) {
      const model = (category as any)[modelId]
      if (model) {
        return model
      }
    }
    return null
  }

  private prepareModelInput(modelConfig: any, params: any) {
    // Merge default parameters with user parameters
    const mergedParams = {
      ...modelConfig.defaultParams,
      ...params
    }

    // Convert camelCase to snake_case for Replicate API
    const input: any = {}

    Object.entries(mergedParams).forEach(([key, value]) => {
      if (value !== undefined) {
        // Convert camelCase to snake_case
        const snakeKey = this.camelToSnake(key)

        // Skip modelId as it shouldn't be in the input
        if (snakeKey !== 'model_id') {
          input[snakeKey] = value
        }
      }
    })

    return input
  }

  private camelToSnake(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)
  }

  private async processModelOutput(
    output: any,
    request: GenerationRequest,
    modelConfig: any,
    generationTime: number,
    cost: number
  ): Promise<BaseGenerationResult[]> {
    const results: BaseGenerationResult[] = []

    // Handle different output formats
    let imageUrls: string[] = []

    if (Array.isArray(output)) {
      // Output is an array of URLs
      imageUrls = output.filter((url: any) => typeof url === 'string' && url.length > 0)
    } else if (typeof output === 'string' && output.length > 0) {
      // Output is a single URL string
      imageUrls = [output]
    } else if (output && typeof output === 'object') {
      // Output might be an object with URLs in various properties
      if (output.url) {
        imageUrls = [output.url]
      } else if (output.urls && Array.isArray(output.urls)) {
        imageUrls = output.urls.filter((url: any) => typeof url === 'string' && url.length > 0)
      } else if (output.images && Array.isArray(output.images)) {
        imageUrls = output.images.filter((url: any) => typeof url === 'string' && url.length > 0)
      } else if (output.output && Array.isArray(output.output)) {
        imageUrls = output.output.filter((url: any) => typeof url === 'string' && url.length > 0)
      } else {
        // Try to find any property that looks like a URL
        Object.values(output).forEach(value => {
          if (typeof value === 'string' && (value.startsWith('http') || value.startsWith('data:'))) {
            imageUrls.push(value)
          } else if (Array.isArray(value)) {
            value.forEach(item => {
              if (typeof item === 'string' && (item.startsWith('http') || item.startsWith('data:'))) {
                imageUrls.push(item)
              }
            })
          }
        })
      }
    }

    // If no URLs found, create a placeholder result to indicate the issue
    if (imageUrls.length === 0) {
      console.warn('No image URLs found in Replicate output')
      results.push({
        id: `${Date.now()}-0`,
        url: '', // Empty URL to indicate the issue
        prompt: request.params.prompt,
        model: request.modelId,
        timestamp: new Date(),
        metadata: {
          width: request.params.width || 1024,
          height: request.params.height || 1024,
          generationTime,
          cost: cost,
          seed: request.params.seed,
          modelConfig: modelConfig.name,
          provider: modelConfig.provider,
          error: 'No image URLs found in output'
        }
      })
    } else {
      // Process each URL directly (Replicate URLs are already high quality JPEG 95%)
      for (let index = 0; index < imageUrls.length; index++) {
        const url = imageUrls[index]

        results.push({
          id: `${Date.now()}-${index}`,
          url: url, // Use direct Replicate URL (already optimized)
          prompt: request.params.prompt,
          model: request.modelId,
          timestamp: new Date(),
          metadata: {
            width: request.params.width || 1024,
            height: request.params.height || 1024,
            generationTime,
            cost: cost / imageUrls.length,
            seed: request.params.seed,
            modelConfig: modelConfig.name,
            provider: modelConfig.provider,
            // Direct Replicate URL metadata
            storageProvider: 'replicate',
            originalUrl: url,
            optimized: true // Replicate URLs are already optimized JPEG 95%
          }
        })
      }
    }

    return results
  }
}

// Singleton instance
let replicateClient: ReplicateClient | null = null

export function getReplicateClient(apiToken?: string): ReplicateClient {
  if (!replicateClient || apiToken) {
    replicateClient = new ReplicateClient(apiToken)
  }
  return replicateClient
}

// Utility functions for common operations
export async function generateWithReplicate(
  modelId: string,
  params: any,
  apiToken?: string
): Promise<GenerationResponse> {
  const client = getReplicateClient(apiToken)
  return client.generateImage({
    modelId,
    params
  })
}

export function estimateReplicateCost(
  modelId: string,
  params: any,
  apiToken?: string
): CostEstimate {
  const client = getReplicateClient(apiToken)
  return client.estimateCost(modelId, params)
}
