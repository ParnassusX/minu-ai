// Cost Estimation Service for AI Models
import type { CostEstimate } from '@/types/cost-tracking'

// Model pricing configuration (costs in USD)
export const MODEL_PRICING = {
  // FLUX Models
  'flux-schnell': {
    base_cost: 0.003,
    cost_per_image: 0.003,
    cost_type: 'per_image' as const
  },
  'flux-dev': {
    base_cost: 0.025,
    cost_per_image: 0.025,
    cost_type: 'per_image' as const
  },
  'flux-pro': {
    base_cost: 0.04,
    cost_per_image: 0.04,
    cost_type: 'per_image' as const
  },
  'flux-ultra': {
    base_cost: 0.06,
    cost_per_image: 0.06,
    cost_type: 'per_image' as const
  },
  'flux-kontext-dev': {
    base_cost: 0.025,
    cost_per_image: 0.025,
    cost_type: 'per_image' as const
  },
  'flux-kontext-pro': {
    base_cost: 0.045,
    cost_per_image: 0.045,
    cost_type: 'per_image' as const
  },
  'flux-kontext-max': {
    base_cost: 0.055,
    cost_per_image: 0.055,
    cost_type: 'per_image' as const
  },

  // Ideogram Models
  'ideogram-v2': {
    base_cost: 0.008,
    cost_per_second: 0.000975,
    cost_type: 'per_second' as const
  },
  'seedream-3': {
    base_cost: 0.01,
    cost_per_second: 0.0012,
    cost_type: 'per_second' as const
  },

  // ByteDance Models
  'sdxl-lightning-4step': {
    base_cost: 0.0035,
    cost_per_image: 0.0035,
    cost_type: 'per_image' as const
  },
  'seedance-1-lite': {
    base_cost: 0.02,
    cost_per_second: 0.02,
    cost_type: 'per_second' as const
  },
  'seedance-1-pro': {
    base_cost: 0.08,
    cost_per_second: 0.08,
    cost_type: 'per_second' as const
  },

  // Video Models
  'minimax-video-01': {
    base_cost: 0.05,
    cost_per_second: 0.05,
    cost_type: 'per_second' as const
  },
  'stable-video-diffusion': {
    base_cost: 0.03,
    cost_per_second: 0.03,
    cost_type: 'per_second' as const
  },

  // Upscaler Models
  'real-esrgan': {
    base_cost: 0.00023,
    cost_per_second: 0.00023,
    cost_type: 'per_second' as const
  },
  'esrgan': {
    base_cost: 0.00023,
    cost_per_second: 0.00023,
    cost_type: 'per_second' as const
  }
} as const

// Cost multipliers for different parameters
export const COST_MULTIPLIERS = {
  // Resolution multipliers
  resolution: {
    '512x512': 1.0,
    '768x768': 1.2,
    '1024x1024': 1.5,
    '1280x720': 1.3,
    '1920x1080': 2.0,
    '2048x2048': 3.0
  },
  
  // Quality multipliers
  quality: {
    low: 0.8,
    medium: 1.0,
    high: 1.3,
    ultra: 1.8
  },
  
  // Batch size multipliers (economies of scale)
  batch_size: {
    1: 1.0,
    2: 1.9,
    3: 2.7,
    4: 3.5,
    5: 4.2,
    6: 4.8,
    7: 5.4,
    8: 6.0
  },
  
  // Priority multipliers
  priority: {
    normal: 1.0,
    high: 1.5,
    urgent: 2.0
  }
} as const

