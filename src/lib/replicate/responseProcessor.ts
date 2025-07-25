/**
 * Replicate Response Processor
 * Enhanced processing of Replicate API responses with storage integration
 */

import { processReplicateResponse, createDatabaseRecord, ProcessedFile } from '@/lib/storage/uploadUtils'
import { StorageErrorHandler, StorageErrorCode } from '@/lib/storage/errorHandling'
import { getCloudinaryStorageService } from '@/lib/storage/cloudinaryStorage'

export interface ReplicateApiResponse {
  id: string
  status: 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled'
  output?: string | string[] | null
  error?: string | null
  logs?: string
  metrics?: {
    predict_time?: number
    total_time?: number
  }
  model?: string
  version?: string
  input?: Record<string, any>
  created_at?: string
  started_at?: string
  completed_at?: string
}

export interface ProcessingOptions {
  userId: string
  prompt: string
  modelUsed: string
  parameters?: Record<string, any>
  storeInDatabase?: boolean
  generateThumbnails?: boolean
  onProgress?: (progress: ProcessingProgress) => void
}

export interface ProcessingProgress {
  stage: 'downloading' | 'uploading' | 'storing' | 'complete'
  fileIndex: number
  totalFiles: number
  progress: number // 0-100
  message?: string
}

export interface ProcessingResult {
  success: boolean
  files: ProcessedFile[]
  databaseRecords?: any[]
  errors: string[]
  metadata: {
    totalFiles: number
    successCount: number
    processingTime: number
    storageUsed: number // bytes
  }
}

export class ReplicateResponseProcessor {
  private storageService = getCloudinaryStorageService()

  /**
   * Process a complete Replicate API response
   */
  async processResponse(
    response: ReplicateApiResponse,
    options: ProcessingOptions
  ): Promise<ProcessingResult> {
    const startTime = Date.now()
    const result: ProcessingResult = {
      success: false,
      files: [],
      databaseRecords: [],
      errors: [],
      metadata: {
        totalFiles: 0,
        successCount: 0,
        processingTime: 0,
        storageUsed: 0
      }
    }

    try {
      // Validate response
      const validation = this.validateResponse(response)
      if (!validation.valid) {
        result.errors.push(validation.error || 'Invalid response')
        return result
      }

      // Extract file URLs
      const fileUrls = this.extractFileUrls(response)
      result.metadata.totalFiles = fileUrls.length

      if (fileUrls.length === 0) {
        result.errors.push('No files found in response')
        return result
      }

      // Process each file
      for (let i = 0; i < fileUrls.length; i++) {
        const fileUrl = fileUrls[i]
        
        try {
          // Update progress
          if (options.onProgress) {
            options.onProgress({
              stage: 'downloading',
              fileIndex: i,
              totalFiles: fileUrls.length,
              progress: 0,
              message: `Processing file ${i + 1} of ${fileUrls.length}`
            })
          }

          // Process individual file
          const processedFile = await this.processFile(fileUrl, response, options, i)
          result.files.push(processedFile)
          result.metadata.successCount++
          result.metadata.storageUsed += processedFile.metadata.fileSize

          // Create database record if requested
          if (options.storeInDatabase) {
            const dbRecord = createDatabaseRecord(processedFile, options.userId, {
              parameters: options.parameters,
              cost: this.calculateCost(response),
              generationTime: response.metrics?.predict_time
            })
            result.databaseRecords?.push(dbRecord)
          }

          // Update progress
          if (options.onProgress) {
            options.onProgress({
              stage: 'complete',
              fileIndex: i,
              totalFiles: fileUrls.length,
              progress: 100,
              message: `File ${i + 1} processed successfully`
            })
          }

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error'
          result.errors.push(`File ${i + 1}: ${errorMessage}`)
          
          // Log error for monitoring
          StorageErrorHandler.logError(
            StorageErrorHandler.parseError(error, 'file-processing'),
            { fileUrl, responseId: response.id, fileIndex: i }
          )
        }
      }

      result.success = result.metadata.successCount > 0
      result.metadata.processingTime = Date.now() - startTime

      return result

    } catch (error) {
      result.errors.push(error instanceof Error ? error.message : 'Processing failed')
      result.metadata.processingTime = Date.now() - startTime
      return result
    }
  }

  /**
   * Process a single file from the response
   */
  private async processFile(
    fileUrl: string,
    response: ReplicateApiResponse,
    options: ProcessingOptions,
    fileIndex: number
  ): Promise<ProcessedFile> {
    // Validate URL
    const urlValidation = StorageErrorHandler.validateUrl(fileUrl)
    if (!urlValidation.valid) {
      throw urlValidation.error
    }

    // Analyze file properties
    const fileInfo = await this.analyzeFile(fileUrl)
    
    // Create metadata for Cloudinary storage
    const metadata = {
      originalUrl: fileUrl,
      filename: fileInfo.filename,
      mimeType: fileInfo.mimeType,
      width: fileInfo.width,
      height: fileInfo.height,
      duration: fileInfo.duration,
      generatedAt: new Date().toISOString(),
      modelUsed: options.modelUsed,
      prompt: options.prompt
    }

    // Store file with Cloudinary (no progress callback support)
    if (options.onProgress) {
      options.onProgress({
        stage: 'uploading',
        fileIndex,
        totalFiles: 1,
        progress: 0,
        message: `Uploading file ${fileIndex + 1} to Cloudinary...`
      })
    }

    const storageResult = await StorageErrorHandler.withRetry(
      () => this.storageService.storeFromUrl(fileUrl, metadata),
      'file-upload'
    )

    if (options.onProgress) {
      options.onProgress({
        stage: 'uploading',
        fileIndex,
        totalFiles: 1,
        progress: 100,
        message: `File ${fileIndex + 1} uploaded successfully`
      })
    }

    if (!storageResult.success || !storageResult.data) {
      throw new Error(storageResult.error || 'Storage failed')
    }

    return {
      originalUrl: fileUrl,
      storedUrl: storageResult.data.publicUrl,
      metadata: {
        ...storageResult.data.metadata,
        fileSize: 0 // Will be calculated during actual storage
      },
      storageResult: {
        ...storageResult,
        data: storageResult.data ? {
          path: storageResult.data.publicId || storageResult.data.publicUrl,
          publicUrl: storageResult.data.publicUrl,
          metadata: {
            ...storageResult.data.metadata,
            fileSize: 0 // Will be calculated during actual storage
          }
        } : undefined
      }
    }
  }

