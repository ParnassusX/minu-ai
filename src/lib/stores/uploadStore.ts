/**
 * Upload Store - Zustand store for managing file upload state
 * Handles file validation, processing, and state management
 */

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { 
  UploadStore, 
  UploadedFile, 
  UploadValidation, 
  UploadConfig,
  DEFAULT_UPLOAD_CONFIGS,
  FILE_VALIDATION,
  UPLOAD_ERRORS,
  generateFileId,
  createObjectURL,
  revokeObjectURL,
  getImageDimensions,
  fileToDataURL,
  isImageFile,
  formatFileSize
} from '@/lib/types/upload'
import { GeneratorMode } from '@/lib/types/modes'

interface ExtendedUploadStore extends UploadStore {
  // Mode integration
  updateConfigForMode: (mode: GeneratorMode) => void
  getRequiredFilesForMode: (mode: GeneratorMode) => number
  isUploadRequiredForMode: (mode: GeneratorMode) => boolean
  
  // File processing
  processFiles: (files: FileList | File[]) => Promise<UploadedFile[]>
  validateFile: (file: File) => UploadValidation
  
  // Cleanup
  cleanup: () => void
  
  // Internal state
  lastModeUpdate: number
}

export const useUploadStore = create<ExtendedUploadStore>()(
  persist(
    (set, get) => ({
      // Initial state
      files: [],
      isUploading: false,
      uploadProgress: 0,
      dragActive: false,
      error: null,
      maxFiles: 1,
      config: DEFAULT_UPLOAD_CONFIGS.video || {
        maxFiles: 1,
        maxFileSize: 10 * 1024 * 1024,
        acceptedTypes: ['image/jpeg', 'image/png', 'image/webp'],
        acceptedExtensions: ['.jpg', '.jpeg', '.png', '.webp'],
        requiresDimensions: true,
        minDimensions: { width: 256, height: 256 },
        maxDimensions: { width: 4096, height: 4096 },
        supportsMask: false,
        supportsMultiple: false
      },
      lastModeUpdate: Date.now(),

      // Core actions
      addFiles: async (files: FileList | File[]) => {
        const fileArray = Array.from(files)
        const state = get()
        
        // Validate files
        const validation = state.validateFiles(fileArray)
        if (!validation.isValid) {
          set({ error: validation.errors[0] })
          return
        }

        set({ isUploading: true, error: null })

        try {
          const processedFiles = await state.processFiles(fileArray)
          
          set((state) => ({
            files: [...state.files, ...processedFiles].slice(0, state.maxFiles),
            isUploading: false,
            uploadProgress: 0
          }))
        } catch (error) {
          set({ 
            isUploading: false, 
            error: error instanceof Error ? error.message : UPLOAD_ERRORS.PROCESSING_FAILED 
          })
        }
      },

      removeFile: (fileId: string) => {
        set((state) => {
          const fileToRemove = state.files.find(f => f.id === fileId)
          if (fileToRemove) {
            revokeObjectURL(fileToRemove.url)
          }
          
          return {
            files: state.files.filter(f => f.id !== fileId),
            error: null
          }
        })
      },

      clearFiles: () => {
        const state = get()
        // Cleanup object URLs
        state.files.forEach(file => revokeObjectURL(file.url))
        
        set({
          files: [],
          error: null,
          uploadProgress: 0,
          isUploading: false
        })
      },

      updateFileStatus: (fileId: string, status: UploadedFile['status'], error?: string) => {
        set((state) => ({
          files: state.files.map(file => 
            file.id === fileId 
              ? { ...file, status, error }
              : file
          )
        }))
      },

      setDragActive: (active: boolean) => {
        set({ dragActive: active })
      },

      setError: (error: string | null) => {
        set({ error })
      },

      updateConfig: (newConfig: Partial<UploadConfig>) => {
        set((state) => ({
          config: { ...state.config, ...newConfig },
          maxFiles: newConfig.maxFiles || state.maxFiles
        }))
      },

      // Mode integration - uses MODE_CONFIGS as single source of truth
      updateConfigForMode: (mode: GeneratorMode) => {
        const { MODE_CONFIGS } = require('@/lib/types/modes')
        const modeConfig = MODE_CONFIGS[mode]

        // Create upload config from mode config
        const uploadConfig = modeConfig.uploadConfig
        if (uploadConfig) {
          const config = {
            maxFiles: uploadConfig.maxFiles,
            maxFileSize: DEFAULT_UPLOAD_CONFIGS[mode]?.maxFileSize || 10 * 1024 * 1024,
            acceptedTypes: uploadConfig.acceptedTypes,
            acceptedExtensions: uploadConfig.acceptedTypes.map((type: string) =>
              type.replace('image/', '.').replace('jpeg', 'jpg')
            ),
            requiresDimensions: true,
            minDimensions: { width: 256, height: 256 },
            maxDimensions: { width: 4096, height: 4096 },
            supportsMask: uploadConfig.supportsMask,
            supportsMultiple: uploadConfig.supportsMultiple
          }

          set({
            config,
            maxFiles: config.maxFiles,
            lastModeUpdate: Date.now()
          })

          // Clear files if switching to a mode with different requirements
          const state = get()
          if (state.files.length > config.maxFiles) {
            state.clearFiles()
          }
        }
      },

      getRequiredFilesForMode: (mode: GeneratorMode) => {
        const config = DEFAULT_UPLOAD_CONFIGS[mode]
        return config ? config.maxFiles : 0
      },

      isUploadRequiredForMode: (mode: GeneratorMode) => {
        const { MODE_CONFIGS } = require('@/lib/types/modes')
        return MODE_CONFIGS[mode].requiresUpload
      },

      // File validation
      validateFiles: (files: FileList | File[]) => {
        const fileArray = Array.from(files)
        const state = get()
        const errors: string[] = []
        const warnings: string[] = []

        // Check file count
        if (fileArray.length > state.config.maxFiles) {
          errors.push(`Maximum ${state.config.maxFiles} file(s) allowed`)
        }

        // Check total files after adding
        if (state.files.length + fileArray.length > state.config.maxFiles) {
          errors.push(`Cannot add ${fileArray.length} files. Maximum ${state.config.maxFiles} total.`)
        }

        // Validate each file
        fileArray.forEach((file, index) => {
          const fileValidation = state.validateFile(file)
          errors.push(...fileValidation.errors.map(err => `File ${index + 1}: ${err}`))
          warnings.push(...fileValidation.warnings.map(warn => `File ${index + 1}: ${warn}`))
        })

        return {
          isValid: errors.length === 0,
          errors,
          warnings
        }
      },

      validateFile: (file: File) => {
        const state = get()
        const errors: string[] = []
        const warnings: string[] = []

        // Check file type
        if (!state.config.acceptedTypes.includes(file.type)) {
          errors.push(`File type ${file.type} not supported`)
        }

        // Check file size
        if (file.size > state.config.maxFileSize) {
          errors.push(`File size ${formatFileSize(file.size)} exceeds limit of ${formatFileSize(state.config.maxFileSize)}`)
        }

        // Check if it's an image
        if (!isImageFile(file)) {
          errors.push('Only image files are supported')
        }

        return {
          isValid: errors.length === 0,
          errors,
          warnings
        }
      },

      // File processing
      processFile: async (file: File): Promise<UploadedFile> => {
        const id = generateFileId()
        const url = createObjectURL(file)
        
        const uploadedFile: UploadedFile = {
          id,
          file,
          name: file.name,
          size: file.size,
          type: file.type,
          url,
          uploadedAt: new Date(),
          status: 'processing'
        }

        try {
          // Get image dimensions
          if (isImageFile(file)) {
            const dimensions = await getImageDimensions(file)
            uploadedFile.dimensions = dimensions
            
            // Validate dimensions
            const state = get()
            if (state.config.requiresDimensions) {
              if (state.config.minDimensions) {
                if (dimensions.width < state.config.minDimensions.width || 
                    dimensions.height < state.config.minDimensions.height) {
                  throw new Error(`Image too small. Minimum ${state.config.minDimensions.width}x${state.config.minDimensions.height}`)
                }
              }
              
              if (state.config.maxDimensions) {
                if (dimensions.width > state.config.maxDimensions.width || 
                    dimensions.height > state.config.maxDimensions.height) {
                  throw new Error(`Image too large. Maximum ${state.config.maxDimensions.width}x${state.config.maxDimensions.height}`)
                }
              }
            }
          }

          // Convert to data URL for API usage
          const dataUrl = await fileToDataURL(file)
          uploadedFile.dataUrl = dataUrl
          uploadedFile.status = 'ready'
          
          return uploadedFile
        } catch (error) {
          uploadedFile.status = 'error'
          uploadedFile.error = error instanceof Error ? error.message : 'Processing failed'
          throw error
        }
      },

      processFiles: async (files: FileList | File[]) => {
        const fileArray = Array.from(files)
        const processedFiles: UploadedFile[] = []
        
        for (let i = 0; i < fileArray.length; i++) {
          try {
            const processed = await get().processFile(fileArray[i])
            processedFiles.push(processed)
            
            // Update progress
            set({ uploadProgress: ((i + 1) / fileArray.length) * 100 })
          } catch (error) {
            // Continue processing other files even if one fails
            console.error('Failed to process file:', fileArray[i].name, error)
          }
        }
        
        return processedFiles
      },

      // Cleanup
      cleanup: () => {
        const state = get()
        state.files.forEach(file => revokeObjectURL(file.url))
        set({
          files: [],
          isUploading: false,
          uploadProgress: 0,
          dragActive: false,
          error: null
        })
      }
    }),
    {
      name: 'minu-ai-upload-store',
      storage: createJSONStorage(() => localStorage),
      // Don't persist files (they contain File objects and URLs)
      partialize: (state) => ({
        config: state.config,
        maxFiles: state.maxFiles
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Reset transient state after hydration
          state.files = []
          state.isUploading = false
          state.uploadProgress = 0
          state.dragActive = false
          state.error = null
        }
      }
    }
  )
)

// Hook for mode-specific upload requirements - uses MODE_CONFIGS as single source of truth
export const useModeUploadRequirements = (mode: GeneratorMode) => {
  // Import MODE_CONFIGS dynamically to avoid circular dependencies
  const { MODE_CONFIGS } = require('@/lib/types/modes')
  const modeConfig = MODE_CONFIGS[mode]

  return {
    isRequired: modeConfig.requiresUpload,
    isOptional: modeConfig.uploadConfig && !modeConfig.uploadConfig.required,
    maxFiles: modeConfig.uploadConfig?.maxFiles || 0,
    config: DEFAULT_UPLOAD_CONFIGS[mode] || null,
    modeConfig: modeConfig
  }
}
