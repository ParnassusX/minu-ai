/**
 * Storage Configuration Management
 * Environment-specific settings for Supabase storage buckets and policies
 */

import { StorageConfig } from './supabaseStorage'

export interface StorageEnvironmentConfig {
  development: StorageConfig
  production: StorageConfig
  test: StorageConfig
}

export interface BucketPolicy {
  name: string
  public: boolean
  fileSizeLimit: number
  allowedMimeTypes: string[]
  retentionDays?: number
}

// Environment-specific storage configurations
export const STORAGE_CONFIGS: StorageEnvironmentConfig = {
  development: {
    bucketName: 'dev-generated-content',
    maxFileSize: 100 * 1024 * 1024, // 100MB for development
    allowedMimeTypes: [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'video/mp4',
      'video/webm',
      'video/quicktime',
      'video/avi'
    ],
    publicAccess: true
  },
  production: {
    bucketName: 'generated-content',
    maxFileSize: 50 * 1024 * 1024, // 50MB for production
    allowedMimeTypes: [
      'image/jpeg',
      'image/png',
      'image/webp',
      'video/mp4',
      'video/webm',
      'video/quicktime'
    ],
    publicAccess: true
  },
  test: {
    bucketName: 'test-generated-content',
    maxFileSize: 10 * 1024 * 1024, // 10MB for testing
    allowedMimeTypes: [
      'image/jpeg',
      'image/png',
      'video/mp4'
    ],
    publicAccess: true
  }
}

// Bucket policies for different content types
export const BUCKET_POLICIES: Record<string, BucketPolicy> = {
  'generated-content': {
    name: 'generated-content',
    public: true,
    fileSizeLimit: 50 * 1024 * 1024,
    allowedMimeTypes: [
      'image/jpeg',
      'image/png',
      'image/webp',
      'video/mp4',
      'video/webm',
      'video/quicktime'
    ],
    retentionDays: 365 // Keep files for 1 year
  },
  'dev-generated-content': {
    name: 'dev-generated-content',
    public: true,
    fileSizeLimit: 100 * 1024 * 1024,
    allowedMimeTypes: [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'video/mp4',
      'video/webm',
      'video/quicktime',
      'video/avi'
    ],
    retentionDays: 30 // Keep dev files for 30 days
  },
  'test-generated-content': {
    name: 'test-generated-content',
    public: true,
    fileSizeLimit: 10 * 1024 * 1024,
    allowedMimeTypes: [
      'image/jpeg',
      'image/png',
      'video/mp4'
    ],
    retentionDays: 7 // Keep test files for 7 days
  }
}

// File organization patterns
export const STORAGE_PATTERNS = {
  images: {
    path: 'images/{year}/{month}/{day}',
    naming: '{timestamp}-{randomId}.{extension}',
    thumbnails: 'images/thumbnails/{year}/{month}/{day}'
  },
  videos: {
    path: 'videos/{year}/{month}/{day}',
    naming: '{timestamp}-{randomId}.{extension}',
    thumbnails: 'videos/thumbnails/{year}/{month}/{day}'
  },
  temp: {
    path: 'temp/{date}',
    naming: 'temp-{timestamp}-{randomId}.{extension}',
    retentionHours: 24
  }
}

// Content type detection
export const MIME_TYPE_CATEGORIES = {
  images: [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/bmp',
    'image/tiff'
  ],
  videos: [
    'video/mp4',
    'video/webm',
    'video/quicktime',
    'video/avi',
    'video/mov',
    'video/wmv'
  ]
}

// Quality settings for different content types
export const QUALITY_SETTINGS = {
  images: {
    thumbnail: { width: 300, height: 300, quality: 80 },
    preview: { width: 800, height: 600, quality: 85 },
    full: { quality: 95 }
  },
  videos: {
    thumbnail: { width: 300, height: 200, format: 'jpg' },
    preview: { width: 640, height: 480, bitrate: '1M' },
    full: { bitrate: '5M' }
  }
}

/**
 * Get storage configuration for current environment
 */
export function getStorageConfig(): StorageConfig {
  const env = (process.env.NODE_ENV as keyof StorageEnvironmentConfig) || 'development'
  return STORAGE_CONFIGS[env]
}

/**
 * Get bucket policy for a specific bucket
 */
