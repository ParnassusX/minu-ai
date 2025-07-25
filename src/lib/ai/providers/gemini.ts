import { 
  AIProvider, 
  AIProviderCapabilities, 
  ImageGenerationOptions, 
  ImageGenerationResult,
  PromptEnhancementResult,
  AIProviderConfig 
} from '../types'

export class GeminiProvider implements AIProvider {
  readonly name = 'Gemini 2.0 Flash'
  readonly provider = 'Google'
  readonly description = 'Google\'s latest multimodal AI model for text generation and prompt enhancement'
  readonly features = ['Advanced text generation', 'Prompt enhancement', 'Conversational AI', 'World knowledge']

  private apiKey: string
  private apiUrl: string

  constructor(config: AIProviderConfig) {
    this.apiKey = config.apiKey || process.env.GEMINI_API_KEY || ''
    this.apiUrl = config.apiUrl || process.env.GEMINI_API_URL || 'https://generativelanguage.googleapis.com'
  }

  isAvailable(): boolean {
    return !!this.apiKey
  }

  getCapabilities(): AIProviderCapabilities {
    return {
      imageGeneration: false, // Gemini 2.0 Flash does not support image generation
      promptEnhancement: true,
      conversationalEditing: true,
      textRendering: false, // Text rendering in images not supported
      aspectRatioControl: false, // Not applicable for text-only model
      advancedParameters: false
    }
  }

  async generateImage(prompt: string, options: ImageGenerationOptions = {}): Promise<ImageGenerationResult> {
    // Gemini 2.0 Flash does not support image generation
    return {
      success: false,
      images: [],
      error: 'Gemini 2.0 Flash does not support image generation. This model is designed for text generation and prompt enhancement only. Please use FLUX or another image generation model.',
      metadata: {
        model: 'gemini-2.0-flash',
        prompt,
        parameters: options,
        generationTime: 0
      }
    }
  }

  async enhancePrompt(prompt: string): Promise<PromptEnhancementResult> {
    if (!this.isAvailable()) {
      return {
        success: false,
        enhancedPrompt: prompt,
        error: 'Gemini API key is not configured'
      }
    }

    try {
      const response = await fetch(
        `${this.apiUrl}/v1beta/models/gemini-2.0-flash:generateContent?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `You are an expert at writing prompts for AI image generation. Take this basic prompt and enhance it to create professional, detailed, high-quality images.

Original prompt: "${prompt}"

Enhanced prompt guidelines:
- Add specific details about composition, lighting, and style
- Include professional photography or art terms when appropriate
- Specify image quality (high resolution, professional, detailed, etc.)
- Add artistic style if not specified (photorealistic, digital art, etc.)
- Keep the core concept but make it much more descriptive
- Aim for prompts that will generate professional-quality images

Return only the enhanced prompt, nothing else.`
              }]
            }]
          }),
        }
      )

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      let enhancedPrompt = prompt

      // Extract text from response
      for (const candidate of data.candidates || []) {
        for (const part of candidate.content?.parts || []) {
          if (part.text) {
            enhancedPrompt = part.text.trim()
            break
          }
        }
      }

      return {
        success: true,
        enhancedPrompt,
        improvements: [
          'Added professional details',
          'Enhanced composition description',
          'Specified image quality',
          'Improved artistic direction'
        ]
      }
    } catch (error) {
      return {
        success: false,
        enhancedPrompt: prompt,
        error: error instanceof Error ? error.message : 'Failed to enhance prompt'
      }
    }
  }
}
