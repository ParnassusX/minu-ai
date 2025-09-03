/**
 * Storage Pipeline Integrity Test
 * Comprehensive test to verify the complete storage pipeline works correctly
 */

interface StorageTestResult {
  success: boolean
  stage: string
  error?: string
  data?: any
}

interface PipelineTestResults {
  uploadImage: StorageTestResult
  unifiedStorage: StorageTestResult
  galleryStorage: StorageTestResult
  galleryRetrieval: StorageTestResult
  overall: {
    success: boolean
    passedStages: number
    totalStages: number
    errors: string[]
  }
}

export class StoragePipelineIntegrityTest {
  private testImageUrl = 'https://replicate.delivery/pbxt/test-image.jpg' // Mock test URL
  private testMetadata = {
    originalUrl: 'https://replicate.delivery/pbxt/test-image.jpg',
    filename: 'test-image.jpg',
    mimeType: 'image/jpeg',
    generatedAt: new Date().toISOString(),
    modelUsed: 'test-model',
    prompt: 'Test image for storage pipeline verification',
    mode: 'images'
  }

  /**
   * Test the complete storage pipeline end-to-end
   */
  async testCompletePipeline(): Promise<PipelineTestResults> {
    const results: PipelineTestResults = {
      uploadImage: { success: false, stage: 'uploadImage' },
      unifiedStorage: { success: false, stage: 'unifiedStorage' },
      galleryStorage: { success: false, stage: 'galleryStorage' },
      galleryRetrieval: { success: false, stage: 'galleryRetrieval' },
      overall: {
        success: false,
        passedStages: 0,
        totalStages: 4,
        errors: []
      }
    }

    console.log('🧪 Starting Storage Pipeline Integrity Test...')

    // Stage 1: Test Image Upload (Input Storage)
    results.uploadImage = await this.testImageUpload()
    if (results.uploadImage.success) results.overall.passedStages++
    else results.overall.errors.push(`Upload: ${results.uploadImage.error}`)

    // Stage 2: Test Unified Storage (Result Storage)
    results.unifiedStorage = await this.testUnifiedStorage()
    if (results.unifiedStorage.success) results.overall.passedStages++
    else results.overall.errors.push(`Storage: ${results.unifiedStorage.error}`)

    // Stage 3: Test Gallery Storage (Database Save)
    results.galleryStorage = await this.testGalleryStorage()
    if (results.galleryStorage.success) results.overall.passedStages++
    else results.overall.errors.push(`Gallery Save: ${results.galleryStorage.error}`)

    // Stage 4: Test Gallery Retrieval (Database Load)
    results.galleryRetrieval = await this.testGalleryRetrieval()
    if (results.galleryRetrieval.success) results.overall.passedStages++
    else results.overall.errors.push(`Gallery Load: ${results.galleryRetrieval.error}`)

    // Overall assessment
    results.overall.success = results.overall.passedStages === results.overall.totalStages

    console.log('🧪 Storage Pipeline Test Complete:', {
      success: results.overall.success,
      passed: `${results.overall.passedStages}/${results.overall.totalStages}`,
      errors: results.overall.errors
    })

    return results
  }

