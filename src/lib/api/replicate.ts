/**
 * Replicate API Client for Minu.AI
 * Handles all interactions with Replicate API for image generation, editing, and enhancement
 */

import {
  ReplicateClientConfig,
  ReplicatePrediction,
  ReplicateCreatePredictionRequest,
  ReplicateAPIError,
  ImageGenerationInput,
  VideoGenerationInput,
  ImageEnhanceInput,
  API_ENDPOINTS,
  API_TIMEOUTS,
  API_RETRY_CONFIG,
  isReplicatePrediction
} from './types'

export class ReplicateClient {
  private config: ReplicateClientConfig
  private baseHeaders: Record<string, string>

  constructor(apiKey: string) {
    this.config = {
      baseURL: 'https://api.replicate.com/v1',
      apiKey,
      timeout: API_TIMEOUTS.DEFAULT,
      retries: API_RETRY_CONFIG.MAX_RETRIES,
      retryDelay: API_RETRY_CONFIG.RETRY_DELAY
    }

    this.baseHeaders = {
      'Authorization': `Token ${apiKey}`,
      'Content-Type': 'application/json',
      'User-Agent': 'Minu.AI/1.0'
    }
  }

  /**
   * Make HTTP request with retry logic and error handling
   */
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {},
    timeout: number = this.config.timeout!
  ): Promise<T> {
    const url = `${this.config.baseURL}${endpoint}`
    const requestOptions: RequestInit = {
      ...options,
      headers: {
        ...this.baseHeaders,
        ...options.headers
      }
    }

    let lastError: Error
    
    for (let attempt = 0; attempt <= this.config.retries!; attempt++) {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), timeout)

        const response = await fetch(url, {
          ...requestOptions,
          signal: controller.signal
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new ReplicateAPIError(
            errorData.detail || `HTTP ${response.status}: ${response.statusText}`,
            response.status,
            errorData
          )
        }

        const data = await response.json()
        return data as T
      } catch (error) {
        lastError = error as Error
        
        // Don't retry on client errors (4xx) or abort errors
        if (error instanceof ReplicateAPIError && error.status && error.status < 500) {
          throw error
        }
        
        if (error instanceof Error && error.name === 'AbortError') {
          throw new ReplicateAPIError('Request timeout', 408)
        }

        // Wait before retry (with exponential backoff)
        if (attempt < this.config.retries!) {
          const delay = this.config.retryDelay! * Math.pow(API_RETRY_CONFIG.BACKOFF_MULTIPLIER, attempt)
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }
    }

    throw lastError!
  }

  /**
   * Create a new prediction
   */
  async createPrediction(request: ReplicateCreatePredictionRequest): Promise<ReplicatePrediction> {
    const prediction = await this.makeRequest<ReplicatePrediction>(
      API_ENDPOINTS.REPLICATE.PREDICTIONS,
      {
        method: 'POST',
        body: JSON.stringify(request)
      },
      API_TIMEOUTS.GENERATION
    )

    if (!isReplicatePrediction(prediction)) {
      throw new ReplicateAPIError('Invalid prediction response format')
    }

    return prediction
  }

  /**
   * Get prediction status
   */
  async getPrediction(id: string): Promise<ReplicatePrediction> {
    const prediction = await this.makeRequest<ReplicatePrediction>(
      `${API_ENDPOINTS.REPLICATE.PREDICTIONS}/${id}`
    )

    if (!isReplicatePrediction(prediction)) {
      throw new ReplicateAPIError('Invalid prediction response format')
    }

    return prediction
  }

  /**
   * Cancel a prediction
   */
  async cancelPrediction(id: string): Promise<ReplicatePrediction> {
    const prediction = await this.makeRequest<ReplicatePrediction>(
      `${API_ENDPOINTS.REPLICATE.PREDICTIONS}/${id}/cancel`,
      { method: 'POST' }
    )

    if (!isReplicatePrediction(prediction)) {
      throw new ReplicateAPIError('Invalid prediction response format')
    }

    return prediction
  }

  /**
   * Generate images using specified model
   */
  async generateImage(
    modelVersion: string,
    input: ImageGenerationInput
  ): Promise<ReplicatePrediction> {
    const startTime = Date.now()
    
    const request: ReplicateCreatePredictionRequest = {
      version: modelVersion,
      input: {
        prompt: input.prompt,
        aspect_ratio: input.aspect_ratio || '1:1',
        num_outputs: input.num_outputs || 1,
        guidance_scale: input.guidance_scale || 3.5,
        num_inference_steps: input.num_inference_steps || 28,
        ...(input.seed && { seed: input.seed })
      }
    }

    const prediction = await this.createPrediction(request)
    
    // Cost tracking will be handled at the API route level

    return prediction
  }

  /**
   * Generate videos using video generation models
   */
  async generateVideo(
    modelVersion: string,
    input: VideoGenerationInput
  ): Promise<ReplicatePrediction> {
    const startTime = Date.now()
    
    const request: ReplicateCreatePredictionRequest = {
      version: modelVersion,
      input: {
        prompt: input.prompt,
        ...(input.input_image && { input_image: input.input_image }),
        aspect_ratio: input.aspect_ratio || '16:9',
        duration: input.duration || 5,
        fps: input.fps || 24,
        ...(input.seed && { seed: input.seed })
      }
    }

    const prediction = await this.createPrediction(request)
    
    // Cost tracking will be handled at the API route level

    return prediction
  }

  /**
   * Enhance images using upscaling models
   */
  async enhanceImage(
    modelVersion: string,
    input: ImageEnhanceInput
  ): Promise<ReplicatePrediction> {
    const startTime = Date.now()
    
    const request: ReplicateCreatePredictionRequest = {
      version: modelVersion,
      input: {
        image: input.image,
        scale: input.scale || 4,
        face_enhance: input.face_enhance || false
      }
    }

    const prediction = await this.createPrediction(request)
    
    // Cost tracking will be handled at the API route level

    return prediction
  }

  /**
   * Poll prediction until completion
   */
  async waitForCompletion(
    id: string,
    pollInterval: number = 2000,
    maxWaitTime: number = 300000 // 5 minutes
  ): Promise<ReplicatePrediction> {
    const startTime = Date.now()
    
    while (Date.now() - startTime < maxWaitTime) {
      const prediction = await this.getPrediction(id)
      
      if (prediction.status === 'succeeded' || 
          prediction.status === 'failed' || 
          prediction.status === 'canceled') {
        return prediction
      }
      
      await new Promise(resolve => setTimeout(resolve, pollInterval))
    }
    
    throw new ReplicateAPIError('Prediction timeout - maximum wait time exceeded')
  }

  /**
   * Get account information
   */
  async getAccount(): Promise<any> {
    return this.makeRequest(API_ENDPOINTS.REPLICATE.ACCOUNT)
  }

  /**
   * Validate API key by making a test request
   */
  async validateApiKey(): Promise<boolean> {
    try {
      await this.getAccount()
      return true
    } catch (error) {
      if (error instanceof ReplicateAPIError && error.status === 401) {
        return false
      }
      throw error
    }
  }
}

// Singleton instance
let replicateClient: ReplicateClient | null = null

/**
 * Get or create Replicate client instance
 */
export function getReplicateClient(): ReplicateClient {
  if (!replicateClient) {
    const apiKey = process.env.REPLICATE_API_TOKEN
    if (!apiKey) {
      throw new Error('REPLICATE_API_TOKEN environment variable is required')
    }
    replicateClient = new ReplicateClient(apiKey)
  }
  return replicateClient
}

/**
 * Initialize Replicate client with custom API key
 */
export function initializeReplicateClient(apiKey: string): ReplicateClient {
  replicateClient = new ReplicateClient(apiKey)
  return replicateClient
}

// Export types for convenience
export type {
  ReplicatePrediction,
  ReplicateCreatePredictionRequest,
  ImageGenerationInput,
  VideoGenerationInput,
  ImageEnhanceInput
}
