// Core AI provider interfaces and types

export interface ImageGenerationOptions {
  aspectRatio?: string
  numberOfImages?: number
  width?: number
  height?: number
  steps?: number
  guidance?: number
  seed?: number
  // Provider-specific options can be added as needed
  [key: string]: any
}

export interface ImageGenerationResult {
  success: boolean
  images: string[] // base64 encoded images
  error?: string
  metadata?: {
    model: string
    prompt: string
    parameters: ImageGenerationOptions
    generationTime?: number
  }
}

export interface PromptEnhancementResult {
  success: boolean
  enhancedPrompt: string
  error?: string
  improvements?: string[]
}

export interface AIProviderCapabilities {
  imageGeneration: boolean
  promptEnhancement: boolean
  conversationalEditing: boolean
  textRendering: boolean
  aspectRatioControl: boolean
  advancedParameters: boolean
}

export interface AIProvider {
  readonly name: string
  readonly provider: string
  readonly description: string
  readonly features: string[]
  
  // Core capabilities
  isAvailable(): boolean
  getCapabilities(): AIProviderCapabilities
  
  // Image generation
  generateImage(prompt: string, options?: ImageGenerationOptions): Promise<ImageGenerationResult>
  
  // Prompt enhancement (optional)
  enhancePrompt?(prompt: string): Promise<PromptEnhancementResult>
}

export type AIProviderType = 'gemini' | 'flux'

export interface AIProviderConfig {
  apiKey?: string
  apiUrl?: string
  defaultOptions?: ImageGenerationOptions
}
