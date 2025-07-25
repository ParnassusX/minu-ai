/**
 * Unified Storage Service
 * Combines Cloudinary (persistent) and Supabase (fallback) storage
 */

import { CloudinaryStorageService, CloudinaryMetadata } from './cloudinaryStorage'
import { SupabaseStorageService, StorageMetadata } from './supabaseStorage'

export interface UnifiedStorageMetadata {
  originalUrl: string
  filename: string
  mimeType: string
  width?: number
  height?: number
  duration?: number
  generatedAt: string
  modelUsed: string
  prompt: string
  userId?: string
}

export interface UnifiedStorageResult {
  success: boolean
  data?: {
    url: string
    secureUrl?: string
    provider: 'cloudinary' | 'supabase'
    persistent: boolean
    publicId?: string
    path?: string
    metadata: UnifiedStorageMetadata
  }
  error?: string
}

export class UnifiedStorageService {
  private cloudinary: CloudinaryStorageService
  private supabase: SupabaseStorageService

  constructor() {
    this.cloudinary = new CloudinaryStorageService()
    this.supabase = new SupabaseStorageService()
  }

  /**
   * Store file with Cloudinary as primary, Supabase as fallback
   */
  async storeFromUrl(url: string, metadata: UnifiedStorageMetadata): Promise<UnifiedStorageResult> {
    // Try Cloudinary first for persistent storage
    try {
      const cloudinaryMetadata: CloudinaryMetadata = {
        originalUrl: metadata.originalUrl,
        filename: metadata.filename,
        mimeType: metadata.mimeType,
        width: metadata.width,
        height: metadata.height,
        duration: metadata.duration,
        generatedAt: metadata.generatedAt,
        modelUsed: metadata.modelUsed,
        prompt: metadata.prompt
      }

      const cloudinaryResult = await this.cloudinary.storeFromUrl(url, cloudinaryMetadata)
      
      if (cloudinaryResult.success && cloudinaryResult.data) {
        return {
          success: true,
          data: {
            url: cloudinaryResult.data.publicUrl,
            secureUrl: cloudinaryResult.data.secureUrl,
            provider: 'cloudinary',
            persistent: true,
            publicId: cloudinaryResult.data.publicId,
            metadata: {
              ...metadata,
              width: cloudinaryResult.data.metadata.width,
              height: cloudinaryResult.data.metadata.height,
              duration: cloudinaryResult.data.metadata.duration
            }
          }
        }
      }
    } catch (error) {
      console.warn('Cloudinary storage failed, falling back to Supabase:', error)
    }

    // Fallback to Supabase
    try {
      const supabaseMetadata: StorageMetadata = {
        originalUrl: metadata.originalUrl,
        filename: metadata.filename,
        mimeType: metadata.mimeType,
        fileSize: 0, // Will be calculated during upload
        width: metadata.width,
        height: metadata.height,
        duration: metadata.duration,
        generatedAt: metadata.generatedAt,
        modelUsed: metadata.modelUsed,
        prompt: metadata.prompt
      }

      const supabaseResult = await this.supabase.storeFromUrl(url, supabaseMetadata)
      
      if (supabaseResult.success && supabaseResult.data) {
        return {
          success: true,
          data: {
            url: supabaseResult.data.publicUrl,
            provider: 'supabase',
            persistent: true,
            path: supabaseResult.data.path,
            metadata: {
              ...metadata,
              width: supabaseResult.data.metadata.width,
              height: supabaseResult.data.metadata.height,
              duration: supabaseResult.data.metadata.duration
            }
          }
        }
      }
    } catch (error) {
      console.error('Both Cloudinary and Supabase storage failed:', error)
    }

    // If both fail, return the original URL as non-persistent
    return {
      success: true,
      data: {
        url: url,
        provider: 'cloudinary', // Keep as cloudinary for consistency
        persistent: false,
        metadata
      }
    }
  }

  /**
   * Store buffer with Cloudinary as primary, Supabase as fallback
   */
  async storeBuffer(buffer: Buffer, metadata: UnifiedStorageMetadata): Promise<UnifiedStorageResult> {
    // Try Cloudinary first
    try {
      const cloudinaryMetadata: CloudinaryMetadata = {
        originalUrl: metadata.originalUrl,
        filename: metadata.filename,
        mimeType: metadata.mimeType,
        width: metadata.width,
        height: metadata.height,
        duration: metadata.duration,
        generatedAt: metadata.generatedAt,
        modelUsed: metadata.modelUsed,
        prompt: metadata.prompt
      }

      const cloudinaryResult = await this.cloudinary.storeBuffer(buffer, cloudinaryMetadata)
      
      if (cloudinaryResult.success && cloudinaryResult.data) {
        return {
          success: true,
          data: {
            url: cloudinaryResult.data.publicUrl,
            secureUrl: cloudinaryResult.data.secureUrl,
            provider: 'cloudinary',
            persistent: true,
            publicId: cloudinaryResult.data.publicId,
            metadata: {
              ...metadata,
              width: cloudinaryResult.data.metadata.width,
              height: cloudinaryResult.data.metadata.height,
              duration: cloudinaryResult.data.metadata.duration
            }
          }
        }
      }
    } catch (error) {
      console.warn('Cloudinary buffer storage failed, falling back to Supabase:', error)
    }

    // Fallback to Supabase
    try {
      const supabaseMetadata: StorageMetadata = {
        originalUrl: metadata.originalUrl,
        filename: metadata.filename,
        mimeType: metadata.mimeType,
        fileSize: buffer.length,
        width: metadata.width,
        height: metadata.height,
        duration: metadata.duration,
        generatedAt: metadata.generatedAt,
        modelUsed: metadata.modelUsed,
        prompt: metadata.prompt
      }

      const supabaseResult = await this.supabase.storeBuffer(buffer, supabaseMetadata)
      
      if (supabaseResult.success && supabaseResult.data) {
        return {
          success: true,
          data: {
            url: supabaseResult.data.publicUrl,
            provider: 'supabase',
            persistent: true,
            path: supabaseResult.data.path,
            metadata: {
              ...metadata,
              width: supabaseResult.data.metadata.width,
              height: supabaseResult.data.metadata.height,
              duration: supabaseResult.data.metadata.duration
            }
          }
        }
      }
    } catch (error) {
      console.error('Both storage providers failed for buffer:', error)
    }

    return {
      success: false,
      error: 'All storage providers failed'
    }
  }

  /**
   * Get optimized URL for Cloudinary images
   */
  getOptimizedUrl(publicId: string, options: {
    width?: number
    height?: number
    quality?: string
    format?: string
  } = {}): string {
    return this.cloudinary.getOptimizedUrl(publicId, options)
  }

  /**
   * Delete file from storage
   */
  async deleteFile(identifier: string, provider: 'cloudinary' | 'supabase', resourceType: 'image' | 'video' = 'image'): Promise<boolean> {
    try {
      if (provider === 'cloudinary') {
        return await this.cloudinary.deleteFile(identifier, resourceType)
      } else {
        const result = await this.supabase.deleteFile(identifier)
        return result.success
      }
    } catch (error) {
      console.error(`Failed to delete file from ${provider}:`, error)
      return false
    }
  }
}

/**
 * Get configured unified storage service
 */
export function getUnifiedStorageService(): UnifiedStorageService {
  return new UnifiedStorageService()
}

export default UnifiedStorageService
