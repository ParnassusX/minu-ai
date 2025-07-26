'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Upload,
  Play,
  Image as ImageIcon,
  Video,
  Wand2,
  X,
  Sparkles,
  History,
  Loader2,
  Lightbulb
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useCurrentMode, useSetMode } from '@/lib/stores/modeStore'
import { ReplicateModelSchema, ModelParameter } from '@/lib/replicate/realModelData'
import { useModelsByMode } from '@/lib/hooks/useRealModelData'
import { generationService } from '@/lib/services/generationService'
import { GenerationResultDisplay } from './GenerationResultDisplay'
import { validateAllParameters } from '@/lib/utils/parameterValidation'
import { CompactModelSelector } from './CompactModelSelector'
import { AspectRatioControls } from './AspectRatioControls'
import { useGallery } from '@/contexts/GalleryContext'
import { MultiImageUpload } from './MultiImageUpload'
import { ProgressiveParameterControls } from './ProgressiveParameterControls'
import { SuggestionPanel } from '@/components/suggestions/SuggestionPanel'

interface ModernGeneratorProps {
  className?: string
}

interface GenerationState {
  isGenerating: boolean
  progress: number
  stage: string
  error: string | null
}

interface SavedPrompt {
  id: string
  text: string
  timestamp: number
  mode: string
}

