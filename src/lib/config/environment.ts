/**
 * Centralized environment configuration management
 * Single source of truth for all environment variables and API configurations
 */

// Environment variable validation and access
export class EnvironmentConfig {
  private static instance: EnvironmentConfig
  private config: Record<string, string | undefined>

  private constructor() {
    this.config = {
      // Supabase Configuration
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,

      // Replicate API Configuration
      REPLICATE_API_TOKEN: process.env.REPLICATE_API_TOKEN,
      REPLICATE_WEBHOOK_URL: process.env.REPLICATE_WEBHOOK_URL,
      REPLICATE_WEBHOOK_SECRET: process.env.REPLICATE_WEBHOOK_SECRET,

      // Google Gemini API Configuration
      GOOGLE_GEMINI_API_KEY: process.env.GOOGLE_GEMINI_API_KEY,
      GEMINI_API_KEY: process.env.GEMINI_API_KEY, // Backward compatibility
      GEMINI_API_URL: process.env.GEMINI_API_URL,



      // Next.js Configuration
      NODE_ENV: process.env.NODE_ENV,
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
      NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    }

    this.validateRequiredVariables()
  }

  public static getInstance(): EnvironmentConfig {
    if (!EnvironmentConfig.instance) {
      EnvironmentConfig.instance = new EnvironmentConfig()
    }
    return EnvironmentConfig.instance
  }

  private validateRequiredVariables(): void {
    const required = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    ]

    const missing = required.filter(key => !this.config[key])
    
    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
    }
  }

  public get(key: string): string | undefined {
    return this.config[key]
  }

  public getRequired(key: string): string {
    const value = this.config[key]
    if (!value) {
      throw new Error(`Required environment variable ${key} is not set`)
    }
    return value
  }

  public isDevelopment(): boolean {
    return this.config.NODE_ENV === 'development'
  }

  public isProduction(): boolean {
    return this.config.NODE_ENV === 'production'
  }

  // Supabase Configuration
  public getSupabaseConfig() {
    return {
      url: this.getRequired('NEXT_PUBLIC_SUPABASE_URL'),
      anonKey: this.getRequired('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
      serviceRoleKey: this.get('SUPABASE_SERVICE_ROLE_KEY'),
    }
  }

  // Replicate Configuration
  public getReplicateConfig() {
    return {
      apiToken: this.get('REPLICATE_API_TOKEN'),
      webhookUrl: this.get('REPLICATE_WEBHOOK_URL'),
      webhookSecret: this.get('REPLICATE_WEBHOOK_SECRET'),
      apiUrl: 'https://api.replicate.com/v1',
      defaultTimeout: 300000, // 5 minutes
      maxRetries: 3,
      retryDelay: 1000,
    }
  }

  // Gemini Configuration
  public getGeminiConfig() {
    return {
      apiKey: this.get('GOOGLE_GEMINI_API_KEY') || this.get('GEMINI_API_KEY'),
      apiUrl: this.get('GEMINI_API_URL') || 'https://generativelanguage.googleapis.com',
      defaultModel: 'gemini-1.5-flash',
      maxTokens: 1000,
      temperature: 0.7,
    }
  }



  // Application Configuration
  public getAppConfig() {
    return {
      isDevelopment: this.isDevelopment(),
      isProduction: this.isProduction(),
      authSecret: this.get('NEXTAUTH_SECRET'),
      authUrl: this.get('NEXTAUTH_URL') || 'http://localhost:3000',
    }
  }

  // Performance Configuration
  public getPerformanceConfig() {
    return {
      galleryPageSize: 50,
      maxPromptLength: 1000,
      minPromptLength: 3,
      debounceDelay: 300,
      apiTimeout: 30000,
      retryAttempts: 3,
    }
  }

  // Feature Flags
  public getFeatureFlags() {
    return {
      enablePromptEnhancement: !!this.getGeminiConfig().apiKey,
      enableWebhooks: !!this.getReplicateConfig().webhookUrl,
      enableDevelopmentMode: this.isDevelopment(),
      enableErrorReporting: this.isProduction(),
    }
  }

  // Validation helpers
  public hasReplicateConfig(): boolean {
    return !!this.get('REPLICATE_API_TOKEN')
  }

  public hasGeminiConfig(): boolean {
    return !!(this.get('GOOGLE_GEMINI_API_KEY') || this.get('GEMINI_API_KEY'))
  }

  public hasSupabaseServiceRole(): boolean {
    return !!this.get('SUPABASE_SERVICE_ROLE_KEY')
  }


}

// Singleton instance
export const env = EnvironmentConfig.getInstance()

// Convenience exports for common configurations
export const supabaseConfig = env.getSupabaseConfig()
export const replicateConfig = env.getReplicateConfig()
export const geminiConfig = env.getGeminiConfig()

export const appConfig = env.getAppConfig()
export const performanceConfig = env.getPerformanceConfig()
export const featureFlags = env.getFeatureFlags()
