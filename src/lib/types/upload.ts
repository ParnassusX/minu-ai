/**
 * Upload System Types for Minu.AI Generator
 * Defines file upload, validation, and processing types
 */

export interface UploadedFile {
  id: string
  file: File
  name: string
  size: number
  type: string
  url: string // Object URL for preview
  dataUrl?: string // Base64 data URL for API
  dimensions?: {
    width: number
    height: number
  }
  uploadedAt: Date
  status: 'uploading' | 'processing' | 'ready' | 'error'
  error?: string
  progress?: number
}

export interface UploadValidation {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

export interface UploadConfig {
  maxFiles: number
  maxFileSize: number // in bytes
  acceptedTypes: string[]
  acceptedExtensions: string[]
  requiresDimensions: boolean
  minDimensions?: {
    width: number
    height: number
  }
  maxDimensions?: {
    width: number
    height: number
  }
  supportsMask: boolean
  supportsMultiple: boolean
}

export interface UploadState {
  files: UploadedFile[]
  isUploading: boolean
  uploadProgress: number
  dragActive: boolean
  error: string | null
  maxFiles: number
  config: UploadConfig
}

export interface UploadActions {
  addFiles: (files: FileList | File[]) => Promise<void>
  removeFile: (fileId: string) => void
  clearFiles: () => void
  updateFileStatus: (fileId: string, status: UploadedFile['status'], error?: string) => void
  setDragActive: (active: boolean) => void
  setError: (error: string | null) => void
  updateConfig: (config: Partial<UploadConfig>) => void
  validateFiles: (files: FileList | File[]) => UploadValidation
  processFile: (file: File) => Promise<UploadedFile>
}

export type UploadStore = UploadState & UploadActions

// Default upload configurations for different modes
export const DEFAULT_UPLOAD_CONFIGS: Record<string, UploadConfig> = {
  video: {
    maxFiles: 1,
    maxFileSize: 10 * 1024 * 1024, // 10MB
    acceptedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    acceptedExtensions: ['.jpg', '.jpeg', '.png', '.webp'],
    requiresDimensions: true,
    minDimensions: { width: 256, height: 256 },
    maxDimensions: { width: 4096, height: 4096 },
    supportsMask: false,
    supportsMultiple: false
  },
  enhance: {
    maxFiles: 1,
    maxFileSize: 10 * 1024 * 1024, // 10MB
    acceptedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    acceptedExtensions: ['.jpg', '.jpeg', '.png', '.webp'],
    requiresDimensions: true,
    minDimensions: { width: 64, height: 64 },
    maxDimensions: { width: 2048, height: 2048 },
    supportsMask: false,
    supportsMultiple: false
  }
}

// File validation utilities
export const FILE_VALIDATION = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  SUPPORTED_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  SUPPORTED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.webp'],
  MIN_DIMENSIONS: { width: 64, height: 64 },
  MAX_DIMENSIONS: { width: 4096, height: 4096 }
} as const

// Upload error messages
export const UPLOAD_ERRORS = {
  FILE_TOO_LARGE: 'File size exceeds maximum limit',
  INVALID_TYPE: 'File type not supported',
  INVALID_DIMENSIONS: 'Image dimensions are invalid',
  TOO_MANY_FILES: 'Too many files selected',
  PROCESSING_FAILED: 'Failed to process file',
  UPLOAD_FAILED: 'Upload failed',
  NETWORK_ERROR: 'Network error occurred'
} as const

// Upload status messages
export const UPLOAD_STATUS = {
  UPLOADING: 'Uploading...',
  PROCESSING: 'Processing...',
  READY: 'Ready',
  ERROR: 'Error'
} as const

// Helper functions
export const isImageFile = (file: File): boolean => {
  return FILE_VALIDATION.SUPPORTED_TYPES.includes(file.type as any)
}

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export const generateFileId = (): string => {
  return `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

export const createObjectURL = (file: File): string => {
  return URL.createObjectURL(file)
}

export const revokeObjectURL = (url: string): void => {
  URL.revokeObjectURL(url)
}

// Image dimension utilities
export const getImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = createObjectURL(file)
    
    img.onload = () => {
      revokeObjectURL(url)
      resolve({ width: img.naturalWidth, height: img.naturalHeight })
    }
    
    img.onerror = () => {
      revokeObjectURL(url)
      reject(new Error('Failed to load image'))
    }
    
    img.src = url
  })
}

// Convert file to data URL for API usage
export const fileToDataURL = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}
