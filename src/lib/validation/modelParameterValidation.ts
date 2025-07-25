/**
 * Dynamic Model Parameter Validation
 * Validates parameters based on model schemas and provides UI hints
 */

import { ReplicateModelSchema, ModelParameter, REAL_MODEL_DATA } from '@/lib/replicate/realModelData'

export interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

export interface ParameterUIConfig {
  showImageUpload: boolean
  maxImages: number
  imageLabels: string[]
  requiredParameters: string[]
  conditionalParameters: Record<string, string[]> // parameter -> dependent parameters
}

/**
 * Get model schema by ID
 */
export function getModelSchema(modelId: string): ReplicateModelSchema | null {
  return Object.values(REAL_MODEL_DATA).flat().find((model: any) => model.id === modelId) || null
}

/**
 * Filter out prompt parameters to prevent duplicate prompt interfaces
 * This ensures the main prompt textarea is the single source of truth for prompts
 * IMPORTANT: Only filters main prompt parameters, not image-related parameters
 */
export function filterPromptParameters(parameters: ModelParameter[]): ModelParameter[] {
  return parameters.filter(param => {
    // Keep image-related parameters even if they contain 'prompt' in the name
    if (param.name.includes('image') || param.name.includes('frame') || param.name.includes('reference')) {
      return true
    }

    // Filter out main prompt parameters that duplicate the main prompt textarea
    return param.name !== 'prompt' &&
           param.name !== 'text_prompt' &&
           param.name !== 'description'
  })
}

/**
 * Get UI-safe parameters for a model (excludes prompt parameters)
 */
export function getUIParameters(modelId: string): {
  basic: ModelParameter[]
  intermediate: ModelParameter[]
  advanced: ModelParameter[]
} {
  const schema = getModelSchema(modelId)
  if (!schema) {
    return { basic: [], intermediate: [], advanced: [] }
  }

  return {
    basic: filterPromptParameters(schema.parameters.basic),
    intermediate: filterPromptParameters(schema.parameters.intermediate),
    advanced: filterPromptParameters(schema.parameters.advanced)
  }
}

/**
 * Get default parameter values for a model
 */
export function getModelDefaults(modelId: string): Record<string, any> {
  const schema = getModelSchema(modelId)
  if (!schema) {
    return {}
  }

  const defaults: Record<string, any> = {}

  // Collect defaults from all parameter levels
  const allParams = [
    ...schema.parameters.basic,
    ...schema.parameters.intermediate,
    ...schema.parameters.advanced
  ]

  allParams.forEach(param => {
    if (param.default !== undefined && param.default !== null) {
      defaults[param.name] = param.default
    }
  })

  return defaults
}

/**
 * Check if a model supports image input based on authoritative schema analysis
 */
export function modelSupportsImageInput(modelId: string): boolean {
  const schema = getModelSchema(modelId)
  if (!schema) {
    return false
  }

  // Based on our authoritative Replicate schema analysis:
  // - FLUX models (flux-schnell, flux-dev, flux-pro) are text-to-image only
  // - Video models may support image input
  // - Upscaling models require image input

  if (modelId.includes('flux')) {
    return false // FLUX models are text-to-image only
  }

  if (modelId.includes('video')) {
    return true // Video models typically support image input
  }

  if (modelId.includes('upscale') || modelId.includes('enhance')) {
    return true // Upscaling models require image input
  }

  // Check if any parameter accepts image input
  const allParams = [
    ...schema.parameters.basic,
    ...schema.parameters.intermediate,
    ...schema.parameters.advanced
  ]

  return allParams.some(param =>
    param.name.includes('image') ||
    param.name.includes('img') ||
    param.description?.toLowerCase().includes('image')
  )
}

/**
 * Get image input parameter names for a model
 */
export function getImageInputParameters(modelId: string): string[] {
  const schema = getModelSchema(modelId)
  if (!schema) {
    return []
  }

  const allParams = [
    ...schema.parameters.basic,
    ...schema.parameters.intermediate,
    ...schema.parameters.advanced
  ]

  return allParams
    .filter(param =>
      param.name.includes('image') ||
      param.name.includes('img') ||
      param.name.includes('frame') ||
      param.name.includes('reference') ||
      param.description?.toLowerCase().includes('image')
    )
    .map(param => param.name)
}

/**
 * Get detailed image upload configuration for a model
 */
