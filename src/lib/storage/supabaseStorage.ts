/**
 * Supabase Storage Service
 * Handles persistent storage of images and videos from Replicate API responses
 */

import { createServiceClient } from '@/lib/supabase/server'

export interface StorageConfig {
  bucketName: string
  maxFileSize: number // bytes
  allowedMimeTypes: string[]
  publicAccess: boolean
}

export interface StorageMetadata {
  originalUrl: string
  filename: string
  mimeType: string
  fileSize: number
  width?: number
  height?: number
  duration?: number // for videos
  generatedAt: string
  modelUsed: string
  prompt: string
}

export interface StorageResult {
  success: boolean
  data?: {
    path: string
    publicUrl: string
    metadata: StorageMetadata
  }
  error?: string
}

export interface UploadProgress {
  loaded: number
  total: number
  percentage: number
}

export class SupabaseStorageService {
  private supabase
  private config: StorageConfig

  constructor(config?: Partial<StorageConfig>) {
    // Use service client for storage operations to bypass RLS
    this.supabase = createServiceClient()
    
    this.config = {
      bucketName: 'generated-content',
      maxFileSize: 50 * 1024 * 1024, // 50MB
      allowedMimeTypes: [
        'image/jpeg',
        'image/png', 
        'image/webp',
        'video/mp4',
        'video/webm',
        'video/quicktime'
      ],
      publicAccess: true,
      ...config
    }
  }

  /**
   * Store a file from a URL (typically from Replicate) to Supabase storage
   */
  async storeFromUrl(
    fileUrl: string, 
    metadata: Omit<StorageMetadata, 'fileSize' | 'generatedAt'>,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<StorageResult> {
    try {
      // Download file from URL
      const downloadResult = await this.downloadFile(fileUrl, onProgress)
      if (!downloadResult.success || !downloadResult.data) {
        return { success: false, error: downloadResult.error }
      }

      // Upload to Supabase storage
      return await this.uploadFile(
        downloadResult.data.buffer,
        {
          ...metadata,
          fileSize: downloadResult.data.size,
          generatedAt: new Date().toISOString()
        }
      )
    } catch (error) {
      console.error('Storage error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown storage error'
      }
    }
  }

  /**
   * Download file from URL with progress tracking
   */
  private async downloadFile(
    url: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<{ success: boolean; data?: { buffer: ArrayBuffer; size: number }; error?: string }> {
    try {
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`Failed to download file: ${response.statusText}`)
      }

      const contentLength = response.headers.get('content-length')
      const total = contentLength ? parseInt(contentLength, 10) : 0

      if (!response.body) {
        throw new Error('No response body')
      }

      const reader = response.body.getReader()
      const chunks: Uint8Array[] = []
      let loaded = 0

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        chunks.push(value)
        loaded += value.length

        if (onProgress && total > 0) {
          onProgress({
            loaded,
            total,
            percentage: Math.round((loaded / total) * 100)
          })
        }
      }

      // Combine chunks into single ArrayBuffer
      const buffer = new ArrayBuffer(loaded)
      const uint8Array = new Uint8Array(buffer)
      let offset = 0
      
      for (const chunk of chunks) {
        uint8Array.set(chunk, offset)
        offset += chunk.length
      }

      return {
        success: true,
        data: { buffer, size: loaded }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Download failed'
      }
    }
  }

  /**
   * Upload file buffer to Supabase storage
   */
  private async uploadFile(
    buffer: ArrayBuffer,
    metadata: StorageMetadata
  ): Promise<StorageResult> {
    try {
      // Validate file size
      if (buffer.byteLength > this.config.maxFileSize) {
        return {
          success: false,
          error: `File size ${buffer.byteLength} exceeds maximum ${this.config.maxFileSize} bytes`
        }
      }

      // Validate MIME type
      if (!this.config.allowedMimeTypes.includes(metadata.mimeType)) {
        return {
          success: false,
          error: `MIME type ${metadata.mimeType} not allowed`
        }
      }

      // Generate storage path
      const storagePath = this.generateStoragePath(metadata)

      // Upload to Supabase
      const { data, error } = await this.supabase.storage
        .from(this.config.bucketName)
        .upload(storagePath, buffer, {
          contentType: metadata.mimeType,
          upsert: false
        })

      if (error) {
        throw new Error(`Supabase upload error: ${error.message}`)
      }

      // Get public URL
      const { data: urlData } = this.supabase.storage
        .from(this.config.bucketName)
        .getPublicUrl(storagePath)

      return {
        success: true,
        data: {
          path: storagePath,
          publicUrl: urlData.publicUrl,
          metadata
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      }
    }
  }

  /**
   * Generate organized storage path
   */
  private generateStoragePath(metadata: StorageMetadata): string {
    const date = new Date()
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    
    const isVideo = metadata.mimeType.startsWith('video/')
    const contentType = isVideo ? 'videos' : 'images'
    
    // Extract file extension from original filename or MIME type
    const extension = this.getFileExtension(metadata.filename, metadata.mimeType)
    
    // Generate unique filename
    const timestamp = Date.now()
    const randomId = Math.random().toString(36).substring(2, 8)
    const filename = `${timestamp}-${randomId}${extension}`
    
    return `${contentType}/${year}/${month}/${day}/${filename}`
  }

  /**
   * Get file extension from filename or MIME type
   */
  private getFileExtension(filename: string, mimeType: string): string {
    // Try to get extension from filename first
    const filenameExt = filename.split('.').pop()
    if (filenameExt && filenameExt.length <= 4) {
      return `.${filenameExt.toLowerCase()}`
    }

    // Fallback to MIME type mapping - prioritize high-quality formats
    const mimeExtensions: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/webp': '.jpg', // Convert WebP to JPEG for luxury quality
      'video/mp4': '.mp4',
      'video/webm': '.webm',
      'video/quicktime': '.mov'
    }

    return mimeExtensions[mimeType] || '.jpg' // Default to JPEG for images
  }

  /**
   * Store a buffer directly to Supabase storage
   */
  async storeBuffer(
    buffer: Buffer,
    metadata: StorageMetadata
  ): Promise<StorageResult> {
    return await this.uploadFile(buffer, metadata)
  }

  /**
   * Ensure storage bucket exists and is properly configured
   */
  async ensureBucketExists(): Promise<{ success: boolean; error?: string }> {
    try {
      // Check if bucket exists
      const { data: buckets, error: listError } = await this.supabase.storage.listBuckets()
      
      if (listError) {
        throw new Error(`Failed to list buckets: ${listError.message}`)
      }

      const bucketExists = buckets?.some(bucket => bucket.name === this.config.bucketName)

      if (!bucketExists) {
        // Create bucket
        const { error: createError } = await this.supabase.storage.createBucket(
          this.config.bucketName,
          {
            public: this.config.publicAccess,
            fileSizeLimit: this.config.maxFileSize,
            allowedMimeTypes: this.config.allowedMimeTypes
          }
        )

        if (createError) {
          throw new Error(`Failed to create bucket: ${createError.message}`)
        }
      }

      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Bucket setup failed'
      }
    }
  }

  /**
   * Delete file from storage
   */
  async deleteFile(path: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase.storage
        .from(this.config.bucketName)
        .remove([path])

      if (error) {
        throw new Error(`Failed to delete file: ${error.message}`)
      }

      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Delete failed'
      }
    }
  }
}

// Singleton instance
let storageService: SupabaseStorageService | null = null

export function getStorageService(config?: Partial<StorageConfig>): SupabaseStorageService {
  if (!storageService || config) {
    storageService = new SupabaseStorageService(config)
  }
  return storageService
}

export default SupabaseStorageService
