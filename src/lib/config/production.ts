/**
 * Production Configuration
 * Handles environment-specific settings and feature flags for production deployment
 */

export interface ProductionConfig {
  environment: 'development' | 'staging' | 'production'
  enableTestEndpoints: boolean
  enableDebugFeatures: boolean
  enableDevelopmentTools: boolean
  corsOrigins: string[]
  apiRateLimit: {
    windowMs: number
    maxRequests: number
  }
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error'
    enableConsole: boolean
    enableFile: boolean
  }
  features: {
    enableMockData: boolean
    enableTestUsers: boolean
    enableDevelopmentMigrations: boolean
    enablePerformanceMetrics: boolean
  }
}

/**
 * Get production configuration based on environment
 */
export function getProductionConfig(): ProductionConfig {
  const env = process.env.NODE_ENV || 'development'
  const isProduction = env === 'production'
  const isStaging = process.env.VERCEL_ENV === 'preview' // Use Vercel's staging detection
  const isDevelopment = env === 'development'

  return {
    environment: env as 'development' | 'staging' | 'production',
    enableTestEndpoints: !isProduction,
    enableDebugFeatures: isDevelopment,
    enableDevelopmentTools: isDevelopment,
    corsOrigins: isProduction
      ? [
          process.env.NEXT_PUBLIC_PRODUCTION_URL || 'https://minu.ai',
          'https://minu.ai',
          'https://www.minu.ai'
        ]
      : [
          'http://localhost:3000',
          'http://localhost:4000',
          'http://127.0.0.1:3000',
          'http://127.0.0.1:4000',
          'https://localhost:3000',
          'https://localhost:4000'
        ],
    apiRateLimit: {
      windowMs: isProduction ? 15 * 60 * 1000 : 60 * 1000, // 15 min in prod, 1 min in dev
      maxRequests: isProduction ? 100 : 1000 // Stricter in production
    },
    logging: {
      level: isProduction ? 'error' : isDevelopment ? 'debug' : 'info',
      enableConsole: !isProduction,
      enableFile: isProduction || isStaging
    },
    features: {
      enableMockData: isDevelopment,
      enableTestUsers: !isProduction,
      enableDevelopmentMigrations: isDevelopment,
      enablePerformanceMetrics: true
    }
  }
}

/**
 * Test endpoints that should be disabled in production
 */
export const TEST_ENDPOINTS = [
  '/api/test-auth',
  '/api/test-cloudinary',
  '/api/test-cloudinary-config',
  '/api/test-cloudinary-direct',
  '/api/test-config',
  '/api/test-db',
  '/api/test-env',
  '/api/test-env-direct',
  '/api/test-infrastructure',
  '/api/test-migration',
  '/api/test-profile',
  '/api/test-replicate',
  '/api/test-storage',
  '/api/test-supabase',
  '/api/test-supabase-new',
  '/api/test-supabase-storage',
  '/api/apply-missing-migration',
  '/api/execute-migration',
  '/api/database-schema',
  '/api/debug',
  '/api/dev',
  '/api/diagnostics',
  '/api/production-readiness'
] as const

/**
 * Development-only endpoints that should be disabled in production
 */
export const DEVELOPMENT_ENDPOINTS = [
  '/api/config-test-new',
  '/api/env-check',
  '/api/security-fixes'
] as const

/**
 * Check if an endpoint should be available in current environment
 */
export function isEndpointEnabled(path: string): boolean {
  const config = getProductionConfig()
  
  // Always allow core functionality endpoints
  const coreEndpoints = [
    '/api/generate',
    '/api/generate-replicate',
    '/api/generate-video',
    '/api/upload-image',
    '/api/unified-storage',
    '/api/gallery',
    '/api/enhance',
    '/api/enhance-prompt-v2',
    '/api/health',
    '/api/auth-check',
    '/api/prompts',
    '/api/suggestions'
  ]
  
  if (coreEndpoints.some(endpoint => path.startsWith(endpoint))) {
    return true
  }
  
  // Check test endpoints
  if (TEST_ENDPOINTS.some(endpoint => path.startsWith(endpoint))) {
    return config.enableTestEndpoints
  }
  
  // Check development endpoints
  if (DEVELOPMENT_ENDPOINTS.some(endpoint => path.startsWith(endpoint))) {
    return config.enableDevelopmentTools
  }
  
  // Default to enabled for other endpoints
  return true
}

/**
 * Get CORS configuration for current environment
 */
export function getCorsConfig() {
  const config = getProductionConfig()
  
  return {
    origin: config.corsOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'Origin'
    ],
    credentials: true,
    maxAge: config.environment === 'production' ? 86400 : 3600 // 24h in prod, 1h in dev
  }
}

/**
 * Validate production environment configuration
 */
export function validateProductionConfig(): {
  isValid: boolean
  errors: string[]
  warnings: string[]
} {
  const errors: string[] = []
  const warnings: string[] = []
  
  // Check required environment variables
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'REPLICATE_API_TOKEN',
    'GEMINI_API_KEY'
  ]
  
  requiredVars.forEach(varName => {
    if (!process.env[varName]) {
      errors.push(`Missing required environment variable: ${varName}`)
    }
  })
  
  // Check optional but recommended variables
  const recommendedVars = [
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET',
    'CLOUDINARY_CLOUD_NAME',
    'SUPABASE_SERVICE_ROLE_KEY'
  ]
  
  recommendedVars.forEach(varName => {
    if (!process.env[varName]) {
      warnings.push(`Missing recommended environment variable: ${varName}`)
    }
  })
  
  // Check for placeholder values
  const checkPlaceholders = [
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET'
  ]
  
  checkPlaceholders.forEach(varName => {
    const value = process.env[varName]
    if (value && (value.includes('placeholder') || value.includes('your-') || value.includes('xxx'))) {
      warnings.push(`Environment variable ${varName} appears to contain placeholder value`)
    }
  })
  
  // Production-specific checks
  if (process.env.NODE_ENV === 'production') {
    if (!process.env.NEXT_PUBLIC_PRODUCTION_URL) {
      warnings.push('NEXT_PUBLIC_PRODUCTION_URL not set for production environment')
    }
    
    if (process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('localhost')) {
      errors.push('Production environment should not use localhost Supabase URL')
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * Get environment-specific feature flags
 */
export function getFeatureFlags() {
  const config = getProductionConfig()
  
  return {
    // Core features (always enabled)
    imageGeneration: true,
    videoGeneration: true,
    galleryManagement: true,
    promptEnhancement: true,
    
    // Environment-dependent features
    testEndpoints: config.enableTestEndpoints,
    debugTools: config.enableDebugFeatures,
    developmentMigrations: config.features.enableDevelopmentMigrations,
    performanceMetrics: config.features.enablePerformanceMetrics,
    mockData: config.features.enableMockData,
    
    // Production optimizations
    imageOptimization: config.environment === 'production',
    cdnEnabled: config.environment === 'production',
    compressionEnabled: config.environment === 'production',
    cachingEnabled: config.environment !== 'development'
  }
}

export default {
  getProductionConfig,
  isEndpointEnabled,
  getCorsConfig,
  validateProductionConfig,
  getFeatureFlags,
  TEST_ENDPOINTS,
  DEVELOPMENT_ENDPOINTS
}
