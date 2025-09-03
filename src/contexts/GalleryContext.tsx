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
  currentPage: number
  hasMore: boolean
  refreshGallery: (resetPagination?: boolean) => Promise<void>
  loadMore: () => Promise<void>
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
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  const refreshGallery = useCallback(async (resetPagination = true) => {
    try {
      setLoading(true)
      setError(null)

      const pageToLoad = resetPagination ? 1 : currentPage
      const response = await fetch(`/api/gallery?page=${pageToLoad}&limit=50`)

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication required. Please log in to view your gallery.')
        }
        throw new Error(`Failed to load gallery: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()

      if (resetPagination) {
        setImages(data.images || [])
        setCurrentPage(1)
        setHasMore(data.pagination?.hasMore || false)
      } else {
        // Append new images for infinite scroll
        setImages(prev => [...prev, ...(data.images || [])])
        setHasMore(data.pagination?.hasMore || false)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load gallery'
      setError(errorMessage)
      console.error('Gallery refresh error:', err)
    } finally {
      setLoading(false)
    }
  }, [currentPage])

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return

    try {
      setLoading(true)
      const nextPage = currentPage + 1
      const response = await fetch(`/api/gallery?page=${nextPage}&limit=50`)

      if (!response.ok) {
        throw new Error(`Failed to load more images: ${response.status}`)
      }

      const data = await response.json()
      setImages(prev => [...prev, ...(data.images || [])])
      setCurrentPage(nextPage)
      setHasMore(data.pagination?.hasMore || false)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load more images'
      setError(errorMessage)
      console.error('Load more error:', err)
    } finally {
      setLoading(false)
    }
  }, [loading, hasMore, currentPage])

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
    currentPage,
    hasMore,
    refreshGallery,
    loadMore,
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
