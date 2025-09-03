/**
 * Replicate API Integration Test
 * Tests actual API calls with our model parameter mappings
 */

interface ApiTestResult {
  modelId: string
  success: boolean
  error?: string
  predictionId?: string
  parameters?: any
  responseTime?: number
}

interface SchemaValidationResult {
  modelId: string
  schemaMatch: boolean
  missingParameters: string[]
  extraParameters: string[]
  typeErrors: string[]
}

export class ReplicateApiTester {
  private apiToken: string | null = null

  constructor() {
    this.apiToken = process.env.REPLICATE_API_TOKEN || null
  }

  /**
   * Test API connectivity and authentication
   */
  async testApiConnection(): Promise<{ success: boolean; error?: string }> {
    if (!this.apiToken) {
      return { success: false, error: 'REPLICATE_API_TOKEN not configured' }
    }

    try {
      const response = await fetch('https://api.replicate.com/v1/predictions', {
        method: 'GET',
        headers: {
          'Authorization': `Token ${this.apiToken}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        return { success: true }
      } else {
        return { success: false, error: `API returned ${response.status}: ${response.statusText}` }
      }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  /**
   * Test parameter mapping for a specific model
   */
  async testModelParameters(modelId: string, testParameters: any): Promise<ApiTestResult> {
    const startTime = Date.now()
    
    if (!this.apiToken) {
      return {
        modelId,
        success: false,
        error: 'REPLICATE_API_TOKEN not configured'
      }
    }

    try {
      // Get the model version first
      const modelResponse = await fetch(`https://api.replicate.com/v1/models/${modelId}`, {
        headers: {
          'Authorization': `Token ${this.apiToken}`,
          'Content-Type': 'application/json'
        }
      })

      if (!modelResponse.ok) {
        return {
          modelId,
          success: false,
          error: `Failed to fetch model info: ${modelResponse.status}`
        }
      }

      const modelData = await modelResponse.json()
      const latestVersion = modelData.latest_version?.id

      if (!latestVersion) {
        return {
          modelId,
          success: false,
          error: 'No latest version found for model'
        }
      }

      // Create a prediction with test parameters
      const predictionResponse = await fetch('https://api.replicate.com/v1/predictions', {
        method: 'POST',
        headers: {
          'Authorization': `Token ${this.apiToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          version: latestVersion,
          input: testParameters
        })
      })

      const responseTime = Date.now() - startTime

      if (predictionResponse.ok) {
        const prediction = await predictionResponse.json()
        return {
          modelId,
          success: true,
          predictionId: prediction.id,
          parameters: testParameters,
          responseTime
        }
      } else {
        const errorData = await predictionResponse.json()
        return {
          modelId,
          success: false,
          error: `API error: ${predictionResponse.status} - ${JSON.stringify(errorData)}`,
          parameters: testParameters,
          responseTime
        }
      }
    } catch (error) {
      return {
        modelId,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        parameters: testParameters,
        responseTime: Date.now() - startTime
      }
    }
  }

  /**
   * Validate our parameter schemas against official Replicate schemas
   */
  async validateModelSchema(modelId: string, ourParameters: any): Promise<SchemaValidationResult> {
    if (!this.apiToken) {
      return {
        modelId,
        schemaMatch: false,
        missingParameters: [],
        extraParameters: [],
        typeErrors: ['REPLICATE_API_TOKEN not configured']
      }
    }

    try {
      // Get the official model schema
      const modelResponse = await fetch(`https://api.replicate.com/v1/models/${modelId}`, {
        headers: {
          'Authorization': `Token ${this.apiToken}`,
          'Content-Type': 'application/json'
        }
      })

      if (!modelResponse.ok) {
        return {
          modelId,
          schemaMatch: false,
          missingParameters: [],
          extraParameters: [],
          typeErrors: [`Failed to fetch model schema: ${modelResponse.status}`]
        }
      }

      const modelData = await modelResponse.json()
      const officialSchema = modelData.latest_version?.openapi_schema?.components?.schemas?.Input?.properties

      if (!officialSchema) {
        return {
          modelId,
          schemaMatch: false,
          missingParameters: [],
          extraParameters: [],
          typeErrors: ['No schema found in model data']
        }
      }

      // Compare our parameters with official schema
      const officialParams = Object.keys(officialSchema)
      const ourParams = Object.keys(ourParameters)

      const missingParameters = officialParams.filter(param => !ourParams.includes(param))
      const extraParameters = ourParams.filter(param => !officialParams.includes(param))
      const typeErrors: string[] = []

      // Check parameter types
      for (const param of ourParams) {
        if (officialSchema[param]) {
          const officialType = officialSchema[param].type
          const officialEnum = officialSchema[param].enum
          const ourValue = ourParameters[param]

          // Type checking logic
          if (officialType === 'integer' && typeof ourValue !== 'number') {
            typeErrors.push(`${param}: expected integer, got ${typeof ourValue}`)
          }
          if (officialType === 'string' && typeof ourValue !== 'string' && ourValue !== null) {
            typeErrors.push(`${param}: expected string, got ${typeof ourValue}`)
          }
          if (officialType === 'boolean' && typeof ourValue !== 'boolean') {
            typeErrors.push(`${param}: expected boolean, got ${typeof ourValue}`)
          }
          if (officialEnum && !officialEnum.includes(ourValue)) {
            typeErrors.push(`${param}: value ${ourValue} not in allowed enum: ${officialEnum.join(', ')}`)
          }
        }
      }

      return {
        modelId,
        schemaMatch: missingParameters.length === 0 && extraParameters.length === 0 && typeErrors.length === 0,
        missingParameters,
        extraParameters,
        typeErrors
      }
    } catch (error) {
      return {
        modelId,
        schemaMatch: false,
        missingParameters: [],
        extraParameters: [],
        typeErrors: [error instanceof Error ? error.message : 'Unknown error']
      }
    }
  }

  /**
   * Test critical models with sample parameters
   */
  async testCriticalModels(): Promise<ApiTestResult[]> {
    const testCases = [
      {
        modelId: 'bytedance/seedance-1-lite',
        parameters: {
          prompt: 'A beautiful sunset over mountains',
          duration: 5,
          resolution: '720p',
          aspect_ratio: '16:9',
          fps: 24,
          camera_fixed: false
        }
      },
      {
        modelId: 'bytedance/seedance-1-pro',
        parameters: {
          prompt: 'A serene lake with reflections',
          duration: 5,
          resolution: '1080p',
          aspect_ratio: '16:9',
          fps: 24,
          camera_fixed: false
        }
      },
      {
        modelId: 'black-forest-labs/flux-kontext-pro',
        parameters: {
          prompt: 'Make this image more vibrant and colorful',
          aspect_ratio: '1:1',
          output_format: 'png',
          prompt_upsampling: false,
          safety_tolerance: 2
        }
      },
      {
        modelId: 'black-forest-labs/flux-kontext-max',
        parameters: {
          prompt: 'Transform this into a watercolor painting',
          aspect_ratio: '1:1',
          output_format: 'png',
          prompt_upsampling: false,
          safety_tolerance: 2
        }
      }
    ]

    const results: ApiTestResult[] = []
    
    for (const testCase of testCases) {
      console.log(`Testing ${testCase.modelId}...`)
      const result = await this.testModelParameters(testCase.modelId, testCase.parameters)
      results.push(result)
      
      // Add delay between requests to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    return results
  }

  /**
   * Generate a comprehensive test report
   */
  generateTestReport(results: ApiTestResult[], schemaValidations: SchemaValidationResult[]): string {
    const successCount = results.filter(r => r.success).length
    const totalCount = results.length

    let report = `
# Replicate API Integration Test Report

## Summary
- **Total Models Tested**: ${totalCount}
- **Successful API Calls**: ${successCount}
- **Failed API Calls**: ${totalCount - successCount}
- **Success Rate**: ${Math.round((successCount / totalCount) * 100)}%

## API Test Results
${results.map(result => `
### ${result.modelId}
- **Status**: ${result.success ? '✅ SUCCESS' : '❌ FAILED'}
- **Response Time**: ${result.responseTime}ms
${result.predictionId ? `- **Prediction ID**: ${result.predictionId}` : ''}
${result.error ? `- **Error**: ${result.error}` : ''}
${result.parameters ? `- **Parameters**: ${JSON.stringify(result.parameters, null, 2)}` : ''}
`).join('')}

## Schema Validation Results
${schemaValidations.map(validation => `
### ${validation.modelId}
- **Schema Match**: ${validation.schemaMatch ? '✅ VALID' : '❌ INVALID'}
${validation.missingParameters.length > 0 ? `- **Missing Parameters**: ${validation.missingParameters.join(', ')}` : ''}
${validation.extraParameters.length > 0 ? `- **Extra Parameters**: ${validation.extraParameters.join(', ')}` : ''}
${validation.typeErrors.length > 0 ? `- **Type Errors**: ${validation.typeErrors.join('; ')}` : ''}
`).join('')}

## Recommendations
${successCount === totalCount ? 
  '✅ All models are working correctly with current parameter mappings.' :
  `❌ ${totalCount - successCount} model(s) need parameter fixes before production deployment.`
}

${schemaValidations.some(v => !v.schemaMatch) ? 
  '⚠️ Schema mismatches detected. Update parameter mappings to match official Replicate schemas.' :
  '✅ All parameter schemas match official Replicate specifications.'
}
`

    return report
  }
}

// Export singleton instance
export const replicateApiTester = new ReplicateApiTester()
