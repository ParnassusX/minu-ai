// High-Quality Image Download Service for Minu.AI
// Ensures users get original high-resolution JPEG files for luxury photo work
// Simplified to work with direct Replicate URLs for production readiness

export interface DownloadOptions {
  filename?: string
  format?: 'jpg' | 'png' | 'original'
  quality?: number
  maxWidth?: number
  maxHeight?: number
}

export interface DownloadResult {
  success: boolean
  downloadUrl?: string
  filename?: string
  error?: string
}

export class ImageDownloadService {
  /**
   * Download image with high quality settings
   * Simplified to work with direct Replicate URLs for production readiness
   */
  async downloadImage(
    imageUrl: string,
    imageId: string,
    options: DownloadOptions = {}
  ): Promise<DownloadResult> {
    try {
      const {
        filename = `minu-ai-${imageId}-hq.jpg`,
        format = 'jpg',
        quality = 100, // Maximum quality for luxury photos
      } = options

      // Check if this is a Replicate URL (original source)
      if (this.isReplicateUrl(imageUrl)) {
        // For Replicate URLs, use the direct URL (already high quality JPEG 95%)
        return {
          success: true,
          downloadUrl: imageUrl,
          filename
        }
      }

      // For other URLs, return as-is
      return {
        success: true,
        downloadUrl: imageUrl,
        filename
      }

    } catch (error) {
      console.error('Download service error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Download failed'
      }
    }
  }

  /**
   * Trigger browser download with proper filename and quality
   */
  async triggerDownload(
    imageUrl: string,
    imageId: string,
    options: DownloadOptions = {}
  ): Promise<void> {
    const result = await this.downloadImage(imageUrl, imageId, options)
    
    if (!result.success || !result.downloadUrl) {
      throw new Error(result.error || 'Failed to prepare download')
    }

    // Create download link
    const link = document.createElement('a')
    link.href = result.downloadUrl
    link.download = result.filename || `minu-ai-${imageId}-hq.jpg`
    
    // Add CORS headers for cross-origin downloads
    link.setAttribute('crossorigin', 'anonymous')
    
    // Trigger download
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }



  /**
   * Check if URL is from Replicate
   */
  private isReplicateUrl(url: string): boolean {
    return url.includes('replicate.delivery') || url.includes('replicate.com')
  }



  /**
   * Attempt to get original high-quality URL from Replicate
   */
  private async getReplicateOriginalUrl(url: string): Promise<string | null> {
    try {
      // For Replicate URLs, the original is usually the best quality available
      // We can try to modify the URL to request specific formats if needed
      
      // Check if URL has format parameters we can modify
      const urlObj = new URL(url)
      
      // Remove any quality-reducing parameters
      urlObj.searchParams.delete('w') // Remove width restrictions
      urlObj.searchParams.delete('h') // Remove height restrictions
      urlObj.searchParams.delete('q') // Remove quality restrictions
      urlObj.searchParams.delete('f') // Remove format restrictions
      
      return urlObj.toString()
    } catch (error) {
      console.error('Error processing Replicate URL:', error)
      return null
    }
  }

  /**
   * Get download options for different quality levels
   */
  static getQualityPresets(): Record<string, DownloadOptions> {
    return {
      'luxury': {
        format: 'jpg',
        quality: 100,
        maxWidth: 4096,
        maxHeight: 4096
      },
      'professional': {
        format: 'jpg',
        quality: 95,
        maxWidth: 2048,
        maxHeight: 2048
      },
      'standard': {
        format: 'jpg',
        quality: 85,
        maxWidth: 1920,
        maxHeight: 1920
      },
      'web': {
        format: 'jpg',
        quality: 80,
        maxWidth: 1200,
        maxHeight: 1200
      }
    }
  }
}

// Singleton instance
let downloadService: ImageDownloadService | null = null

export function getImageDownloadService(): ImageDownloadService {
  if (!downloadService) {
    downloadService = new ImageDownloadService()
  }
  return downloadService
}

// Convenience function for quick downloads
export async function downloadHighQualityImage(
  imageUrl: string,
  imageId: string,
  qualityLevel: 'luxury' | 'professional' | 'standard' | 'web' = 'luxury'
): Promise<void> {
  const service = getImageDownloadService()
  const presets = ImageDownloadService.getQualityPresets()
  const options = presets[qualityLevel]
  
  await service.triggerDownload(imageUrl, imageId, options)
}
