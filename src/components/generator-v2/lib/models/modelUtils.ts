/**
 * Model Utilities - Minu.AI Generator V2
 * Utility functions for working with model data and validation
 */

import { ModelSchema, GenerationMode, ModelParameter, PRIORITY_MODEL_IDS } from '../../types/models'
import { GeneratorError } from '../../types/generator'
import { ALL_MODELS, PRIORITY_MODELS } from './modelData'
import { createGeneratorError } from '../utils'

// Model retrieval functions
export const getModelById = (modelId: string): ModelSchema | null => {
  return ALL_MODELS.find(model => model.id === modelId) || null
}

export const getModelsByMode = (mode: GenerationMode): ModelSchema[] => {
  return ALL_MODELS.filter(model => 
    model.supportedModes.includes(mode) && model.isActive
  )
}

export const getPriorityModels = (): ModelSchema[] => {
  return PRIORITY_MODELS.filter(model => model.isActive)
}

export const getModelsByProvider = (provider: string): ModelSchema[] => {
  return ALL_MODELS.filter(model => 
    model.provider.toLowerCase() === provider.toLowerCase() && model.isActive
  )
}

export const getModelsByCategory = (category: string): ModelSchema[] => {
  return ALL_MODELS.filter(model => 
    model.category === category && model.isActive
  )
}

// Model validation functions
export const validateModelSelection = (
  modelId: string | null,
  mode: GenerationMode
): GeneratorError[] => {
  const errors: GeneratorError[] = []
  
  if (!modelId) {
    errors.push(createGeneratorError(
      'MODEL_REQUIRED',
      'Please select a model',
      'model'
    ))
    return errors
  }
  
  const model = getModelById(modelId)
  if (!model) {
    errors.push(createGeneratorError(
      'INVALID_MODEL',
      'Selected model not found',
      'model'
    ))
    return errors
  }
  
  if (!model.isActive) {
    errors.push(createGeneratorError(
      'MODEL_INACTIVE',
      'Selected model is currently unavailable',
      'model'
    ))
  }
  
  if (!model.supportedModes.includes(mode)) {
    errors.push(createGeneratorError(
      'MODEL_MODE_MISMATCH',
      `Selected model does not support ${mode} mode`,
      'model'
    ))
  }
  
  return errors
}

export const validateModelParameters = (
  model: ModelSchema,
  parameters: Record<string, any>
): GeneratorError[] => {
  const errors: GeneratorError[] = []
  
  // Check required parameters (prompt is handled separately by main prompt field)
  const requiredParams = model.parameters.filter(param => param.required && param.name !== 'prompt')
  for (const param of requiredParams) {
    const value = parameters[param.name]
    if (value === undefined || value === null || value === '') {
      errors.push(createGeneratorError(
        'MISSING_REQUIRED_PARAMETER',
        `${param.name} is required`,
        param.name
      ))
    }
  }

  // Validate parameter values (skip prompt since it's validated separately)
  for (const param of model.parameters) {
    if (param.name === 'prompt') continue
    const value = parameters[param.name]
    if (value === undefined || value === null) continue

    const paramErrors = validateParameterValue(param, value)
    errors.push(...paramErrors)
  }
  
  return errors
}

export const validateParameterValue = (
  parameter: ModelParameter,
  value: any
): GeneratorError[] => {
  const errors: GeneratorError[] = []
  
  switch (parameter.type) {
    case 'string':
      if (typeof value !== 'string') {
        errors.push(createGeneratorError(
          'INVALID_PARAMETER_TYPE',
          `${parameter.name} must be a string`,
          parameter.name
        ))
      }
      break
      
    case 'number':
      if (typeof value !== 'number' || isNaN(value)) {
        errors.push(createGeneratorError(
          'INVALID_PARAMETER_TYPE',
          `${parameter.name} must be a number`,
          parameter.name
        ))
      } else {
        // Check min/max if specified
        if (parameter.min !== undefined && value < parameter.min) {
          errors.push(createGeneratorError(
            'PARAMETER_OUT_OF_RANGE',
            `${parameter.name} must be at least ${parameter.min}`,
            parameter.name
          ))
        }
        if (parameter.max !== undefined && value > parameter.max) {
          errors.push(createGeneratorError(
            'PARAMETER_OUT_OF_RANGE',
            `${parameter.name} must be at most ${parameter.max}`,
            parameter.name
          ))
        }
      }
      break
      
    case 'boolean':
      if (typeof value !== 'boolean') {
        errors.push(createGeneratorError(
          'INVALID_PARAMETER_TYPE',
          `${parameter.name} must be a boolean`,
          parameter.name
        ))
      }
      break
      
    case 'select':
      if (parameter.options && !(parameter.options as any[]).includes(value)) {
        errors.push(createGeneratorError(
          'INVALID_PARAMETER_VALUE',
          `${parameter.name} must be one of: ${(parameter.options as any[]).join(', ')}`,
          parameter.name
        ))
      }
      break
      
    case 'file':
      // File validation would be handled separately during upload
      break
  }
  
  return errors
}

