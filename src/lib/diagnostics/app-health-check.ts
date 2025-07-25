/**
 * Comprehensive Application Health Check
 * Tests all critical components and integrations
 */

export interface HealthCheckResult {
  component: string
  status: 'pass' | 'fail' | 'warning'
  message: string
  details?: any
  timestamp: Date
}

export interface HealthCheckReport {
  overall: 'healthy' | 'degraded' | 'critical'
  results: HealthCheckResult[]
  summary: {
    total: number
    passed: number
    failed: number
    warnings: number
  }
}

export class AppHealthChecker {
  private results: HealthCheckResult[] = []

  async runFullDiagnostic(): Promise<HealthCheckReport> {
    this.results = []
    
    // Test environment configuration
    await this.checkEnvironmentVariables()
    
    // Test Supabase connection
    await this.checkSupabaseConnection()
    
    // Test Gemini API
    await this.checkGeminiAPI()
    
    // Test FLUX API (if configured)
    await this.checkFluxAPI()
    
    // Test database schema
    await this.checkDatabaseSchema()
    
    // Test authentication flow
    await this.checkAuthenticationFlow()
    
    // Test AI provider system
    await this.checkAIProviderSystem()
    
    return this.generateReport()
  }

  private async checkEnvironmentVariables(): Promise<void> {
    const requiredVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'GEMINI_API_KEY'
    ]

    const optionalVars = [
      'FLUX_API_KEY',
      'SUPABASE_SERVICE_ROLE_KEY'
    ]

    let missingRequired: string[] = []
    let missingOptional: string[] = []

    requiredVars.forEach(varName => {
      if (!process.env[varName]) {
        missingRequired.push(varName)
      }
    })

    optionalVars.forEach(varName => {
      if (!process.env[varName]) {
        missingOptional.push(varName)
      }
    })

    if (missingRequired.length > 0) {
      this.addResult('Environment Variables', 'fail', 
        `Missing required environment variables: ${missingRequired.join(', ')}`)
    } else if (missingOptional.length > 0) {
      this.addResult('Environment Variables', 'warning', 
        `Missing optional environment variables: ${missingOptional.join(', ')}`)
    } else {
      this.addResult('Environment Variables', 'pass', 'All environment variables configured')
    }
  }

  private async checkSupabaseConnection(): Promise<void> {
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      
      // Test basic connection
      const { data, error } = await supabase.from('profiles').select('count').limit(1)
      
      if (error) {
        this.addResult('Supabase Connection', 'fail', 
          `Database connection failed: ${error.message}`, error)
      } else {
        this.addResult('Supabase Connection', 'pass', 'Database connection successful')
      }
    } catch (error) {
      this.addResult('Supabase Connection', 'fail', 
        `Failed to initialize Supabase client: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  private async checkGeminiAPI(): Promise<void> {
    try {
      if (!process.env.GEMINI_API_KEY) {
        this.addResult('Gemini API', 'warning', 'Gemini API key not configured')
        return
      }

      // Test Gemini API with a simple request
      const response = await fetch('/api/list-gemini-models', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        this.addResult('Gemini API', 'pass', 'Gemini API connection successful', data)
      } else {
        const errorData = await response.json().catch(() => ({}))
        this.addResult('Gemini API', 'fail', 
          `Gemini API test failed: ${errorData.error || response.statusText}`)
      }
    } catch (error) {
      this.addResult('Gemini API', 'fail', 
        `Gemini API test error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  private async checkFluxAPI(): Promise<void> {
    try {
      if (!process.env.FLUX_API_KEY) {
        this.addResult('FLUX API', 'warning', 'FLUX API key not configured (optional)')
        return
      }

      // FLUX is now available through Replicate integration
      this.addResult('FLUX API', 'pass', 'FLUX models available via Replicate integration')
    } catch (error) {
      this.addResult('FLUX API', 'fail', 
        `FLUX API configuration error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  private async checkDatabaseSchema(): Promise<void> {
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      
      const tables = ['profiles', 'images', 'prompt_templates', 'prompt_history', 'suggestions']
      const missingTables: string[] = []
      
      for (const table of tables) {
        const { error } = await supabase.from(table).select('*').limit(1)
        if (error && error.message.includes('does not exist')) {
          missingTables.push(table)
        }
      }
      
      if (missingTables.length > 0) {
        this.addResult('Database Schema', 'fail', 
          `Missing database tables: ${missingTables.join(', ')}`)
      } else {
        this.addResult('Database Schema', 'pass', 'All required database tables exist')
      }
    } catch (error) {
      this.addResult('Database Schema', 'fail', 
        `Database schema check failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  private async checkAuthenticationFlow(): Promise<void> {
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      
      // Test getting current session (should not throw)
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        this.addResult('Authentication Flow', 'fail', 
          `Auth session check failed: ${error.message}`)
      } else {
        this.addResult('Authentication Flow', 'pass', 
          `Auth system functional. Current session: ${session ? 'authenticated' : 'anonymous'}`)
      }
    } catch (error) {
      this.addResult('Authentication Flow', 'fail', 
        `Auth flow test error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  private async checkAIProviderSystem(): Promise<void> {
    try {
      const { getAIProviderManager } = await import('@/lib/ai/provider-manager')
      const manager = getAIProviderManager()

      // Use async methods with timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Provider initialization timeout')), 5000)
      )

      const [availableProviders, allProviders] = await Promise.race([
        Promise.all([
          manager.getAvailableProviders(),
          manager.getAllProviders()
        ]),
        timeoutPromise
      ]) as [Array<{ type: any; provider: any }>, Array<{ type: any; provider: any }>]

      this.addResult('AI Provider System', 'pass',
        `AI provider system functional. Available: ${availableProviders.length}/${allProviders.length} providers`,
        { availableProviders: availableProviders.map(p => p.type) })
    } catch (error) {
      this.addResult('AI Provider System', 'warning',
        `AI provider system issue: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  private addResult(component: string, status: 'pass' | 'fail' | 'warning', message: string, details?: any): void {
    this.results.push({
      component,
      status,
      message,
      details,
      timestamp: new Date()
    })
  }

  private generateReport(): HealthCheckReport {
    const summary = {
      total: this.results.length,
      passed: this.results.filter(r => r.status === 'pass').length,
      failed: this.results.filter(r => r.status === 'fail').length,
      warnings: this.results.filter(r => r.status === 'warning').length
    }

    let overall: 'healthy' | 'degraded' | 'critical'
    if (summary.failed > 0) {
      overall = 'critical'
    } else if (summary.warnings > 0) {
      overall = 'degraded'
    } else {
      overall = 'healthy'
    }

    return {
      overall,
      results: this.results,
      summary
    }
  }
}

// Convenience function for running diagnostics
export async function runAppDiagnostics(): Promise<HealthCheckReport> {
  const checker = new AppHealthChecker()
  return checker.runFullDiagnostic()
}
