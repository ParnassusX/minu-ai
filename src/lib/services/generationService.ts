/**
 * Generation Service
 * Handles end-to-end generation workflow with Replicate API and Cloudinary storage
 */

import { ReplicateModelSchema } from '@/lib/replicate/realModelData'
import { transformParametersForModel, mapImageParametersForModel } from '@/lib/utils/modelParameterMapping'


interface GenerationRequest {
  model: ReplicateModelSchema
  prompt: string
  parameters: Record<string, any>
  images?: string[] | null  // Changed to accept URLs instead of Files
  mode: 'images' | 'video' | 'enhance'
}

interface GenerationResult {
  id: string
  status: 'pending' | 'processing' | 'succeeded' | 'failed' | 'canceled'
  output?: string | string[]
  error?: string
  progress?: number
  logs?: string
  urls?: {
    get: string
    cancel: string
  }
}

interface StoredResult {
  id: string
  originalUrl: string
  cloudinaryUrl: string
  publicId: string
  metadata: {
    model: string
    prompt: string
    parameters: Record<string, any>
    mode: string
    createdAt: string
  }
}

class GenerationService {
  private baseUrl = 'https://api.replicate.com/v1'
  private cloudinaryUrl = `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}`

  /**
   * Start a new generation
   */
  async startGeneration(request: GenerationRequest): Promise<GenerationResult> {
    try {
      // Prepare input parameters
      const input = await this.prepareInput(request)

      // Call the Next.js API route instead of Replicate directly
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: request.model.replicateModel,
          input
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `API error: ${response.status}`)
      }

      const apiResult = await response.json()

