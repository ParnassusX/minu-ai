/**
 * Generator Hook - Minu.AI Generator V2
 * Main hook for generator state management and actions
 */

'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { GeneratorState, GeneratorSettings, UseGeneratorReturn, GeneratorActions, GeneratorUtils, UploadedImage } from '../types/generator'
import { GenerationMode, ModelSchema } from '../types/models'
import { GenerationResult } from '../types/api'
import { getModelsByMode, getPriorityModels, getModelById, validateModelSelection, validateModelParameters, getDefaultParameters, estimateGenerationCost } from '../lib/models'
import { storage, createGeneratorError, validatePrompt, validateImageFile } from '../lib/utils'
import { DEFAULT_GENERATOR_SETTINGS } from '../lib/config'

const STORAGE_KEYS = {
  SETTINGS: 'minu-generator-v2-settings',
  HISTORY: 'minu-generator-v2-history',
  LAST_PROMPT: 'minu-generator-v2-last-prompt',
  LAST_MODEL: 'minu-generator-v2-last-model'
} as const

export const useGenerator = (initialMode: GenerationMode = 'images'): UseGeneratorReturn => {
  // Core state
  const [mode, setMode] = useState<GenerationMode>(initialMode)
  // Precompute initial models to avoid a render where no model is selected
  const initialModels = initialMode === 'images' ? getPriorityModels() : getModelsByMode(initialMode)
  const initialSelectedModel = initialModels.length > 0 ? initialModels[0] : null
  const [selectedModel, setSelectedModel] = useState<ModelSchema | null>(initialSelectedModel)
  const [availableModels, setAvailableModels] = useState<ModelSchema[]>(initialModels)
  const [prompt, setPrompt] = useState('')
  const [parameters, setParameters] = useState<Record<string, any>>(
    initialSelectedModel ? getDefaultParameters(initialSelectedModel) : {}
  )
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([])
  
  // Generation state
  const [isGenerating, setIsGenerating] = useState(false)
  const [currentGeneration, setCurrentGeneration] = useState<GenerationResult | null>(null)
  const [generationHistory, setGenerationHistory] = useState<GenerationResult[]>([])
  
  // UI state
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [warnings, setWarnings] = useState<string[]>([])
  
  // Settings
  const [settings, setSettings] = useState<GeneratorSettings>(DEFAULT_GENERATOR_SETTINGS)
  
  // Refs for cleanup
  const abortControllerRef = useRef<AbortController | null>(null)
  const generationTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  // Initialize state from storage
  useEffect(() => {
    const savedSettings = storage.get(STORAGE_KEYS.SETTINGS, DEFAULT_GENERATOR_SETTINGS)
    const savedHistory = storage.get(STORAGE_KEYS.HISTORY, [])
    const savedPrompt = storage.get(STORAGE_KEYS.LAST_PROMPT, '')
    const savedModelId = storage.get(STORAGE_KEYS.LAST_MODEL, '')
    
    setSettings(savedSettings)
    setGenerationHistory(savedHistory)
    setPrompt(savedPrompt)
    
    // Restore last selected model if valid
    if (savedModelId) {
      const model = getModelById(savedModelId)
      if (model && model.supportedModes.includes(mode)) {
        setSelectedModel(model)
        setParameters(getDefaultParameters(model))
      }
    }
  }, [mode])
  
  // Update available models when mode changes
  useEffect(() => {
    console.log('🎨 useGenerator: Loading models for mode:', mode)

    const models = mode === 'images' ? getPriorityModels() : getModelsByMode(mode)
    console.log('🎨 useGenerator: Models loaded:', {
      mode,
      modelsCount: models.length,
      modelNames: models.map(m => m.name),
      firstModel: models[0]?.name || 'None'
    })

    setAvailableModels(models)

    // Auto-select first model if none selected or current model doesn't support new mode
    if (!selectedModel || !selectedModel.supportedModes.includes(mode)) {
      const firstModel = models[0]
      console.log('🎨 useGenerator: Auto-selecting model:', {
        previousModel: selectedModel?.name || 'None',
        newModel: firstModel?.name || 'None',
        reason: !selectedModel ? 'No model selected' : 'Model does not support mode'
      })

      if (firstModel) {
        setSelectedModel(firstModel)
        setParameters(getDefaultParameters(firstModel))
        console.log('🎨 useGenerator: Model selected successfully:', firstModel.name)
      } else {
        console.error('🎨 useGenerator: No models available for mode:', mode)
      }
    }
  }, [mode, selectedModel])
  
  // Save state to storage
  useEffect(() => {
    storage.set(STORAGE_KEYS.SETTINGS, settings)
  }, [settings])
  
  useEffect(() => {
    storage.set(STORAGE_KEYS.HISTORY, generationHistory.slice(0, settings.maxHistoryItems))
  }, [generationHistory, settings.maxHistoryItems])
  
  useEffect(() => {
    storage.set(STORAGE_KEYS.LAST_PROMPT, prompt)
  }, [prompt])
  
  useEffect(() => {
    storage.set(STORAGE_KEYS.LAST_MODEL, selectedModel?.id || '')
  }, [selectedModel])
  
  // Actions
  const actions: GeneratorActions = {
    setMode: useCallback((newMode: GenerationMode) => {
      setMode(newMode)
      setError(null)
      setWarnings([])
    }, []),
    
    selectModel: useCallback((model: ModelSchema) => {
      setSelectedModel(model)
      setParameters(getDefaultParameters(model))
      setError(null)
      setWarnings([])
    }, []),
    
    setPrompt: useCallback((newPrompt: string) => {
      console.log('🎯 useGenerator.setPrompt called:', {
        oldPrompt: prompt,
        newPrompt,
        lengthChange: `${prompt.length} → ${newPrompt.length}`
      })

      // Force state update with functional update to ensure it takes effect
      setPrompt(prevPrompt => {
        console.log('🎯 Functional state update:', { prevPrompt, newPrompt })
        return newPrompt
      })

      setError(null)
      console.log('🎯 Prompt state updated successfully')

      // Save to localStorage for persistence
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('minu-last-prompt', newPrompt)
        } catch (e) {
          // Ignore localStorage errors
        }
      }
    }, [prompt]),
    
    setParameter: useCallback((name: string, value: any) => {
      setParameters(prev => ({ ...prev, [name]: value }))
      setError(null)
    }, []),
    
    setParameters: useCallback((newParams: Record<string, any>) => {
      setParameters(newParams)
      setError(null)
    }, []),
    
    uploadImage: useCallback(async (file: File): Promise<UploadedImage> => {
      // Validate file
      const validationErrors = validateImageFile(file)
      if (validationErrors.length > 0) {
        throw new Error(validationErrors[0].message)
      }

      console.log('📤 Uploading image:', { name: file.name, size: file.size, type: file.type })

      try {
        // Create form data for upload
        const formData = new FormData()
        formData.append('file', file)
        formData.append('purpose', 'input_image')

        // Upload to server (if upload endpoint exists)
        let uploadedUrl = URL.createObjectURL(file) // Fallback to blob URL

        try {
          const uploadResponse = await fetch('/api/upload-image', {
            method: 'POST',
            body: formData
          })

          if (uploadResponse.ok) {
            const uploadData = await uploadResponse.json()
            if (uploadData.success && uploadData.data?.url) {
              uploadedUrl = uploadData.data.url
              console.log('✅ Image uploaded to server:', uploadedUrl)
            }
          } else {
            console.warn('⚠️ Server upload failed, using blob URL')
          }
        } catch (uploadError) {
          console.warn('⚠️ Upload endpoint not available, using blob URL:', uploadError)
        }

        // Create uploaded image object
        const uploadedImage: UploadedImage = {
          id: `img_${Date.now()}_${Math.random().toString(36).substring(2)}`,
          file,
          url: uploadedUrl,
          name: file.name,
          size: file.size,
          type: file.type,
          uploadedAt: new Date().toISOString()
        }

        setUploadedImages(prev => [...prev, uploadedImage])
        console.log('✅ Image added to state:', uploadedImage.id)
        return uploadedImage

      } catch (error: any) {
        console.error('❌ Image upload failed:', error)
        throw new Error(`Upload failed: ${error.message}`)
      }
    }, []),
    
    removeImage: useCallback((imageId: string) => {
      setUploadedImages(prev => {
        const image = prev.find(img => img.id === imageId)
        if (image) {
          URL.revokeObjectURL(image.url)
        }
        return prev.filter(img => img.id !== imageId)
      })
    }, []),
    
    generate: useCallback(async (): Promise<GenerationResult> => {
      if (!selectedModel) {
        throw new Error('No model selected')
      }
      
      // Validate input
      const promptErrors = validatePrompt(prompt)
      const modelErrors = validateModelSelection(selectedModel.id, mode)
      const paramErrors = validateModelParameters(selectedModel, parameters)
      
      const allErrors = [...promptErrors, ...modelErrors, ...paramErrors]
      if (allErrors.length > 0) {
        throw new Error(allErrors[0].message)
      }
      
      setIsGenerating(true)
      setError(null)
      setCurrentGeneration(null)
      
      // Create abort controller for cancellation
      abortControllerRef.current = new AbortController()
      
      try {
        // Prepare request data
        const requestData = {
          model: selectedModel.replicateModel,
          mode,
          input: {
            ...parameters,
            prompt: prompt.trim()
          },
          options: {
            saveToGallery: settings.autoSave,
            timeout: 300000 // 5 minutes
          }
        }
        
        // Make API request
        const response = await fetch('/api/generate-v2', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestData),
          signal: abortControllerRef.current.signal
        })
        
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error?.userMessage || errorData.error || 'Generation failed')
        }
        
        const result: GenerationResult = await response.json()
        
        // Update state
        setCurrentGeneration(result)
        setGenerationHistory(prev => [result, ...prev].slice(0, settings.maxHistoryItems))
        
        return result
        
      } catch (error: any) {
        if (error.name === 'AbortError') {
          throw new Error('Generation cancelled')
        }
        throw error
      } finally {
        setIsGenerating(false)
        abortControllerRef.current = null
      }
    }, [selectedModel, mode, prompt, parameters, settings.autoSave, settings.maxHistoryItems]),
    
    cancelGeneration: useCallback(() => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      if (generationTimeoutRef.current) {
        clearTimeout(generationTimeoutRef.current)
      }
      setIsGenerating(false)
      setCurrentGeneration(null)
    }, []),
    
    clearHistory: useCallback(() => {
      setGenerationHistory([])
      storage.remove(STORAGE_KEYS.HISTORY)
    }, []),
    
    removeFromHistory: useCallback((resultId: string) => {
      setGenerationHistory(prev => prev.filter(result => result.id !== resultId))
    }, []),
    
    updateSettings: useCallback((newSettings: Partial<GeneratorSettings>) => {
      setSettings(prev => ({ ...prev, ...newSettings }))
    }, []),
    
    clearError: useCallback(() => {
      setError(null)
    }, []),
    
    clearWarnings: useCallback(() => {
      setWarnings([])
    }, [])
  }
  
  // Utilities
  const utils: GeneratorUtils = {
    validateInput: useCallback(() => {
      const errors = []

      console.log('🔍 useGenerator: Validating input:', {
        hasSelectedModel: !!selectedModel,
        selectedModelName: selectedModel?.name || 'None',
        promptLength: prompt.length,
        promptTrimmed: prompt.trim(),
        parametersCount: Object.keys(parameters).length
      })

      if (!selectedModel) {
        const modelError = createGeneratorError('MODEL_REQUIRED', 'Please select a model', 'model')
        errors.push(modelError)
        console.log('🔍 useGenerator: Model validation failed:', modelError)
      }

      const promptErrors = validatePrompt(prompt)
      errors.push(...promptErrors)
      console.log('🔍 useGenerator: Prompt validation:', {
        promptErrors: promptErrors.map(e => e.message),
        promptValid: promptErrors.length === 0
      })

      if (selectedModel) {
        const paramErrors = validateModelParameters(selectedModel, parameters)
        errors.push(...paramErrors)
        console.log('🔍 useGenerator: Parameter validation:', {
          paramErrors: paramErrors.map(e => e.message),
          parametersValid: paramErrors.length === 0
        })
      }

      console.log('🔍 useGenerator: Validation complete:', {
        totalErrors: errors.length,
        errorMessages: errors.map(e => e.message),
        isValid: errors.length === 0
      })

      return errors
    }, [selectedModel, prompt, parameters]),
    
    validateParameters: useCallback(() => {
      if (!selectedModel) return []
      return validateModelParameters(selectedModel, parameters)
    }, [selectedModel, parameters]),
    
    estimateCost: useCallback(async () => {
      if (!selectedModel) return 0
      return estimateGenerationCost(selectedModel, parameters)
    }, [selectedModel, parameters]),
    
    exportSettings: useCallback(() => {
      return JSON.stringify({
        settings,
        lastModel: selectedModel?.id,
        lastPrompt: prompt
      }, null, 2)
    }, [settings, selectedModel, prompt]),
    
    importSettings: useCallback((settingsJson: string) => {
      try {
        const imported = JSON.parse(settingsJson)
        if (imported.settings) {
          setSettings({ ...DEFAULT_GENERATOR_SETTINGS, ...imported.settings })
        }
        if (imported.lastPrompt) {
          setPrompt(imported.lastPrompt)
        }
        if (imported.lastModel) {
          const model = getModelById(imported.lastModel)
          if (model) {
            setSelectedModel(model)
            setParameters(getDefaultParameters(model))
          }
        }
      } catch (error) {
        throw new Error('Invalid settings format')
      }
    }, []),
    
    reset: useCallback(() => {
      setPrompt('')
      setParameters(selectedModel ? getDefaultParameters(selectedModel) : {})
      setUploadedImages([])
      setError(null)
      setWarnings([])
      setCurrentGeneration(null)
    }, [selectedModel]),
    
    resetToDefaults: useCallback(() => {
      setSettings(DEFAULT_GENERATOR_SETTINGS)
      setPrompt('')
      setParameters({})
      setUploadedImages([])
      setError(null)
      setWarnings([])
      setCurrentGeneration(null)
      setGenerationHistory([])
      
      // Clear storage
      Object.values(STORAGE_KEYS).forEach(key => storage.remove(key))
    }, [])
  }
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Cancel any ongoing generation
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      if (generationTimeoutRef.current) {
        clearTimeout(generationTimeoutRef.current)
      }
      
      // Revoke object URLs
      uploadedImages.forEach(image => {
        URL.revokeObjectURL(image.url)
      })
    }
  }, [uploadedImages])
  
  // Compose state
  const state: GeneratorState = {
    mode,
    selectedModel,
    availableModels,
    prompt,
    parameters,
    uploadedImages,
    isGenerating,
    currentGeneration,
    generationHistory,
    isLoading,
    error,
    warnings,
    settings
  }
  
  return {
    state,
    actions,
    utils
  }
}