export class CostEstimationService {
  /**
   * Estimate cost for image generation
   */
  static estimateImageCost(
    model: string,
    parameters: {
      num_outputs?: number
      width?: number
      height?: number
      quality?: string
      priority?: string
      num_inference_steps?: number
    } = {}
  ): CostEstimate {
    const modelPricing = MODEL_PRICING[model as keyof typeof MODEL_PRICING]
    
    if (!modelPricing) {
      throw new Error(`Unknown model: ${model}`)
    }

    const numOutputs = parameters.num_outputs || 1
    const resolution = `${parameters.width || 1024}x${parameters.height || 1024}`
    const quality = parameters.quality || 'medium'
    const priority = parameters.priority || 'normal'

    // Base cost calculation
    let baseCost = modelPricing.base_cost * numOutputs

    // Apply resolution multiplier
    const resolutionMultiplier = COST_MULTIPLIERS.resolution[resolution as keyof typeof COST_MULTIPLIERS.resolution] || 1.0
    
    // Apply quality multiplier
    const qualityMultiplier = COST_MULTIPLIERS.quality[quality as keyof typeof COST_MULTIPLIERS.quality] || 1.0
    
    // Apply batch size multiplier
    const batchMultiplier = COST_MULTIPLIERS.batch_size[numOutputs as keyof typeof COST_MULTIPLIERS.batch_size] || numOutputs
    
    // Apply priority multiplier
    const priorityMultiplier = COST_MULTIPLIERS.priority[priority as keyof typeof COST_MULTIPLIERS.priority] || 1.0

    // Calculate costs
    const adjustedBaseCost = baseCost * resolutionMultiplier * qualityMultiplier
    const parameterCost = adjustedBaseCost * (batchMultiplier / numOutputs - 1)
    const priorityCost = adjustedBaseCost * (priorityMultiplier - 1)

    const totalCost = adjustedBaseCost + parameterCost + priorityCost

    return {
      model,
      estimated_cost: Math.round(totalCost * 10000) / 10000, // Round to 4 decimal places
      cost_breakdown: {
        base_cost: Math.round(adjustedBaseCost * 10000) / 10000,
        parameter_cost: Math.round(parameterCost * 10000) / 10000,
        priority_cost: Math.round(priorityCost * 10000) / 10000
      },
      cost_factors: {
        resolution,
        quality_settings: quality,
        batch_size: numOutputs
      }
    }
  }

  /**
   * Estimate cost for video generation
   */
  static estimateVideoCost(
    model: string,
    parameters: {
      duration?: number
      fps?: number
      width?: number
      height?: number
      quality?: string
      priority?: string
    } = {}
  ): CostEstimate {
    const modelPricing = MODEL_PRICING[model as keyof typeof MODEL_PRICING]
    
    if (!modelPricing) {
      throw new Error(`Unknown model: ${model}`)
    }

    const duration = parameters.duration || 6 // seconds
    const resolution = `${parameters.width || 1280}x${parameters.height || 720}`
    const quality = parameters.quality || 'medium'
    const priority = parameters.priority || 'normal'

    // Base cost calculation (per second)
    let baseCost = ('cost_per_second' in modelPricing ? modelPricing.cost_per_second : modelPricing.base_cost) * duration

    // Apply resolution multiplier
    const resolutionMultiplier = COST_MULTIPLIERS.resolution[resolution as keyof typeof COST_MULTIPLIERS.resolution] || 1.0
    
    // Apply quality multiplier
    const qualityMultiplier = COST_MULTIPLIERS.quality[quality as keyof typeof COST_MULTIPLIERS.quality] || 1.0
    
    // Apply priority multiplier
    const priorityMultiplier = COST_MULTIPLIERS.priority[priority as keyof typeof COST_MULTIPLIERS.priority] || 1.0

    // Calculate costs
    const adjustedBaseCost = baseCost * resolutionMultiplier * qualityMultiplier
    const parameterCost = 0 // No additional parameter costs for video
    const priorityCost = adjustedBaseCost * (priorityMultiplier - 1)

    const totalCost = adjustedBaseCost + parameterCost + priorityCost

    return {
      model,
      estimated_cost: Math.round(totalCost * 10000) / 10000,
      cost_breakdown: {
        base_cost: Math.round(adjustedBaseCost * 10000) / 10000,
        parameter_cost: Math.round(parameterCost * 10000) / 10000,
        priority_cost: Math.round(priorityCost * 10000) / 10000
      },
      cost_factors: {
        resolution,
        duration,
        quality_settings: quality
      }
    }
  }

  /**
   * Estimate cost for image editing
   */
  static estimateImageEditCost(
    model: string,
    parameters: {
      width?: number
      height?: number
      quality?: string
      priority?: string
    } = {}
  ): CostEstimate {
    // Image editing typically costs similar to image generation
    return this.estimateImageCost(model, { ...parameters, num_outputs: 1 })
  }

