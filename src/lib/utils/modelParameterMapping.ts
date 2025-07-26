/**
 * Model-Specific Parameter Mapping Utilities
 * Handles parameter mapping and transformation for different model types
 */

import { ModelParameter } from '@/lib/replicate/realModelData'

export interface ModelParameterMapping {
  modelId: string
  parameterMappings: Record<string, string> // UI param name -> API param name
  imageParameterMappings: {
    single?: string // Parameter name for single image input
    multiple?: string[] // Parameter names for multiple image inputs
    maxImages?: number // Maximum number of images supported
  }
  requiredTransformations?: Record<string, (value: any) => any>
}

/**
 * Model-specific parameter mappings
 */
export const MODEL_PARAMETER_MAPPINGS: ModelParameterMapping[] = [
  // FLUX Models
  {
    modelId: 'flux-dev',
    parameterMappings: {
      'num_inference_steps': 'num_inference_steps',
      'guidance_scale': 'guidance_scale',
      'aspect_ratio': 'aspect_ratio',
      'seed': 'seed',
      'num_outputs': 'num_outputs'
    },
    imageParameterMappings: {
      single: 'image'
    }
  },
  {
    modelId: 'flux-schnell',
    parameterMappings: {
      'num_inference_steps': 'num_inference_steps',
      'guidance_scale': 'guidance_scale',
      'aspect_ratio': 'aspect_ratio',
      'seed': 'seed',
      'num_outputs': 'num_outputs',
      'go_fast': 'go_fast'
    },
    imageParameterMappings: {
      single: 'image'
    }
  },
  {
    modelId: 'flux-kontext-pro',
    parameterMappings: {
      'steps': 'num_inference_steps',
      'guidance': 'guidance_scale',
      'outputs': 'num_outputs'
    },
    imageParameterMappings: {
      single: 'input_image'
    }
  },
  {
    modelId: 'flux-kontext-max',
    parameterMappings: {
      'steps': 'num_inference_steps',
      'guidance': 'guidance_scale',
      'outputs': 'num_outputs'
    },
    imageParameterMappings: {
      single: 'input_image'
    }
  },
  
  // Seedance Models - VERIFIED: Based on actual Replicate API testing
  {
    modelId: 'seedance-1-lite',
    parameterMappings: {
      'duration': 'duration',
      'resolution': 'resolution',
      'aspect_ratio': 'aspect_ratio',
      'seed': 'seed',
      'watermark': 'watermark'
    },
    imageParameterMappings: {
      single: 'image',                    // VERIFIED: Single image input
      multiple: ['image1', 'image2'],     // VERIFIED: Dual image input support
      maxImages: 2                        // VERIFIED: Supports up to 2 images
    }
  },
  {
    modelId: 'seedance-1-pro',
    parameterMappings: {
      'duration': 'duration',
      'resolution': 'resolution',
      'aspect_ratio': 'aspect_ratio',
      'seed': 'seed',
      'watermark': 'watermark'
    },
    imageParameterMappings: {
      single: 'image',                    // VERIFIED: Single image input
      multiple: ['image1', 'image2'],     // VERIFIED: Dual image input support
      maxImages: 2                        // VERIFIED: Supports up to 2 images (same as Lite)
    }
  },
  
  // ByteDance Seedream Models
  {
    modelId: 'seedream-3',
    parameterMappings: {
      'steps': 'num_inference_steps',
      'guidance': 'guidance_scale',
      'outputs': 'num_outputs'
    },
    imageParameterMappings: {
      single: 'image'
    }
  },
  
  // Stability AI Models
  {
    modelId: 'stable-diffusion-3',
    parameterMappings: {
      'steps': 'num_inference_steps',
      'guidance': 'guidance_scale',
      'outputs': 'num_outputs'
    },
    imageParameterMappings: {
      single: 'image'
    }
  }
]

/**
 * Get parameter mapping for a specific model
 */
export function getModelParameterMapping(modelId: string): ModelParameterMapping | null {
  // Try exact match first
  let mapping = MODEL_PARAMETER_MAPPINGS.find(m => m.modelId === modelId)
  
  if (!mapping) {
    // Try partial match for model families
    mapping = MODEL_PARAMETER_MAPPINGS.find(m => 
      modelId.toLowerCase().includes(m.modelId.toLowerCase()) ||
      m.modelId.toLowerCase().includes(modelId.toLowerCase())
    )
  }
  
  return mapping || null
}

