/**
 * Model Verification System
 * Verifies that models display their actual capabilities and parameters correctly
 */

import { 
  getModelSchema, 
  getUIParameters, 
  getImageUploadConfig, 
  modelSupportsImageInput,
  getImageInputParameters 
} from './modelParameterValidation'
import { REAL_MODEL_DATA } from '@/lib/replicate/realModelData'

export interface ModelVerificationResult {
  modelId: string
  modelName: string
  issues: ModelIssue[]
  warnings: ModelWarning[]
  isValid: boolean
  capabilities: ModelCapabilityCheck
}

export interface ModelIssue {
  type: 'missing_parameter' | 'incorrect_capability' | 'invalid_configuration' | 'non_existent_model'
  message: string
  severity: 'error' | 'warning'
}

export interface ModelWarning {
  type: 'deprecated_parameter' | 'suboptimal_configuration' | 'missing_optimization'
  message: string
}

export interface ModelCapabilityCheck {
  imageInputCorrect: boolean
  parameterExposureCorrect: boolean
  multipleImageSupport: boolean
  requiredParametersPresent: boolean
}

/**
 * Verify a single model's parameter exposure and capabilities
 */
export function verifyModelConfiguration(modelId: string): ModelVerificationResult {
  const schema = getModelSchema(modelId)
  const issues: ModelIssue[] = []
  const warnings: ModelWarning[] = []
  
  if (!schema) {
    return {
      modelId,
      modelName: 'Unknown Model',
      issues: [{
        type: 'non_existent_model',
        message: `Model ${modelId} not found in schema`,
        severity: 'error'
      }],
      warnings: [],
      isValid: false,
      capabilities: {
        imageInputCorrect: false,
        parameterExposureCorrect: false,
        multipleImageSupport: false,
        requiredParametersPresent: false
      }
    }
  }

  // Check image input configuration
  const imageConfig = getImageUploadConfig(modelId)
  const supportsImage = modelSupportsImageInput(modelId)
  const imageParams = getImageInputParameters(modelId)
  
  // Verify image input consistency
  const imageInputCorrect = (
    imageConfig.showImageUpload === supportsImage &&
    imageConfig.imageParameters.length === imageParams.length
  )
  
  if (!imageInputCorrect) {
    issues.push({
      type: 'incorrect_capability',
      message: `Image input configuration mismatch for ${modelId}`,
      severity: 'error'
    })
  }

  // Check parameter exposure
  const uiParams = getUIParameters(modelId)
  const allUIParams = [...uiParams.basic, ...uiParams.intermediate, ...uiParams.advanced]
  const allSchemaParams = [...schema.parameters.basic, ...schema.parameters.intermediate, ...schema.parameters.advanced]
  
  // Verify no duplicate prompts in UI parameters
  const promptParams = allUIParams.filter(p => 
    p.name === 'prompt' || p.name === 'text_prompt' || p.name === 'description'
  )
  
  if (promptParams.length > 0) {
    // Check if these are image-related prompts (which should be kept)
    const imageRelatedPrompts = promptParams.filter(p => 
      p.name.includes('image') || p.name.includes('frame') || p.name.includes('reference')
    )
    
    if (promptParams.length > imageRelatedPrompts.length) {
      issues.push({
        type: 'invalid_configuration',
        message: `Duplicate prompt parameters found in UI for ${modelId}`,
        severity: 'error'
      })
    }
  }

  // Check for missing required parameters
  const requiredParams = allSchemaParams.filter(p => p.required)
  const exposedRequiredParams = allUIParams.filter(p => p.required)
  
  const requiredParametersPresent = requiredParams.every(reqParam => 
    exposedRequiredParams.some(expParam => expParam.name === reqParam.name) ||
    reqParam.name === 'prompt' // Prompt is handled separately
  )
  
  if (!requiredParametersPresent) {
    issues.push({
      type: 'missing_parameter',
      message: `Missing required parameters in UI for ${modelId}`,
      severity: 'error'
    })
  }

  // Check for model-specific optimizations
  if (modelId.includes('flux')) {
    // FLUX models should not show image input
    if (supportsImage) {
      issues.push({
        type: 'incorrect_capability',
        message: `FLUX model ${modelId} incorrectly shows image input support`,
        severity: 'error'
      })
    }
    
    // FLUX Schnell should have optimized inference steps
    if (modelId === 'flux-schnell') {
      const inferenceParam = allSchemaParams.find(p => p.name === 'num_inference_steps')
      if (inferenceParam && inferenceParam.default !== 4) {
        warnings.push({
          type: 'suboptimal_configuration',
          message: 'FLUX Schnell should default to 4 inference steps for optimal speed'
        })
      }
    }
  }

  // Check video models
  if (schema.category === 'video-generation') {
    if (!supportsImage) {
      warnings.push({
        type: 'missing_optimization',
        message: `Video model ${modelId} should support image input for first frame`
      })
    }
    
    // Check for multiple image support
    if (imageParams.length > 1 && !schema.capabilities.supportsMultipleImages) {
      issues.push({
        type: 'invalid_configuration',
        message: `Video model ${modelId} has multiple image parameters but capabilities don't reflect this`,
        severity: 'warning'
      })
    }
  }

  // Check upscaling models
  if (schema.category === 'upscaling') {
    if (!supportsImage || !imageConfig.isRequired) {
      issues.push({
        type: 'incorrect_capability',
        message: `Upscaling model ${modelId} should require image input`,
        severity: 'error'
      })
    }
  }

  const capabilities: ModelCapabilityCheck = {
    imageInputCorrect,
    parameterExposureCorrect: issues.filter(i => i.type === 'missing_parameter').length === 0,
    multipleImageSupport: schema.capabilities.supportsMultipleImages && imageParams.length > 1,
    requiredParametersPresent
  }

  return {
    modelId,
    modelName: schema.name,
    issues,
    warnings,
    isValid: issues.filter(i => i.severity === 'error').length === 0,
    capabilities
  }
}

/**
 * Verify all models in the system
 */
export function verifyAllModels(): ModelVerificationResult[] {
  return Object.values(REAL_MODEL_DATA).flat().map((model: any) => verifyModelConfiguration(model.id))
}

/**
 * Get models with specific issues
 */
export function getModelsWithIssues(issueType?: ModelIssue['type']): ModelVerificationResult[] {
  const results = verifyAllModels()
  
  if (!issueType) {
    return results.filter(result => !result.isValid)
  }
  
  return results.filter(result => 
    result.issues.some(issue => issue.type === issueType)
  )
}

/**
 * Generate verification report
 */
export function generateVerificationReport(): {
  totalModels: number
  validModels: number
  modelsWithErrors: number
  modelsWithWarnings: number
  criticalIssues: ModelIssue[]
  summary: string
} {
  const results = verifyAllModels()
  const validModels = results.filter(r => r.isValid).length
  const modelsWithErrors = results.filter(r => r.issues.some(i => i.severity === 'error')).length
  const modelsWithWarnings = results.filter(r => r.warnings.length > 0).length
  
  const criticalIssues = results
    .flatMap(r => r.issues)
    .filter(i => i.severity === 'error')
  
  const summary = `
Model Verification Report:
- Total Models: ${results.length}
- Valid Models: ${validModels}
- Models with Errors: ${modelsWithErrors}
- Models with Warnings: ${modelsWithWarnings}
- Critical Issues: ${criticalIssues.length}
  `.trim()

  return {
    totalModels: results.length,
    validModels,
    modelsWithErrors,
    modelsWithWarnings,
    criticalIssues,
    summary
  }
}