export const ModernGenerator: React.FC<ModernGeneratorProps> = ({ className }) => {
  const currentMode = useCurrentMode()
  const setMode = useSetMode()
  const { addImage, refreshGallery } = useGallery()

  // Core state
  const [prompt, setPrompt] = useState('')
  const [selectedModel, setSelectedModel] = useState<ReplicateModelSchema | null>(null)
  const [uploadedImage, setUploadedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [multiImages, setMultiImages] = useState<Record<string, { file: File | null, preview: string | null, url: string | null }>>({})
  const [parameters, setParameters] = useState<Record<string, any>>({})
  const [showPromptHistory, setShowPromptHistory] = useState(false)
  const [isEnhancing, setIsEnhancing] = useState(false)
  const [savedPrompts, setSavedPrompts] = useState<SavedPrompt[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [generationState, setGenerationState] = useState<GenerationState>({
    isGenerating: false,
    progress: 0,
    stage: 'idle',
    error: null
  })
  const [generationResults, setGenerationResults] = useState<any[]>([])
  const [showResults, setShowResults] = useState(false)

  // Use real model data - now simplified and reliable
  const { models: availableModels, loading: modelsLoading, error: modelsError } = useModelsByMode(currentMode)



  // CRITICAL FIX: Separate model selection from result clearing to prevent race conditions

  // Clear results immediately when mode changes (no dependencies on model state)
  useEffect(() => {
    // Clear previous generation results when switching modes
    setGenerationResults([])
    setShowResults(false)

    // Reset any error states
    setGenerationState(prev => ({
      ...prev,
      error: null,
      stage: 'idle'
    }))
  }, [currentMode]) // Only depend on mode changes - this prevents race conditions

  // Set default model when mode changes (separate from result clearing)
  useEffect(() => {
    if (availableModels.length > 0) {
      // Only change model if current model doesn't support the new mode
      if (!selectedModel || !availableModels.find(m => m.id === selectedModel.id)) {
        setSelectedModel(availableModels[0])
      }
    }
  }, [currentMode, availableModels]) // Removed selectedModel from deps to prevent loops

  // Initialize parameters when model changes
  useEffect(() => {
    if (selectedModel) {
      const defaultParams: Record<string, any> = {}
      const excludedParams = ['prompt', 'image', 'input_image', 'first_frame_image']

      selectedModel.parameters.basic.forEach(param => {
        if (!excludedParams.includes(param.name)) {
          defaultParams[param.name] = param.default
        }
      })
      selectedModel.parameters.intermediate.forEach(param => {
        if (!excludedParams.includes(param.name)) {
          defaultParams[param.name] = param.default
        }
      })
      selectedModel.parameters.advanced.forEach(param => {
        if (!excludedParams.includes(param.name)) {
          defaultParams[param.name] = param.default
        }
      })

      setParameters(defaultParams)
    }
  }, [selectedModel])

  // Load saved prompts from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('minu-ai-prompts')
    if (saved) {
      setSavedPrompts(JSON.parse(saved))
    }
  }, [])



  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploadedImage(file)

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)

    // Upload to Cloudinary for actual use
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        const result = await response.json()
        // Store the Cloudinary URL for actual generation
        setParameters(prev => ({
          ...prev,
          imageUrl: result.url
        }))
      }
    } catch (error) {
      console.error('Image upload failed:', error)
    }
  }

  const removeImage = () => {
    setUploadedImage(null)
    setImagePreview(null)
  }

  const handleMultiImageUpload = async (slotId: string, file: File) => {
    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setMultiImages(prev => ({
        ...prev,
        [slotId]: {
          ...prev[slotId],
          file,
          preview: e.target?.result as string
        }
      }))
    }
    reader.readAsDataURL(file)

    // Upload to Cloudinary
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        const result = await response.json()
        setMultiImages(prev => ({
          ...prev,
          [slotId]: {
            ...prev[slotId],
            url: result.url
          }
        }))

        // Update parameters with the uploaded image URL
        setParameters(prev => ({
          ...prev,
          [slotId]: result.url
        }))
      }
    } catch (error) {
      console.error('Multi-image upload failed:', error)
    }
  }

  const handleMultiImageRemove = (slotId: string) => {
    setMultiImages(prev => ({
      ...prev,
      [slotId]: { file: null, preview: null, url: null }
    }))

    // Remove from parameters
    setParameters(prev => {
      const newParams = { ...prev }
      delete newParams[slotId]
      return newParams
    })
  }

  const handleParameterChange = (paramName: string, value: any) => {
    setParameters(prev => ({
      ...prev,
      [paramName]: value
    }))
  }

  // Helper function to check if model needs multiple images
  const needsMultipleImages = (model: ReplicateModelSchema | null): boolean => {
    if (!model) return false

    // Use model capabilities to determine multi-image support
    return model.capabilities.supportsMultipleImages && model.capabilities.maxImages > 1
  }

  // Get image upload slots for multi-image models
  const getImageSlots = (model: ReplicateModelSchema | null) => {
    if (!needsMultipleImages(model)) return []

    const maxImages = model?.capabilities.maxImages || 2
    const slots = []

    // Generate slots based on model capabilities and ID
    if (model?.id === 'seedance-1-lite') {
      // Seedance Lite supports dual image input
      slots.push(
        {
          id: 'image1',
          label: 'First Image',
          description: 'First reference image',
          file: multiImages.image1?.file || null,
          preview: multiImages.image1?.preview || null,
          url: multiImages.image1?.url || null
        },
        {
          id: 'image2',
          label: 'Second Image',
          description: 'Second reference image',
          file: multiImages.image2?.file || null,
          preview: multiImages.image2?.preview || null,
          url: multiImages.image2?.url || null
        }
      )
    } else if (model?.id === 'flux-kontext-pro' || model?.id === 'flux-kontext-max') {
      // FLUX Kontext models support multiple reference images
      for (let i = 1; i <= Math.min(maxImages, 4); i++) {
        const slotId = i === 1 ? 'image' : `image${i}`
        slots.push({
          id: slotId,
          label: `Reference ${i}`,
          description: `Reference image ${i} for context`,
          file: multiImages[slotId]?.file || null,
          preview: multiImages[slotId]?.preview || null,
          url: multiImages[slotId]?.url || null
        })
      }
    } else {
      // Default multi-image slots for other models
      slots.push(
        {
          id: 'first_frame_image',
          label: 'First Frame',
          description: 'Starting frame for video',
          file: multiImages.first_frame_image?.file || null,
          preview: multiImages.first_frame_image?.preview || null,
          url: multiImages.first_frame_image?.url || null
        },
        {
          id: 'subject_reference',
          label: 'Subject Reference',
          description: 'Character/object reference',
          file: multiImages.subject_reference?.file || null,
          preview: multiImages.subject_reference?.preview || null,
          url: multiImages.subject_reference?.url || null
        }
      )
    }

    return slots
  }

  const enhancePrompt = async () => {
    if (!prompt.trim()) return
    
    setIsEnhancing(true)
    try {
      const response = await fetch('/api/enhance-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt.trim() })
      })
      
      if (response.ok) {
        const { enhancedPrompt } = await response.json()
        setPrompt(enhancedPrompt)
      }
    } catch (error) {
      console.error('Failed to enhance prompt:', error)
    } finally {
      setIsEnhancing(false)
    }
  }

  const savePrompt = () => {
    if (!prompt.trim()) return
    
    const newPrompt: SavedPrompt = {
      id: Date.now().toString(),
      text: prompt.trim(),
      timestamp: Date.now(),
      mode: currentMode
    }
    
    const updated = [newPrompt, ...savedPrompts.slice(0, 19)] // Keep last 20
    setSavedPrompts(updated)
    localStorage.setItem('minu-ai-prompts', JSON.stringify(updated))
  }

  const loadPrompt = (savedPrompt: SavedPrompt) => {
    setPrompt(savedPrompt.text)
    setShowPromptHistory(false)
  }

  const handleSuggestionUse = (suggestion: any) => {
    setPrompt(suggestion.text)
    setShowSuggestions(false)
  }

  const handleGenerate = async () => {
    if (!selectedModel) return

    // Different validation for different modes
    if (currentMode === 'enhance' && !parameters.imageUrl) {
      setGenerationState(prev => ({ ...prev, error: 'Please upload an image to enhance' }))
      return
    }

    if ((currentMode === 'images' || currentMode === 'video') && !prompt.trim()) {
      setGenerationState(prev => ({ ...prev, error: 'Please enter a prompt' }))
      return
    }

    // Validate parameters against model schema using comprehensive validation
    // Exclude prompt parameter since it's handled separately in the UI
    const allModelParams = [
      ...selectedModel.parameters.basic,
      ...selectedModel.parameters.intermediate,
      ...selectedModel.parameters.advanced
    ].filter(param => param.name !== 'prompt')

    const validation = validateAllParameters(parameters, allModelParams, {
      transformValues: true, // Allow automatic value transformation
      strict: false // Don't treat warnings as errors
    })

    if (!validation.isValid) {
      setGenerationState(prev => ({
        ...prev,
        error: `Parameter validation failed: ${validation.errors.join('; ')}`
      }))
      return
    }

    // Log warnings if any
    if (validation.warnings.length > 0) {
      console.warn('Parameter validation warnings:', validation.warnings)
    }

    // Save prompt if it's new
    if (prompt.trim() && !savedPrompts.some(p => p.text === prompt.trim())) {
      savePrompt()
    }

    setGenerationState({
      isGenerating: true,
      progress: 0,
      stage: 'preparing',
      error: null
    })

    try {
      // Prepare images based on model capabilities
      const preparedImages = (() => {
        if (needsMultipleImages(selectedModel)) {
          // Multi-image models: collect all uploaded images
          const imageUrls = Object.values(multiImages)
            .filter(img => img.url)
            .map(img => img.url)
          return imageUrls.length > 0 ? imageUrls : null
        } else if (selectedModel?.capabilities.supportsImageInput) {
          // Single image models: use the single uploaded image URL
          return parameters.imageUrl ? [parameters.imageUrl] : null
        } else {
          // Text-only models: no images
          return null
        }
      })()

      // Prepare generation request with validated and transformed parameters
      const generationRequest = {
        model: selectedModel,
        prompt: prompt.trim(),
        parameters: validation.validatedParameters, // Use validated parameters
        images: preparedImages,
        mode: currentMode
      }

      setGenerationState(prev => ({ ...prev, stage: 'generating', progress: 25 }))

      // Use the new generation service
      const { result, storedResults } = await generationService.completeGeneration(generationRequest)

      setGenerationState(prev => ({ ...prev, stage: 'complete', progress: 100 }))

      // Process results for display
      const displayResults = storedResults.map((storedResult, index) => ({
        id: storedResult.id || `result-${index}`,
        url: storedResult.cloudinaryUrl || storedResult.originalUrl,
        originalUrl: storedResult.originalUrl,
        type: currentMode === 'video' ? 'video' : 'image',
        format: storedResult.format || (currentMode === 'video' ? 'mp4' : 'jpg'),
        metadata: {
          width: storedResult.metadata?.width,
          height: storedResult.metadata?.height,
          duration: storedResult.metadata?.duration,
          model: selectedModel?.name,
          prompt: prompt.trim()
        }
      }))

      // Show results in UI
      setGenerationResults(displayResults)
      setShowResults(true)

      // Add to Gallery context for immediate availability
      storedResults.forEach((storedResult) => {
        if (storedResult.databaseId) {
          addImage({
            id: storedResult.databaseId,
            url: storedResult.cloudinaryUrl || storedResult.originalUrl,
            prompt: prompt.trim(),
            model: selectedModel?.name || 'Unknown',
            parameters: validation.validatedParameters,
            width: storedResult.metadata?.width || 1024,
            height: storedResult.metadata?.height || 1024,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isFavorite: false,
            tags: []
          })
        }
      })

      // Show success message with results
      console.log('Generation successful:', {
        result,
        storedResults,
        displayResults,
        cloudinaryUrls: storedResults.map(r => r.cloudinaryUrl)
      })

      // Reset generation state after showing success
      setTimeout(() => {
        setGenerationState({
          isGenerating: false,
          progress: 0,
          stage: 'idle',
          error: null
        })
      }, 3000)

    } catch (error) {
      setGenerationState({
        isGenerating: false,
        progress: 0,
        stage: 'idle',
        error: error instanceof Error ? error.message : 'Generation failed'
      })
    }
  }

  const getModeIcon = (mode: string) => {
    switch (mode) {
      case 'images': return ImageIcon
      case 'video': return Video
      case 'enhance': return Wand2
      default: return Sparkles
    }
  }

  const getModeConfig = (mode: string) => {
    switch (mode) {
      case 'images':
        return {
          title: 'Generate Images',
          description: 'Create stunning images from text descriptions',
          primaryInput: 'prompt',
          supportsImageInput: selectedModel?.capabilities.supportsImageInput || false,
          placeholder: 'Describe the image you want to create...'
        }
      case 'video':
        return {
          title: 'Generate Videos',
          description: 'Create videos from text and images',
          primaryInput: 'prompt',
          supportsImageInput: true,
          placeholder: 'Describe the video motion or scene...'
        }
      case 'enhance':
        return {
          title: 'Enhance Images',
          description: 'Upscale and improve image quality',
          primaryInput: 'image',
          supportsImageInput: true,
          placeholder: 'Upload an image to enhance'
        }
      default:
        return {
          title: 'AI Generator',
          description: 'Create with AI',
          primaryInput: 'prompt',
          supportsImageInput: false,
          placeholder: 'Enter your prompt...'
        }
    }
  }

  const modeConfig = getModeConfig(currentMode)
  const ModeIcon = getModeIcon(currentMode)

  return (
    <div className="w-full flex flex-col min-h-0">
      {/* Main Content - Centered Layout */}
      <div className="flex-1 px-3 sm:px-4 lg:px-6 py-2 min-h-0">
        <div className={cn("max-w-3xl mx-auto space-y-2", className)}>
          {/* Professional Mode Selector Grid */}
          <div className="flex items-center justify-center">
            <div className="grid grid-cols-3 gap-1 p-1 bg-white/10 backdrop-blur-md rounded-xl border border-white/20">
              {(['images', 'video', 'enhance'] as const).map((mode) => {
                const Icon = getModeIcon(mode)
                const isActive = currentMode === mode

                return (
                  <button
                    key={mode}
                    onClick={() => setMode(mode)}
                    className={cn(
                      "flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 text-sm min-w-[100px]",
                      isActive
                        ? "bg-blue-500 text-white shadow-lg"
                        : "text-gray-600 dark:text-gray-400 hover:bg-white/10"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="capitalize">{mode}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Compact Header */}
          <div className="text-center space-y-0.5">
            <div className="flex items-center justify-center gap-1.5">
              <ModeIcon className="w-4 h-4 text-blue-500" />
              <h1 className="text-lg font-bold text-gray-900 dark:text-white break-words">
                {modeConfig.title}
              </h1>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 break-words">
              {modeConfig.description}
            </p>
          </div>

          {/* Model Selector - Compact */}
          <div className="max-w-sm mx-auto">
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 text-center">
              Model
            </label>
            {modelsLoading ? (
              <div className="flex items-center justify-center p-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl">
                <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Loading models...</span>
              </div>
            ) : availableModels.length === 0 ? (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                <p className="text-sm text-red-600 dark:text-red-400 text-center">
                  No models available for {currentMode} mode.
                </p>
              </div>
            ) : (
              <CompactModelSelector
                selectedModel={selectedModel}
                availableModels={availableModels}
                onModelSelect={setSelectedModel}
              />
            )}
          </div>

          {/* Main Generation Interface - Compact */}
          <div className="bg-white/10 backdrop-blur-md rounded-lg border border-white/20 p-3">

        {/* Primary Input Area - Tight Layout */}
        <div className="space-y-2 mb-3">
          {/* Prompt and Image Upload Row */}
          <div className="flex gap-3">

            {/* Text Prompt Area - Flexible width */}
            {modeConfig.primaryInput === 'prompt' && (
              <div className="flex-1 space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  Prompt
                </label>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setShowPromptHistory(!showPromptHistory)}
                    className="p-0.5 text-gray-500 hover:text-blue-500 transition-colors"
                    title="Prompt History"
                  >
                    <History className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setShowSuggestions(!showSuggestions)}
                    className="p-0.5 text-gray-500 hover:text-purple-500 transition-colors"
                    title="Browse Suggestions"
                  >
                    <Lightbulb className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={enhancePrompt}
                    disabled={!prompt.trim() || isEnhancing}
                    className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title="Enhance Prompt with AI"
                  >
                    {isEnhancing ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Sparkles className="w-3 h-3" />
                    )}
                    Enhance
                  </button>
                </div>
              </div>

              <div className="relative">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={modeConfig.placeholder}
                  className="w-full px-3 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none min-h-[80px] break-words text-sm"
                  rows={3}
                />

                {/* Prompt History Dropdown */}
                <AnimatePresence>
                  {showPromptHistory && savedPrompts.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10 max-h-[40vh] overflow-y-auto"
                    >
                      {savedPrompts.slice(0, 10).map((savedPrompt) => (
                        <button
                          key={savedPrompt.id}
                          onClick={() => loadPrompt(savedPrompt)}
                          className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                        >
                          <div className="text-sm text-gray-900 dark:text-white truncate break-words">
                            {savedPrompt.text}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {savedPrompt.mode} • {new Date(savedPrompt.timestamp).toLocaleDateString()}
                          </div>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Suggestion Panel */}
                <AnimatePresence>
                  {showSuggestions && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute top-full left-0 right-0 mt-2 z-20"
                    >
                      <SuggestionPanel
                        onSuggestionUse={handleSuggestionUse}
                        compact={true}
                        className="max-h-[50vh] overflow-y-auto"
                        currentMode={currentMode}
                        selectedModel={selectedModel}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          )}

            {/* Compact Square Image Upload */}
            {(modeConfig.supportsImageInput || modeConfig.primaryInput === 'image') && (
              <div className="w-20 flex-shrink-0 space-y-0.5">
              {needsMultipleImages(selectedModel) ? (
                // Multi-image upload for video models like Seedance
                <MultiImageUpload
                  slots={getImageSlots(selectedModel)}
                  onImageUpload={handleMultiImageUpload}
                  onImageRemove={handleMultiImageRemove}
                />
              ) : (
                // Single image upload for other models
                <>
                  <label className="text-xs font-medium text-gray-700 dark:text-gray-300 block mb-0.5">
                    Image
                  </label>

                  <div className="relative w-full h-20 aspect-square">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="image-upload"
                    />

                    {imagePreview ? (
                      <div className="relative group w-full h-full">
                        <img
                          src={imagePreview}
                          alt="Uploaded preview"
                          className="w-full h-full object-cover rounded-lg border border-gray-300 dark:border-gray-600"
                          onLoad={(e) => {
                            const img = e.target as HTMLImageElement
                            const container = img.parentElement?.querySelector('.image-info')
                            if (container) {
                              container.textContent = `${img.naturalWidth}×${img.naturalHeight}`
                            }
                          }}
                        />
                        <button
                          onClick={removeImage}
                          className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-2 h-2" />
                        </button>
                      </div>
                    ) : (
                      <label
                        htmlFor="image-upload"
                        className="cursor-pointer w-full h-full border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex flex-col items-center justify-center text-center hover:border-blue-500 transition-colors"
                      >
                        <Upload className="w-6 h-6 text-gray-400" />
                      </label>
                    )}
                  </div>
                </>
              )}
            </div>
            )}
          </div>

          {/* Professional Controls Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-center">

            {/* Aspect Ratio - Grid Item */}
            {(currentMode === 'images' || currentMode === 'video') && (
              <div className="flex items-center gap-2 min-w-0">
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                  Ratio:
                </label>
                <AspectRatioControls
                  value={parameters.aspect_ratio || '1:1'}
                  onChange={(value) => handleParameterChange('aspect_ratio', value)}
                />
              </div>
            )}


          </div>
        </div>

        {/* Progressive Parameter Controls */}
        {selectedModel && (
          <div className="mb-4">
            <ProgressiveParameterControls
              basicParams={selectedModel.parameters.basic.filter(param =>
                param.name !== 'prompt' &&
                param.name !== 'image' &&
                param.name !== 'input_image' &&
                param.name !== 'aspect_ratio' &&
                param.name !== 'image1' &&
                param.name !== 'image2' &&
                param.name !== 'first_frame_image' &&
                param.name !== 'subject_reference'
              )}
              intermediateParams={selectedModel.parameters.intermediate.filter(param =>
                param.name !== 'aspect_ratio' &&
                param.name !== 'image' &&
                param.name !== 'input_image' &&
                param.name !== 'image1' &&
                param.name !== 'image2' &&
                param.name !== 'first_frame_image' &&
                param.name !== 'subject_reference'
              )}
              advancedParams={(selectedModel.parameters.advanced || []).filter(param =>
                param.name !== 'image' &&
                param.name !== 'input_image' &&
                param.name !== 'image1' &&
                param.name !== 'image2' &&
                param.name !== 'first_frame_image' &&
                param.name !== 'subject_reference'
              )}
              values={parameters}
              onChange={handleParameterChange}
            />
          </div>
        )}

        {/* Professional Generate Section */}
        <div className="grid grid-cols-1 gap-4">
          <div className="flex items-center justify-center">
            {/* Generate Button - Professional Sizing */}
            <button
              onClick={handleGenerate}
              disabled={generationState.isGenerating || (
                (currentMode === 'enhance' && !parameters.imageUrl) ||
                ((currentMode === 'images' || currentMode === 'video') && !prompt.trim())
              )}
              className={cn(
                "w-full max-w-[280px] py-3 px-6 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2",
                generationState.isGenerating
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl"
              )}
            >
              {generationState.isGenerating ? (
                <>
                  {/* ENHANCED: Modern AI platform loading animation */}
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
                  </div>
                  {generationState.stage === 'preparing' && 'Preparing...'}
                  {generationState.stage === 'generating' && `Generating with ${selectedModel?.name}...`}
                  {generationState.stage === 'complete' && 'Complete!'}
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  {currentMode === 'images' && 'Generate Image'}
                  {currentMode === 'video' && 'Generate Video'}
                  {currentMode === 'enhance' && 'Enhance Image'}
                </>
              )}
            </button>
          </div>
        </div>

        {/* Error Display */}
        {generationState.error && (
          <div className="mt-4 p-3 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded-lg">
            <p className="text-sm text-red-700 dark:text-red-400">{generationState.error}</p>
          </div>
        )}

          {/* Generation Results Display */}
          <GenerationResultDisplay
            results={generationResults}
            isVisible={showResults}
            onClose={() => setShowResults(false)}
            onDownload={(result) => {
              console.log('Downloading result:', result)
            }}
            onAddToFavorites={(result) => {
              console.log('Adding to favorites:', result)
            }}
          />
          </div>
        </div>
      </div>
    </div>
  )
}


