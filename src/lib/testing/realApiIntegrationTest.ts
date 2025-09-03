/**
 * Real API Integration Test
 * Tests actual Replicate API calls with our corrected model schemas
 */

import { REAL_MODEL_DATA } from '@/lib/replicate/realModelData'

interface ApiTestResult {
  modelId: string
  success: boolean
  predictionId?: string
  error?: string
  responseTime: number
  parameterValidation: {
    passed: boolean
    errors: string[]
  }
  schemaCompliance: {
    passed: boolean
    missingParams: string[]
    extraParams: string[]
  }
}

interface ModelTestCase {
  modelId: string
  replicateModel: string
  testParameters: Record<string, any>
  expectedOutputType: 'image' | 'video' | 'array'
}

export class RealApiIntegrationTest {
  private apiToken: string | null = null

  constructor() {
    this.apiToken = process.env.REPLICATE_API_TOKEN || null
  }

  /**
   * Test critical models with real API calls
   */
  async testCriticalModels(): Promise<ApiTestResult[]> {
    if (!this.apiToken) {
      throw new Error('REPLICATE_API_TOKEN not configured')
    }

    const testCases: ModelTestCase[] = [
      {
        modelId: 'flux-schnell',
        replicateModel: 'black-forest-labs/flux-schnell',
        testParameters: {
          prompt: 'A beautiful sunset over mountains, photorealistic',
          width: 1024,
          height: 1024,
          num_inference_steps: 4,
          seed: 12345
        },
        expectedOutputType: 'image'
      },
      {
        modelId: 'seedance-1-lite',
        replicateModel: 'bytedance/seedance-1-lite',
        testParameters: {
          prompt: 'A serene lake with gentle waves',
          duration: 5,
          resolution: '720p',
          aspect_ratio: '16:9',
          fps: 24,
          camera_fixed: false
        },
        expectedOutputType: 'video'
      },
      {
        modelId: 'flux-kontext-pro',
        replicateModel: 'black-forest-labs/flux-kontext-pro',
        testParameters: {
          prompt: 'Make this image more vibrant and colorful',
          aspect_ratio: '1:1',
          output_format: 'png',
          prompt_upsampling: false,
          safety_tolerance: 2
        },
        expectedOutputType: 'image'
      }
    ]

    const results: ApiTestResult[] = []

    for (const testCase of testCases) {
      console.log(`🧪 Testing ${testCase.modelId} (${testCase.replicateModel})...`)
      
      const result = await this.testModelWithRealApi(testCase)
      results.push(result)
      
      // Add delay between requests to respect rate limits
      await new Promise(resolve => setTimeout(resolve, 2000))
    }

    return results
  }

  /**
   * Test a specific model with real API call
   */
  private async testModelWithRealApi(testCase: ModelTestCase): Promise<ApiTestResult> {
    const startTime = Date.now()
    
    try {
      // Validate parameters against our schema
      const parameterValidation = this.validateParameters(testCase.modelId, testCase.testParameters)
      
      // Get official schema for comparison
      const schemaCompliance = await this.validateSchemaCompliance(testCase.replicateModel, testCase.testParameters)
      
      // Create prediction
      const prediction = await this.createPrediction(testCase.replicateModel, testCase.testParameters)
      
      const responseTime = Date.now() - startTime
      
      if (prediction.success) {
        return {
          modelId: testCase.modelId,
          success: true,
          predictionId: prediction.id,
          responseTime,
          parameterValidation,
          schemaCompliance
        }
      } else {
        return {
          modelId: testCase.modelId,
          success: false,
          error: prediction.error,
          responseTime,
          parameterValidation,
          schemaCompliance
        }
      }
    } catch (error) {
      return {
        modelId: testCase.modelId,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        responseTime: Date.now() - startTime,
        parameterValidation: { passed: false, errors: ['Test failed before validation'] },
        schemaCompliance: { passed: false, missingParams: [], extraParams: [] }
      }
    }
  }

  /**
   * Validate parameters against our model schema
   */
  private validateParameters(modelId: string, parameters: Record<string, any>): { passed: boolean; errors: string[] } {
    const model = REAL_MODEL_DATA.find(m => m.id === modelId)
    if (!model) {
      return { passed: false, errors: [`Model ${modelId} not found in schema`] }
    }

    const errors: string[] = []
    const allParams = (model as any).parameters || []

    // Check required parameters
    allParams.forEach((param: any) => {
      if (param.required && !(param.name in parameters)) {
        errors.push(`Missing required parameter: ${param.name}`)
      }
    })

    // Check parameter types and values
    Object.entries(parameters).forEach(([key, value]) => {
      const paramDef = allParams.find((p: any) => p.name === key)
      if (!paramDef) {
        errors.push(`Unknown parameter: ${key}`)
        return
      }

      // Type validation
      switch (paramDef.type) {
        case 'integer':
          if (typeof value !== 'number' || !Number.isInteger(value)) {
            errors.push(`Parameter ${key} must be an integer`)
          }
          break
        case 'string':
          if (typeof value !== 'string' && value !== null) {
            errors.push(`Parameter ${key} must be a string`)
          }
          break
        case 'boolean':
          if (typeof value !== 'boolean') {
            errors.push(`Parameter ${key} must be a boolean`)
          }
          break
        case 'select':
          if (paramDef.options && !paramDef.options.includes(value)) {
            errors.push(`Parameter ${key} must be one of: ${paramDef.options.join(', ')}`)
          }
          break
      }
    })

    return { passed: errors.length === 0, errors }
  }

