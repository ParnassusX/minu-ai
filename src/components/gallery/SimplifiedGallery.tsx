'use client'

import { useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ImagePreviewModal } from '@/components/gallery/ImagePreviewModal'
import { useGallery, type GalleryImage } from '@/contexts/GalleryContext'
import { toastHelpers } from '@/lib/hooks/useToast'
import {
  Images,
  Search,
  RefreshCw,
  Download,
  Heart,
  Trash2,
  ChevronDown,
  SortAsc,
  Filter
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface SimplifiedImageCardProps {
  image: GalleryImage
  onPreview: (image: GalleryImage) => void
  onToggleFavorite: (image: GalleryImage) => void
  onDownload: (image: GalleryImage) => void
  onDelete: (image: GalleryImage) => void
}

function SimplifiedImageCard({ 
  image, 
  onPreview, 
  onToggleFavorite, 
  onDownload, 
  onDelete 
}: SimplifiedImageCardProps) {
  return (
    <div className="group relative bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-200">
      {/* Image */}
      <div
        className="aspect-square cursor-pointer overflow-hidden"
        onClick={() => onPreview(image)}
      >
        {!!image.url && (
          <img
            src={image.url}
            alt={image.prompt || 'Generated image'}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
            loading="lazy"
          />
        )}
      </div>
      
      {/* Hover Actions */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200 pointer-events-none">
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-1 pointer-events-auto">
          <Button
            size="sm"
            variant="secondary"
            className="h-8 w-8 p-0 bg-white/90 hover:bg-white"
            onClick={(e) => {
              e.stopPropagation()
              onToggleFavorite(image)
            }}
          >
            <Heart className={cn("h-4 w-4", image.isFavorite && "fill-red-500 text-red-500")} />
          </Button>
          <Button
            size="sm"
            variant="secondary"
            className="h-8 w-8 p-0 bg-white/90 hover:bg-white"
            onClick={(e) => {
              e.stopPropagation()
              onDownload(image)
            }}
          >
            <Download className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="secondary"
            className="h-8 w-8 p-0 bg-white/90 hover:bg-white text-red-600 hover:text-red-700"
            onClick={(e) => {
              e.stopPropagation()
              onDelete(image)
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Image Info */}
      <div className="p-3">
        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
          {image.prompt}
        </p>
        <div className="flex items-center justify-between text-xs text-gray-500">
          <Badge variant="outline" className="text-xs">
            {image.model}
          </Badge>
          <span>
            {new Date(image.createdAt).toLocaleDateString()}
          </span>
        </div>
      </div>
    </div>
  )
}

export function SimplifiedGallery() {
  const { images, loading, error, refreshGallery, updateImage, removeImage, clearError } = useGallery()
  const [previewImage, setPreviewImage] = useState<GalleryImage | null>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'date' | 'model' | 'prompt'>('date')
  const [showFilters, setShowFilters] = useState(false)
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)

  // Load images on mount
  useEffect(() => {
    refreshGallery()
  }, [])

  // Filter and sort images
  const filteredAndSortedImages = useMemo(() => {
    let filtered = images

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(image => 
        image.prompt.toLowerCase().includes(query) ||
        image.model.toLowerCase().includes(query) ||
        (image.tags || []).some(tag => tag.toLowerCase().includes(query))
      )
    }

    // Apply favorites filter
    if (showFavoritesOnly) {
      filtered = filtered.filter(image => image.isFavorite)
    }

    // Sort images
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        case 'model':
          return a.model.localeCompare(b.model)
        case 'prompt':
          return a.prompt.localeCompare(b.prompt)
        default:
          return 0
      }
    })
  }, [images, searchQuery, sortBy, showFavoritesOnly])

  // Image actions
  const handleDownload = async (image: GalleryImage) => {
    try {
      const { downloadHighQualityImage } = await import('@/lib/download/imageDownload')
      await downloadHighQualityImage(image.url, image.id, 'luxury')
      toastHelpers.success('Download Started', 'Your high-quality image download has begun')
    } catch (error) {
      console.error('Download failed:', error)
      // Fallback download
      const link = document.createElement('a')
      link.href = image.url
      link.download = `minu-ai-${image.id}-hq.jpg`
      link.click()
    }
  }

  const handleToggleFavorite = async (image: GalleryImage) => {
    try {
      const response = await fetch('/api/gallery', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageId: image.id,
          updates: { isFavorite: !image.isFavorite }
        })
      })

      if (response.ok) {
        updateImage(image.id, { isFavorite: !image.isFavorite })
        toastHelpers.success('Updated', `${!image.isFavorite ? 'Added to' : 'Removed from'} favorites`)
      } else {
        toastHelpers.error('Error', 'Failed to update favorite status')
      }
    } catch (err) {
      console.error('Failed to toggle favorite:', err)
      toastHelpers.error('Error', 'Failed to update favorite status')
    }
  }

  const handleDelete = async (image: GalleryImage) => {
    if (!confirm('Are you sure you want to delete this image?')) return

    try {
      const response = await fetch(`/api/gallery?id=${image.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        removeImage(image.id)
        toastHelpers.success('Deleted', 'Image deleted successfully')
      } else {
        toastHelpers.error('Error', 'Failed to delete image')
      }
    } catch (err) {
      console.error('Failed to delete image:', err)
      toastHelpers.error('Error', 'Failed to delete image')
    }
  }

  // Preview modal handlers
  const openPreview = (image: GalleryImage) => {
    setPreviewImage(image)
    setIsPreviewOpen(true)
  }

  const closePreview = () => {
    setIsPreviewOpen(false)
    setPreviewImage(null)
  }

  const handlePreviewDelete = async (image: GalleryImage) => {
    await handleDelete(image)
    closePreview()
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Simple Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Images className="h-6 w-6 text-blue-600" />
              <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Gallery
              </h1>
              <Badge variant="secondary">
                {filteredAndSortedImages.length} images
              </Badge>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4 mr-1" />
                Filters
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={refreshGallery}
                disabled={loading}
              >
                <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
              </Button>
            </div>
          </div>

          {/* Collapsible Filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex-1 min-w-64">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search images, prompts, models..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-sm"
                >
                  <option value="date">Sort by Date</option>
                  <option value="model">Sort by Model</option>
                  <option value="prompt">Sort by Prompt</option>
                </select>

                <Button
                  variant={showFavoritesOnly ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                >
                  <Heart className="h-4 w-4 mr-1" />
                  Favorites Only
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-center justify-between">
              <p className="text-red-700 dark:text-red-400">{error}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  clearError()
                  refreshGallery()
                }}
              >
                Retry
              </Button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
            <p className="text-gray-500">Loading your gallery...</p>
          </div>
        ) : filteredAndSortedImages.length === 0 ? (
          <div className="text-center py-12">
            <Images className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              {images.length === 0 ? 'No images yet' : 'No images found'}
            </h3>
            <p className="text-gray-500">
              {images.length === 0 
                ? 'Start generating images to build your gallery.' 
                : 'Try adjusting your search or filters.'}
            </p>
          </div>
        ) : (
          /* Scrollable Image Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
            {filteredAndSortedImages.map((image) => (
              <SimplifiedImageCard
                key={image.id}
                image={image}
                onPreview={openPreview}
                onToggleFavorite={handleToggleFavorite}
                onDownload={handleDownload}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      {/* Image Preview Modal */}
      <ImagePreviewModal
        image={previewImage}
        images={filteredAndSortedImages}
        isOpen={isPreviewOpen}
        onClose={closePreview}
        onDownload={handleDownload}
        onToggleFavorite={handleToggleFavorite}
        onDelete={handlePreviewDelete}
      />
    </div>
  )
}
