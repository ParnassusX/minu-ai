'use client'

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react'

export interface GalleryImage {
  id: string
  url: string
  prompt: string
  model: string
  parameters: Record<string, any>
  width: number
  height: number
  cost?: number
  generationTime?: number
  tags: string[]
  folderId?: string | null
  isFavorite: boolean
  createdAt: string
  updatedAt: string
  storage?: {
    persistent: boolean
    provider: 'supabase' | 'replicate' | 'cloudinary'
    accessible: boolean
  }
  metadata?: {
    size?: number
    format?: string
  }
}

interface GalleryContextType {
  images: GalleryImage[]
  loading: boolean
  error: string | null
  refreshGallery: () => Promise<void>
  addImage: (image: GalleryImage) => void
  updateImage: (imageId: string, updates: Partial<GalleryImage>) => void
  removeImage: (imageId: string) => void
  clearError: () => void
}

const GalleryContext = createContext<GalleryContextType | undefined>(undefined)

interface GalleryProviderProps {
  children: ReactNode
}

export function GalleryProvider({ children }: GalleryProviderProps) {
  const [images, setImages] = useState<GalleryImage[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refreshGallery = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/gallery?page=1&limit=50')
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication required. Please log in to view your gallery.')
        }
        throw new Error(`Failed to load gallery: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      setImages(data.images || [])
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load gallery'
      setError(errorMessage)
      console.error('Gallery refresh error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const addImage = useCallback((image: GalleryImage) => {
    setImages(prev => [image, ...prev])
  }, [])

  const updateImage = useCallback((imageId: string, updates: Partial<GalleryImage>) => {
    setImages(prev => prev.map(img =>
      img.id === imageId ? { ...img, ...updates } : img
    ))
  }, [])

  const removeImage = useCallback((imageId: string) => {
    setImages(prev => prev.filter(img => img.id !== imageId))
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const value: GalleryContextType = {
    images,
    loading,
    error,
    refreshGallery,
    addImage,
    updateImage,
    removeImage,
    clearError
  }

  return (
    <GalleryContext.Provider value={value}>
      {children}
    </GalleryContext.Provider>
  )
}

export function useGallery() {
  const context = useContext(GalleryContext)
  if (context === undefined) {
    throw new Error('useGallery must be used within a GalleryProvider')
  }
  return context
}