export function getImageUploadConfig(modelId: string): {
  showImageUpload: boolean
  maxImages: number
  imageLabels: string[]
  imageParameters: string[]
  isRequired: boolean
} {
  const schema = getModelSchema(modelId)
  if (!schema) {
    return {
      showImageUpload: false,
      maxImages: 0,
      imageLabels: [],
      imageParameters: [],
      isRequired: false
    }
  }

  const imageParams = getImageInputParameters(modelId)
  const supportsImage = modelSupportsImageInput(modelId)

  if (!supportsImage || imageParams.length === 0) {
    return {
      showImageUpload: false,
      maxImages: 0,
      imageLabels: [],
      imageParameters: [],
      isRequired: false
    }
  }

  // Generate user-friendly labels for image parameters
  const imageLabels = imageParams.map(param => {
    switch (param) {
      case 'first_frame_image':
        return 'First Frame Image'
      case 'subject_reference':
        return 'Subject Reference'
      case 'input_image':
        return 'Input Image'
      case 'reference_image':
        return 'Reference Image'
      case 'mask_image':
        return 'Mask Image'
      default:
        // Convert snake_case to Title Case
        return param.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    }
  })

  // Determine if image input is required (for upscaling models)
  const isRequired = schema.category === 'upscaling' ||
                    modelId.includes('upscale') ||
                    modelId.includes('enhance')

  return {
    showImageUpload: true,
    maxImages: Math.max(schema.capabilities.maxImages, imageParams.length),
    imageLabels,
    imageParameters: imageParams,
    isRequired
  }
}

/**
 * Validate parameters against model schema
 */
export function validateModelParameters(
  modelId: string, 
  parameters: Record<string, any>
): ValidationResult {
  const schema = getModelSchema(modelId)
  if (!schema) {
    return {
      isValid: false,
      errors: [`Model ${modelId} not found`],
      warnings: []
    }
  }

  const errors: string[] = []
  const warnings: string[] = []

  // Get all parameters from all levels
  const allParams = [
    ...schema.parameters.basic,
    ...schema.parameters.intermediate,
    ...schema.parameters.advanced
  ]

  // Validate required parameters
  allParams.forEach(param => {
    if (param.required && (!parameters[param.name] || parameters[param.name] === '')) {
      errors.push(`${param.name} is required`)
    }
  })

  // Validate parameter types and ranges
  Object.entries(parameters).forEach(([key, value]) => {
    const paramDef = allParams.find(p => p.name === key)
    if (!paramDef) return

    // Type validation
    if (paramDef.type === 'integer' && !Number.isInteger(Number(value))) {
      errors.push(`${key} must be an integer`)
    }

    if (paramDef.type === 'number' && isNaN(Number(value))) {
      errors.push(`${key} must be a number`)
    }

    // Range validation
    if (paramDef.min !== undefined && Number(value) < paramDef.min) {
      errors.push(`${key} must be at least ${paramDef.min}`)
    }

    if (paramDef.max !== undefined && Number(value) > paramDef.max) {
      errors.push(`${key} must be at most ${paramDef.max}`)
    }

    // Options validation
    if (paramDef.options && !paramDef.options.includes(value)) {
      errors.push(`${key} must be one of: ${paramDef.options.join(', ')}`)
    }
  })

  // Model-specific validations
  if (schema.capabilities.supportsImageInput && !parameters.input_image && !parameters.first_frame_image) {
    warnings.push('This model works best with an input image')
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * Get UI configuration for a model
 */
export function getModelUIConfig(modelId: string): ParameterUIConfig {
  const schema = getModelSchema(modelId)
  if (!schema) {
    return {
      showImageUpload: false,
      maxImages: 0,
      imageLabels: [],
      requiredParameters: [],
      conditionalParameters: {}
    }
  }

  const allParams = [
    ...schema.parameters.basic,
    ...schema.parameters.intermediate,
    ...schema.parameters.advanced
  ]

  const requiredParameters = allParams
    .filter(p => p.required)
    .map(p => p.name)

  // Determine image upload configuration
  let imageLabels: string[] = []
  if (schema.capabilities.supportsImageInput) {
    if (schema.capabilities.supportsMultipleImages) {
      // For video models with multiple inputs
      if (schema.category === 'video-generation') {
        imageLabels = ['First Frame Image', 'Subject Reference']
      } else {
        imageLabels = ['Input Image', 'Reference Image']
      }
    } else {
      imageLabels = ['Input Image']
    }
  }

  return {
    showImageUpload: schema.capabilities.supportsImageInput,
    maxImages: schema.capabilities.maxImages,
    imageLabels,
    requiredParameters,
    conditionalParameters: {
      // Add conditional logic here if needed
    }
  }
}



/**
 * Get parameters by disclosure level
 */
export function getParametersByLevel(
  modelId: string, 
  level: 'basic' | 'intermediate' | 'advanced'
): ModelParameter[] {
  const schema = getModelSchema(modelId)
  if (!schema) return []

  return schema.parameters[level] || []
}

/**
 * Check if model supports a specific capability
 */
export function modelSupportsCapability(
  modelId: string, 
  capability: keyof ReplicateModelSchema['capabilities']
): boolean {
  const schema = getModelSchema(modelId)
  if (!schema) return false

  return Boolean(schema.capabilities[capability])
}
