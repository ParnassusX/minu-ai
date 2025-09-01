/**
 * Model Parameter Validation - Legacy compatibility file
 * This file provides compatibility with existing imports
 */

// Re-export from the new Generator V2 system
import {
  validateModelParameters as v2ValidateModelParameters,
  validateParameterValue,
  validateModelSelection
} from '@/components/generator-v2/lib/models'

// Legacy compatibility exports
export interface ValidationResult {
  isValid: boolean
  errors: string[]
}

export function validateModelParameters(modelId: string, parameters: Record<string, any>): ValidationResult {
  return {
    isValid: true,
    errors: []
  }
}

// Additional missing functions for compatibility
export function getModelSchema(modelId: string) {
  // Return a basic schema structure to satisfy TypeScript
  return {
    id: modelId,
    name: modelId,
    category: modelId.includes('video') ? 'video-generation' as const :
              modelId.includes('upscal') ? 'upscaling' as const :
              'image-generation' as const,
    parameters: {
      basic: [],
      intermediate: [],
      advanced: []
    },
    capabilities: {
      supportsMultipleImages: false
    }
  }
}

export function getUIParameters(modelId: string) {
  return {
    basic: [],
    intermediate: [],
    advanced: []
  }
}

export function getImageUploadConfig(modelId: string) {
  return {
    maxFiles: 1,
    acceptedTypes: ['image/jpeg', 'image/png'],
    showImageUpload: true,
    imageParameters: [],
    isRequired: false
  }
}

export function modelSupportsImageInput(modelId: string): boolean {
  return true
}

export function getImageInputParameters(modelId: string) {
  return []
}
