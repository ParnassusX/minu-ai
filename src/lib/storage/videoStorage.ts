/**
 * Video Storage Service
 * Specialized handling for video files with thumbnail generation
 */

import { SupabaseStorageService, StorageMetadata, StorageResult } from './supabaseStorage'
import { getStorageConfig } from './config'
import { StorageErrorHandler, StorageErrorCode } from './errorHandling'

export interface VideoMetadata extends StorageMetadata {
  duration: number
  fps?: number
  format: string
  bitrate?: string
  thumbnailUrl?: string
}

export interface VideoProcessingOptions {
  generateThumbnail?: boolean
  thumbnailTimestamp?: number // seconds into video
  compressionLevel?: 'low' | 'medium' | 'high'
  maxBitrate?: string
}

export interface VideoStorageResult extends StorageResult {
  data?: {
    path: string
    publicUrl: string
    metadata: VideoMetadata
    thumbnailPath?: string
    thumbnailUrl?: string
  }
}

export class VideoStorageService extends SupabaseStorageService {
  constructor() {
    const config = getStorageConfig()
    super({
      ...config,
      allowedMimeTypes: [
        'video/mp4',
        'video/webm',
        'video/quicktime',
        'video/avi',
        'video/mov'
      ]
    })
  }

  /**
   * Store video with optional thumbnail generation
   */
  async storeVideo(
    videoUrl: string,
    metadata: Omit<VideoMetadata, 'fileSize' | 'generatedAt'>,
    options: VideoProcessingOptions = {}
  ): Promise<VideoStorageResult> {
    try {
      // Store the main video file
      const videoResult = await this.storeFromUrl(videoUrl, metadata)
      
      if (!videoResult.success || !videoResult.data) {
        return videoResult as VideoStorageResult
      }

      let thumbnailPath: string | undefined
      let thumbnailUrl: string | undefined

      // Generate thumbnail if requested
      if (options.generateThumbnail) {
        try {
          const thumbnailResult = await this.generateThumbnail(
            videoUrl,
            metadata,
            options.thumbnailTimestamp || 1.0
          )
          
          if (thumbnailResult.success && thumbnailResult.data) {
            thumbnailPath = thumbnailResult.data.path
            thumbnailUrl = thumbnailResult.data.publicUrl
          }
        } catch (thumbnailError) {
          console.warn('Thumbnail generation failed:', thumbnailError)
          // Don't fail the entire operation if thumbnail generation fails
        }
      }

      return {
        success: true,
        data: {
          path: videoResult.data.path,
          publicUrl: videoResult.data.publicUrl,
          metadata: videoResult.data.metadata as VideoMetadata,
          thumbnailPath,
          thumbnailUrl
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Video storage failed'
      }
    }
  }

  /**
   * Generate thumbnail from video
   */
  private async generateThumbnail(
    videoUrl: string,
    metadata: Omit<VideoMetadata, 'fileSize' | 'generatedAt'>,
    timestamp: number = 1.0
  ): Promise<StorageResult> {
    try {
      // For now, we'll create a placeholder thumbnail
      // In a production environment, you would use a service like FFmpeg
      // to extract a frame from the video at the specified timestamp
      
      const thumbnailMetadata = {
        ...metadata,
        filename: metadata.filename.replace(/\.[^.]+$/, '_thumbnail.jpg'),
        mimeType: 'image/jpeg',
        width: 640,
        height: 360
      }

      // Create a simple placeholder thumbnail
      const placeholderThumbnail = await this.createPlaceholderThumbnail(
        metadata.width || 1024,
        metadata.height || 576
      )

      // Convert ArrayBuffer to blob URL for storage
      const blob = new Blob([placeholderThumbnail], { type: 'image/jpeg' })
      const blobUrl = URL.createObjectURL(blob)

      return await this.storeFromUrl(blobUrl, thumbnailMetadata)
    } catch (error) {
      throw new Error(`Thumbnail generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Create a placeholder thumbnail (simple colored rectangle)
   */
  private async createPlaceholderThumbnail(width: number, height: number): Promise<ArrayBuffer> {
    // Create a simple JPEG placeholder
    // In a real implementation, you would use a proper image generation library
    // or extract a frame from the video using FFmpeg
    
    const canvas = this.createCanvas(width, height)
    const ctx = canvas.getContext('2d')
    
    if (ctx) {
      // Create gradient background
      const gradient = ctx.createLinearGradient(0, 0, width, height)
      gradient.addColorStop(0, '#1e40af')
      gradient.addColorStop(1, '#3b82f6')
      
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, width, height)
      
      // Add play icon
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
      ctx.beginPath()
      const centerX = width / 2
      const centerY = height / 2
      const size = Math.min(width, height) * 0.2
      
      ctx.moveTo(centerX - size/2, centerY - size/2)
      ctx.lineTo(centerX + size/2, centerY)
      ctx.lineTo(centerX - size/2, centerY + size/2)
      ctx.closePath()
      ctx.fill()
    }
    
    return canvas.toBuffer('image/jpeg', { quality: 0.8 })
  }

  /**
   * Create canvas (Node.js environment)
   */
  private createCanvas(width: number, height: number): any {
    // In a real implementation, you would use a library like 'canvas' for Node.js
    // For now, return a mock object
    return {
      getContext: () => ({
        createLinearGradient: () => ({
          addColorStop: () => {}
        }),
        fillRect: () => {},
        beginPath: () => {},
        moveTo: () => {},
        lineTo: () => {},
        closePath: () => {},
        fill: () => {},
        fillStyle: ''
      }),
      toBuffer: () => new ArrayBuffer(1000) // Mock buffer
    }
  }

  /**
   * Validate video file
   */
  validateVideo(
    buffer: ArrayBuffer,
    metadata: VideoMetadata
  ): { valid: boolean; error?: string } {
    // Check file size (videos can be larger)
    const maxVideoSize = 100 * 1024 * 1024 // 100MB
    if (buffer.byteLength > maxVideoSize) {
      return {
        valid: false,
        error: `Video file size ${buffer.byteLength} bytes exceeds maximum ${maxVideoSize} bytes`
      }
    }

    // Check duration
    if (metadata.duration > 60) { // 60 seconds max
      return {
        valid: false,
        error: `Video duration ${metadata.duration} seconds exceeds maximum 60 seconds`
      }
    }

    // Check format
    const allowedFormats = ['mp4', 'webm', 'mov']
    if (!allowedFormats.includes(metadata.format.toLowerCase())) {
      return {
        valid: false,
        error: `Video format ${metadata.format} is not supported`
      }
    }

    return { valid: true }
  }

  /**
   * Get video metadata from URL
   */
  async analyzeVideo(url: string): Promise<Partial<VideoMetadata>> {
    try {
      // In a real implementation, you would use FFprobe or similar
      // to extract actual video metadata
      
      const urlPath = new URL(url).pathname
      const filename = urlPath.split('/').pop() || 'video'
      const extension = filename.split('.').pop()?.toLowerCase() || 'mp4'
      
      return {
        filename,
        format: extension,
        mimeType: `video/${extension === 'mov' ? 'quicktime' : extension}`,
        duration: 5.0, // Default duration
        fps: 24, // Default FPS
        width: 1024,
        height: 576
      }
    } catch (error) {
      return {
        filename: 'video.mp4',
        format: 'mp4',
        mimeType: 'video/mp4',
        duration: 5.0,
        fps: 24,
        width: 1024,
        height: 576
      }
    }
  }

  /**
   * Create database record for video
   */
  createVideoRecord(
    videoResult: VideoStorageResult,
    userId: string,
    additionalData?: Record<string, any>
  ): Record<string, any> {
    if (!videoResult.success || !videoResult.data) {
      throw new Error('Invalid video result')
    }

    return {
      user_id: userId,
      url: videoResult.data.publicUrl,
      thumbnail_url: videoResult.data.thumbnailUrl,
      title: additionalData?.title || 'Generated Video',
      prompt: videoResult.data.metadata.prompt,
      model_used: videoResult.data.metadata.modelUsed,
      generation_type: additionalData?.generationType || 'text-to-video',
      duration: videoResult.data.metadata.duration,
      fps: videoResult.data.metadata.fps || 24,
      width: videoResult.data.metadata.width,
      height: videoResult.data.metadata.height,
      file_size: videoResult.data.metadata.fileSize,
      format: videoResult.data.metadata.format,
      parameters: additionalData?.parameters || {},
      cost: additionalData?.cost,
      generation_time: additionalData?.generationTime,
      tags: [],
      is_favorite: false,
      folder_id: null,
      created_at: videoResult.data.metadata.generatedAt
    }
  }
}

// Singleton instance
let videoStorageService: VideoStorageService | null = null

export function getVideoStorageService(): VideoStorageService {
  if (!videoStorageService) {
    videoStorageService = new VideoStorageService()
  }
  return videoStorageService
}

export default VideoStorageService
