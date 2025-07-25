/**
 * Client-side model parameter validation to prevent API errors
 */

export interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

export interface ModelParameters {
  prompt: string
  modelId: string
  numOutputs?: number
  aspectRatio?: string
  seed?: number
  guidanceScale?: number
  numInferenceSteps?: number
  [key: string]: any
}

// Model-specific parameter constraints
const MODEL_CONSTRAINTS = {
  'flux-schnell': {
    numInferenceSteps: { min: 1, max: 4, default: 4 },
    guidanceScale: null, // Not supported
    aspectRatio: ['1:1', '16:9', '9:16', '4:3', '3:4'],
    numOutputs: { min: 1, max: 4 }
  },
  'flux-dev': {
    numInferenceSteps: { min: 1, max: 50, default: 28 },
    guidanceScale: { min: 0, max: 10, default: 3 },
    aspectRatio: ['1:1', '16:9', '9:16', '4:3', '3:4'],
    numOutputs: { min: 1, max: 4 }
  },
  'flux-pro': {
    numInferenceSteps: { min: 10, max: 50, default: 30 },
    guidanceScale: { min: 1, max: 10, default: 3.5 },
    aspectRatio: ['1:1', '16:9', '9:16', '4:3', '3:4'],
    numOutputs: { min: 1, max: 4 }
  },
  'flux-ultra': {
    numInferenceSteps: { min: 10, max: 50, default: 30 },
    guidanceScale: { min: 1, max: 10, default: 3.5 },
    aspectRatio: ['1:1', '16:9', '9:16', '4:3', '3:4'],
    numOutputs: { min: 1, max: 4 }
  },
  'ideogram-v2': {
    numInferenceSteps: null, // Not supported
    guidanceScale: null, // Not supported
    aspectRatio: ['1:1', '16:9', '9:16', '4:3', '3:4', '3:2', '2:3'],
    numOutputs: { min: 1, max: 4 },
    magicPromptOption: ['Auto', 'On', 'Off'], // Ideogram-specific
    styleType: ['Auto', 'General', 'Realistic', 'Design', 'Render_3d', 'Anime'] // Ideogram-specific
  }
} as const

// Default constraints for unknown models
const DEFAULT_CONSTRAINTS = {
  numInferenceSteps: { min: 1, max: 50, default: 28 },
  guidanceScale: { min: 1, max: 10, default: 3.5 },
  aspectRatio: ['1:1', '16:9', '9:16', '4:3', '3:4'],
  numOutputs: { min: 1, max: 4 }
}

/**
 * Validate model parameters against model-specific constraints
 */
export function validateModelParameters(params: ModelParameters): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  // Get model constraints
  const constraints = MODEL_CONSTRAINTS[params.modelId as keyof typeof MODEL_CONSTRAINTS] || DEFAULT_CONSTRAINTS

  // Validate prompt
  if (!params.prompt || typeof params.prompt !== 'string') {
    errors.push('Prompt is required')
  } else if (params.prompt.trim().length === 0) {
    errors.push('Prompt cannot be empty')
  } else if (params.prompt.length > 1000) {
    errors.push('Prompt too long (max 1000 characters)')
  }

  // Validate numOutputs
  if (params.numOutputs !== undefined) {
    if (!Number.isInteger(params.numOutputs) || params.numOutputs < constraints.numOutputs.min || params.numOutputs > constraints.numOutputs.max) {
      errors.push(`Number of outputs must be between ${constraints.numOutputs.min} and ${constraints.numOutputs.max}`)
    }
  }

  // Validate aspectRatio
  if (params.aspectRatio && !constraints.aspectRatio.includes(params.aspectRatio as any)) {
    errors.push(`Invalid aspect ratio. Supported: ${constraints.aspectRatio.join(', ')}`)
  }

  // Validate numInferenceSteps
  if (params.numInferenceSteps !== undefined) {
    if (constraints.numInferenceSteps === null) {
      warnings.push(`Model ${params.modelId} does not support custom inference steps`)
    } else {
      if (!Number.isInteger(params.numInferenceSteps) || 
          params.numInferenceSteps < constraints.numInferenceSteps.min || 
          params.numInferenceSteps > constraints.numInferenceSteps.max) {
        errors.push(`Inference steps must be between ${constraints.numInferenceSteps.min} and ${constraints.numInferenceSteps.max}`)
      }
    }
  }

  // Validate guidanceScale
  if (params.guidanceScale !== undefined) {
    if (constraints.guidanceScale === null) {
      warnings.push(`Model ${params.modelId} does not support guidance scale`)
    } else {
      if (typeof params.guidanceScale !== 'number' || 
          params.guidanceScale < constraints.guidanceScale.min || 
          params.guidanceScale > constraints.guidanceScale.max) {
        errors.push(`Guidance scale must be between ${constraints.guidanceScale.min} and ${constraints.guidanceScale.max}`)
      }
    }
  }

  // Validate seed
  if (params.seed !== undefined) {
    if (!Number.isInteger(params.seed) || params.seed < 0 || params.seed > 2147483647) {
      errors.push('Seed must be a positive integer between 0 and 2147483647')
    }
  }

  // Model-specific validations
  if (params.modelId === 'ideogram-v2') {
    // Validate Ideogram-specific parameters
    if (params.magicPromptOption && !MODEL_CONSTRAINTS['ideogram-v2'].magicPromptOption.includes(params.magicPromptOption)) {
      errors.push(`Invalid magic prompt option. Supported: ${MODEL_CONSTRAINTS['ideogram-v2'].magicPromptOption.join(', ')}`)
    }
    
    if (params.styleType && !MODEL_CONSTRAINTS['ideogram-v2'].styleType.includes(params.styleType)) {
      errors.push(`Invalid style type. Supported: ${MODEL_CONSTRAINTS['ideogram-v2'].styleType.join(', ')}`)
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * Get model-specific constraints for UI display
 */
export function getModelConstraints(modelId: string) {
  return MODEL_CONSTRAINTS[modelId as keyof typeof MODEL_CONSTRAINTS] || DEFAULT_CONSTRAINTS
}

/**
 * Sanitize parameters to ensure they meet model constraints
 */
export function sanitizeParameters(params: ModelParameters): ModelParameters {
  const constraints = getModelConstraints(params.modelId)
  const sanitized = { ...params }

  // Sanitize numOutputs
  if (sanitized.numOutputs !== undefined) {
    sanitized.numOutputs = Math.max(constraints.numOutputs.min, Math.min(constraints.numOutputs.max, sanitized.numOutputs))
  }

  // Sanitize numInferenceSteps
  if (sanitized.numInferenceSteps !== undefined && constraints.numInferenceSteps) {
    sanitized.numInferenceSteps = Math.max(constraints.numInferenceSteps.min, Math.min(constraints.numInferenceSteps.max, sanitized.numInferenceSteps))
  }

  // Sanitize guidanceScale
  if (sanitized.guidanceScale !== undefined && constraints.guidanceScale) {
    sanitized.guidanceScale = Math.max(constraints.guidanceScale.min, Math.min(constraints.guidanceScale.max, sanitized.guidanceScale))
  }

  // Sanitize seed
  if (sanitized.seed !== undefined) {
    sanitized.seed = Math.max(0, Math.min(2147483647, Math.floor(sanitized.seed)))
  }

  return sanitized
}