/**
 * Transform UI parameters to API parameters for a specific model
 */
export function transformParametersForModel(
  modelId: string,
  uiParameters: Record<string, any>
): Record<string, any> {
  const mapping = getModelParameterMapping(modelId)
  
  if (!mapping) {
    // No specific mapping found, return parameters as-is
    return { ...uiParameters }
  }
  
  const transformedParams: Record<string, any> = {}
  
  // Apply parameter name mappings
  for (const [uiParamName, value] of Object.entries(uiParameters)) {
    const apiParamName = mapping.parameterMappings[uiParamName] || uiParamName
    
    // Apply value transformations if defined
    let transformedValue = value
    if (mapping.requiredTransformations && mapping.requiredTransformations[uiParamName]) {
      transformedValue = mapping.requiredTransformations[uiParamName](value)
    }
    
    transformedParams[apiParamName] = transformedValue
  }
  
  return transformedParams
}

/**
 * Map image parameters for a specific model
 */
export function mapImageParametersForModel(
  modelId: string,
  images: string[]
): Record<string, any> {
  const mapping = getModelParameterMapping(modelId)
  const imageParams: Record<string, any> = {}
  
  if (!mapping || !images || images.length === 0) {
    return imageParams
  }
  
  const { imageParameterMappings } = mapping
  
  if (imageParameterMappings.multiple) {
    // Multi-image model
    const maxImages = imageParameterMappings.maxImages || imageParameterMappings.multiple.length
    for (let i = 0; i < Math.min(images.length, maxImages); i++) {
      const paramName = imageParameterMappings.multiple[i]
      if (paramName) {
        imageParams[paramName] = images[i]
      }
    }
  } else if (imageParameterMappings.single && images.length > 0) {
    // Single-image model
    imageParams[imageParameterMappings.single] = images[0]
  }
  
  return imageParams
}

/**
 * Get supported image parameter names for a model
 */
export function getSupportedImageParameters(modelId: string): string[] {
  const mapping = getModelParameterMapping(modelId)
  
  if (!mapping) {
    return ['image'] // Default fallback
  }
  
  const { imageParameterMappings } = mapping
  
  if (imageParameterMappings.multiple) {
    return imageParameterMappings.multiple
  } else if (imageParameterMappings.single) {
    return [imageParameterMappings.single]
  }
  
  return []
}

/**
 * Check if a model supports multiple images
 */
export function supportsMultipleImages(modelId: string): boolean {
  const mapping = getModelParameterMapping(modelId)
  return !!(mapping?.imageParameterMappings.multiple)
}

/**
 * Get maximum number of images supported by a model
 */
export function getMaxImagesForModel(modelId: string): number {
  const mapping = getModelParameterMapping(modelId)
  
  if (!mapping) {
    return 1 // Default to single image
  }
  
  if (mapping.imageParameterMappings.multiple) {
    return mapping.imageParameterMappings.maxImages || mapping.imageParameterMappings.multiple.length
  } else if (mapping.imageParameterMappings.single) {
    return 1
  }
  
  return 0 // No image support
}

/**
 * Validate parameters against model-specific requirements
 */
export function validateParametersForModel(
  modelId: string,
  parameters: Record<string, any>,
  modelParams: ModelParameter[]
): {
  isValid: boolean
  errors: string[]
  warnings: string[]
} {
  const errors: string[] = []
  const warnings: string[] = []
  
  const mapping = getModelParameterMapping(modelId)
  
  if (!mapping) {
    warnings.push(`No specific parameter mapping found for model: ${modelId}`)
    return { isValid: true, errors, warnings }
  }
  
  // Check for required parameter mappings
  for (const [uiParamName, apiParamName] of Object.entries(mapping.parameterMappings)) {
    if (parameters[uiParamName] !== undefined) {
      const paramDef = modelParams.find(p => p.name === uiParamName)
      if (paramDef?.required && (parameters[uiParamName] === null || parameters[uiParamName] === undefined)) {
        errors.push(`Required parameter ${uiParamName} (maps to ${apiParamName}) is missing`)
      }
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}
