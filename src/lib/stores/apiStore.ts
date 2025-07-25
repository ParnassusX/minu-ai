/**
 * API Store - Zustand store for managing API state and generation functionality
 * Handles Replicate and Gemini API interactions with proper state management
 */

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { 
  APIStore,
  GenerationRequest,
  GenerationResult,
  GenerationSettings,
  APIClientError
} from '@/lib/api/types'
import { getReplicateClient } from '@/lib/api/replicate'
import { getGeminiClient } from '@/lib/api/gemini'
import { generateFileId } from '@/lib/types/upload'

// Helper function to generate unique IDs
const generateId = (): string => {
  return `gen_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
}

// Helper function to convert File to base64
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// Helper function to find model in registry
const findModelInRegistry = (registry: any, modelId: string): any => {
  for (const category of Object.values(registry)) {
    if (category && typeof category === 'object' && (category as any)[modelId]) {
      return (category as any)[modelId]
    }
  }
  return null
}

export const useAPIStore = create<APIStore>()(
  persist(
    (set, get) => ({
      // Initial state
      isLoading: false,
      error: null,
      lastRequest: undefined,
      currentGeneration: undefined,
      generationHistory: [],
      promptEnhancement: {
        isEnhancing: false,
        originalPrompt: undefined,
        enhancedPrompt: undefined,
        error: undefined
      },

      // Generation actions
      generateImage: async (request: GenerationRequest): Promise<GenerationResult> => {
        set({ isLoading: true, error: null })
        
        try {
          const replicateClient = getReplicateClient()
          
          // Get model version from our config
          const modelConfig = await import('@/lib/replicate/config')
          const model = findModelInRegistry(modelConfig.MODEL_REGISTRY, request.model)
          
          if (!model) {
            throw new Error(`Model ${request.model} not found`)
          }

          // Create generation result
          const generationResult: GenerationResult = {
            id: generateId(),
            status: 'pending',
            mode: request.mode,
            model: request.model,
            prompt: request.prompt,
            settings: request.settings,
            createdAt: new Date()
          }

          set({ currentGeneration: generationResult })

          // Start prediction
          const prediction = await replicateClient.generateImage(model.replicateModel, {
            prompt: request.prompt,
            aspect_ratio: request.settings.aspectRatio,
            num_outputs: request.settings.numImages,
            guidance_scale: request.settings.guidanceScale,
            num_inference_steps: request.settings.inferenceSteps,
            seed: request.settings.seed
          })

          // Update with prediction ID and processing status
          const updatedResult: GenerationResult = {
            ...generationResult,
            status: 'processing'
          }

          set({ currentGeneration: updatedResult })

          // Poll for completion
          const completedPrediction = await replicateClient.waitForCompletion(prediction.id)

          if (completedPrediction.status === 'succeeded') {
            const finalResult: GenerationResult = {
              ...updatedResult,
              status: 'completed',
              outputs: Array.isArray(completedPrediction.output) 
                ? completedPrediction.output.map((url: string, index: number) => ({
                    id: `output_${index}`,
                    url,
                    type: 'image' as const,
                    format: 'jpeg'
                  }))
                : [{
                    id: 'output_0',
                    url: completedPrediction.output,
                    type: 'image' as const,
                    format: 'jpeg'
                  }],
              metrics: {
                processingTime: completedPrediction.metrics?.predict_time
              },
              completedAt: new Date()
            }

            // Add to history
            set((state) => ({
              currentGeneration: finalResult,
              generationHistory: [finalResult, ...state.generationHistory],
              isLoading: false,
              lastRequest: request
            }))

            return finalResult
          } else {
            throw new Error(completedPrediction.error || 'Generation failed')
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
          
          set((state) => ({
            error: errorMessage,
            isLoading: false,
            currentGeneration: state.currentGeneration ? {
              ...state.currentGeneration,
              status: 'failed',
              error: errorMessage
            } : undefined
          }))

          throw error
        }
      },

      generateVideo: async (request: GenerationRequest): Promise<GenerationResult> => {
        set({ isLoading: true, error: null })
        
        try {
          const replicateClient = getReplicateClient()
          
          // Get model version from our config
          const modelConfig = await import('@/lib/replicate/config')
          const model = findModelInRegistry(modelConfig.MODEL_REGISTRY, request.model)
          
          if (!model) {
            throw new Error(`Model ${request.model} not found`)
          }

          // Video generation supports both text-to-video and image-to-video
          let imageBase64: string | undefined
          if (request.files && request.files.length > 0) {
            // Image-to-video generation
            imageBase64 = await fileToBase64(request.files[0])
          }

          // Create generation result
          const generationResult: GenerationResult = {
            id: generateId(),
            status: 'pending',
            mode: request.mode,
            model: request.model,
            prompt: request.prompt,
            settings: request.settings,
            files: request.files?.map(file => ({
              id: generateFileId(),
              name: file.name,
              url: URL.createObjectURL(file),
              type: file.type
            })),
            createdAt: new Date()
          }

          set({ currentGeneration: generationResult })

          // Start prediction with video generation parameters
          const prediction = await replicateClient.generateVideo(model.replicateModel, {
            prompt: request.prompt,
            ...(imageBase64 && { input_image: imageBase64 }),
            aspect_ratio: request.settings.aspectRatio || '16:9',
            duration: request.settings.duration || 5,
            fps: request.settings.fps || 24,
            seed: request.settings.seed
          })

          // Update with processing status
          const updatedResult: GenerationResult = {
            ...generationResult,
            status: 'processing'
          }

          set({ currentGeneration: updatedResult })

          // Poll for completion
          const completedPrediction = await replicateClient.waitForCompletion(prediction.id)

          if (completedPrediction.status === 'succeeded') {
            const finalResult: GenerationResult = {
              ...updatedResult,
              status: 'completed',
              outputs: Array.isArray(completedPrediction.output)
                ? completedPrediction.output.map((url: string, index: number) => ({
                    id: `output_${index}`,
                    url,
                    type: 'video' as const,
                    format: 'mp4'
                  }))
                : [{
                    id: 'output_0',
                    url: completedPrediction.output,
                    type: 'video' as const,
                    format: 'mp4'
                  }],
              metrics: {
                processingTime: completedPrediction.metrics?.predict_time
              },
              completedAt: new Date()
            }

            // Add to history
            set((state) => ({
              currentGeneration: finalResult,
              generationHistory: [finalResult, ...state.generationHistory],
              isLoading: false,
              lastRequest: request
            }))

            return finalResult
          } else {
            throw new Error(completedPrediction.error || 'Image editing failed')
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
          
          set((state) => ({
            error: errorMessage,
            isLoading: false,
            currentGeneration: state.currentGeneration ? {
              ...state.currentGeneration,
              status: 'failed',
              error: errorMessage
            } : undefined
          }))

          throw error
        }
      },

      enhanceImage: async (request: GenerationRequest): Promise<GenerationResult> => {
        set({ isLoading: true, error: null })
        
        try {
          const replicateClient = getReplicateClient()
          
          // Get model version from our config
          const modelConfig = await import('@/lib/replicate/config')
          const model = findModelInRegistry(modelConfig.MODEL_REGISTRY, request.model)
          
          if (!model) {
            throw new Error(`Model ${request.model} not found`)
          }

          if (!request.files || request.files.length === 0) {
            throw new Error('No images provided for enhancement')
          }

          // Convert first file to base64
          const imageBase64 = await fileToBase64(request.files[0])

          // Create generation result
          const generationResult: GenerationResult = {
            id: generateId(),
            status: 'pending',
            mode: request.mode,
            model: request.model,
            prompt: request.prompt,
            settings: request.settings,
            files: request.files.map(file => ({
              id: generateFileId(),
              name: file.name,
              url: URL.createObjectURL(file),
              type: file.type
            })),
            createdAt: new Date()
          }

          set({ currentGeneration: generationResult })

          // Start prediction
          const prediction = await replicateClient.enhanceImage(model.replicateModel, {
            image: imageBase64,
            scale: request.settings.upscaleFactor || 4,
            face_enhance: true
          })

          // Update with processing status
          const updatedResult: GenerationResult = {
            ...generationResult,
            status: 'processing'
          }

          set({ currentGeneration: updatedResult })

          // Poll for completion
          const completedPrediction = await replicateClient.waitForCompletion(prediction.id)

          if (completedPrediction.status === 'succeeded') {
            const finalResult: GenerationResult = {
              ...updatedResult,
              status: 'completed',
              outputs: [{
                id: 'output_0',
                url: completedPrediction.output,
                type: 'image' as const,
                format: 'jpeg'
              }],
              metrics: {
                processingTime: completedPrediction.metrics?.predict_time
              },
              completedAt: new Date()
            }

            // Add to history
            set((state) => ({
              currentGeneration: finalResult,
              generationHistory: [finalResult, ...state.generationHistory],
              isLoading: false,
              lastRequest: request
            }))

            return finalResult
          } else {
            throw new Error(completedPrediction.error || 'Image enhancement failed')
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
          
          set((state) => ({
            error: errorMessage,
            isLoading: false,
            currentGeneration: state.currentGeneration ? {
              ...state.currentGeneration,
              status: 'failed',
              error: errorMessage
            } : undefined
          }))

          throw error
        }
      },

      // Prompt enhancement
      enhancePrompt: async (prompt: string): Promise<string> => {
        set((state) => ({
          promptEnhancement: {
            ...state.promptEnhancement,
            isEnhancing: true,
            originalPrompt: prompt,
            error: undefined
          }
        }))

        try {
          const geminiClient = getGeminiClient()
          const enhancedPrompt = await geminiClient.enhancePrompt(prompt)

          set((state) => ({
            promptEnhancement: {
              ...state.promptEnhancement,
              isEnhancing: false,
              enhancedPrompt
            }
          }))

          return enhancedPrompt
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Prompt enhancement failed'
          
          set((state) => ({
            promptEnhancement: {
              ...state.promptEnhancement,
              isEnhancing: false,
              error: errorMessage
            }
          }))

          // Return original prompt if enhancement fails
          return prompt
        }
      },

      // Status management
      checkGenerationStatus: async (id: string): Promise<GenerationResult> => {
        const state = get()
        const generation = state.generationHistory.find(g => g.id === id) || state.currentGeneration
        
        if (!generation) {
          throw new Error('Generation not found')
        }

        return generation
      },

      cancelGeneration: async (id: string): Promise<void> => {
        // Implementation would depend on having prediction ID stored
        // For now, just update local state
        set((state) => ({
          currentGeneration: state.currentGeneration?.id === id ? {
            ...state.currentGeneration,
            status: 'failed',
            error: 'Cancelled by user'
          } : state.currentGeneration
        }))
      },

      // History management
      getGenerationHistory: () => {
        return get().generationHistory
      },

      clearHistory: () => {
        set({ generationHistory: [] })
      },

      removeFromHistory: (id: string) => {
        set((state) => ({
          generationHistory: state.generationHistory.filter(g => g.id !== id)
        }))
      },

      // Error handling
      clearError: () => {
        set({ error: null })
      },

      setError: (error: string) => {
        set({ error })
      }
    }),
    {
      name: 'minu-ai-api-store',
      storage: createJSONStorage(() => localStorage),
      // Don't persist sensitive data or large objects
      partialize: (state) => ({
        generationHistory: state.generationHistory.slice(0, 50), // Keep only last 50 generations
        promptEnhancement: {
          originalPrompt: state.promptEnhancement.originalPrompt,
          enhancedPrompt: state.promptEnhancement.enhancedPrompt
        }
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Reset transient state after hydration
          state.isLoading = false
          state.error = null
          state.currentGeneration = undefined
          state.promptEnhancement.isEnhancing = false
          state.promptEnhancement.error = undefined
        }
      }
    }
  )
)
