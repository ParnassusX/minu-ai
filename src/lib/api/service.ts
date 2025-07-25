/**
 * API Service Layer for Minu.AI
 * High-level service functions that integrate API clients with the application
 */

import { GeneratorMode } from '@/lib/types/modes'
import { UploadedFile } from '@/lib/types/upload'

// Helper function to find model in registry
const findModelInRegistry = (registry: any, modelId: string): any => {
  for (const category of Object.values(registry)) {
    if (category && typeof category === 'object' && (category as any)[modelId]) {
      return (category as any)[modelId]
    }
  }
  return null
}
import { 
  GenerationRequest, 
  GenerationResult, 
  GenerationSettings,
  APIClientError 
} from './types'
import { getReplicateClient } from './replicate'
import { getGeminiClient } from './gemini'
import { useAPIStore } from '@/lib/stores/apiStore'

/**
 * Create a generation request from current application state
 */
export function createGenerationRequest(
  mode: GeneratorMode,
  model: string,
  prompt: string,
  settings: Partial<GenerationSettings>,
  files?: UploadedFile[]
): GenerationRequest {
  // Convert UploadedFile[] to File[]
  const requestFiles = files?.map(uploadedFile => uploadedFile.file).filter(Boolean)

  // Default settings based on mode
  const defaultSettings: GenerationSettings = {
    aspectRatio: '1:1',
    numImages: 1,
    guidanceScale: 3.5,
    inferenceSteps: 28,
    ...settings
  }

  return {
    mode,
    model,
    prompt,
    settings: defaultSettings,
    files: requestFiles
  }
}

/**
 * Generate content based on mode
 */
export async function generateContent(
  mode: GeneratorMode,
  model: string,
  prompt: string,
  settings: Partial<GenerationSettings>,
  files?: UploadedFile[]
): Promise<GenerationResult> {
  const apiStore = useAPIStore.getState()
  const request = createGenerationRequest(mode, model, prompt, settings, files)

  switch (mode) {
    case 'images':
      return apiStore.generateImage(request)

    case 'video':
      // Video mode supports both text-to-video and image-to-video
      return apiStore.generateVideo(request)

    case 'enhance':
      if (!files || files.length === 0) {
        throw new APIClientError('An image is required for enhance mode', 'MISSING_FILES')
      }
      return apiStore.enhanceImage(request)

    default:
      throw new APIClientError(`Unsupported mode: ${mode}`, 'INVALID_MODE')
  }
}

/**
 * Enhance a prompt using Gemini AI
 */
export async function enhancePrompt(
  prompt: string,
  mode: GeneratorMode = 'images'
): Promise<string> {
  const apiStore = useAPIStore.getState()
  return apiStore.enhancePrompt(prompt)
}

/**
 * Validate API configuration
 */
