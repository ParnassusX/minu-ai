import {
  AIProvider,
  AIProviderCapabilities,
  ImageGenerationOptions,
  ImageGenerationResult,
  PromptEnhancementResult,
  AIProviderConfig
} from '../types'
import { createFluxModel } from '../../replicate/models/flux'
import { FluxGenerationParams } from '../../replicate/types'

export class FluxProvider implements AIProvider {
  readonly name = 'FLUX Schnell'
  readonly provider = 'Black Forest Labs'
  readonly description = 'Fast and efficient FLUX model via Replicate'
  readonly features = ['Fast generation', 'High quality', 'Commercial use']

  private fluxModel: ReturnType<typeof createFluxModel>

  constructor(config: AIProviderConfig) {
    // Use FLUX Schnell as the default model (fastest)
    this.fluxModel = createFluxModel('flux-schnell')
  }

  isAvailable(): boolean {
    // FLUX is available through Replicate if Replicate API key is configured
    return !!process.env.REPLICATE_API_TOKEN
  }

  getCapabilities(): AIProviderCapabilities {
    return {
      imageGeneration: true,
      promptEnhancement: false,
      conversationalEditing: false,
      textRendering: false,
      aspectRatioControl: true,
      advancedParameters: true
    }
  }

  async generateImage(prompt: string, options: ImageGenerationOptions = {}): Promise<ImageGenerationResult> {
    if (!this.isAvailable()) {
      return {
        success: false,
        images: [],
        error: 'Replicate API key is not configured'
      }
    }

    const startTime = Date.now()

    try {
      // Convert generic options to FLUX-specific parameters
      const fluxParams: FluxGenerationParams = {
        prompt,
        width: options.width || 1024,
        height: options.height || 1024,
        numOutputs: options.numOutputs || 1,
        seed: options.seed
      }

      const results = await this.fluxModel.generate(fluxParams)

      if (results && results.length > 0) {
        return {
          success: true,
          images: results.map(result => result.url),
          metadata: {
            model: 'flux-schnell',
            prompt,
            parameters: options,
            generationTime: Date.now() - startTime
          }
        }
      } else {
        throw new Error('No images generated')
      }
    } catch (error) {
      return {
        success: false,
        images: [],
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        metadata: {
          model: 'flux-schnell',
          prompt,
          parameters: options,
          generationTime: Date.now() - startTime
        }
      }
    }
  }

  // FLUX doesn't support prompt enhancement
  async enhancePrompt(prompt: string): Promise<PromptEnhancementResult> {
    return {
      success: false,
      enhancedPrompt: prompt,
      error: 'FLUX provider does not support prompt enhancement'
    }
  }
}
