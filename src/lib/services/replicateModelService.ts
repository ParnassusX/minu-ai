/**
 * Replicate Model Service
 * Fetches real model schemas and capabilities from Replicate API
 */

import { ReplicateModelSchema, ModelParameter } from '@/lib/replicate/realModelData'

interface ReplicateModelVersion {
  id: string
  created_at: string
  cog_version: string
  openapi_schema: {
    components: {
      schemas: {
        Input: {
          type: string
          properties: Record<string, any>
          required?: string[]
        }
        Output: {
          type: string
          [key: string]: any
        }
      }
    }
  }
}

interface ReplicateModel {
  url: string
  owner: string
  name: string
  description: string
  visibility: string
  github_url?: string
  paper_url?: string
  license_url?: string
  cover_image_url?: string
  latest_version: ReplicateModelVersion
}

class ReplicateModelService {
  private baseUrl = 'https://api.replicate.com/v1'
  private cache = new Map<string, ReplicateModelSchema>()
  private cacheExpiry = new Map<string, number>()
  private readonly CACHE_DURATION = 1000 * 60 * 30 // 30 minutes

  /**
   * Fetch model schema from Replicate API
   */
  async fetchModelSchema(owner: string, name: string): Promise<ReplicateModelSchema | null> {
    const cacheKey = `${owner}/${name}`
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      const expiry = this.cacheExpiry.get(cacheKey) || 0
      if (Date.now() < expiry) {
        return this.cache.get(cacheKey) || null
      }
    }