export async function validateAPIConfiguration(): Promise<{
  replicate: boolean
  gemini: boolean
  errors: string[]
}> {
  const errors: string[] = []
  let replicateValid = false
  let geminiValid = false

  try {
    const replicateClient = getReplicateClient()
    replicateValid = await replicateClient.validateApiKey()
    if (!replicateValid) {
      errors.push('Invalid Replicate API key')
    }
  } catch (error) {
    errors.push(`Replicate API error: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }

  try {
    const geminiClient = getGeminiClient()
    geminiValid = await geminiClient.validateApiKey()
    if (!geminiValid) {
      errors.push('Invalid Gemini API key')
    }
  } catch (error) {
    errors.push(`Gemini API error: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }

  return {
    replicate: replicateValid,
    gemini: geminiValid,
    errors
  }
}

/**
 * Get model version for a given model ID
 */
export async function getModelVersion(modelId: string): Promise<string> {
  try {
    const modelConfig = await import('@/lib/replicate/config')
    const model = findModelInRegistry(modelConfig.MODEL_REGISTRY, modelId)
    
    if (!model) {
      throw new APIClientError(`Model ${modelId} not found in configuration`, 'MODEL_NOT_FOUND')
    }

    return model.version
  } catch (error) {
    throw new APIClientError(
      `Failed to get model version for ${modelId}`,
      'MODEL_VERSION_ERROR',
      undefined,
      error
    )
  }
}

/**
 * Download high-resolution image as JPEG
 */
export async function downloadImageAsJPEG(
  url: string,
  filename?: string
): Promise<void> {
  try {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`)
    }

    const blob = await response.blob()
    
    // Convert to JPEG if not already
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()
    
    return new Promise((resolve, reject) => {
      img.onload = () => {
        canvas.width = img.naturalWidth
        canvas.height = img.naturalHeight
        ctx?.drawImage(img, 0, 0)
        
        canvas.toBlob((jpegBlob) => {
          if (!jpegBlob) {
            reject(new Error('Failed to convert image to JPEG'))
            return
          }

          // Create download link
          const downloadUrl = URL.createObjectURL(jpegBlob)
          const link = document.createElement('a')
          link.href = downloadUrl
          link.download = filename || `minu-ai-${Date.now()}.jpg`
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          URL.revokeObjectURL(downloadUrl)
          
          resolve()
        }, 'image/jpeg', 0.95) // High quality JPEG
      }
      
      img.onerror = () => reject(new Error('Failed to load image'))
      img.src = URL.createObjectURL(blob)
    })
  } catch (error) {
    throw new APIClientError(
      'Failed to download image',
      'DOWNLOAD_ERROR',
      undefined,
      error
    )
  }
}

/**
 * Get generation statistics
 */
export function getGenerationStats(): {
  total: number
  successful: number
  failed: number
  byMode: Record<GeneratorMode, number>
} {
  const apiStore = useAPIStore.getState()
  const history = apiStore.generationHistory

  const stats = {
    total: history.length,
    successful: history.filter(g => g.status === 'completed').length,
    failed: history.filter(g => g.status === 'failed').length,
    byMode: {
      images: history.filter(g => g.mode === 'images').length,
      video: history.filter(g => g.mode === 'video').length,
      enhance: history.filter(g => g.mode === 'enhance').length
    }
  }

  return stats
}

/**
 * Clear all generation data
 */
export function clearAllGenerationData(): void {
  const apiStore = useAPIStore.getState()
  apiStore.clearHistory()
  apiStore.clearError()
}

/**
 * Export generation history as JSON
 */
export function exportGenerationHistory(): string {
  const apiStore = useAPIStore.getState()
  const history = apiStore.generationHistory.map(generation => ({
    ...generation,
    // Remove file objects for export
    files: generation.files?.map(file => ({
      id: file.id,
      name: file.name,
      type: file.type
    }))
  }))

  return JSON.stringify(history, null, 2)
}

/**
 * Estimate generation cost (placeholder - would need actual pricing data)
 */
export function estimateGenerationCost(
  mode: GeneratorMode,
  model: string,
  settings: Partial<GenerationSettings>
): number {
  // Placeholder cost estimation
  const baseCosts = {
    images: 0.01,
    video: 0.05, // Video generation typically costs more
    enhance: 0.015
  }

  const numImages = settings.numImages || 1
  const baseCost = baseCosts[mode] || 0.01

  return baseCost * numImages
}

// Export commonly used hooks
export const useAPIState = () => useAPIStore((state) => ({
  isLoading: state.isLoading,
  error: state.error,
  currentGeneration: state.currentGeneration,
  generationHistory: state.generationHistory
}))

export const usePromptEnhancement = () => useAPIStore((state) => state.promptEnhancement)

export const useAPIActions = () => useAPIStore((state) => ({
  generateImage: state.generateImage,
  generateVideo: state.generateVideo,
  enhanceImage: state.enhanceImage,
  enhancePrompt: state.enhancePrompt,
  clearError: state.clearError,
  clearHistory: state.clearHistory
}))
