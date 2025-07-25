/**
 * File Upload Utilities
 * Helper functions for processing and uploading files from Replicate API responses
 */

import { getStorageService, StorageMetadata, StorageResult, UploadProgress } from './supabaseStorage'

export interface ReplicateResponse {
  id: string
  status: 'succeeded' | 'failed' | 'processing'
  output?: string | string[] // Can be single URL or array of URLs
  error?: string
  metrics?: {
    predict_time?: number
    total_time?: number
  }
  model?: string
  input?: Record<string, any>
}

export interface ProcessedFile {
  originalUrl: string
  storedUrl: string
  metadata: StorageMetadata
  storageResult: StorageResult
}

export interface BatchUploadResult {
  success: boolean
  files: ProcessedFile[]
  errors: string[]
  totalFiles: number
  successCount: number
}

export interface FileProcessingOptions {
  prompt: string
  modelUsed: string
  userId: string
  onProgress?: (fileIndex: number, progress: UploadProgress) => void
  onFileComplete?: (fileIndex: number, result: ProcessedFile) => void
}

/**
 * Process Replicate API response and store all generated files
 */
export async function processReplicateResponse(
  response: ReplicateResponse,
  options: FileProcessingOptions
): Promise<BatchUploadResult> {
  const result: BatchUploadResult = {
    success: false,
    files: [],
    errors: [],
    totalFiles: 0,
    successCount: 0
  }

  try {
    // Validate response
    if (response.status !== 'succeeded' || !response.output) {
      result.errors.push(response.error || 'No output from Replicate')
      return result
    }

    // Extract file URLs from output
    const fileUrls = Array.isArray(response.output) ? response.output : [response.output]
    result.totalFiles = fileUrls.length

    // Process each file
    for (let i = 0; i < fileUrls.length; i++) {
      const fileUrl = fileUrls[i]
      
      try {
        const processedFile = await processFile(fileUrl, options, i)
        result.files.push(processedFile)
        result.successCount++
        
        // Notify completion
        if (options.onFileComplete) {
          options.onFileComplete(i, processedFile)
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        result.errors.push(`File ${i + 1}: ${errorMessage}`)
      }
    }

    result.success = result.successCount > 0
    return result

  } catch (error) {
    result.errors.push(error instanceof Error ? error.message : 'Processing failed')
    return result
  }
}

/**
 * Process a single file from Replicate URL
 */
async function processFile(
  fileUrl: string,
  options: FileProcessingOptions,
  fileIndex: number
): Promise<ProcessedFile> {
  // Detect file type from URL or content
  const fileInfo = await analyzeFileUrl(fileUrl)
  
  // Create metadata
  const metadata: Omit<StorageMetadata, 'fileSize' | 'generatedAt'> = {
    originalUrl: fileUrl,
    filename: fileInfo.filename,
    mimeType: fileInfo.mimeType,
    width: fileInfo.width,
    height: fileInfo.height,
    duration: fileInfo.duration,
    modelUsed: options.modelUsed,
    prompt: options.prompt
  }

  // Upload to storage with progress tracking
  const storageService = getStorageService()
  const storageResult = await storageService.storeFromUrl(
    fileUrl,
    metadata,
    (progress) => {
      if (options.onProgress) {
        options.onProgress(fileIndex, progress)
      }
    }
  )

  if (!storageResult.success || !storageResult.data) {
    throw new Error(storageResult.error || 'Storage failed')
  }

  return {
    originalUrl: fileUrl,
    storedUrl: storageResult.data.publicUrl,
    metadata: storageResult.data.metadata,
    storageResult
  }
}

/**
 * Analyze file URL to determine type and properties
 */
async function analyzeFileUrl(url: string): Promise<{
  filename: string
  mimeType: string
  width?: number
  height?: number
  duration?: number
}> {
  try {
    // Extract filename from URL
    const urlPath = new URL(url).pathname
    const filename = urlPath.split('/').pop() || 'unknown'
    
    // Determine MIME type from URL extension or content
    const extension = filename.split('.').pop()?.toLowerCase()
    let mimeType = 'application/octet-stream'
    
    const extensionMap: Record<string, string> = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'webp': 'image/webp',
      'mp4': 'video/mp4',
      'webm': 'video/webm',
      'mov': 'video/quicktime'
    }
    
    if (extension && extensionMap[extension]) {
      mimeType = extensionMap[extension]
    } else {
      // Try to detect from content-type header
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

    // For images, try to get dimensions from Replicate URL patterns
    let width: number | undefined
    let height: number | undefined
    let duration: number | undefined

    if (mimeType.startsWith('image/')) {
      // Replicate often includes dimensions in metadata or can be extracted
      // For now, we'll set defaults and let the storage service handle it
      width = 1024
      height = 1024
    }

    if (mimeType.startsWith('video/')) {
      // Default video duration - will be updated if available in metadata
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
      filename: 'generated-file',
      mimeType: 'application/octet-stream'
    }
  }
}

/**
 * Generate database record for stored file
 */
export function createDatabaseRecord(
  processedFile: ProcessedFile,
  userId: string,
  additionalData?: Record<string, any>
): Record<string, any> {
  const isVideo = processedFile.metadata.mimeType.startsWith('video/')
  
  const baseRecord = {
    user_id: userId,
    original_prompt: processedFile.metadata.prompt,
    file_path: processedFile.storedUrl,
    model: processedFile.metadata.modelUsed,
    parameters: additionalData?.parameters || {},
    width: processedFile.metadata.width,
    height: processedFile.metadata.height,
    cost: additionalData?.cost,
    generation_time: additionalData?.generationTime,
    tags: [],
    is_favorite: false,
    folder_id: null,
    created_at: processedFile.metadata.generatedAt
  }

  // Add video-specific fields
  if (isVideo) {
    return {
      ...baseRecord,
      duration: processedFile.metadata.duration,
      fps: additionalData?.fps || 24,
      format: processedFile.metadata.mimeType.split('/')[1],
      file_size: processedFile.metadata.fileSize,
      generation_type: additionalData?.generationType || 'text-to-video'
    }
  }

  return baseRecord
}

/**
 * Batch process multiple Replicate responses
 */
export async function batchProcessResponses(
  responses: ReplicateResponse[],
  options: FileProcessingOptions
): Promise<BatchUploadResult[]> {
  const results: BatchUploadResult[] = []
  
  for (let i = 0; i < responses.length; i++) {
    const response = responses[i]
    const result = await processReplicateResponse(response, {
      ...options,
      onProgress: (fileIndex, progress) => {
        if (options.onProgress) {
          // Adjust file index to account for multiple responses
          const globalFileIndex = i * 10 + fileIndex // Assume max 10 files per response
          options.onProgress(globalFileIndex, progress)
        }
      }
    })
    results.push(result)
  }
  
  return results
}

/**
 * Validate file before processing
 */
export function validateFileUrl(url: string): { valid: boolean; error?: string } {
  try {
    const parsedUrl = new URL(url)
    
    // Check if it's a valid HTTP/HTTPS URL
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return { valid: false, error: 'Invalid protocol. Only HTTP/HTTPS URLs are supported.' }
    }
    
    // Check if it's from a trusted domain (Replicate)
    const trustedDomains = [
      'replicate.delivery',
      'pbxt.replicate.delivery',
      'tjzk.replicate.delivery'
    ]
    
    const isFromTrustedDomain = trustedDomains.some(domain => 
      parsedUrl.hostname === domain || parsedUrl.hostname.endsWith(`.${domain}`)
    )
    
    if (!isFromTrustedDomain) {
      return { valid: false, error: 'URL is not from a trusted domain.' }
    }
    
    return { valid: true }
  } catch {
    return { valid: false, error: 'Invalid URL format.' }
  }
}

/**
 * Clean up temporary files and failed uploads
 */
export async function cleanupFailedUploads(results: BatchUploadResult[]): Promise<void> {
  const storageService = getStorageService()
  
  for (const result of results) {
    for (const file of result.files) {
      if (!file.storageResult.success && file.storageResult.data?.path) {
        try {
          await storageService.deleteFile(file.storageResult.data.path)
        } catch (error) {
          console.warn('Failed to cleanup file:', file.storageResult.data.path, error)
        }
      }
    }
  }
}

export default {
  processReplicateResponse,
  batchProcessResponses,
  createDatabaseRecord,
  validateFileUrl,
  cleanupFailedUploads
}