// Model capability checks
export const modelSupportsImageInput = (model: ModelSchema): boolean => {
  return model.capabilities.supportsImageInput
}

export const modelSupportsMultipleImages = (model: ModelSchema): boolean => {
  return model.capabilities.supportsMultipleImages
}

export const getMaxImagesForModel = (model: ModelSchema): number => {
  return model.capabilities.maxImages
}

export const getImageInputParameters = (model: ModelSchema): ModelParameter[] => {
  return model.parameters.filter(param => param.type === 'file')
}

// Parameter organization functions
export const getParametersByGroup = (model: ModelSchema): Record<string, ModelParameter[]> => {
  const groups: Record<string, ModelParameter[]> = {
    basic: [],
    advanced: [],
    image: []
  }
  
  for (const param of model.parameters) {
    if (param.type === 'file') {
      groups.image.push(param)
    } else if (param.required || ['prompt', 'aspect_ratio', 'output_format'].includes(param.name)) {
      groups.basic.push(param)
    } else {
      groups.advanced.push(param)
    }
  }
  
  // Sort by order within each group
  Object.keys(groups).forEach(group => {
    groups[group].sort((a, b) => a.order - b.order)
  })
  
  return groups
}

export const getRequiredParameters = (model: ModelSchema): ModelParameter[] => {
  return model.parameters.filter(param => param.required)
}

export const getOptionalParameters = (model: ModelSchema): ModelParameter[] => {
  return model.parameters.filter(param => !param.required)
}

// Cost calculation functions
export const estimateGenerationCost = (
  model: ModelSchema,
  parameters: Record<string, any>
): number => {
  let baseCost = 0
  
  if (model.pricing.costPerImage) {
    baseCost = model.pricing.costPerImage
  } else if (model.pricing.costPerSecond && parameters.duration) {
    baseCost = model.pricing.costPerSecond * parameters.duration
  } else if (model.pricing.costPerUpscale) {
    baseCost = model.pricing.costPerUpscale
  }
  
  // Add any parameter-based cost modifiers
  let multiplier = 1
  
  // Higher resolution costs more
  if (parameters.resolution === '1080p') {
    multiplier *= 1.5
  } else if (parameters.resolution === '4K') {
    multiplier *= 2.0
  }
  
  // Longer duration costs more (already factored in for video)
  if (parameters.duration && parameters.duration > 5) {
    // Already calculated in base cost for video models
  }
  
  return baseCost * multiplier
}

// Model comparison functions
export const compareModelsBySpeed = (a: ModelSchema, b: ModelSchema): number => {
  const speedOrder = { fast: 0, medium: 1, slow: 2 }
  return speedOrder[a.performance.speed] - speedOrder[b.performance.speed]
}

export const compareModelsByCost = (a: ModelSchema, b: ModelSchema): number => {
  const aCost = a.pricing.costPerImage || a.pricing.costPerSecond || a.pricing.costPerUpscale || 0
  const bCost = b.pricing.costPerImage || b.pricing.costPerSecond || b.pricing.costPerUpscale || 0
  return aCost - bCost
}

export const compareModelsByQuality = (a: ModelSchema, b: ModelSchema): number => {
  return b.performance.reliability - a.performance.reliability
}

// Model filtering functions
export const filterModelsByTags = (models: ModelSchema[], tags: string[]): ModelSchema[] => {
  return models.filter(model => 
    tags.some(tag => model.tags.includes(tag))
  )
}

export const searchModels = (models: ModelSchema[], query: string): ModelSchema[] => {
  const lowerQuery = query.toLowerCase()
  return models.filter(model => 
    model.name.toLowerCase().includes(lowerQuery) ||
    model.description.toLowerCase().includes(lowerQuery) ||
    model.provider.toLowerCase().includes(lowerQuery) ||
    model.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
  )
}

// Default parameter values
export const getDefaultParameters = (model: ModelSchema): Record<string, any> => {
  const defaults: Record<string, any> = {}
  
  for (const param of model.parameters) {
    if (param.default !== undefined) {
      defaults[param.name] = param.default
    }
  }
  
  return defaults
}

// Model status checks
export const isModelAvailable = (model: ModelSchema): boolean => {
  return model.isActive && model.performance.reliability > 0.8
}

export const isPriorityModel = (modelId: string): boolean => {
  return PRIORITY_MODEL_IDS.includes(modelId as any)
}
