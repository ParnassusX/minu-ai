/**
 * Gemini API Client for Minu.AI
 * Handles prompt enhancement using Google's Gemini API
 */

import {
  GeminiClientConfig,
  GeminiGenerateRequest,
  GeminiGenerateResponse,
  GeminiAPIError,
  API_TIMEOUTS,
  API_RETRY_CONFIG,
  isGeminiResponse
} from './types'

export class GeminiClient {
  private config: GeminiClientConfig
  private baseHeaders: Record<string, string>

  constructor(apiKey: string, model: string = 'gemini-pro') {
    this.config = {
      baseURL: 'https://generativelanguage.googleapis.com/v1beta',
      apiKey,
      model,
      timeout: API_TIMEOUTS.ENHANCEMENT,
      retries: API_RETRY_CONFIG.MAX_RETRIES,
      retryDelay: API_RETRY_CONFIG.RETRY_DELAY
    }

    this.baseHeaders = {
      'Content-Type': 'application/json',
      'User-Agent': 'Minu.AI/1.0'
    }
  }

  /**
   * Make HTTP request with retry logic and error handling
   */
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {},
    timeout: number = this.config.timeout!
  ): Promise<T> {
    const url = `${this.config.baseURL}${endpoint}?key=${this.config.apiKey}`
    const requestOptions: RequestInit = {
      ...options,
      headers: {
        ...this.baseHeaders,
        ...options.headers
      }
    }

    let lastError: Error
    
    for (let attempt = 0; attempt <= this.config.retries!; attempt++) {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), timeout)

        const response = await fetch(url, {
          ...requestOptions,
          signal: controller.signal
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new GeminiAPIError(
            errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`,
            response.status,
            errorData
          )
        }

        const data = await response.json()
        return data as T
      } catch (error) {
        lastError = error as Error
        
        // Don't retry on client errors (4xx) or abort errors
        if (error instanceof GeminiAPIError && error.status && error.status < 500) {
          throw error
        }
        
        if (error instanceof Error && error.name === 'AbortError') {
          throw new GeminiAPIError('Request timeout', 408)
        }

        // Wait before retry (with exponential backoff)
        if (attempt < this.config.retries!) {
          const delay = this.config.retryDelay! * Math.pow(API_RETRY_CONFIG.BACKOFF_MULTIPLIER, attempt)
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }
    }

    throw lastError!
  }

  /**
   * Generate content using Gemini API
   */
  async generateContent(request: GeminiGenerateRequest): Promise<GeminiGenerateResponse> {
    const response = await this.makeRequest<GeminiGenerateResponse>(
      `/models/${this.config.model}:generateContent`,
      {
        method: 'POST',
        body: JSON.stringify(request)
      }
    )

    if (!isGeminiResponse(response)) {
      throw new GeminiAPIError('Invalid Gemini response format')
    }

    return response
  }

  /**
   * Enhance a prompt for better AI image generation
   */
  async enhancePrompt(originalPrompt: string, mode: 'images' | 'edit' | 'enhance' = 'images'): Promise<string> {
    const enhancementPrompts = {
      images: `You are an expert AI image generation prompt engineer. Your task is to enhance the following prompt to create stunning, high-quality images. 

Guidelines:
- Add specific artistic details, lighting, composition, and style elements
- Include quality enhancers like "ultra detailed", "high resolution", "professional photography"
- Maintain the original intent while making it more descriptive and visually compelling
- Focus on luxury and premium aesthetics
- Keep it under 200 words

Original prompt: "${originalPrompt}"

Enhanced prompt:`,

      edit: `You are an expert AI image editing prompt engineer. Your task is to enhance the following editing instruction to create precise, high-quality image modifications.

Guidelines:
- Be specific about the changes needed
- Include details about style, lighting, and composition adjustments
- Maintain natural and realistic results
- Focus on professional editing quality
- Keep it under 150 words

Original editing instruction: "${originalPrompt}"

Enhanced editing instruction:`,

      enhance: `You are an expert AI image enhancement prompt engineer. Your task is to enhance the following enhancement request for optimal upscaling and quality improvement.

Guidelines:
- Focus on clarity, sharpness, and detail preservation
- Specify enhancement priorities (faces, textures, edges)
- Maintain natural appearance
- Optimize for high-resolution output
- Keep it under 100 words

Original enhancement request: "${originalPrompt}"

Enhanced enhancement request:`
    }

    const request: GeminiGenerateRequest = {
      contents: [{
        parts: [{
          text: enhancementPrompts[mode]
        }]
      }],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 300
      },
      safetySettings: [
        {
          category: 'HARM_CATEGORY_HARASSMENT',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE'
        },
        {
          category: 'HARM_CATEGORY_HATE_SPEECH',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE'
        },
        {
          category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE'
        },
        {
          category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE'
        }
      ]
    }

    try {
      const response = await this.generateContent(request)
      
      if (response.candidates && response.candidates.length > 0) {
        const enhancedText = response.candidates[0].content.parts[0].text
        
        // Clean up the response - remove any prefixes or suffixes
        const cleanedText = enhancedText
          .replace(/^(Enhanced prompt:|Enhanced editing instruction:|Enhanced enhancement request:)\s*/i, '')
          .replace(/^["']|["']$/g, '') // Remove quotes
          .trim()
        
        return cleanedText || originalPrompt
      }
      
      return originalPrompt
    } catch (error) {
      console.warn('Prompt enhancement failed, using original prompt:', error)
      return originalPrompt
    }
  }

  /**
   * Generate creative variations of a prompt
   */
  async generatePromptVariations(originalPrompt: string, count: number = 3): Promise<string[]> {
    const request: GeminiGenerateRequest = {
      contents: [{
        parts: [{
          text: `Generate ${count} creative variations of this image generation prompt. Each variation should maintain the core concept but explore different artistic styles, moods, or perspectives.

Original prompt: "${originalPrompt}"

Please provide ${count} distinct variations, each on a new line:`
        }]
      }],
      generationConfig: {
        temperature: 0.8,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 500
      }
    }

    try {
      const response = await this.generateContent(request)
      
      if (response.candidates && response.candidates.length > 0) {
        const variationsText = response.candidates[0].content.parts[0].text
        const variations = variationsText
          .split('\n')
          .map(line => line.replace(/^\d+\.\s*/, '').trim())
          .filter(line => line.length > 0)
          .slice(0, count)
        
        return variations.length > 0 ? variations : [originalPrompt]
      }
      
      return [originalPrompt]
    } catch (error) {
      console.warn('Prompt variation generation failed:', error)
      return [originalPrompt]
    }
  }

  /**
   * Validate API key by making a test request
   */
  async validateApiKey(): Promise<boolean> {
    try {
      const testRequest: GeminiGenerateRequest = {
        contents: [{
          parts: [{
            text: 'Hello'
          }]
        }],
        generationConfig: {
          maxOutputTokens: 10
        }
      }
      
      await this.generateContent(testRequest)
      return true
    } catch (error) {
      if (error instanceof GeminiAPIError && (error.status === 401 || error.status === 403)) {
        return false
      }
      throw error
    }
  }
}

// Singleton instance
let geminiClient: GeminiClient | null = null

/**
 * Get or create Gemini client instance
 */
export function getGeminiClient(): GeminiClient {
  if (!geminiClient) {
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY
    if (!apiKey) {
      throw new Error('GOOGLE_GEMINI_API_KEY environment variable is required')
    }
    geminiClient = new GeminiClient(apiKey)
  }
  return geminiClient
}

/**
 * Initialize Gemini client with custom API key
 */
export function initializeGeminiClient(apiKey: string, model?: string): GeminiClient {
  geminiClient = new GeminiClient(apiKey, model)
  return geminiClient
}

// Export types for convenience
export type {
  GeminiGenerateRequest,
  GeminiGenerateResponse
}
