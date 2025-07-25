'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { cn } from '@/lib/utils'
import { Upload, X, Image as ImageIcon, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { EnhancedLoading } from '@/components/ui/enhanced-loading'

interface ChatImageUploadProps {
  onImageUpload: (imageUrl: string, file: File) => void
  onImageRemove: () => void
  currentImage?: string
  className?: string
  disabled?: boolean
}

interface UploadedFile {
  file: File
  preview: string
  status: 'uploading' | 'ready' | 'error'
  progress?: number
}

export function ChatImageUpload({
  onImageUpload,
  onImageRemove,
  currentImage,
  className,
  disabled = false
}: ChatImageUploadProps) {
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null)
  const [isDragActive, setIsDragActive] = useState(false)

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0 || disabled) return

    const file = acceptedFiles[0]
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      return
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      return
    }

    // Create preview
    const preview = URL.createObjectURL(file)
    
    setUploadedFile({
      file,
      preview,
      status: 'uploading',
      progress: 0
    })

    try {
      // Simulate upload progress
      for (let progress = 0; progress <= 100; progress += 20) {
        setUploadedFile(prev => prev ? { ...prev, progress } : null)
        await new Promise(resolve => setTimeout(resolve, 100))
      }

      // Convert to data URL for immediate use
      const reader = new FileReader()
      reader.onload = (e) => {
        const imageUrl = e.target?.result as string
        setUploadedFile(prev => prev ? { ...prev, status: 'ready' } : null)
        onImageUpload(imageUrl, file)
      }
      reader.readAsDataURL(file)

    } catch (error) {
      setUploadedFile(prev => prev ? { ...prev, status: 'error' } : null)
    }
  }, [onImageUpload, disabled])

  const { getRootProps, getInputProps, isDragActive: dropzoneActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.webp']
    },
    maxFiles: 1,
    disabled,
    onDragEnter: () => setIsDragActive(true),
    onDragLeave: () => setIsDragActive(false)
  })

  const handleRemove = () => {
    if (uploadedFile) {
      URL.revokeObjectURL(uploadedFile.preview)
      setUploadedFile(null)
    }
    onImageRemove()
  }

  const hasImage = currentImage || uploadedFile?.status === 'ready'

  return (
    <div className={cn('space-y-3', className)}>
      {/* Upload Area */}
      {!hasImage && (
        <div
          {...getRootProps()}
          className={cn(
            'relative border-2 border-dashed rounded-xl p-6 transition-all duration-200 cursor-pointer',
            'bg-white/30 dark:bg-gray-800/30 backdrop-blur-sm',
            'hover:bg-white/40 dark:hover:bg-gray-800/40',
            (isDragActive || dropzoneActive) && 'border-blue-400 bg-blue-50/50 dark:bg-blue-900/20',
            !isDragActive && !dropzoneActive && 'border-gray-300 dark:border-gray-600',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          <input {...getInputProps()} />
          
          <div className="flex flex-col items-center text-center space-y-3">
            <div className={cn(
              'p-3 rounded-full transition-colors',
              (isDragActive || dropzoneActive) 
                ? 'bg-blue-100 dark:bg-blue-900/30' 
                : 'bg-gray-100 dark:bg-gray-700'
            )}>
              <Upload className={cn(
                'h-6 w-6',
                (isDragActive || dropzoneActive) 
                  ? 'text-blue-600 dark:text-blue-400' 
                  : 'text-gray-500 dark:text-gray-400'
              )} />
            </div>
            
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {isDragActive ? 'Drop your image here' : 'Upload an image to edit'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                PNG, JPG, WEBP up to 10MB
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Uploading State */}
      {uploadedFile?.status === 'uploading' && (
        <div className="relative rounded-xl overflow-hidden bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50">
          <div className="aspect-video relative">
            <img
              src={uploadedFile.preview}
              alt="Uploading..."
              className="w-full h-full object-cover opacity-50"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <EnhancedLoading
                variant="upload"
                title="Processing image"
                subtitle="Preparing for editing"
                progress={uploadedFile.progress}
                showProgress={true}
                animated={true}
              />
            </div>
          </div>
        </div>
      )}

      {/* Uploaded Image Display */}
      {hasImage && uploadedFile?.status === 'ready' && (
        <div className="relative rounded-xl overflow-hidden bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50">
          <div className="aspect-video relative group">
            <img
              src={currentImage || uploadedFile.preview}
              alt="Uploaded image"
              className="w-full h-full object-cover"
            />
            
            {/* Overlay with controls */}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="bg-white/90 text-gray-900">
                  <Check className="h-3 w-3 mr-1" />
                  Ready to edit
                </Badge>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleRemove}
                  className="bg-red-500/90 hover:bg-red-600/90"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          
          {/* Image info */}
          <div className="p-3 border-t border-gray-200/50 dark:border-gray-700/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {uploadedFile?.file.name || 'Uploaded image'}
                </span>
              </div>
              <Badge variant="outline" className="text-xs">
                Ready
              </Badge>
            </div>
          </div>
        </div>
      )}

      {/* Error State */}
      {uploadedFile?.status === 'error' && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
          <div className="flex items-center gap-2">
            <X className="h-4 w-4 text-red-500" />
            <span className="text-sm text-red-700 dark:text-red-400">
              Failed to upload image. Please try again.
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
