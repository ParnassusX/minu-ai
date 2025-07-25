import { AIProvider, AIProviderType } from './types'
import { logStartup, logError, logWarning, logInfo } from '@/lib/utils/logger'

export class AIProviderManager {
  private providers: Map<AIProviderType, AIProvider> = new Map()
  private initialized = false
  private initializationPromise: Promise<void> | null = null

  constructor() {
    // Don't initialize providers synchronously to avoid blocking startup
  }

  private async initializeProviders(): Promise<void> {
    if (this.initialized) return
    if (this.initializationPromise) return this.initializationPromise

    this.initializationPromise = this.doInitialization()
    return this.initializationPromise
  }

  private async doInitialization(): Promise<void> {
    try {
      logStartup('AIProviderManager', 'Starting provider initialization')

      // Dynamically import providers to avoid blocking startup
      const [{ GeminiProvider }, { FluxProvider }] = await Promise.all([
        import('./providers/gemini'),
        import('./providers/flux')
      ])

      logInfo('AIProviderManager', 'Provider modules loaded successfully')

      // Initialize providers with error handling
      try {
        const geminiProvider = new GeminiProvider({
          apiKey: process.env.GEMINI_API_KEY,
          apiUrl: process.env.GEMINI_API_URL
        })
        this.providers.set('gemini', geminiProvider)
        logInfo('AIProviderManager', 'Gemini provider initialized', {
          available: geminiProvider.isAvailable()
        })
      } catch (error) {
        logWarning('AIProviderManager', 'Failed to initialize Gemini provider', undefined, error as Error)
      }

      try {
        const fluxProvider = new FluxProvider({
          apiKey: process.env.FLUX_API_KEY,
          apiUrl: process.env.FLUX_API_URL
        })
        this.providers.set('flux', fluxProvider)
        logInfo('AIProviderManager', 'FLUX provider initialized', {
          available: fluxProvider.isAvailable()
        })
      } catch (error) {
        logWarning('AIProviderManager', 'Failed to initialize FLUX provider', undefined, error as Error)
      }

      this.initialized = true
      logStartup('AIProviderManager', 'Provider initialization completed', {
        totalProviders: this.providers.size,
        availableProviders: Array.from(this.providers.entries())
          .filter(([, provider]) => provider.isAvailable())
          .map(([type]) => type)
      })
    } catch (error) {
      logError('AIProviderManager', 'Failed to initialize AI providers', error as Error)
      throw error
    }
  }

  async getProvider(type: AIProviderType): Promise<AIProvider | null> {
    await this.initializeProviders()
    return this.providers.get(type) || null
  }

  async getAvailableProviders(): Promise<Array<{ type: AIProviderType; provider: AIProvider }>> {
    await this.initializeProviders()
    const available: Array<{ type: AIProviderType; provider: AIProvider }> = []

    // Convert Map.entries() to Array for ES2017 compatibility
    Array.from(this.providers.entries()).forEach(([type, provider]) => {
      if (provider.isAvailable()) {
        available.push({ type, provider })
      }
    })

    return available
  }

  async getAllProviders(): Promise<Array<{ type: AIProviderType; provider: AIProvider }>> {
    await this.initializeProviders()
    const all: Array<{ type: AIProviderType; provider: AIProvider }> = []

    // Convert Map.entries() to Array for ES2017 compatibility
    Array.from(this.providers.entries()).forEach(([type, provider]) => {
      all.push({ type, provider })
    })

    return all
  }

  // Synchronous methods for cases where initialization is not critical
  getProviderSync(type: AIProviderType): AIProvider | null {
    return this.providers.get(type) || null
  }

  getAvailableProvidersSync(): Array<{ type: AIProviderType; provider: AIProvider }> {
    const available: Array<{ type: AIProviderType; provider: AIProvider }> = []
    Array.from(this.providers.entries()).forEach(([type, provider]) => {
      if (provider.isAvailable()) {
        available.push({ type, provider })
      }
    })
    return available
  }

  async generateImage(
    providerType: AIProviderType,
    prompt: string,
    options?: any
  ) {
    const provider = await this.getProvider(providerType)
    if (!provider) {
      throw new Error(`Provider ${providerType} not found`)
    }

    if (!provider.isAvailable()) {
      throw new Error(`Provider ${providerType} is not available`)
    }

    return provider.generateImage(prompt, options)
  }

  async enhancePrompt(providerType: AIProviderType, prompt: string) {
    const provider = await this.getProvider(providerType)
    if (!provider) {
      throw new Error(`Provider ${providerType} not found`)
    }

    if (!provider.isAvailable()) {
      throw new Error(`Provider ${providerType} is not available`)
    }

    if (!provider.enhancePrompt) {
      throw new Error(`Provider ${providerType} does not support prompt enhancement`)
    }

    return provider.enhancePrompt(prompt)
  }
}

// Lazy singleton instance - only created when needed
let aiProviderManagerInstance: AIProviderManager | null = null

export function getAIProviderManager(): AIProviderManager {
  if (!aiProviderManagerInstance) {
    aiProviderManagerInstance = new AIProviderManager()
  }
  return aiProviderManagerInstance
}

// Convenience functions with error handling
export async function getAIProvider(type: AIProviderType): Promise<AIProvider | null> {
  try {
    return await getAIProviderManager().getProvider(type)
  } catch (error) {
    console.error(`Failed to get AI provider ${type}:`, error)
    return null
  }
}

export async function getAvailableProviders(): Promise<Array<{ type: AIProviderType; provider: AIProvider }>> {
  try {
    return await getAIProviderManager().getAvailableProviders()
  } catch (error) {
    console.error('Failed to get available providers:', error)
    return []
  }
}

export async function getAllProviders(): Promise<Array<{ type: AIProviderType; provider: AIProvider }>> {
  try {
    return await getAIProviderManager().getAllProviders()
  } catch (error) {
    console.error('Failed to get all providers:', error)
    return []
  }
}

// Legacy export for backward compatibility - use getter to avoid module load time instantiation
export function getAIProviderManagerLegacy() {
  return getAIProviderManager()
}
