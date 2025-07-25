/**
 * Storage Workflow Test
 * End-to-end testing for the generation and storage workflow
 */

import { getStorageService } from '@/lib/storage/supabaseStorage'
import { getResponseProcessor } from '@/lib/replicate/responseProcessor'
import { StorageErrorHandler } from '@/lib/storage/errorHandling'

export interface WorkflowTestResult {
  success: boolean
  stage: string
  error?: string
  details?: any
  timing: {
    start: number
    end: number
    duration: number
  }
}

export interface EndToEndTestResult {
  overall: {
    success: boolean
    totalTime: number
    errors: string[]
  }
  stages: {
    storageSetup: WorkflowTestResult
    replicateSimulation: WorkflowTestResult
    fileProcessing: WorkflowTestResult
    databaseStorage: WorkflowTestResult
    galleryRetrieval: WorkflowTestResult
  }
  metrics: {
    filesProcessed: number
    storageUsed: number
    averageProcessingTime: number
  }
}

export class StorageWorkflowTester {
  private testUserId = 'test-user-' + Date.now()
  private testPrompt = 'Test image generation for storage workflow'

  /**
   * Run complete end-to-end test
   */
  async runEndToEndTest(): Promise<EndToEndTestResult> {
    const startTime = Date.now()
    const result: EndToEndTestResult = {
      overall: {
        success: false,
        totalTime: 0,
        errors: []
      },
      stages: {
        storageSetup: await this.testStorageSetup(),
        replicateSimulation: await this.testReplicateSimulation(),
        fileProcessing: await this.testFileProcessing(),
        databaseStorage: await this.testDatabaseStorage(),
        galleryRetrieval: await this.testGalleryRetrieval()
      },
      metrics: {
        filesProcessed: 0,
        storageUsed: 0,
        averageProcessingTime: 0
      }
    }

    // Collect errors from all stages
    Object.values(result.stages).forEach(stage => {
      if (!stage.success && stage.error) {
        result.overall.errors.push(`${stage.stage}: ${stage.error}`)
      }
    })

    // Calculate overall success
    result.overall.success = Object.values(result.stages).every(stage => stage.success)
    result.overall.totalTime = Date.now() - startTime

    // Calculate metrics
    result.metrics.averageProcessingTime = Object.values(result.stages)
      .reduce((sum, stage) => sum + stage.timing.duration, 0) / Object.keys(result.stages).length

    return result
  }

  /**
   * Test storage service setup
   */
  private async testStorageSetup(): Promise<WorkflowTestResult> {
    const start = Date.now()
    
    try {
      const storageService = getStorageService()
      
      // Test bucket existence/creation
      const bucketResult = await storageService.ensureBucketExists()
      if (!bucketResult.success) {
        throw new Error(bucketResult.error || 'Bucket setup failed')
      }

      return {
        success: true,
        stage: 'Storage Setup',
        timing: {
          start,
          end: Date.now(),
          duration: Date.now() - start
        }
      }
    } catch (error) {
      return {
        success: false,
        stage: 'Storage Setup',
        error: error instanceof Error ? error.message : 'Unknown error',
        timing: {
          start,
          end: Date.now(),
          duration: Date.now() - start
        }
      }
    }
  }

  /**
   * Test Replicate response simulation
   */
  private async testReplicateSimulation(): Promise<WorkflowTestResult> {
    const start = Date.now()
    
    try {
      // Create mock Replicate response
      const mockResponse = {
        id: 'test-prediction-' + Date.now(),
        status: 'succeeded' as const,
        output: [
          'https://replicate.delivery/pbxt/test-image-1.jpg',
          'https://replicate.delivery/pbxt/test-image-2.jpg'
        ],
        model: 'flux-dev',
        metrics: {
          predict_time: 2.5
        }
      }

      // Validate response structure
      if (!mockResponse.output || !Array.isArray(mockResponse.output)) {
        throw new Error('Invalid response structure')
      }

      return {
        success: true,
        stage: 'Replicate Simulation',
        details: {
          responseId: mockResponse.id,
          outputCount: mockResponse.output.length
        },
        timing: {
          start,
          end: Date.now(),
          duration: Date.now() - start
        }
      }
    } catch (error) {
      return {
        success: false,
        stage: 'Replicate Simulation',
        error: error instanceof Error ? error.message : 'Unknown error',
        timing: {
          start,
          end: Date.now(),
          duration: Date.now() - start
        }
      }
    }
  }

  /**
   * Test file processing workflow
   */
  private async testFileProcessing(): Promise<WorkflowTestResult> {
    const start = Date.now()
    
    try {
      // Note: This is a dry run test since we can't actually download from mock URLs
      // In a real test environment, you would use actual test files
      
      const processor = getResponseProcessor()
      
      // Validate processor exists and has required methods
      if (!processor || typeof processor.processResponse !== 'function') {
        throw new Error('Response processor not properly initialized')
      }

      // Test URL validation
      const testUrls = [
        'https://replicate.delivery/pbxt/test-image-1.jpg',
        'https://replicate.delivery/pbxt/test-image-2.jpg'
      ]

      for (const url of testUrls) {
        const validation = StorageErrorHandler.validateUrl(url)
        if (!validation.valid) {
          throw new Error(`URL validation failed: ${validation.error?.message}`)
        }
      }

      return {
        success: true,
        stage: 'File Processing',
        details: {
          urlsValidated: testUrls.length,
          processorReady: true
        },
        timing: {
          start,
          end: Date.now(),
          duration: Date.now() - start
        }
      }
    } catch (error) {
      return {
        success: false,
        stage: 'File Processing',
        error: error instanceof Error ? error.message : 'Unknown error',
        timing: {
          start,
          end: Date.now(),
          duration: Date.now() - start
        }
      }
    }
  }

