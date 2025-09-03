/**
 * Model Parameter Mapping - Legacy compatibility file
 * This file provides compatibility with existing imports
 */

// Re-export from the new Generator V2 system
import { getDefaultParameters } from '@/components/generator-v2/lib/models'

// Legacy compatibility functions
export function transformParametersForModel(modelId: string, parameters: Record<string, any>): Record<string, any> {
  // Basic parameter transformation
  return {
    ...parameters,
    // Ensure common parameters are properly formatted
    prompt: parameters.prompt || '',
    aspect_ratio: parameters.aspect_ratio || '1:1',
    output_format: parameters.output_format || 'jpg'
  }
}

export function mapImageParametersForModel(modelId: string, parameters: Record<string, any>): Record<string, any> {
  // Image-specific parameter mapping
  return transformParametersForModel(modelId, parameters)
}
