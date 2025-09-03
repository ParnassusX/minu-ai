/**
 * Storage Pipeline Verification
 * Quick verification of storage pipeline components without running full tests
 */

interface ComponentStatus {
  name: string
  status: 'available' | 'unavailable' | 'error'
  details?: string
}

interface PipelineStatus {
  overall: 'healthy' | 'degraded' | 'critical'
  components: ComponentStatus[]
  recommendations: string[]
}

export class StoragePipelineVerifier {
  /**
   * Verify all storage pipeline components
   */
  async verifyPipeline(): Promise<PipelineStatus> {
    console.log('🔍 Verifying Storage Pipeline Components...')
    
    const components: ComponentStatus[] = []
    const recommendations: string[] = []
    
    // Check environment variables
    components.push(this.checkEnvironmentVariables())
    
    // Check API endpoints
    components.push(await this.checkUploadEndpoint())
    components.push(await this.checkUnifiedStorageEndpoint())
    components.push(await this.checkGalleryEndpoints())
    
    // Check storage services
    components.push(this.checkCloudinaryConfig())
    components.push(this.checkSupabaseConfig())
    
    // Determine overall health
    const availableCount = components.filter(c => c.status === 'available').length
    const errorCount = components.filter(c => c.status === 'error').length
    
    let overall: 'healthy' | 'degraded' | 'critical'
    if (errorCount === 0 && availableCount === components.length) {
      overall = 'healthy'
    } else if (errorCount <= 2) {
      overall = 'degraded'
      recommendations.push('Some components have issues but system should still function')
    } else {
      overall = 'critical'
      recommendations.push('Multiple critical components are failing')
    }
    
    // Add specific recommendations
    if (components.find(c => c.name === 'Cloudinary Config' && c.status !== 'available')) {
      recommendations.push('Configure Cloudinary for persistent storage')
    }
    
    if (components.find(c => c.name === 'Upload Endpoint' && c.status !== 'available')) {
      recommendations.push('Fix upload endpoint for image input functionality')
    }
    
    if (components.find(c => c.name === 'Gallery Endpoints' && c.status !== 'available')) {
      recommendations.push('Fix gallery endpoints for image management')
    }
    
    console.log('🔍 Pipeline Verification Complete:', {
      overall,
      available: availableCount,
      total: components.length,
      errors: errorCount
    })
    
    return {
      overall,
      components,
      recommendations
    }
  }
  
  /**
   * Check environment variables
   */
  private checkEnvironmentVariables(): ComponentStatus {
    const required = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'REPLICATE_API_TOKEN'
    ]
    
    const missing = required.filter(key => !process.env[key])
    
