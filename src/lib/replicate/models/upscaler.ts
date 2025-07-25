// Upscaler Models for Minu.AI
// Modular upscaler implementation using Replicate API

import { BaseModelConfig, BaseGenerationResult, ReplicateAPIError, UpscalerConfig } from '../types'
import { MODEL_REGISTRY } from '../config'

export interface UpscalerParams {
  image: string | File // Image URL or File object
  scale?: number // Upscaling factor (usually 2x or 4x)
  face_enhance?: boolean // Enhance faces specifically
  tile?: number // Tile size for processing large images
}

export interface UpscalerResult extends BaseGenerationResult {
  originalImage: string
  upscaledImage: string
  scale: number
  processingTime: number
}

export class UpscalerModel {
  private config: UpscalerConfig
  private replicateModel: string

  constructor(modelId: string) {
    const upscalerModels = MODEL_REGISTRY.upscaling
    const config = upscalerModels[modelId as keyof typeof upscalerModels]
    if (!config) {
      throw new Error(`Upscaler model ${modelId} not found`)
    }
    this.config = config as any

    // Map model IDs to actual Replicate model names
    const modelMapping: Record<string, string> = {
      'real-esrgan': 'xinntao/realesrgan',
      'esrgan': 'xinntao/esrgan',
      'swinir': 'jingyunliang/swinir'
    }

    this.replicateModel = modelMapping[modelId] || modelId
  }

