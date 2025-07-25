// Model Registry and Factory - Central access point for all models
// Provides unified interface for all image generation models

import { BaseGenerationResult, ModelParams, ModelConfig, ModelOption } from '../types'
import { MODEL_REGISTRY, RECOMMENDED_MODELS, MODEL_CATEGORIES, PRICING_TIERS } from '../config'
import { FluxModel, createFluxModel, FLUX_MODEL_INSTANCES } from './flux'

// Model Factory - Creates appropriate model instance
export class ModelFactory {
  /**
   * Create a model instance by ID
   */
  static createModel(modelId: string): any {
    // Check FLUX models
    if (modelId in FLUX_MODEL_INSTANCES) {
      return FLUX_MODEL_INSTANCES[modelId as keyof typeof FLUX_MODEL_INSTANCES]()
    }

    // Add other model types here as they're implemented
    // if (modelId in STABLE_DIFFUSION_MODEL_INSTANCES) {
    //   return STABLE_DIFFUSION_MODEL_INSTANCES[modelId]()
    // }

    throw new Error(`Model ${modelId} not found or not implemented`)
  }

  /**
   * Generate image with any model
   */
  static async generateImage(
    modelId: string,
    params: ModelParams
  ): Promise<BaseGenerationResult[]> {
    const model = this.createModel(modelId)
    return model.generate(params)
  }

  /**
   * Estimate cost for any model
   */
  static estimateCost(modelId: string, params: ModelParams): number {
    const model = this.createModel(modelId)
    return model.estimateCost(params)
  }

  /**
   * Get model configuration
   */
  static getModelConfig(modelId: string): ModelConfig | null {
    for (const category of Object.values(MODEL_REGISTRY)) {
      if (category[modelId]) {
        return category[modelId]
      }
    }
    return null
  }

  /**
   * Check if model is available
   */
  static isModelAvailable(modelId: string): boolean {
    const config = this.getModelConfig(modelId)
    return config ? config.available : false
  }
}

// Model Selection Helpers
export class ModelUtils {
  /**
   * Get all available models as options for UI
   */
  static getModelOptions(): ModelOption[] {
    const options: ModelOption[] = []

    Object.values(MODEL_REGISTRY).forEach(category => {
      Object.values(category).forEach(config => {
        if (config.available) {
          options.push({
            id: config.id,
            name: config.name,
            description: config.description,
            provider: config.provider,
            category: config.category,
            pricing: {
              display: config.pricing.costPerImage 
                ? `$${config.pricing.costPerImage.toFixed(3)}/image`
                : `$${config.pricing.costPerSecond?.toFixed(6)}/sec`,
              costPerImage: config.pricing.costPerImage
            },
            capabilities: {
              maxResolution: config.capabilities.maxResolution,
              features: config.capabilities.features
            },
            performance: config.performance,
            available: config.available,
            recommended: Object.values(RECOMMENDED_MODELS).includes(config.id),
            popular: MODEL_CATEGORIES['Popular']?.includes(config.id) || false
          })
        }
      })
    })

    return options.sort((a, b) => {
      // Sort by: recommended first, then by cost
      if (a.recommended && !b.recommended) return -1
      if (!a.recommended && b.recommended) return 1
      
      const aCost = a.pricing.costPerImage || 0
      const bCost = b.pricing.costPerImage || 0
      return aCost - bCost
    })
  }

  /**
   * Get models by category
   */
  static getModelsByCategory(): Record<string, ModelOption[]> {
    const allOptions = this.getModelOptions()
    const categorized: Record<string, ModelOption[]> = {}

    Object.entries(MODEL_CATEGORIES).forEach(([categoryName, modelIds]) => {
      categorized[categoryName] = allOptions.filter(option => 
        modelIds.includes(option.id)
      )
    })

    return categorized
  }

  /**
   * Get models by pricing tier
   */
  static getModelsByPricingTier(): Record<string, ModelOption[]> {
    const allOptions = this.getModelOptions()
    const byTier: Record<string, ModelOption[]> = {}

    Object.entries(PRICING_TIERS).forEach(([tierName, tier]) => {
      byTier[tierName] = allOptions.filter(option => {
        const cost = option.pricing.costPerImage || 0
        return cost <= tier.max && (
          tierName === 'ultra' || 
          cost > (Object.values(PRICING_TIERS).find(t => 
            Object.keys(PRICING_TIERS).indexOf(Object.keys(PRICING_TIERS).find(k => 
              PRICING_TIERS[k as keyof typeof PRICING_TIERS] === t
            )!) < Object.keys(PRICING_TIERS).indexOf(tierName)
          )?.max || 0)
        )
      })
    })

    return byTier
  }

  /**
   * Get recommended model for specific use case
   */
  static getRecommendedModel(useCase: keyof typeof RECOMMENDED_MODELS): ModelOption | null {
    const modelId = RECOMMENDED_MODELS[useCase]
    const allOptions = this.getModelOptions()
    return allOptions.find(option => option.id === modelId) || null
  }

  /**
   * Find best model based on criteria
   */
  static findBestModel(criteria: {
    maxCost?: number
    minQuality?: 'standard' | 'high' | 'premium'
    maxTime?: number
    features?: string[]
  }): ModelOption | null {
    const options = this.getModelOptions()
    
    const filtered = options.filter(option => {
      // Cost filter
      if (criteria.maxCost && option.pricing.costPerImage && option.pricing.costPerImage > criteria.maxCost) {
        return false
      }

      // Quality filter
      if (criteria.minQuality) {
        const qualityOrder = ['standard', 'high', 'premium']
        const minIndex = qualityOrder.indexOf(criteria.minQuality)
        const optionIndex = qualityOrder.indexOf(option.performance.quality)
        if (optionIndex < minIndex) return false
      }

      // Time filter (approximate)
      if (criteria.maxTime) {
        const config = ModelFactory.getModelConfig(option.id)
        if (config && config.performance.averageTime > criteria.maxTime) {
          return false
        }
      }

      // Features filter
      if (criteria.features) {
        const hasAllFeatures = criteria.features.every(feature =>
          option.capabilities.features.some(f => 
            f.toLowerCase().includes(feature.toLowerCase())
          )
        )
        if (!hasAllFeatures) return false
      }

      return true
    })

    // Return the best match (recommended first, then cheapest)
    return filtered.sort((a, b) => {
      if (a.recommended && !b.recommended) return -1
      if (!a.recommended && b.recommended) return 1
      return (a.pricing.costPerImage || 0) - (b.pricing.costPerImage || 0)
    })[0] || null
  }
}

// Export main interfaces
export { ModelFactory as Models }
export * from './flux'

// Convenience exports
export const generateImage = ModelFactory.generateImage
export const estimateCost = ModelFactory.estimateCost
export const getModelConfig = ModelFactory.getModelConfig
export const isModelAvailable = ModelFactory.isModelAvailable
export const getModelOptions = ModelUtils.getModelOptions
export const getModelsByCategory = ModelUtils.getModelsByCategory
export const findBestModel = ModelUtils.findBestModel