  /**
   * Test database storage
   */
  private async testDatabaseStorage(): Promise<WorkflowTestResult> {
    const start = Date.now()
    
    try {
      // Test database connection and schema
      const { createServiceClient } = await import('@/lib/supabase/server')
      const supabase = createServiceClient()

      // Test images table exists and is accessible
      const { error: tableError } = await supabase
        .from('images')
        .select('id')
        .limit(1)

      if (tableError) {
        throw new Error(`Database table access failed: ${tableError.message}`)
      }

      // Test profiles table for user management
      const { error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .limit(1)

      if (profileError) {
        throw new Error(`Profiles table access failed: ${profileError.message}`)
      }

      return {
        success: true,
        stage: 'Database Storage',
        details: {
          tablesAccessible: ['images', 'profiles'],
          connectionValid: true
        },
        timing: {
          start,
          end: Date.now(),
          duration: Date.now() - start
        }
      }
    } catch (error) {
      return {
        success: false,
        stage: 'Database Storage',
        error: error instanceof Error ? error.message : 'Unknown error',
        timing: {
          start,
          end: Date.now(),
          duration: Date.now() - start
        }
      }
    }
  }

  /**
   * Test gallery retrieval
   */
  private async testGalleryRetrieval(): Promise<WorkflowTestResult> {
    const start = Date.now()
    
    try {
      // Test gallery API endpoint
      const response = await fetch('/api/gallery?limit=1', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`Gallery API failed: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid gallery response format')
      }

      return {
        success: true,
        stage: 'Gallery Retrieval',
        details: {
          apiAccessible: true,
          responseValid: true,
          imageCount: data.images?.length || 0
        },
        timing: {
          start,
          end: Date.now(),
          duration: Date.now() - start
        }
      }
    } catch (error) {
      return {
        success: false,
        stage: 'Gallery Retrieval',
        error: error instanceof Error ? error.message : 'Unknown error',
        timing: {
          start,
          end: Date.now(),
          duration: Date.now() - start
        }
      }
    }
  }

  /**
   * Test storage persistence
   */
  async testStoragePersistence(): Promise<WorkflowTestResult> {
    const start = Date.now()
    
    try {
      const storageService = getStorageService()
      
      // Create a small test file
      const testData = new TextEncoder().encode('Test storage persistence')
      const testBuffer = testData.buffer
      
      const metadata = {
        originalUrl: 'test://localhost/test-file.txt',
        filename: 'test-persistence.txt',
        mimeType: 'text/plain',
        modelUsed: 'test-model',
        prompt: 'Test persistence'
      }

      // Test upload
      const uploadResult = await storageService.storeFromUrl(
        'data:text/plain;base64,' + btoa('Test storage persistence'),
        metadata
      )

      if (!uploadResult.success || !uploadResult.data) {
        throw new Error(uploadResult.error || 'Upload failed')
      }

      // Test file accessibility
      const response = await fetch(uploadResult.data.publicUrl)
      if (!response.ok) {
        throw new Error('Stored file not accessible')
      }

      // Cleanup test file
      await storageService.deleteFile(uploadResult.data.path)

      return {
        success: true,
        stage: 'Storage Persistence',
        details: {
          fileUploaded: true,
          fileAccessible: true,
          cleanupSuccessful: true
        },
        timing: {
          start,
          end: Date.now(),
          duration: Date.now() - start
        }
      }
    } catch (error) {
      return {
        success: false,
        stage: 'Storage Persistence',
        error: error instanceof Error ? error.message : 'Unknown error',
        timing: {
          start,
          end: Date.now(),
          duration: Date.now() - start
        }
      }
    }
  }

  /**
   * Generate test report
   */
  generateReport(result: EndToEndTestResult): string {
    const lines = [
      '# Storage Workflow Test Report',
      `Generated: ${new Date().toISOString()}`,
      '',
      '## Overall Results',
      `✅ Success: ${result.overall.success ? 'PASS' : 'FAIL'}`,
      `⏱️ Total Time: ${result.overall.totalTime}ms`,
      `📊 Average Stage Time: ${result.metrics.averageProcessingTime.toFixed(2)}ms`,
      '',
      '## Stage Results'
    ]

    Object.entries(result.stages).forEach(([key, stage]) => {
      lines.push(`### ${stage.stage}`)
      lines.push(`Status: ${stage.success ? '✅ PASS' : '❌ FAIL'}`)
      lines.push(`Duration: ${stage.timing.duration}ms`)
      
      if (stage.error) {
        lines.push(`Error: ${stage.error}`)
      }
      
      if (stage.details) {
        lines.push(`Details: ${JSON.stringify(stage.details, null, 2)}`)
      }
      
      lines.push('')
    })

    if (result.overall.errors.length > 0) {
      lines.push('## Errors')
      result.overall.errors.forEach(error => {
        lines.push(`- ${error}`)
      })
    }

    return lines.join('\n')
  }
}

// Export singleton instance
export const storageWorkflowTester = new StorageWorkflowTester()

export default StorageWorkflowTester