      // Handle the API route response format
      if (apiResult.success && apiResult.data) {
        return {
          id: apiResult.data.id,
          status: apiResult.data.status,
          output: apiResult.data.output,
          error: apiResult.data.error,
          urls: apiResult.data.urls
        }
      } else {
        throw new Error(apiResult.error || 'Generation failed')
      }
    } catch (error) {
      console.error('Generation failed:', error)
      throw error
    }
  }

  /**
   * Check generation status
   */
  async checkStatus(predictionId: string): Promise<GenerationResult> {
    try {
      const response = await fetch(`${this.baseUrl}/predictions/${predictionId}`, {
        headers: {
          'Authorization': `Token ${process.env.NEXT_PUBLIC_REPLICATE_API_TOKEN}`,
        }
      })

      if (!response.ok) {
        throw new Error(`Failed to check status: ${response.status}`)
      }

      const result = await response.json()
      
      return {
        id: result.id,
        status: result.status,
        output: result.output,
        error: result.error,
        progress: this.calculateProgress(result.status, result.logs),
        logs: result.logs,
        urls: result.urls
      }
    } catch (error) {
      console.error('Status check failed:', error)
      throw error
    }
  }

  /**
   * Store result in Cloudinary and return permanent URLs
   */
  async storeResult(result: GenerationResult, metadata: any): Promise<StoredResult[]> {
    if (!result.output || result.status !== 'succeeded') {
      throw new Error('No output to store')
    }

    const outputs = Array.isArray(result.output) ? result.output : [result.output]
    const storedResults: StoredResult[] = []

    for (const [index, outputUrl] of outputs.entries()) {
      try {
        // Upload to Cloudinary
        const uploadResponse = await fetch('/api/upload-to-cloudinary', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: outputUrl,
            folder: 'minu-ai/generations',
            public_id: `${result.id}_${index}`,
            context: {
              model: metadata.model,
              prompt: metadata.prompt,
              mode: metadata.mode,
              created_at: new Date().toISOString()
            }
          })
        })

        if (!uploadResponse.ok) {
          console.warn(`Failed to upload result ${index} to Cloudinary`)
          continue
        }

        const uploadResult = await uploadResponse.json()
        
        storedResults.push({
          id: `${result.id}_${index}`,
          originalUrl: outputUrl,
          cloudinaryUrl: uploadResult.secure_url,
          publicId: uploadResult.public_id,
          metadata: {
            model: metadata.model,
            prompt: metadata.prompt,
            parameters: metadata.parameters,
            mode: metadata.mode,
            createdAt: new Date().toISOString()
          }
        })
      } catch (error) {
        console.error(`Failed to store result ${index}:`, error)
      }
    }

    return storedResults
  }

  /**
   * Save to gallery
   */
  async saveToGallery(storedResults: StoredResult[]): Promise<void> {
    try {
      const response = await fetch('/api/gallery/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          results: storedResults
        })
      })

      if (!response.ok) {
        console.warn('Failed to save to gallery')
      }
    } catch (error) {
      console.error('Gallery save failed:', error)
    }
  }

  /**
   * Complete generation workflow
   */
  async completeGeneration(request: GenerationRequest): Promise<{
    result: GenerationResult
    storedResults: StoredResult[]
  }> {
    try {
      // Prepare input parameters
      const input = await this.prepareInput(request)

      // Map from full Replicate model name to legacy model ID
      const modelIdMapping: Record<string, string> = {
        'black-forest-labs/flux-schnell': 'flux-schnell',
        'black-forest-labs/flux-dev': 'flux-dev',
        'black-forest-labs/flux-1.1-pro': 'flux-pro',
        'fofr/flux-kontext-pro': 'flux-kontext-pro',
        'fofr/flux-kontext-max': 'flux-kontext-max',
        'seedream/seedream-3': 'seedream-3',
        'stability-ai/stable-diffusion-3-5-large': 'sd-3.5-large',
        'stability-ai/stable-diffusion-3-5-large-turbo': 'sd-3.5-large-turbo'
      }

      const legacyModelId = modelIdMapping[request.model.replicateModel] || 'flux-dev'

      // Use legacy format to get complete workflow with storage
      const requestBody = {
        prompt: request.prompt,
        modelId: legacyModelId,
        ...input // Spread the prepared input parameters
      }

      // Call the Next.js API route which handles the complete workflow
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `API error: ${response.status}`)
      }

      const apiResult = await response.json()

      if (!apiResult.success) {
        throw new Error(apiResult.error || 'Generation failed')
      }

      // Check if we have images in the response
      if (!apiResult.images || !Array.isArray(apiResult.images)) {
        throw new Error('No images returned from API')
      }

      // Transform API response to our expected format
      const result: GenerationResult = {
        id: `gen-${Date.now()}`,
        status: 'succeeded',
        output: apiResult.images.map((img: any) => img.url),
        progress: 100
      }

      // Transform stored images to StoredResult format
      const storedResults: StoredResult[] = apiResult.images.map((img: any, index: number) => ({
        id: img.id || `result-${index}`,
        originalUrl: img.originalUrl || img.url,
        cloudinaryUrl: img.url,
        publicId: img.publicId || `gen-${Date.now()}-${index}`,
        databaseId: img.id,
        format: img.format || 'jpg',
        metadata: {
          model: request.model.name,
          prompt: request.prompt,
          parameters: request.parameters,
          mode: request.mode,
          createdAt: new Date().toISOString(),
          width: img.metadata?.width,
          height: img.metadata?.height
        }
      }))

      // Upload to persistent storage (Cloudinary with Supabase fallback) and auto-save to gallery
      if (storedResults.length > 0) {
        try {
          // Upload each image to persistent storage with intelligent fallback
          const persistentResults = await Promise.all(
            storedResults.map(async (result, index) => {
              try {
                const uploadResponse = await fetch('/api/unified-storage', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({
                    url: result.originalUrl,
                    metadata: {
                      originalUrl: result.originalUrl,
                      filename: `generated-${Date.now()}-${index}.jpg`, // Force JPEG for luxury quality
                      mimeType: 'image/jpeg', // Force JPEG MIME type for high quality
                      width: result.metadata.width,
                      height: result.metadata.height,
                      generatedAt: result.metadata.createdAt,
                      modelUsed: result.metadata.model,
                      prompt: result.metadata.prompt
                    }
                  })
                })

                if (uploadResponse.ok) {
                  const storageResult = await uploadResponse.json()

                  if (storageResult.success && storageResult.data) {
                    // Update the result with persistent storage URL
                    return {
                      ...result,
                      cloudinaryUrl: storageResult.data.secureUrl || storageResult.data.url,
                      publicId: storageResult.data.publicId || storageResult.data.path,
                      metadata: {
                        ...result.metadata,
                        isPermanent: storageResult.data.persistent,
                        storageProvider: storageResult.data.provider
                      }
                    }
                  }
                }

                // If storage fails, keep original result
                console.warn(`Failed to upload image ${index} to persistent storage`)
                return result
              } catch (uploadError) {
                console.error(`Error uploading image ${index} to persistent storage:`, uploadError)
                return result
              }
            })
          )

          // Save to gallery with updated URLs
          const saveResponse = await fetch('/api/gallery/save', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              results: persistentResults
            })
          })

          if (saveResponse.ok) {
            const saveData = await saveResponse.json()
            console.log(`Auto-saved ${saveData.saved} images to gallery with persistent storage URLs`)
          } else {
            console.warn('Failed to auto-save images to gallery:', saveResponse.status)
          }
        } catch (saveError) {
          console.error('Error auto-saving to gallery:', saveError)
        }
      }

      return { result, storedResults }
    } catch (error) {
      console.error('Generation failed:', error)
      throw error
    }
  }

  /**
   * Prepare input parameters for Replicate API with proper validation and transformation
   */
  private async prepareInput(request: GenerationRequest): Promise<Record<string, any>> {
    const input: Record<string, any> = {
      prompt: request.prompt
    }

    // Get all model parameters for validation
    const allModelParams = [
      ...request.model.parameters.basic,
      ...request.model.parameters.intermediate,
      ...request.model.parameters.advanced
    ]

    // Transform and validate each parameter
    const validatedParams: Record<string, any> = {}
    for (const [paramName, paramValue] of Object.entries(request.parameters)) {
      const paramDef = allModelParams.find(p => p.name === paramName)

      if (paramDef && paramValue !== null && paramValue !== undefined) {
        // Type conversion and validation
        const transformedValue = this.transformParameterValue(paramValue, paramDef)
        if (transformedValue !== null) {
          validatedParams[paramName] = transformedValue
        }
      }
    }

    // Apply model-specific parameter transformations
    const modelSpecificParams = transformParametersForModel(request.model.id, validatedParams)
    Object.assign(input, modelSpecificParams)

    // Handle image URLs with model-specific mapping
    if (request.images && request.images.length > 0) {
      const imageParams = mapImageParametersForModel(request.model.id, request.images)
      Object.assign(input, imageParams)
    }

    return input
  }

  /**
   * Transform parameter value based on parameter definition
   */
  private transformParameterValue(value: any, paramDef: any): any {
    if (value === null || value === undefined || value === '') {
      return paramDef.required ? paramDef.default : null
    }

    switch (paramDef.type) {
      case 'integer':
        const intValue = parseInt(value, 10)
        if (isNaN(intValue)) return paramDef.default
        if (paramDef.min !== undefined && intValue < paramDef.min) return paramDef.min
        if (paramDef.max !== undefined && intValue > paramDef.max) return paramDef.max
        return intValue

      case 'number':
        const numValue = parseFloat(value)
        if (isNaN(numValue)) return paramDef.default
        if (paramDef.min !== undefined && numValue < paramDef.min) return paramDef.min
        if (paramDef.max !== undefined && numValue > paramDef.max) return paramDef.max
        return numValue

      case 'boolean':
        return Boolean(value)

      case 'select':
        if (paramDef.options && paramDef.options.includes(value)) {
          return value
        }
        return paramDef.default

      case 'string':
      default:
        return String(value)
    }
  }



  /**
   * Convert file to base64
   */
  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  /**
   * Calculate progress from status and logs
   */
  private calculateProgress(status: string, logs?: string): number {
    switch (status) {
      case 'starting': return 10
      case 'processing': 
        // Try to extract progress from logs
        if (logs) {
          const progressMatch = logs.match(/(\d+)%/)
          if (progressMatch) {
            return parseInt(progressMatch[1])
          }
        }
        return 50
      case 'succeeded': return 100
      case 'failed':
      case 'canceled': return 0
      default: return 0
    }
  }

  /**
   * Cancel generation
   */
  async cancelGeneration(predictionId: string): Promise<void> {
    try {
      await fetch(`${this.baseUrl}/predictions/${predictionId}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${process.env.NEXT_PUBLIC_REPLICATE_API_TOKEN}`,
        }
      })
    } catch (error) {
      console.error('Cancel failed:', error)
    }
  }
}

export const generationService = new GenerationService()
export default generationService
