'use client'

import { useState, useCallback, useMemo, useReducer } from 'react'
import { toastHelpers } from './useToast'

// Types
export interface GenerationParameters {
  numOutputs: number
  aspectRatio: string
  guidanceScale: number
  numInferenceSteps: number
  seed: number
}

export interface GeneratorState {
  selectedModel: string
  prompt: string
  parameters: GenerationParameters
  isGenerating: boolean
  generatedImages: any[]
  error: string | null
}

// Action types
type GeneratorAction =
  | { type: 'SET_MODEL'; payload: string }
  | { type: 'SET_PROMPT'; payload: string }
  | { type: 'UPDATE_PARAMETERS'; payload: Partial<GenerationParameters> }
  | { type: 'SET_GENERATING'; payload: boolean }
  | { type: 'SET_IMAGES'; payload: any[] }
  | { type: 'ADD_IMAGE'; payload: any }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'RESET_STATE' }

// Reducer
function generatorReducer(state: GeneratorState, action: GeneratorAction): GeneratorState {
  switch (action.type) {
    case 'SET_MODEL':
      return { ...state, selectedModel: action.payload }
    case 'SET_PROMPT':
      return { ...state, prompt: action.payload }
    case 'UPDATE_PARAMETERS':
      return { 
        ...state, 
        parameters: { ...state.parameters, ...action.payload }
      }
    case 'SET_GENERATING':
      return { ...state, isGenerating: action.payload }
    case 'SET_IMAGES':
      return { ...state, generatedImages: action.payload }
    case 'ADD_IMAGE':
      return { 
        ...state, 
        generatedImages: [...state.generatedImages, action.payload]
      }
    case 'SET_ERROR':
      return { ...state, error: action.payload }
    case 'RESET_STATE':
      return {
        ...state,
        isGenerating: false,
        generatedImages: [],
        error: null
      }
    default:
      return state
  }
}

// Initial state - using configuration
import { getGenerationDefaults } from '@/lib/config/generator'

const generateSeed = () => Math.floor(Math.random() * 1000000)

const initialState: GeneratorState = {
  selectedModel: 'flux-dev',
  prompt: '',
  parameters: {
    ...getGenerationDefaults(),
    seed: generateSeed(),
  },
  isGenerating: false,
  generatedImages: [],
  error: null
}

// Model limits configuration
const MODEL_LIMITS = {
  'flux-dev': {
    numInferenceSteps: { min: 1, max: 50, default: 28 },
    guidanceScale: { min: 1, max: 10, default: 3.5 }
  },
  'flux-schnell': {
    numInferenceSteps: { min: 1, max: 4, default: 4 },
    guidanceScale: { min: 1, max: 10, default: 3.5 }
  },
  // Add more models as needed
} as const

// Custom hook
export function useGeneratorState() {
  const [state, dispatch] = useReducer(generatorReducer, initialState)

  // Memoized selectors
  const currentLimits = useMemo(() => {
    return MODEL_LIMITS[state.selectedModel as keyof typeof MODEL_LIMITS] || {
      numInferenceSteps: { min: 1, max: 50, default: 28 },
      guidanceScale: { min: 1, max: 10, default: 3.5 }
    }
  }, [state.selectedModel])

  // Optimized actions with useCallback
  const setModel = useCallback((modelId: string) => {
    dispatch({ type: 'SET_MODEL', payload: modelId })
    
    // Auto-adjust parameters to respect model limits
    const limits = MODEL_LIMITS[modelId as keyof typeof MODEL_LIMITS]
    if (limits) {
      const newParameters: Partial<GenerationParameters> = {}
      
      if (state.parameters.numInferenceSteps > limits.numInferenceSteps.max) {
        newParameters.numInferenceSteps = limits.numInferenceSteps.max
      }
      if (state.parameters.guidanceScale > limits.guidanceScale.max) {
        newParameters.guidanceScale = limits.guidanceScale.max
      }
      if (state.parameters.guidanceScale < limits.guidanceScale.min) {
        newParameters.guidanceScale = limits.guidanceScale.min
      }
      
      if (Object.keys(newParameters).length > 0) {
        dispatch({ type: 'UPDATE_PARAMETERS', payload: newParameters })
        toastHelpers.info('Parameters Adjusted', `Settings updated for ${modelId} model`)
      }
    }
  }, [state.parameters])

  const setPrompt = useCallback((prompt: string) => {
    dispatch({ type: 'SET_PROMPT', payload: prompt })
  }, [])

  const updateParameters = useCallback((updates: Partial<GenerationParameters>) => {
    dispatch({ type: 'UPDATE_PARAMETERS', payload: updates })
  }, [])

  const setGenerating = useCallback((generating: boolean) => {
    dispatch({ type: 'SET_GENERATING', payload: generating })
    
    if (generating) {
      dispatch({ type: 'SET_ERROR', payload: null })
      toastHelpers.imageGeneration.started(state.selectedModel)
    }
  }, [state.selectedModel])

  const setImages = useCallback((images: any[]) => {
    dispatch({ type: 'SET_IMAGES', payload: images })
  }, [])

  const addImage = useCallback((image: any) => {
    dispatch({ type: 'ADD_IMAGE', payload: image })
  }, [])

  const setError = useCallback((error: string | null) => {
    dispatch({ type: 'SET_ERROR', payload: error })
    
    if (error) {
      toastHelpers.imageGeneration.failed(error)
    }
  }, [])

  // Upload functionality is now handled by the unified upload store

  const generateRandomSeed = useCallback(() => {
    const newSeed = generateSeed()
    dispatch({ type: 'UPDATE_PARAMETERS', payload: { seed: newSeed } })
    toastHelpers.info('New Seed Generated', `Seed: ${newSeed}`)
  }, [])

  const resetState = useCallback(() => {
    dispatch({ type: 'RESET_STATE' })
    toastHelpers.info('Generator Reset', 'All settings have been reset')
  }, [])

  // Validation helpers
  const isValidConfiguration = useMemo(() => {
    return (
      state.prompt.trim().length > 0 &&
      state.selectedModel.length > 0 &&
      !state.isGenerating
    )
  }, [state.prompt, state.selectedModel, state.isGenerating])

  const canGenerate = useMemo(() => {
    return isValidConfiguration && !state.isGenerating
  }, [isValidConfiguration, state.isGenerating])

  return {
    // State
    ...state,
    currentLimits,
    isValidConfiguration,
    canGenerate,
    
    // Actions
    setModel,
    setPrompt,
    updateParameters,
    setGenerating,
    setImages,
    addImage,
    setError,
    generateRandomSeed,
    resetState,
  }
}
