/**
 * Generator V2 Module Index - Minu.AI Generator V2
 * Main export point for the rebuilt generator system
 */

// Main Generator Component
export { Generator } from './components/Generator'

// Individual Components
export {
  ModelSelector,
  PromptInput,
  ParameterControls,
  ResultsDisplay
} from './components'

// Hooks
export { useGenerator } from './hooks/useGenerator'

// Model System
export {
  PRIORITY_MODELS,
  ALL_MODELS,
  getModelById,
  getModelsByMode,
  getPriorityModels,
  validateModelSelection,
  validateModelParameters,
  estimateGenerationCost
} from './lib/models'

// Validation
export {
  validateGenerationRequest,
  validateModelParameters as validateParams,
  validateFileUpload
} from './lib/validation/schemas'

// Types
export type {
  GeneratorState,
  GeneratorSettings,
  UseGeneratorReturn,
  GeneratorActions,
  GeneratorUtils,
  UploadedImage
} from './types/generator'

export type {
  ModelSchema,
  GenerationMode,
  AspectRatio,
  OutputFormat,
  GenerationParams
} from './types/models'

export type {
  APIResponse,
  GenerationResult,
  GenerationRequest
} from './types/api'

// Configuration
export {
  API_CONFIG,
  REPLICATE_CONFIG,
  DEFAULT_GENERATOR_SETTINGS,
  FEATURE_FLAGS
} from './lib/config'

// Utilities
export {
  cn,
  formatCost,
  formatDuration,
  formatFileSize,
  formatDate,
  validatePrompt,
  validateImageFile
} from './lib/utils'