  /**
   * Validate Replicate response
   */
  private validateResponse(response: ReplicateApiResponse): { valid: boolean; error?: string } {
    if (!response) {
      return { valid: false, error: 'Response is null or undefined' }
    }

    if (response.status !== 'succeeded') {
      return { valid: false, error: `Response status is ${response.status}: ${response.error || 'Unknown error'}` }
    }

    if (!response.output) {
      return { valid: false, error: 'No output in response' }
    }

    return { valid: true }
  }

  /**
   * Extract file URLs from response output
   */
  private extractFileUrls(response: ReplicateApiResponse): string[] {
    if (!response.output) return []

    // Handle different output formats
    if (typeof response.output === 'string') {
      return [response.output]
    }

    if (Array.isArray(response.output)) {
      return response.output.filter(url => typeof url === 'string' && url.trim().length > 0)
    }

    // Handle object output (some models return objects with URLs)
    if (typeof response.output === 'object') {
      const urls: string[] = []
      
      // Common patterns in Replicate responses
      const possibleKeys = ['url', 'urls', 'video', 'image', 'images', 'files']
      
      for (const key of possibleKeys) {
        const value = (response.output as any)[key]
        if (typeof value === 'string') {
          urls.push(value)
        } else if (Array.isArray(value)) {
          urls.push(...value.filter(url => typeof url === 'string'))
        }
      }
      
      return urls
    }

    return []
  }

  /**
   * Analyze file properties from URL
   */
  private async analyzeFile(url: string): Promise<{
    filename: string
    mimeType: string
    width?: number
    height?: number
    duration?: number
  }> {
    try {
      // Extract filename from URL
      const urlPath = new URL(url).pathname
      const filename = urlPath.split('/').pop() || `generated-${Date.now()}`
      
      // Determine MIME type from extension
      const extension = filename.split('.').pop()?.toLowerCase()
      let mimeType = 'application/octet-stream'
      
      const extensionMap: Record<string, string> = {
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'webp': 'image/webp',
        'gif': 'image/gif',
        'mp4': 'video/mp4',
        'webm': 'video/webm',
        'mov': 'video/quicktime'
      }
      
      if (extension && extensionMap[extension]) {
        mimeType = extensionMap[extension]
      } else {
        // Try to get content-type from HEAD request
        try {
          const response = await fetch(url, { method: 'HEAD' })
          const contentType = response.headers.get('content-type')
          if (contentType) {
            mimeType = contentType.split(';')[0]
          }
        } catch {
          // Fallback to default
        }
      }

      // Set default dimensions based on content type
      let width: number | undefined
      let height: number | undefined
      let duration: number | undefined

      if (mimeType.startsWith('image/')) {
        // Default image dimensions (will be updated during processing if available)
        width = 1024
        height = 1024
      } else if (mimeType.startsWith('video/')) {
        // Default video properties
        width = 1024
        height = 576
        duration = 5.0
      }

      return {
        filename,
        mimeType,
        width,
        height,
        duration
      }
    } catch (error) {
      // Fallback for invalid URLs
      return {
        filename: `generated-${Date.now()}.bin`,
        mimeType: 'application/octet-stream'
      }
    }
  }

  /**
   * Calculate generation cost from response
   */
  private calculateCost(response: ReplicateApiResponse): number | undefined {
    // This would typically be calculated based on the model used and processing time
    // For now, return undefined as cost calculation requires model-specific pricing
    return undefined
  }

  /**
   * Process multiple responses in batch
   */
  async processBatch(
    responses: ReplicateApiResponse[],
    options: ProcessingOptions
  ): Promise<ProcessingResult[]> {
    const results: ProcessingResult[] = []
    
    for (let i = 0; i < responses.length; i++) {
      const response = responses[i]
      
      // Update progress for batch processing
      const batchOptions = {
        ...options,
        onProgress: (progress: ProcessingProgress) => {
          if (options.onProgress) {
            options.onProgress({
              ...progress,
              fileIndex: i * 10 + progress.fileIndex, // Adjust for batch
              totalFiles: responses.length * 10, // Estimate
              message: `Batch ${i + 1}/${responses.length}: ${progress.message}`
            })
          }
        }
      }
      
      const result = await this.processResponse(response, batchOptions)
      results.push(result)
    }
    
    return results
  }
}

// Singleton instance
let processor: ReplicateResponseProcessor | null = null

export function getResponseProcessor(): ReplicateResponseProcessor {
  if (!processor) {
    processor = new ReplicateResponseProcessor()
  }
  return processor
}

export default ReplicateResponseProcessor