export function getBucketPolicy(bucketName: string): BucketPolicy | null {
  return BUCKET_POLICIES[bucketName] || null
}

/**
 * Validate storage configuration
 */
export function validateStorageConfig(config: StorageConfig): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!config.bucketName || config.bucketName.trim().length === 0) {
    errors.push('Bucket name is required')
  }

  if (config.maxFileSize <= 0) {
    errors.push('Max file size must be greater than 0')
  }

  if (!config.allowedMimeTypes || config.allowedMimeTypes.length === 0) {
    errors.push('At least one allowed MIME type is required')
  }

  // Validate MIME types format
  for (const mimeType of config.allowedMimeTypes) {
    if (!mimeType.includes('/')) {
      errors.push(`Invalid MIME type format: ${mimeType}`)
    }
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * Get content category from MIME type
 */
export function getContentCategory(mimeType: string): 'images' | 'videos' | 'unknown' {
  if (MIME_TYPE_CATEGORIES.images.includes(mimeType)) {
    return 'images'
  }
  if (MIME_TYPE_CATEGORIES.videos.includes(mimeType)) {
    return 'videos'
  }
  return 'unknown'
}

/**
 * Generate storage path based on content type and date
 */
export function generateStoragePath(
  contentCategory: 'images' | 'videos' | 'temp',
  filename: string,
  date: Date = new Date()
): string {
  const pattern = STORAGE_PATTERNS[contentCategory]
  if (!pattern) {
    throw new Error(`Unknown content category: ${contentCategory}`)
  }

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const timestamp = Date.now()
  const randomId = Math.random().toString(36).substring(2, 8)
  
  // Extract extension from filename
  const extension = filename.split('.').pop() || 'bin'

  // Replace placeholders in path
  let path = pattern.path
    .replace('{year}', String(year))
    .replace('{month}', month)
    .replace('{day}', day)
    .replace('{date}', `${year}-${month}-${day}`)

  // Replace placeholders in naming
  const name = pattern.naming
    .replace('{timestamp}', String(timestamp))
    .replace('{randomId}', randomId)
    .replace('{extension}', extension)

  return `${path}/${name}`
}

/**
 * Check if file size is within limits
 */
export function validateFileSize(fileSize: number, config?: StorageConfig): { valid: boolean; error?: string } {
  const storageConfig = config || getStorageConfig()
  
  if (fileSize > storageConfig.maxFileSize) {
    return {
      valid: false,
      error: `File size ${fileSize} bytes exceeds maximum ${storageConfig.maxFileSize} bytes`
    }
  }
  
  return { valid: true }
}

/**
 * Check if MIME type is allowed
 */
export function validateMimeType(mimeType: string, config?: StorageConfig): { valid: boolean; error?: string } {
  const storageConfig = config || getStorageConfig()
  
  if (!storageConfig.allowedMimeTypes.includes(mimeType)) {
    return {
      valid: false,
      error: `MIME type ${mimeType} is not allowed`
    }
  }
  
  return { valid: true }
}

/**
 * Get quality settings for content type
 */
export function getQualitySettings(contentCategory: 'images' | 'videos', variant: 'thumbnail' | 'preview' | 'full') {
  return QUALITY_SETTINGS[contentCategory]?.[variant] || null
}

/**
 * Environment-specific bucket names
 */
export function getBucketName(environment?: string): string {
  const env = (environment || process.env.NODE_ENV) as keyof StorageEnvironmentConfig
  return STORAGE_CONFIGS[env]?.bucketName || STORAGE_CONFIGS.development.bucketName
}

/**
 * Check if current environment allows certain operations
 */
export function isEnvironmentAllowed(operation: 'upload' | 'delete' | 'cleanup'): boolean {
  const env = process.env.NODE_ENV
  
  switch (operation) {
    case 'upload':
      return true // Always allow uploads
    case 'delete':
      return env !== 'production' // Restrict deletes in production
    case 'cleanup':
      return env === 'development' || env === 'test' // Only allow cleanup in dev/test
    default:
      return false
  }
}

export default {
  getStorageConfig,
  getBucketPolicy,
  validateStorageConfig,
  getContentCategory,
  generateStoragePath,
  validateFileSize,
  validateMimeType,
  getQualitySettings,
  getBucketName,
  isEnvironmentAllowed
}
