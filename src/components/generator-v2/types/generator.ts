/**
 * Generator Type Definitions - Minu.AI Generator V2
 * Types specific to the generator UI and state management
 */

import { GenerationMode, ModelSchema, GenerationParams } from './models'
import { GenerationResult, GenerationStatus } from './api'

// Generator State Types
export interface GeneratorState {
  // Current mode and model
  mode: GenerationMode
  selectedModel: ModelSchema | null
  availableModels: ModelSchema[]
  
  // Input state
  prompt: string
  parameters: Record<string, any>
  uploadedImages: UploadedImage[]
  
  // Generation state
  isGenerating: boolean
  currentGeneration: GenerationResult | null
  generationHistory: GenerationResult[]
  
  // UI state
  isLoading: boolean
  error: string | null
  warnings: string[]
  
  // Settings
  settings: GeneratorSettings
}

export interface GeneratorSettings {
  autoSave: boolean
  showAdvancedParams: boolean
  defaultAspectRatio: string
  defaultOutputFormat: string
  maxHistoryItems: number
  enableNotifications: boolean
}

// Image Upload Types
export interface UploadedImage {
  id: string
  file: File
  url: string
  name: string
  size: number
  type: string
  uploadedAt: string
}

export interface ImageUploadConfig {
  maxSize: number // bytes
  allowedTypes: string[]
  maxImages: number
  required: boolean
  label: string
  description?: string
}

// Parameter Control Types
export interface ParameterControl {
  name: string
  label: string
  type: 'text' | 'number' | 'select' | 'boolean' | 'slider' | 'file'
  value: any
  defaultValue: any
  required: boolean
  disabled: boolean
  visible: boolean
  order: number
  group?: string
  description?: string
  validation?: ParameterValidation
  options?: ParameterOption[]
}

export interface ParameterOption {
  value: any
  label: string
  description?: string
  disabled?: boolean
}

export interface ParameterValidation {
  min?: number
  max?: number
  pattern?: string
  custom?: (value: any) => string | null
}

// Generation Flow Types
export interface GenerationStep {
  id: string
  name: string
  description: string
  status: 'pending' | 'active' | 'completed' | 'failed'
  progress?: number
  error?: string
  startedAt?: string
  completedAt?: string
}

export interface GenerationFlow {
  steps: GenerationStep[]
  currentStep: number
  totalSteps: number
  overallProgress: number
  estimatedTimeRemaining?: number
}

// Result Display Types
export interface ResultDisplayConfig {
  showMetadata: boolean
  showCost: boolean
  showDownloadOptions: boolean
  showShareOptions: boolean
  enableFullscreen: boolean
  enableComparison: boolean
}

export interface ResultAction {
  id: string
  label: string
  icon: string
  action: (result: GenerationResult) => void
  disabled?: boolean
  loading?: boolean
}

// Suggestion Types
export interface PromptSuggestion {
  id: string
  text: string
  category: 'style' | 'subject' | 'mood' | 'technique' | 'quality'
  tags: string[]
  popularity: number
  model?: string
}

export interface SuggestionCategory {
  id: string
  name: string
  description: string
  suggestions: PromptSuggestion[]
}

// Error Types
export interface GeneratorError {
  code: string
  message: string
  field?: string
  severity: 'error' | 'warning' | 'info'
  recoverable: boolean
  suggestions?: string[]
}

// Event Types
export type GeneratorEvent = 
  | { type: 'MODE_CHANGED'; mode: GenerationMode }
  | { type: 'MODEL_SELECTED'; model: ModelSchema }
  | { type: 'PROMPT_CHANGED'; prompt: string }
  | { type: 'PARAMETER_CHANGED'; name: string; value: any }
  | { type: 'GENERATION_STARTED'; request: GenerationParams }
  | { type: 'GENERATION_PROGRESS'; progress: number }
  | { type: 'GENERATION_COMPLETED'; result: GenerationResult }
  | { type: 'GENERATION_FAILED'; error: GeneratorError }
  | { type: 'IMAGE_UPLOADED'; image: UploadedImage }
  | { type: 'IMAGE_REMOVED'; imageId: string }
  | { type: 'ERROR_OCCURRED'; error: GeneratorError }
  | { type: 'ERROR_CLEARED' }

// Hook Return Types
export interface UseGeneratorReturn {
  state: GeneratorState
  actions: GeneratorActions
  utils: GeneratorUtils
}

export interface GeneratorActions {
  // Mode and model
  setMode: (mode: GenerationMode) => void
  selectModel: (model: ModelSchema) => void
  
  // Input
  setPrompt: (prompt: string) => void
  setParameter: (name: string, value: any) => void
  setParameters: (params: Record<string, any>) => void
  
  // Images
  uploadImage: (file: File) => Promise<UploadedImage>
  removeImage: (imageId: string) => void
  
  // Generation
  generate: () => Promise<GenerationResult>
  cancelGeneration: () => void
  
  // History
  clearHistory: () => void
  removeFromHistory: (resultId: string) => void
  
  // Settings
  updateSettings: (settings: Partial<GeneratorSettings>) => void
  
  // Error handling
  clearError: () => void
  clearWarnings: () => void
}

export interface GeneratorUtils {
  // Validation
  validateInput: () => GeneratorError[]
  validateParameters: () => GeneratorError[]
  
  // Cost estimation
  estimateCost: () => Promise<number>
  
  // Export/Import
  exportSettings: () => string
  importSettings: (settings: string) => void
  
  // Reset
  reset: () => void
  resetToDefaults: () => void
}
