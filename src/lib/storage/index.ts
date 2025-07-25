/**
 * Storage Module Index
 * Centralized exports for all storage-related functionality
 */

// Core storage service
export {
  SupabaseStorageService,
  getStorageService,
  type StorageConfig,
  type StorageMetadata,
  type StorageResult,
  type UploadProgress
} from './supabaseStorage'

// Cloudinary storage service
export {
  CloudinaryStorageService,
  getCloudinaryStorageService,
  type CloudinaryConfig,
  type CloudinaryMetadata,
  type CloudinaryResult
} from './cloudinaryStorage'

// Unified storage service (Cloudinary + Supabase)
export {
  UnifiedStorageService,
  getUnifiedStorageService,
  type UnifiedStorageMetadata,
  type UnifiedStorageResult
} from './unifiedStorage'

// Video storage specialization
export {
  VideoStorageService,
  getVideoStorageService,
  type VideoMetadata,
  type VideoProcessingOptions,
  type VideoStorageResult
} from './videoStorage'

// Upload utilities
export {
  processReplicateResponse,
  batchProcessResponses,
  createDatabaseRecord,
  validateFileUrl,
  cleanupFailedUploads,
  type ReplicateResponse,
  type ProcessedFile,
  type BatchUploadResult,
  type FileProcessingOptions
} from './uploadUtils'

// Configuration management
export {
  getStorageConfig,
  getBucketPolicy,
  validateStorageConfig,
  getContentCategory,
  generateStoragePath,
  validateFileSize,
  validateMimeType,
  getQualitySettings,
  getBucketName,
  isEnvironmentAllowed,
  STORAGE_CONFIGS,
  BUCKET_POLICIES,
  STORAGE_PATTERNS,
  MIME_TYPE_CATEGORIES,
  QUALITY_SETTINGS
} from './config'

// Error handling
export {
  StorageErrorHandler,
  StorageErrorCode,
  type StorageError,
  type RetryConfig,
  type FallbackConfig
} from './errorHandling'

// Default export for convenience
export { getStorageService as default } from './supabaseStorage'
