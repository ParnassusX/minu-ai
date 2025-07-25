/**
 * Cloudinary Storage Service
 * Handles persistent storage of images and videos using Cloudinary
 */

import { v2 as cloudinary } from 'cloudinary'

export interface CloudinaryConfig {
  cloudName: string
  apiKey: string
  apiSecret: string
}

export interface CloudinaryMetadata {
  originalUrl: string
  filename: string
  mimeType: string
  width?: number
  height?: number
  duration?: number // for videos
  generatedAt: string
  modelUsed: string
  prompt: string
}

export interface CloudinaryResult {
  success: boolean
  data?: {
    publicId: string
    publicUrl: string
    secureUrl: string
    metadata: CloudinaryMetadata
  }
  error?: string
}

export class CloudinaryStorageService {
  private config: CloudinaryConfig

  constructor(config?: Partial<CloudinaryConfig>) {
    this.config = {
      cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
      apiKey: process.env.CLOUDINARY_API_KEY || '',
      apiSecret: process.env.CLOUDINARY_API_SECRET || '',
      ...config
    }

    // Configure Cloudinary
    cloudinary.config({
      cloud_name: this.config.cloudName,
      api_key: this.config.apiKey,
      api_secret: this.config.apiSecret,
      secure: true
    })
  }

  /**
   * Store image from URL to Cloudinary
   */
  async storeFromUrl(url: string, metadata: CloudinaryMetadata): Promise<CloudinaryResult> {
    try {
      // Generate public ID based on metadata
      const publicId = this.generatePublicId(metadata)
      
      // Upload to Cloudinary with high-quality JPEG format for luxury photos
      const result = await cloudinary.uploader.upload(url, {
        public_id: publicId,
        folder: this.getFolder(metadata.mimeType),
        resource_type: metadata.mimeType.startsWith('video/') ? 'video' : 'image',
        quality: 'auto:best', // Maximum quality for luxury photos
        format: 'jpg', // Force JPEG format for high quality and compatibility
        context: {
          model: metadata.modelUsed,
          prompt: metadata.prompt,
          generated_at: metadata.generatedAt
        },
        tags: ['minu-ai', 'generated', metadata.modelUsed]
      })

      return {
        success: true,
        data: {
          publicId: result.public_id,
          publicUrl: result.url,
          secureUrl: result.secure_url,
          metadata: {
            ...metadata,
            width: result.width,
            height: result.height,
            duration: result.duration
          }
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
   * Store file buffer to Cloudinary
   */
  async storeBuffer(buffer: Buffer, metadata: CloudinaryMetadata): Promise<CloudinaryResult> {
    try {
      const publicId = this.generatePublicId(metadata)
      
      return new Promise((resolve) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            public_id: publicId,
            folder: this.getFolder(metadata.mimeType),
            resource_type: metadata.mimeType.startsWith('video/') ? 'video' : 'image',
            quality: 'auto:best', // Maximum quality for luxury photos
            format: 'jpg', // Force JPEG format for high quality and compatibility
            context: {
              model: metadata.modelUsed,
              prompt: metadata.prompt,
              generated_at: metadata.generatedAt
            },
            tags: ['minu-ai', 'generated', metadata.modelUsed]
          },
          (error, result) => {
            if (error || !result) {
              resolve({
                success: false,
                error: error?.message || 'Upload failed'
              })
            } else {
              resolve({
                success: true,
                data: {
                  publicId: result.public_id,
                  publicUrl: result.url,
                  secureUrl: result.secure_url,
                  metadata: {
                    ...metadata,
                    width: result.width,
                    height: result.height,
                    duration: result.duration
                  }
                }
              })
            }
          }
        )
        
        uploadStream.end(buffer)
      })
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      }
    }
  }

  /**
   * Delete file from Cloudinary
   */
  async deleteFile(publicId: string, resourceType: 'image' | 'video' = 'image'): Promise<boolean> {
    try {
      const result = await cloudinary.uploader.destroy(publicId, {
        resource_type: resourceType
      })
      return result.result === 'ok'
    } catch (error) {
      console.error('Cloudinary delete error:', error)
      return false
    }
  }

  /**
   * Get optimized URL with transformations
   */
  getOptimizedUrl(publicId: string, options: {
    width?: number
    height?: number
    quality?: string
    format?: string
  } = {}): string {
    return cloudinary.url(publicId, {
      quality: options.quality || 'auto:good',
      format: options.format || 'auto',
      width: options.width,
      height: options.height,
      crop: 'limit',
      secure: true
    })
  }

  /**
   * Generate public ID for the file
   */
  private generatePublicId(metadata: CloudinaryMetadata): string {
    const timestamp = new Date(metadata.generatedAt).getTime()
    const randomId = Math.random().toString(36).substring(2, 8)
    const sanitizedPrompt = metadata.prompt
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 30)
    
    return `${timestamp}-${sanitizedPrompt}-${randomId}`
  }

  /**
   * Get folder based on MIME type
   */
  private getFolder(mimeType: string): string {
    const date = new Date()
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    
    if (mimeType.startsWith('video/')) {
      return `minu-ai/videos/${year}/${month}/${day}`
    } else {
      return `minu-ai/images/${year}/${month}/${day}`
    }
  }
}

/**
 * Get configured Cloudinary storage service
 */
export function getCloudinaryStorageService(config?: Partial<CloudinaryConfig>): CloudinaryStorageService {
  return new CloudinaryStorageService(config)
}

export default CloudinaryStorageService