    try {
      const response = await fetch(`${this.baseUrl}/models/${owner}/${name}`, {
        headers: {
          'Authorization': `Token ${process.env.NEXT_PUBLIC_REPLICATE_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        console.warn(`Failed to fetch model ${owner}/${name}: ${response.status}`)
        return null
      }

      const modelData: ReplicateModel = await response.json()
      const schema = this.convertToModelSchema(modelData)
      
      // Cache the result
      this.cache.set(cacheKey, schema)
      this.cacheExpiry.set(cacheKey, Date.now() + this.CACHE_DURATION)
      
      return schema
    } catch (error) {
      console.error(`Error fetching model schema for ${owner}/${name}:`, error)
      return null
    }
  }

  /**
   * Convert Replicate API response to our model schema format
   */
  private convertToModelSchema(modelData: ReplicateModel): ReplicateModelSchema {
    const inputSchema = modelData.latest_version.openapi_schema.components.schemas.Input
    const parameters = this.extractParameters(inputSchema)

    return {
      id: `${modelData.owner}-${modelData.name}`,
      name: modelData.name,
      owner: modelData.owner,
      description: modelData.description,
      category: this.inferCategory(modelData),
      supportedModes: this.inferSupportedModes(inputSchema),
      provider: this.capitalizeProvider(modelData.owner),
      pricing: {
        costPerImage: this.estimateCost(modelData)
      },
      performance: {
        speed: 'medium',
        averageTime: 30.0
      },
      capabilities: this.extractCapabilities(inputSchema),
      parameters: {
        basic: parameters.filter(p => this.isBasicParameter(p.name)),
        intermediate: parameters.filter(p => this.isIntermediateParameter(p.name)),
        advanced: parameters.filter(p => this.isAdvancedParameter(p.name))
      },
      replicateModel: `${modelData.owner}/${modelData.name}`,
      isOfficial: this.isOfficialModel(modelData.owner)
    }
  }

  /**
   * Extract parameters from OpenAPI schema
   */
  private extractParameters(inputSchema: any): ModelParameter[] {
    const parameters: ModelParameter[] = []
    
    if (!inputSchema.properties) return parameters

    for (const [name, prop] of Object.entries(inputSchema.properties)) {
      const property = prop as any
      
      parameters.push({
        name,
        type: this.mapParameterType(property),
        default: property.default || null,
        min: property.minimum,
        max: property.maximum,
        options: property.enum || property.oneOf?.map((opt: any) => opt.const),
        description: property.description || `${name} parameter`,
        required: inputSchema.required?.includes(name) || false
      })
    }

    return parameters
  }

  /**
   * Map OpenAPI types to our parameter types
   */
  private mapParameterType(property: any): ModelParameter['type'] {
    if (property.enum || property.oneOf) return 'select'
    if (property.type === 'number' || property.type === 'integer') {
      return property.minimum !== undefined && property.maximum !== undefined ? 'number' : 'integer'
    }
    if (property.type === 'boolean') return 'select' // We handle booleans as select
    return 'string'
  }

  /**
   * Infer model category from description and name
   */
  private inferCategory(modelData: ReplicateModel): 'image-generation' | 'image-editing' | 'video-generation' | 'upscaling' {
    const name = modelData.name.toLowerCase()
    const description = modelData.description.toLowerCase()

    if (name.includes('video') || description.includes('video')) return 'video-generation'
    if (name.includes('upscal') || description.includes('upscal')) return 'upscaling'
    if (name.includes('edit') || description.includes('edit')) return 'image-editing'
    return 'image-generation'
  }

  /**
   * Infer supported modes from input schema
   */
  private inferSupportedModes(inputSchema: any): ('images' | 'video' | 'enhance')[] {
    const properties = inputSchema.properties || {}

    if (properties.video || properties.duration) return ['video']
    if (properties.scale || properties.upscale) return ['enhance']
    return ['images']
  }

  /**
   * Extract model capabilities from input schema
   */
  private extractCapabilities(inputSchema: any): any {
    const properties = inputSchema.properties || {}
    
    return {
      supportsImageInput: !!(properties.image || properties.input_image),
      supportsMultipleImages: !!(properties.image1 || properties.image2),
      maxImages: this.countImageInputs(properties),
      supportsTextInput: !!properties.prompt,
      supportsVideoOutput: !!(properties.duration || properties.fps),
      supportsImageOutput: true // Most models support image output
    }
  }

  /**
   * Count image input parameters
   */
  private countImageInputs(properties: any): number {
    let count = 0
    for (const key of Object.keys(properties)) {
      if (key.includes('image') || key === 'input_image') count++
    }
    return Math.max(count, 1)
  }

  /**
   * Categorize parameters by complexity
   */
  private isBasicParameter(name: string): boolean {
    const basicParams = ['prompt', 'image', 'input_image', 'aspect_ratio', 'width', 'height', 'num_outputs']
    return basicParams.includes(name)
  }

  private isIntermediateParameter(name: string): boolean {
    const intermediateParams = ['guidance_scale', 'num_inference_steps', 'strength', 'motion_strength']
    return intermediateParams.includes(name)
  }

  private isAdvancedParameter(name: string): boolean {
    const advancedParams = ['seed', 'scheduler', 'lora_scale', 'output_format']
    return advancedParams.includes(name)
  }

  /**
   * Estimate cost based on model type and provider
   */
  private estimateCost(modelData: ReplicateModel): number {
    // Basic cost estimation - would need real pricing data
    if (modelData.owner === 'black-forest-labs') return 0.003
    if (modelData.owner === 'bytedance') return 0.002
    if (modelData.owner === 'stability-ai') return 0.004
    return 0.005
  }

  /**
   * Capitalize provider name
   */
  private capitalizeProvider(owner: string): string {
    const providers: Record<string, string> = {
      'black-forest-labs': 'Black Forest Labs',
      'bytedance': 'ByteDance',
      'stability-ai': 'Stability AI',
      'ideogram-ai': 'Ideogram AI',
      'minimax': 'MiniMax'
    }
    return providers[owner] || owner.charAt(0).toUpperCase() + owner.slice(1)
  }

  /**
   * Check if model is from official provider
   */
  private isOfficialModel(owner: string): boolean {
    const officialProviders = ['black-forest-labs', 'bytedance', 'stability-ai', 'ideogram-ai', 'minimax']
    return officialProviders.includes(owner)
  }

  /**
   * Batch fetch multiple models
   */
  async fetchMultipleModels(models: Array<{owner: string, name: string}>): Promise<ReplicateModelSchema[]> {
    const promises = models.map(({owner, name}) => this.fetchModelSchema(owner, name))
    const results = await Promise.allSettled(promises)
    
    return results
      .filter((result): result is PromiseFulfilledResult<ReplicateModelSchema> => 
        result.status === 'fulfilled' && result.value !== null
      )
      .map(result => result.value)
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear()
    this.cacheExpiry.clear()
  }
}

export const replicateModelService = new ReplicateModelService()
export default replicateModelService