  /**
   * Validate schema compliance with official Replicate schema
   */
  private async validateSchemaCompliance(replicateModel: string, parameters: Record<string, any>): Promise<{ passed: boolean; missingParams: string[]; extraParams: string[] }> {
    try {
      // Get official model schema
      const response = await fetch(`https://api.replicate.com/v1/models/${replicateModel}`, {
        headers: {
          'Authorization': `Token ${this.apiToken}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        return { passed: false, missingParams: [], extraParams: [`Failed to fetch schema: ${response.status}`] }
      }

      const modelData = await response.json()
      const officialSchema = modelData.latest_version?.openapi_schema?.components?.schemas?.Input?.properties

      if (!officialSchema) {
        return { passed: false, missingParams: [], extraParams: ['No schema found'] }
      }

      const officialParams = Object.keys(officialSchema)
      const ourParams = Object.keys(parameters)

      const missingParams = officialParams.filter(param => 
        officialSchema[param].required && !ourParams.includes(param)
      )
      const extraParams = ourParams.filter(param => !officialParams.includes(param))

      return {
        passed: missingParams.length === 0 && extraParams.length === 0,
        missingParams,
        extraParams
      }
    } catch (error) {
      return {
        passed: false,
        missingParams: [],
        extraParams: [error instanceof Error ? error.message : 'Schema validation failed']
      }
    }
  }

  /**
   * Create a prediction with Replicate API
   */
  private async createPrediction(model: string, input: Record<string, any>): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      const response = await fetch('https://api.replicate.com/v1/predictions', {
        method: 'POST',
        headers: {
          'Authorization': `Token ${this.apiToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          version: await this.getModelVersion(model),
          input
        })
      })

      if (response.ok) {
        const prediction = await response.json()
        return { success: true, id: prediction.id }
      } else {
        const errorData = await response.json()
        return { success: false, error: `${response.status}: ${JSON.stringify(errorData)}` }
      }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  /**
   * Get the latest version ID for a model
   */
  private async getModelVersion(model: string): Promise<string> {
    const response = await fetch(`https://api.replicate.com/v1/models/${model}`, {
      headers: {
        'Authorization': `Token ${this.apiToken}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to get model version: ${response.status}`)
    }

    const modelData = await response.json()
    const version = modelData.latest_version?.id

    if (!version) {
      throw new Error('No latest version found for model')
    }

    return version
  }

  /**
   * Generate comprehensive test report
   */
  generateTestReport(results: ApiTestResult[]): string {
    const successCount = results.filter(r => r.success).length
    const totalCount = results.length
    const successRate = Math.round((successCount / totalCount) * 100)

    const parameterValidationPassed = results.filter(r => r.parameterValidation.passed).length
    const schemaCompliancePassed = results.filter(r => r.schemaCompliance.passed).length

    return `
# 🧪 Real API Integration Test Report

## Executive Summary
- **Total Models Tested**: ${totalCount}
- **Successful API Calls**: ${successCount}/${totalCount} (${successRate}%)
- **Parameter Validation**: ${parameterValidationPassed}/${totalCount} passed
- **Schema Compliance**: ${schemaCompliancePassed}/${totalCount} passed

## Detailed Results

${results.map(result => `
### ${result.modelId}
- **API Call**: ${result.success ? '✅ SUCCESS' : '❌ FAILED'}
- **Response Time**: ${result.responseTime}ms
- **Parameter Validation**: ${result.parameterValidation.passed ? '✅ PASSED' : '❌ FAILED'}
- **Schema Compliance**: ${result.schemaCompliance.passed ? '✅ PASSED' : '❌ FAILED'}

${result.predictionId ? `**Prediction ID**: ${result.predictionId}` : ''}
${result.error ? `**Error**: ${result.error}` : ''}

${result.parameterValidation.errors.length > 0 ? `**Parameter Errors**:
${result.parameterValidation.errors.map(error => `- ${error}`).join('\n')}` : ''}

${result.schemaCompliance.missingParams.length > 0 ? `**Missing Parameters**: ${result.schemaCompliance.missingParams.join(', ')}` : ''}
${result.schemaCompliance.extraParams.length > 0 ? `**Extra Parameters**: ${result.schemaCompliance.extraParams.join(', ')}` : ''}
`).join('')}

## Production Readiness Assessment

### ✅ Ready for Production
${results.filter(r => r.success && r.parameterValidation.passed && r.schemaCompliance.passed).map(r => `- ${r.modelId}`).join('\n')}

### ⚠️ Needs Attention
${results.filter(r => !r.success || !r.parameterValidation.passed || !r.schemaCompliance.passed).map(r => `- ${r.modelId}: ${r.error || 'Parameter/schema issues'}`).join('\n')}

## Recommendations

${successRate === 100 ? '✅ All models are working correctly with current parameter mappings.' : `❌ ${totalCount - successCount} model(s) need fixes before production deployment.`}

${schemaCompliancePassed === totalCount ? '✅ All parameter schemas match official Replicate specifications.' : '⚠️ Some models have schema mismatches that need to be addressed.'}

---
*Report generated on ${new Date().toISOString()}*
`
  }
}

// Export singleton instance
export const realApiIntegrationTest = new RealApiIntegrationTest()