  /**
   * Upscale an image using the selected model
   */
  async upscale(params: UpscalerParams): Promise<UpscalerResult[]> {
    try {
      const startTime = Date.now()
      
      // Convert File to base64 data URL if needed
      let imageInput = params.image
      if (params.image instanceof File) {
        imageInput = await this.fileToDataURL(params.image)
      }

      // Prepare model-specific parameters
      const modelParams = this.prepareModelParams(params, imageInput as string)

      // Make API call to Replicate
      const response = await this.callReplicateAPI(modelParams)
      
      const processingTime = Date.now() - startTime

      // Process response
      const result: UpscalerResult = {
        id: `upscale_${Date.now()}`,
        url: Array.isArray(response.output) ? response.output[0] : response.output,
        prompt: `Upscale image with ${this.config.name}`,
        model: this.config.name,
        timestamp: new Date(),
        originalImage: imageInput as string,
        upscaledImage: Array.isArray(response.output) ? response.output[0] : response.output,
        scale: params.scale || 4,
        processingTime,
        metadata: {
          width: 1024, // Default width - would be extracted from actual image in production
          height: 1024, // Default height - would be extracted from actual image in production
          generationTime: processingTime,
          model: this.config.name,
          provider: this.config.provider,
          parameters: modelParams,
          replicateId: response.id
        }
      }

      return [result]
    } catch (error) {
      throw new ReplicateAPIError(
        `Upscaling failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        500,
        'UPSCALE_ERROR',
        { model: this.config.id, error }
      )
    }
  }

  /**
   * Convert File to data URL
   */
  private fileToDataURL(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  /**
   * Prepare model-specific parameters
   */
  private prepareModelParams(params: UpscalerParams, imageInput: string): Record<string, any> {
    const baseParams = {
      image: imageInput,
      scale: params.scale || 4
    }

    // Model-specific parameter mapping
    switch (this.config.id) {
      case 'real-esrgan':
        return {
          ...baseParams,
          face_enhance: params.face_enhance || false,
          tile: params.tile || 0
        }
      
      case 'esrgan':
        return {
          ...baseParams,
          tile: params.tile || 400
        }
      
      case 'swinir':
        return {
          ...baseParams,
          task: 'real_sr', // Real-world super-resolution
          tile: params.tile || 0,
          tile_overlap: 32
        }
      
      default:
        return baseParams
    }
  }

  /**
   * Call Replicate API
   */
  private async callReplicateAPI(params: Record<string, any>): Promise<any> {
    const apiToken = process.env.REPLICATE_API_TOKEN
    if (!apiToken) {
      throw new Error('REPLICATE_API_TOKEN environment variable is required')
    }

    const response = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version: this.getModelVersion(),
        input: params
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new ReplicateAPIError(
        `Replicate API error: ${response.status} ${response.statusText}`,
        response.status,
        'API_ERROR',
        errorData
      )
    }

    const prediction = await response.json()

    // Poll for completion
    return this.pollForCompletion(prediction.id)
  }

  /**
   * Get model version for Replicate API
   */
  private getModelVersion(): string {
    // These would typically be fetched from Replicate API or stored in config
    const versionMapping: Record<string, string> = {
      'xinntao/realesrgan': 'f121d640bd286e1fdc67f9799164c1d5be36ff74576ee11c803ae5b665dd46aa',
      'xinntao/esrgan': 'f121d640bd286e1fdc67f9799164c1d5be36ff74576ee11c803ae5b665dd46aa',
      'jingyunliang/swinir': 'a01b0512004118f0f3b7b5b2d2e2c5e6e6e6e6e6e6e6e6e6e6e6e6e6e6e6e6e6'
    }
    
    return versionMapping[this.replicateModel] || 'latest'
  }

  /**
   * Poll Replicate API for completion
   */
  private async pollForCompletion(predictionId: string): Promise<any> {
    const apiToken = process.env.REPLICATE_API_TOKEN
    const maxAttempts = 60 // 5 minutes with 5-second intervals
    let attempts = 0

    while (attempts < maxAttempts) {
      const response = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
        headers: {
          'Authorization': `Token ${apiToken}`,
        }
      })

      if (!response.ok) {
        throw new ReplicateAPIError(
          `Failed to check prediction status: ${response.status}`,
          response.status,
          'POLLING_ERROR'
        )
      }

      const prediction = await response.json()

      if (prediction.status === 'succeeded') {
        return prediction
      }

      if (prediction.status === 'failed') {
        throw new ReplicateAPIError(
          `Upscaling failed: ${prediction.error || 'Unknown error'}`,
          500,
          'PREDICTION_FAILED',
          prediction
        )
      }

      if (prediction.status === 'canceled') {
        throw new ReplicateAPIError(
          'Upscaling was canceled',
          500,
          'PREDICTION_CANCELED',
          prediction
        )
      }

      // Wait 5 seconds before next poll
      await new Promise(resolve => setTimeout(resolve, 5000))
      attempts++
    }

    throw new ReplicateAPIError(
      'Upscaling timed out',
      408,
      'TIMEOUT_ERROR'
    )
  }

  /**
   * Get model configuration
   */
  getConfig(): UpscalerConfig {
    return this.config
  }

  /**
   * Check if model is available
   */
  isAvailable(): boolean {
    return this.config.available
  }

  /**
   * Estimate cost for upscaling
   */
  estimateCost(imageSize?: { width: number; height: number }): number {
    // Base cost calculation - this would be more sophisticated in production
    const baseCost = this.config.pricing.costPerSecond || 0.001
    const estimatedTime = this.config.performance.averageTime
    
    // Adjust for image size if provided
    let sizeFactor = 1
    if (imageSize) {
      const pixels = imageSize.width * imageSize.height
      sizeFactor = Math.max(1, pixels / (1024 * 1024)) // Scale based on megapixels
    }
    
    return baseCost * estimatedTime * sizeFactor
  }
}

// Factory functions for each upscaler model
export const createRealESRGAN = () => new UpscalerModel('real-esrgan')
export const createESRGAN = () => new UpscalerModel('esrgan')
export const createSwinIR = () => new UpscalerModel('swinir')

// Model instances registry
export const UPSCALER_MODEL_INSTANCES = {
  'real-esrgan': createRealESRGAN,
  'esrgan': createESRGAN,
  'swinir': createSwinIR
}

// Utility function to create any upscaler model
export function createUpscalerModel(modelId: keyof typeof UPSCALER_MODELS): UpscalerModel {
  return new UpscalerModel(modelId)
}

// Main upscaler service
export class UpscalerService {
  /**
   * Upscale image with specified model
   */
  static async upscaleImage(
    imageFile: File,
    modelId: string,
    options: Partial<UpscalerParams> = {}
  ): Promise<string> {
    const model = createUpscalerModel(modelId as keyof typeof UPSCALER_MODELS)
    
    const params: UpscalerParams = {
      image: imageFile,
      scale: 4,
      ...options
    }
    
    const results = await model.upscale(params)
    return results[0].upscaledImage
  }

  /**
   * Get available upscaler models
   */
  static getAvailableModels() {
    return Object.values(MODEL_REGISTRY.upscaling).filter((model: any) => model.available)
  }

  /**
   * Estimate upscaling cost
   */
  static estimateUpscalingCost(modelId: string, imageSize?: { width: number; height: number }): number {
    const model = createUpscalerModel(modelId as keyof typeof UPSCALER_MODELS)
    return model.estimateCost(imageSize)
  }
}
