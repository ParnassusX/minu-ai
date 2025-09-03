/**
 * Production Readiness Validator
 * Comprehensive validation for production deployment
 */

export interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  recommendations: string[]
}

export interface EnvironmentCheck {
  name: string
  required: boolean
  value?: string
  isValid: boolean
  message: string
}

/**
 * Validate all environment variables required for production
 */
export function validateEnvironmentVariables(): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  const recommendations: string[] = []

  // Required environment variables
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'REPLICATE_API_TOKEN',
    'GEMINI_API_KEY'
  ]

  // Optional but recommended variables
  const recommendedVars = [
    'SUPABASE_SERVICE_ROLE_KEY',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET',
    'CLOUDINARY_CLOUD_NAME',
    'REPLICATE_WEBHOOK_URL'
  ]

  // Check required variables
  requiredVars.forEach(varName => {
    const value = process.env[varName]
    if (!value) {
      errors.push(`Missing required environment variable: ${varName}`)
    } else if (value.includes('placeholder') || value.includes('your-') || value.includes('xxx')) {
      errors.push(`Environment variable ${varName} contains placeholder value`)
    }
  })

  // Check recommended variables
  recommendedVars.forEach(varName => {
    const value = process.env[varName]
    if (!value) {
      warnings.push(`Missing recommended environment variable: ${varName}`)
    } else if (value.includes('placeholder') || value.includes('your-') || value.includes('xxx')) {
      warnings.push(`Environment variable ${varName} contains placeholder value`)
    }
  })

  // Production-specific checks
  if (process.env.NODE_ENV === 'production') {
    // Check for localhost URLs in production
    if (process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('localhost')) {
      errors.push('Production environment should not use localhost Supabase URL')
    }

    // Check for production URL
    if (!process.env.NEXT_PUBLIC_PRODUCTION_URL) {
      warnings.push('NEXT_PUBLIC_PRODUCTION_URL not set for production environment')
    }

    // Check for secure protocols
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.startsWith('https://')) {
      errors.push('Supabase URL must use HTTPS in production')
    }
  }

  // Add recommendations
  if (errors.length === 0 && warnings.length === 0) {
    recommendations.push('All environment variables are properly configured')
  } else {
    if (errors.length > 0) {
      recommendations.push('Fix all required environment variables before deploying to production')
    }
    if (warnings.length > 0) {
      recommendations.push('Consider setting recommended environment variables for full functionality')
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    recommendations
  }
}

/**
 * Validate API connectivity
 */
export async function validateAPIConnectivity(): Promise<ValidationResult> {
  const errors: string[] = []
  const warnings: string[] = []
  const recommendations: string[] = []

  try {
    // Test Supabase connection
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      try {
        const { createClient } = await import('@/lib/supabase/client')
        const supabase = createClient()
        const { error } = await supabase.from('profiles').select('count').limit(1)
        
        if (error) {
          errors.push(`Supabase connection failed: ${error.message}`)
        } else {
          recommendations.push('Supabase connection successful')
        }
      } catch (error: any) {
        errors.push(`Supabase client error: ${error.message}`)
      }
    }

    // Test Replicate API
    if (process.env.REPLICATE_API_TOKEN) {
      try {
        const response = await fetch('https://api.replicate.com/v1/account', {
          headers: {
            'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}`,
            'Content-Type': 'application/json'
          }
        })

        if (!response.ok) {
          errors.push(`Replicate API connection failed: ${response.status}`)
        } else {
          recommendations.push('Replicate API connection successful')
        }
      } catch (error: any) {
        errors.push(`Replicate API error: ${error.message}`)
      }
    }

    // Test Gemini API
    if (process.env.GEMINI_API_KEY) {
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`)
        
        if (!response.ok) {
          errors.push(`Gemini API connection failed: ${response.status}`)
        } else {
          recommendations.push('Gemini API connection successful')
        }
      } catch (error: any) {
        errors.push(`Gemini API error: ${error.message}`)
      }
    }

  } catch (error: any) {
    errors.push(`API connectivity test failed: ${error.message}`)
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    recommendations
  }
}

/**
 * Validate database schema and RLS policies
 */
export async function validateDatabaseSchema(): Promise<ValidationResult> {
  const errors: string[] = []
  const warnings: string[] = []
  const recommendations: string[] = []

  try {
    const { createServiceClient } = await import('@/lib/supabase/server')
    const supabase = createServiceClient()

    // Check required tables exist
    const requiredTables = ['profiles', 'images', 'videos', 'generation_costs', 'prompts']
    
    for (const tableName of requiredTables) {
      try {
        const { error } = await supabase.from(tableName).select('*').limit(1)
        if (error) {
          errors.push(`Table '${tableName}' is not accessible: ${error.message}`)
        }
      } catch (error: any) {
        errors.push(`Failed to check table '${tableName}': ${error.message}`)
      }
    }

    // Check RLS policies are enabled
    try {
      const { data: tables, error } = await supabase
        .from('information_schema.tables')
        .select('table_name, row_security')
        .eq('table_schema', 'public')
        .in('table_name', requiredTables)

      if (error) {
        warnings.push(`Could not verify RLS policies: ${error.message}`)
      } else if (tables) {
        const tablesWithoutRLS = tables.filter(table => !table.row_security)
        if (tablesWithoutRLS.length > 0) {
          warnings.push(`Tables without RLS enabled: ${tablesWithoutRLS.map(t => t.table_name).join(', ')}`)
        }
      }
    } catch (error: any) {
      warnings.push(`RLS policy check failed: ${error.message}`)
    }

    if (errors.length === 0) {
      recommendations.push('Database schema validation successful')
    }

  } catch (error: any) {
    errors.push(`Database schema validation failed: ${error.message}`)
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    recommendations
  }
}

/**
 * Comprehensive production readiness check
 */
export async function validateProductionReadiness(): Promise<ValidationResult> {
  const envValidation = validateEnvironmentVariables()
  const apiValidation = await validateAPIConnectivity()
  const dbValidation = await validateDatabaseSchema()

  const allErrors = [
    ...envValidation.errors,
    ...apiValidation.errors,
    ...dbValidation.errors
  ]

  const allWarnings = [
    ...envValidation.warnings,
    ...apiValidation.warnings,
    ...dbValidation.warnings
  ]

  const allRecommendations = [
    ...envValidation.recommendations,
    ...apiValidation.recommendations,
    ...dbValidation.recommendations
  ]

  return {
    isValid: allErrors.length === 0,
    errors: allErrors,
    warnings: allWarnings,
    recommendations: allRecommendations
  }
}

/**
 * Get environment-specific configuration
 */
export function getEnvironmentConfig() {
  const isProduction = process.env.NODE_ENV === 'production'
  const isDevelopment = process.env.NODE_ENV === 'development'

  return {
    environment: process.env.NODE_ENV || 'development',
    isProduction,
    isDevelopment,
    enableTestEndpoints: !isProduction,
    enableDebugFeatures: isDevelopment,
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
          'http://127.0.0.1:4000'
        ],
    apiRateLimit: {
      windowMs: isProduction ? 15 * 60 * 1000 : 60 * 1000,
      maxRequests: isProduction ? 100 : 1000
    }
  }
}