  /**
   * Estimate cost for upscaling
   */
  static estimateUpscaleCost(
    model: string,
    parameters: {
      input_width?: number
      input_height?: number
      scale_factor?: number
      priority?: string
    } = {}
  ): CostEstimate {
    const modelPricing = MODEL_PRICING[model as keyof typeof MODEL_PRICING]
    
    if (!modelPricing) {
      throw new Error(`Unknown model: ${model}`)
    }

    const inputWidth = parameters.input_width || 512
    const inputHeight = parameters.input_height || 512
    const scaleFactor = parameters.scale_factor || 4
    const priority = parameters.priority || 'normal'

    // Estimate processing time based on input size and scale factor
    const inputPixels = inputWidth * inputHeight
    const outputPixels = inputPixels * (scaleFactor * scaleFactor)
    const estimatedSeconds = Math.max(2, Math.ceil(outputPixels / 1000000)) // Rough estimate

    // Base cost calculation
    let baseCost = ('cost_per_second' in modelPricing ? modelPricing.cost_per_second : modelPricing.base_cost) * estimatedSeconds

    // Apply priority multiplier
    const priorityMultiplier = COST_MULTIPLIERS.priority[priority as keyof typeof COST_MULTIPLIERS.priority] || 1.0

    // Calculate costs
    const priorityCost = baseCost * (priorityMultiplier - 1)
    const totalCost = baseCost + priorityCost

    return {
      model,
      estimated_cost: Math.round(totalCost * 10000) / 10000,
      cost_breakdown: {
        base_cost: Math.round(baseCost * 10000) / 10000,
        parameter_cost: 0,
        priority_cost: Math.round(priorityCost * 10000) / 10000
      },
      cost_factors: {
        resolution: `${inputWidth}x${inputHeight} → ${inputWidth * scaleFactor}x${inputHeight * scaleFactor}`
      }
    }
  }

  /**
   * Get available models with their base costs
   */
  static getModelPricing(): Array<{ model: string; base_cost: number; cost_type: string }> {
    return Object.entries(MODEL_PRICING).map(([model, pricing]) => ({
      model,
      base_cost: pricing.base_cost,
      cost_type: pricing.cost_type
    }))
  }

  /**
   * Compare costs between different models for the same parameters
   */
  static compareModelCosts(
    models: string[],
    generationType: 'image' | 'video' | 'upscale',
    parameters: Record<string, any> = {}
  ): Array<CostEstimate & { model: string }> {
    const estimates: Array<CostEstimate & { model: string }> = []

    for (const model of models) {
      try {
        let estimate: CostEstimate

        switch (generationType) {
          case 'image':
            estimate = this.estimateImageCost(model, parameters)
            break
          case 'video':
            estimate = this.estimateVideoCost(model, parameters)
            break
          case 'upscale':
            estimate = this.estimateUpscaleCost(model, parameters)
            break
          default:
            continue
        }

        estimates.push({ ...estimate, model })
      } catch (error) {
        console.warn(`Could not estimate cost for model ${model}:`, error)
      }
    }

    // Sort by estimated cost (ascending)
    return estimates.sort((a, b) => a.estimated_cost - b.estimated_cost)
  }

  /**
   * Calculate potential savings with batch processing
   */
  static calculateBatchSavings(
    model: string,
    singleImageCost: number,
    batchSize: number
  ): { total_cost: number; cost_per_image: number; savings: number; savings_percentage: number } {
    const batchMultiplier = COST_MULTIPLIERS.batch_size[batchSize as keyof typeof COST_MULTIPLIERS.batch_size] || batchSize
    const batchCost = singleImageCost * batchMultiplier
    const individualCost = singleImageCost * batchSize
    const savings = individualCost - batchCost
    const savingsPercentage = (savings / individualCost) * 100

    return {
      total_cost: Math.round(batchCost * 10000) / 10000,
      cost_per_image: Math.round((batchCost / batchSize) * 10000) / 10000,
      savings: Math.round(savings * 10000) / 10000,
      savings_percentage: Math.round(savingsPercentage * 100) / 100
    }
  }
}

// Simple function for backward compatibility
export function estimateCost(model: string, parameters: Record<string, any>): number {
  try {
    // Determine generation type based on parameters
    if (parameters.duration || parameters.fps) {
      const estimate = CostEstimationService.estimateVideoCost(model, parameters);
      return estimate.estimated_cost;
    } else if (parameters.scale_factor) {
      const estimate = CostEstimationService.estimateUpscaleCost(model, parameters);
      return estimate.estimated_cost;
    } else {
      const estimate = CostEstimationService.estimateImageCost(model, parameters);
      return estimate.estimated_cost;
    }
  } catch (error) {
    console.warn(`Could not estimate cost for model ${model}:`, error);
    return 0.005; // Default fallback cost
  }
}