    if (missing.length === 0) {
      return {
        name: 'Environment Variables',
        status: 'available',
        details: 'All required environment variables are set'
      }
    } else {
      return {
        name: 'Environment Variables',
        status: 'error',
        details: `Missing: ${missing.join(', ')}`
      }
    }
  }
  
  /**
   * Check upload endpoint availability
   */
  private async checkUploadEndpoint(): Promise<ComponentStatus> {
    try {
      const response = await fetch('/api/upload-image', {
        method: 'POST',
        body: new FormData() // Empty form data to test endpoint
      })
      
      // We expect a 400 error for empty form data, which means endpoint is working
      if (response.status === 400) {
        return {
          name: 'Upload Endpoint',
          status: 'available',
          details: 'Endpoint is responding correctly'
        }
      } else {
        return {
          name: 'Upload Endpoint',
          status: 'error',
          details: `Unexpected response: ${response.status}`
        }
      }
    } catch (error) {
      return {
        name: 'Upload Endpoint',
        status: 'unavailable',
        details: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
  
  /**
   * Check unified storage endpoint
   */
  private async checkUnifiedStorageEndpoint(): Promise<ComponentStatus> {
    try {
      const response = await fetch('/api/unified-storage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}) // Empty body to test validation
      })
      
      // We expect a 400 error for empty body, which means endpoint is working
      if (response.status === 400) {
        return {
          name: 'Unified Storage Endpoint',
          status: 'available',
          details: 'Endpoint is responding correctly'
        }
      } else {
        return {
          name: 'Unified Storage Endpoint',
          status: 'error',
          details: `Unexpected response: ${response.status}`
        }
      }
    } catch (error) {
      return {
        name: 'Unified Storage Endpoint',
        status: 'unavailable',
        details: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
  
  /**
   * Check gallery endpoints
   */
  private async checkGalleryEndpoints(): Promise<ComponentStatus> {
    try {
      const response = await fetch('/api/gallery')
      
      // We expect either 200 (with data) or 401 (auth required), both indicate working endpoint
      if (response.status === 200 || response.status === 401) {
        return {
          name: 'Gallery Endpoints',
          status: 'available',
          details: 'Endpoints are responding correctly'
        }
      } else {
        return {
          name: 'Gallery Endpoints',
          status: 'error',
          details: `Unexpected response: ${response.status}`
        }
      }
    } catch (error) {
      return {
        name: 'Gallery Endpoints',
        status: 'unavailable',
        details: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
  
  /**
   * Check Cloudinary configuration
   */
  private checkCloudinaryConfig(): ComponentStatus {
    const hasApiKey = !!process.env.CLOUDINARY_API_KEY
    const hasApiSecret = !!process.env.CLOUDINARY_API_SECRET
    const hasCloudName = !!process.env.CLOUDINARY_CLOUD_NAME
    
    const isPlaceholder = process.env.CLOUDINARY_API_KEY?.includes('placeholder') ||
                         process.env.CLOUDINARY_API_SECRET?.includes('placeholder')
    
    if (hasApiKey && hasApiSecret && hasCloudName && !isPlaceholder) {
      return {
        name: 'Cloudinary Config',
        status: 'available',
        details: 'Cloudinary is properly configured'
      }
    } else if (isPlaceholder) {
      return {
        name: 'Cloudinary Config',
        status: 'unavailable',
        details: 'Using placeholder credentials - will fallback to Supabase'
      }
    } else {
      return {
        name: 'Cloudinary Config',
        status: 'error',
        details: 'Missing Cloudinary credentials'
      }
    }
  }
  
  /**
   * Check Supabase configuration
   */
  private checkSupabaseConfig(): ComponentStatus {
    const hasUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL
    const hasAnonKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (hasUrl && hasAnonKey) {
      return {
        name: 'Supabase Config',
        status: 'available',
        details: 'Supabase is properly configured'
      }
    } else {
      return {
        name: 'Supabase Config',
        status: 'error',
        details: 'Missing Supabase credentials'
      }
    }
  }
  
  /**
   * Generate a status report
   */
  generateStatusReport(status: PipelineStatus): string {
    const { overall, components, recommendations } = status
    
    const statusIcon = overall === 'healthy' ? '✅' : overall === 'degraded' ? '⚠️' : '❌'
    
    let report = `
# Storage Pipeline Status Report

## Overall Status: ${statusIcon} ${overall.toUpperCase()}

## Component Status:
${components.map(component => {
  const icon = component.status === 'available' ? '✅' : 
               component.status === 'unavailable' ? '⚠️' : '❌'
  return `${icon} **${component.name}**: ${component.status}${component.details ? ` - ${component.details}` : ''}`
}).join('\n')}

## Recommendations:
${recommendations.length > 0 ? recommendations.map(rec => `- ${rec}`).join('\n') : '- No specific recommendations at this time'}

## Summary:
The storage pipeline is currently in **${overall}** status. ${
  overall === 'healthy' ? 'All components are functioning correctly.' :
  overall === 'degraded' ? 'Some components have issues but the system should still function with fallbacks.' :
  'Critical issues detected that may prevent proper functionality.'
}
`
    
    return report
  }
}

// Export singleton instance
export const storagePipelineVerifier = new StoragePipelineVerifier()
