/**
 * Parameter Validation Utilities
 * Comprehensive validation for model parameters with proper error messages
 */

import { ModelParameter } from '@/lib/replicate/realModelData'

export interface ParameterValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  transformedValue?: any
}

export interface ParameterValidationOptions {
  strict?: boolean // If true, warnings become errors
  transformValues?: boolean // If true, attempt to transform values to correct types
}

/**
 * Validate a single parameter value against its definition
 */
export function validateParameter(
  param: ModelParameter,
  value: any,
  options: ParameterValidationOptions = {}
): ParameterValidationResult {
  const result: ParameterValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    transformedValue: value
  }

  // Handle null/undefined/empty values
  if (value === null || value === undefined || value === '') {
    if (param.required) {
      result.isValid = false
      result.errors.push(`${param.name} is required`)
      return result
    }
    result.transformedValue = param.default
    return result
  }

  // Type-specific validation and transformation
  switch (param.type) {
    case 'integer':
      return validateIntegerParameter(param, value, result, options)
    
    case 'number':
      return validateNumberParameter(param, value, result, options)
    
    case 'boolean':
      return validateBooleanParameter(param, value, result, options)
    
    case 'select':
      return validateSelectParameter(param, value, result, options)
    
    case 'string':
    default:
      return validateStringParameter(param, value, result, options)
  }
}

/**
 * Validate integer parameter
 */
function validateIntegerParameter(
  param: ModelParameter,
  value: any,
  result: ParameterValidationResult,
  options: ParameterValidationOptions
): ParameterValidationResult {
  let intValue: number

  if (typeof value === 'string') {
    intValue = parseInt(value, 10)
    if (isNaN(intValue)) {
      result.isValid = false
      result.errors.push(`${param.name} must be a valid integer`)
      return result
    }
  } else if (typeof value === 'number') {
    if (!Number.isInteger(value)) {
      if (options.transformValues) {
        intValue = Math.round(value)
        result.warnings.push(`${param.name} was rounded to nearest integer: ${intValue}`)
      } else {
        result.isValid = false
        result.errors.push(`${param.name} must be an integer`)
        return result
      }
    } else {
      intValue = value
    }
  } else {
    result.isValid = false
    result.errors.push(`${param.name} must be a number`)
    return result
  }

  // Range validation
  if (param.min !== undefined && intValue < param.min) {
    if (options.transformValues) {
      intValue = param.min
      result.warnings.push(`${param.name} was adjusted to minimum value: ${param.min}`)
    } else {
      result.isValid = false
      result.errors.push(`${param.name} must be at least ${param.min}`)
      return result
    }
  }

  if (param.max !== undefined && intValue > param.max) {
    if (options.transformValues) {
      intValue = param.max
      result.warnings.push(`${param.name} was adjusted to maximum value: ${param.max}`)
    } else {
      result.isValid = false
      result.errors.push(`${param.name} must be at most ${param.max}`)
      return result
    }
  }

  result.transformedValue = intValue
  return result
}

/**
 * Validate number parameter
 */
function validateNumberParameter(
  param: ModelParameter,
  value: any,
  result: ParameterValidationResult,
  options: ParameterValidationOptions
): ParameterValidationResult {
  let numValue: number

  if (typeof value === 'string') {
    numValue = parseFloat(value)
    if (isNaN(numValue)) {
      result.isValid = false
      result.errors.push(`${param.name} must be a valid number`)
      return result
    }
  } else if (typeof value === 'number') {
    numValue = value
  } else {
    result.isValid = false
    result.errors.push(`${param.name} must be a number`)
    return result
  }

  // Range validation
  if (param.min !== undefined && numValue < param.min) {
    if (options.transformValues) {
      numValue = param.min
      result.warnings.push(`${param.name} was adjusted to minimum value: ${param.min}`)
    } else {
      result.isValid = false
      result.errors.push(`${param.name} must be at least ${param.min}`)
      return result
    }
  }

  if (param.max !== undefined && numValue > param.max) {
    if (options.transformValues) {
      numValue = param.max
      result.warnings.push(`${param.name} was adjusted to maximum value: ${param.max}`)
    } else {
      result.isValid = false
      result.errors.push(`${param.name} must be at most ${param.max}`)
      return result
    }
  }

  result.transformedValue = numValue
  return result
}

/**
 * Validate boolean parameter
 */
function validateBooleanParameter(
  param: ModelParameter,
  value: any,
  result: ParameterValidationResult,
  options: ParameterValidationOptions
): ParameterValidationResult {
  if (typeof value === 'boolean') {
    result.transformedValue = value
  } else if (typeof value === 'string') {
    const lowerValue = value.toLowerCase()
    if (lowerValue === 'true' || lowerValue === '1') {
      result.transformedValue = true
    } else if (lowerValue === 'false' || lowerValue === '0') {
      result.transformedValue = false
    } else {
      result.isValid = false
      result.errors.push(`${param.name} must be true or false`)
      return result
    }
  } else if (typeof value === 'number') {
    result.transformedValue = Boolean(value)
    if (options.transformValues) {
      result.warnings.push(`${param.name} was converted to boolean: ${result.transformedValue}`)
    }
  } else {
    result.isValid = false
    result.errors.push(`${param.name} must be a boolean value`)
    return result
  }

  return result
}

/**
 * Validate select parameter
 */
function validateSelectParameter(
  param: ModelParameter,
  value: any,
  result: ParameterValidationResult,
  options: ParameterValidationOptions
): ParameterValidationResult {
  const stringValue = String(value)

  if (param.options && param.options.length > 0) {
    if (!param.options.includes(stringValue)) {
      result.isValid = false
      result.errors.push(`${param.name} must be one of: ${param.options.join(', ')}`)
      return result
    }
  }

  result.transformedValue = stringValue
  return result
}

/**
 * Validate string parameter
 */
function validateStringParameter(
  param: ModelParameter,
  value: any,
  result: ParameterValidationResult,
  options: ParameterValidationOptions
): ParameterValidationResult {
  const stringValue = String(value)

  // Add any string-specific validation here if needed
  result.transformedValue = stringValue
  return result
}

/**
 * Validate all parameters for a model
 */
export function validateAllParameters(
  parameters: Record<string, any>,
  modelParams: ModelParameter[],
  options: ParameterValidationOptions = {}
): {
  isValid: boolean
  errors: string[]
  warnings: string[]
  validatedParameters: Record<string, any>
} {
  const errors: string[] = []
  const warnings: string[] = []
  const validatedParameters: Record<string, any> = {}

  // Validate each parameter
  for (const param of modelParams) {
    const value = parameters[param.name]
    const validation = validateParameter(param, value, options)

    if (!validation.isValid) {
      errors.push(...validation.errors)
    }
    
    warnings.push(...validation.warnings)
    
    if (validation.transformedValue !== undefined) {
      validatedParameters[param.name] = validation.transformedValue
    }
  }

  // Convert warnings to errors if strict mode
  if (options.strict && warnings.length > 0) {
    errors.push(...warnings.map(w => `Strict validation: ${w}`))
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    validatedParameters
  }
}
