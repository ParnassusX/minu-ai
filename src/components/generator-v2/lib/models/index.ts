/**
 * Models Module Index - Minu.AI Generator V2
 * Central export point for all model-related functionality
 */

// Model data exports
export {
  PRIORITY_MODELS,
  ALL_MODELS,
  fluxSchnellModel,
  fluxUltraModel,
  fluxKontextProModel,
  fluxKontextMaxModel,
  seedream3Model,
  seedance1LiteModel,
  seedance1ProModel
} from './modelData'

// Model utility exports
export {
  getModelById,
  getModelsByMode,
  getPriorityModels,
  getModelsByProvider,
  getModelsByCategory,
  validateModelSelection,
  validateModelParameters,
  validateParameterValue,
  modelSupportsImageInput,
  modelSupportsMultipleImages,
  getMaxImagesForModel,
  getImageInputParameters,
  getParametersByGroup,
  getRequiredParameters,
  getOptionalParameters,
  estimateGenerationCost,
  compareModelsBySpeed,
  compareModelsByCost,
  compareModelsByQuality,
  filterModelsByTags,
  searchModels,
  getDefaultParameters,
  isModelAvailable,
  isPriorityModel
} from './modelUtils'

// Re-export types for convenience
export type {
  ModelSchema,
  ModelParameter,
  GenerationMode,
  AspectRatio,
  OutputFormat,
  VideoResolution,
  VideoDuration,
  ModelPricing,
  ModelCapabilities,
  ModelPerformance,
  ImageGenerationParams,
  VideoGenerationParams,
  EnhanceParams,
  GenerationParams,
  ModelValidationResult,
  ModelSelectionState,
  PriorityModelId
} from '../../types/models'

// Constants
export { PRIORITY_MODEL_IDS, DEFAULT_PARAMS, MODEL_CATEGORIES } from '../../types/models'