  /**
   * Test image upload endpoint (for input images)
   */
  private async testImageUpload(): Promise<StorageTestResult> {
    try {
      console.log('📤 Testing image upload...')
      
      // Create a test file blob
      const testBlob = new Blob(['test image data'], { type: 'image/jpeg' })
      const testFile = new File([testBlob], 'test.jpg', { type: 'image/jpeg' })
      
      const formData = new FormData()
      formData.append('file', testFile)

      const response = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const errorText = await response.text()
        return {
          success: false,
          stage: 'uploadImage',
          error: `HTTP ${response.status}: ${errorText}`
        }
      }

      const data = await response.json()
      
      if (!data.url) {
        return {
          success: false,
          stage: 'uploadImage',
          error: 'No URL returned from upload'
        }
      }

      return {
        success: true,
        stage: 'uploadImage',
        data: { url: data.url, provider: data.provider }
      }
    } catch (error) {
      return {
        success: false,
        stage: 'uploadImage',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Test unified storage endpoint (for generation results)
   */
  private async testUnifiedStorage(): Promise<StorageTestResult> {
    try {
      console.log('🗄️ Testing unified storage...')

      const response = await fetch('/api/unified-storage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: this.testImageUrl,
          metadata: this.testMetadata
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        return {
          success: false,
          stage: 'unifiedStorage',
          error: `HTTP ${response.status}: ${errorText}`
        }
      }

      const data = await response.json()
      
      if (!data.success || !data.data?.url) {
        return {
          success: false,
          stage: 'unifiedStorage',
          error: data.error || 'No URL returned from storage'
        }
      }

      return {
        success: true,
        stage: 'unifiedStorage',
        data: { 
          url: data.data.url, 
          provider: data.data.provider,
          persistent: data.data.persistent
        }
      }
    } catch (error) {
      return {
        success: false,
        stage: 'unifiedStorage',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Test gallery storage (saving to database)
   */
  private async testGalleryStorage(): Promise<StorageTestResult> {
    try {
      console.log('💾 Testing gallery storage...')

      const testResults = [{
        id: 'test-image-1',
        originalUrl: this.testImageUrl,
        cloudinaryUrl: this.testImageUrl,
        metadata: this.testMetadata
      }]

      const response = await fetch('/api/gallery/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          results: testResults
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        return {
          success: false,
          stage: 'galleryStorage',
          error: `HTTP ${response.status}: ${errorText}`
        }
      }

      const data = await response.json()
      
      if (!data.success || data.saved === 0) {
        return {
          success: false,
          stage: 'galleryStorage',
          error: 'No images were saved to gallery'
        }
      }

      return {
        success: true,
        stage: 'galleryStorage',
        data: { saved: data.saved, total: data.total }
      }
    } catch (error) {
      return {
        success: false,
        stage: 'galleryStorage',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Test gallery retrieval (loading from database)
   */
  private async testGalleryRetrieval(): Promise<StorageTestResult> {
    try {
      console.log('📋 Testing gallery retrieval...')

      const response = await fetch('/api/gallery?page=1&limit=10')

      if (!response.ok) {
        const errorText = await response.text()
        return {
          success: false,
          stage: 'galleryRetrieval',
          error: `HTTP ${response.status}: ${errorText}`
        }
      }

      const data = await response.json()
      
      if (!data.success && !Array.isArray(data.images)) {
        return {
          success: false,
          stage: 'galleryRetrieval',
          error: 'Invalid gallery response format'
        }
      }

      return {
        success: true,
        stage: 'galleryRetrieval',
        data: { 
          imageCount: data.images?.length || 0,
          hasImages: (data.images?.length || 0) > 0
        }
      }
    } catch (error) {
      return {
        success: false,
        stage: 'galleryRetrieval',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Generate a comprehensive test report
   */
  generateReport(results: PipelineTestResults): string {
    const { overall } = results
    
    let report = `
# Storage Pipeline Integrity Test Report

## Overall Status: ${overall.success ? '✅ PASSED' : '❌ FAILED'}
- Passed Stages: ${overall.passedStages}/${overall.totalStages}
- Success Rate: ${Math.round((overall.passedStages / overall.totalStages) * 100)}%

## Stage Results:

### 1. Image Upload (Input Storage)
- Status: ${results.uploadImage.success ? '✅ PASSED' : '❌ FAILED'}
- Purpose: Test temporary storage for user-uploaded images
${results.uploadImage.error ? `- Error: ${results.uploadImage.error}` : ''}
${results.uploadImage.data ? `- Data: ${JSON.stringify(results.uploadImage.data)}` : ''}

### 2. Unified Storage (Result Storage)
- Status: ${results.unifiedStorage.success ? '✅ PASSED' : '❌ FAILED'}
- Purpose: Test persistent storage for generation results
${results.unifiedStorage.error ? `- Error: ${results.unifiedStorage.error}` : ''}
${results.unifiedStorage.data ? `- Data: ${JSON.stringify(results.unifiedStorage.data)}` : ''}

### 3. Gallery Storage (Database Save)
- Status: ${results.galleryStorage.success ? '✅ PASSED' : '❌ FAILED'}
- Purpose: Test saving image metadata to database
${results.galleryStorage.error ? `- Error: ${results.galleryStorage.error}` : ''}
${results.galleryStorage.data ? `- Data: ${JSON.stringify(results.galleryStorage.data)}` : ''}

### 4. Gallery Retrieval (Database Load)
- Status: ${results.galleryRetrieval.success ? '✅ PASSED' : '❌ FAILED'}
- Purpose: Test loading images from database
${results.galleryRetrieval.error ? `- Error: ${results.galleryRetrieval.error}` : ''}
${results.galleryRetrieval.data ? `- Data: ${JSON.stringify(results.galleryRetrieval.data)}` : ''}

## Summary:
${overall.success 
  ? 'All storage pipeline components are functioning correctly.' 
  : `Storage pipeline has issues in ${overall.totalStages - overall.passedStages} stage(s):`
}
${overall.errors.map(error => `- ${error}`).join('\n')}
`
    
    return report
  }
}

// Export singleton instance
export const storagePipelineTest = new StoragePipelineIntegrityTest()
