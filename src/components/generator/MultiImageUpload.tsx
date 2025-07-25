'use client'

import { useState } from 'react'
import { Upload, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ImageUploadSlot {
  id: string
  label: string
  description: string
  file: File | null
  preview: string | null
  url: string | null
}

interface MultiImageUploadProps {
  slots: ImageUploadSlot[]
  onImageUpload: (slotId: string, file: File) => void
  onImageRemove: (slotId: string) => void
  className?: string
}

export function MultiImageUpload({ 
  slots, 
  onImageUpload, 
  onImageRemove, 
  className = '' 
}: MultiImageUploadProps) {
  const handleFileChange = async (slotId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    
    onImageUpload(slotId, file)
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {slots.map((slot) => (
        <div key={slot.id} className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {slot.label}
            </label>
            {slot.description && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {slot.description}
              </span>
            )}
          </div>

          <div className="relative">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleFileChange(slot.id, e)}
              className="hidden"
              id={`image-upload-${slot.id}`}
            />

            {slot.preview ? (
              <div className="relative group">
                <img
                  src={slot.preview}
                  alt={slot.label}
                  className="w-full h-32 object-contain rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800"
                  onLoad={(e) => {
                    const img = e.target as HTMLImageElement
                    const container = img.parentElement?.querySelector('.image-info')
                    if (container) {
                      container.textContent = `${img.naturalWidth}×${img.naturalHeight}`
                    }
                  }}
                />
                <button
                  onClick={() => onImageRemove(slot.id)}
                  className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
                <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded image-info">
                  Loading...
                </div>
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                  <label 
                    htmlFor={`image-upload-${slot.id}`} 
                    className="cursor-pointer text-white text-sm font-medium"
                  >
                    Change Image
                  </label>
                </div>
              </div>
            ) : (
              <label
                htmlFor={`image-upload-${slot.id}`}
                className="cursor-pointer w-full h-32 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex flex-col items-center justify-center text-center hover:border-blue-500 transition-colors"
              >
                <Upload className="w-6 h-6 text-gray-400 mb-2" />
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Click to upload {slot.label.toLowerCase()}
                </p>
                {slot.description && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {slot.description}
                  </p>
                )}
              </label>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
