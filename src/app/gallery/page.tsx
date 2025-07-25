'use client'

import { useState, useEffect, useMemo } from 'react'
import { UnifiedLayout } from '@/components/layout/UnifiedLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ImagePreviewModal } from '@/components/gallery/ImagePreviewModal'
import { EnhancedImageCard } from '@/components/gallery/EnhancedImageCard'
import { FilterPanel } from '@/components/gallery/FilterPanel'
import { FolderManager } from '@/components/gallery/FolderManager'
import { BatchActionBar } from '@/components/gallery/BatchActionBar'
import { useBatchSelection } from '@/hooks/useBatchSelection'
import { useGallery, type GalleryImage } from '@/contexts/GalleryContext'
import { useKeyboardShortcuts } from '@/lib/hooks/useKeyboardShortcuts'
import { useTheme } from 'next-themes'
import { toastHelpers } from '@/lib/hooks/useToast'
import {
  Images,
  Download,
  Trash2,
  RefreshCw,
  Clock,
  Grid3X3,
  List,
  Folder,
  Star
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  GalleryFolder,
  GalleryFilter,
  GallerySort,
  GalleryView,
  GallerySelection,
  BatchOperation,
  CreateFolderRequest,
  UpdateFolderRequest,
  createEmptyFilter,
  createDefaultSort,
  createDefaultView,
  createEmptySelection,
  filterImages,
  sortImages
} from '@/types/gallery'

// GalleryImage type is now imported from context

export default function GalleryPage() {
  const [previewImage, setPreviewImage] = useState<GalleryImage | null>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const { theme, setTheme } = useTheme()

  // Use gallery context for centralized state management
  const { images, loading, error, refreshGallery, updateImage, removeImage } = useGallery()

  // Enhanced gallery state
  const [folders, setFolders] = useState<GalleryFolder[]>([])
  const [filter, setFilter] = useState<GalleryFilter>(createEmptyFilter())
  const [sort, setSort] = useState<GallerySort>(createDefaultSort())
  const [view, setView] = useState<GalleryView>(createDefaultView())
  const [selection, setSelection] = useState<GallerySelection>(createEmptySelection())
  const [activeView, setActiveView] = useState<'recent' | 'projects' | 'favorites' | 'archive'>('recent')

  // Load images and folders on mount
  useEffect(() => {
    loadGalleryData()
  }, [])

  // Load gallery data including folders
  const loadGalleryData = async () => {
    try {
      await refreshGallery()
      // Load folders
      const foldersResponse = await fetch('/api/gallery/folders')
      if (foldersResponse.ok) {
        const foldersData = await foldersResponse.json()
        setFolders(foldersData.folders || [])
      }
    } catch (err) {
      console.error('Error loading gallery data:', err)
    }
  }

  // Computed values for enhanced filtering
  const filteredAndSortedImages = useMemo(() => {
    let filteredImages = images

    // Apply view-based filtering
    switch (activeView) {
      case 'favorites':
        filteredImages = images.filter(img => img.isFavorite)
        break
      case 'recent':
        filteredImages = images.slice().sort((a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ).slice(0, 50) // Show last 50 recent images
        break
      case 'projects':
        filteredImages = images.filter(img => img.folderId)
        break
      case 'archive':
        filteredImages = images.filter(img =>
          new Date(img.createdAt) < new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        )
        break
    }

    // Apply additional filters
    const filtered = filterImages(filteredImages, filter)
    return sortImages(filtered, sort)
  }, [images, filter, sort, activeView])

  const availableTags = useMemo(() => {
    const tagCounts = new Map<string, number>()
    images.forEach(image => {
      (image.tags || []).forEach(tag => {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1)
      })
    })
    return Array.from(tagCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([tag]) => tag)
  }, [images])

  const availableModels = useMemo(() => {
    const models = new Set(images.map(image => image.model))
    return Array.from(models)
  }, [images])

  // Batch selection functionality (legacy support)
  const {
    selectAll,
    clearSelection,
    getSelectedItems,
    selectedCount
  } = useBatchSelection<GalleryImage>()



  // Batch operations handlers
  const handleBatchDownload = () => {
    const selected = getSelectedItems(images)
    selected.forEach(image => handleDownload(image))
  }

  const handleBatchDelete = async () => {
    const selected = getSelectedItems(images)
    if (selected.length === 0) return

    if (!confirm(`Are you sure you want to delete ${selected.length} image${selected.length > 1 ? 's' : ''}?`)) return

    try {
      const selectedIds = selected.map(img => img.id)
      const promises = selectedIds.map(id =>
        fetch(`/api/gallery?id=${id}`, { method: 'DELETE' })
      )

      await Promise.all(promises)

      // Remove deleted images from context
      selectedIds.forEach(id => removeImage(id))
      clearSelection()
    } catch (err) {
      console.error('Failed to delete images:', err)
    }
  }

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onSelectAll: () => selectAll(images),
    onDownload: selectedCount > 0 ? handleBatchDownload : undefined,
    onEscape: clearSelection,
    onToggleDarkMode: () => setTheme(theme === 'dark' ? 'light' : 'dark')
  })

  const handleDownload = async (image: GalleryImage) => {
    try {
      const { downloadHighQualityImage } = await import('@/lib/download/imageDownload')
      await downloadHighQualityImage(image.url, image.id, 'luxury')
    } catch (error) {
      console.error('Download failed:', error)
      // Fallback to simple download
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
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageId: image.id,
          updates: { isFavorite: !image.isFavorite }
        })
      })

      if (response.ok) {
        updateImage(image.id, { isFavorite: !image.isFavorite })
      }
    } catch (err) {
      console.error('Failed to toggle favorite:', err)
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
      }
    } catch (err) {
      console.error('Failed to delete image:', err)
    }
  }

  // Preview modal handlers
  const closePreview = () => {
    setIsPreviewOpen(false)
    setPreviewImage(null)
  }

  const handlePreviewDelete = async (image: GalleryImage) => {
    await handleDelete(image)
    closePreview()
  }

  // Enhanced folder operations
  const handleFolderCreate = async (folderData: CreateFolderRequest) => {
    try {
      const response = await fetch('/api/gallery/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(folderData)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create folder')
      }

      const data = await response.json()
      setFolders(prev => [data.folder, ...prev])
      toastHelpers.success('Success!', 'Folder created successfully')
    } catch (error) {
      console.error('Error creating folder:', error)
      toastHelpers.error('Error', 'Failed to create folder')
      throw error
    }
  }

  const handleFolderUpdate = async (folderData: UpdateFolderRequest) => {
    try {
      const response = await fetch('/api/gallery/folders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(folderData)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update folder')
      }

      const data = await response.json()
      setFolders(prev => prev.map(f => f.id === data.folder.id ? data.folder : f))
      toastHelpers.success('Success!', 'Folder updated successfully')
    } catch (error) {
      console.error('Error updating folder:', error)
      toastHelpers.error('Error', 'Failed to update folder')
      throw error
    }
  }

  const handleFolderDelete = async (folderId: string) => {
    try {
      const response = await fetch(`/api/gallery/folders?id=${folderId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete folder')
      }

      setFolders(prev => prev.filter(f => f.id !== folderId))
      toastHelpers.success('Success!', 'Folder deleted successfully')
    } catch (error) {
      console.error('Error deleting folder:', error)
      toastHelpers.error('Error', 'Failed to delete folder')
      throw error
    }
  }

  // Enhanced batch operations
  const handleBatchOperation = async (operation: BatchOperation) => {
    try {
      const response = await fetch('/api/gallery/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(operation)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Batch operation failed')
      }

      const data = await response.json()
      toastHelpers.success('Success!', data.message)

      // Refresh gallery data to reflect changes
      await loadGalleryData()
    } catch (error) {
      console.error('Batch operation error:', error)
      toastHelpers.error('Error', 'Batch operation failed')
      throw error
    }
  }

  // Enhanced selection operations
  const handleImageSelect = (imageId: string, selected: boolean) => {
    setSelection(prev => {
      const newSelectedIds = new Set(prev.selectedIds)
      if (selected) {
        newSelectedIds.add(imageId)
      } else {
        newSelectedIds.delete(imageId)
      }
      return {
        ...prev,
        selectedIds: newSelectedIds,
        selectAll: newSelectedIds.size === filteredAndSortedImages.length
      }
    })
  }

  const handleSelectionChange = (changes: Partial<GallerySelection>) => {
    setSelection(prev => {
      const newSelection = { ...prev, ...changes }

      if (changes.selectAll !== undefined) {
        if (changes.selectAll) {
          newSelection.selectedIds = new Set(filteredAndSortedImages.map(img => img.id))
        } else {
          newSelection.selectedIds = new Set()
        }
      }

      return newSelection
    })
  }

  const handleClearSelection = () => {
    setSelection(createEmptySelection())
    clearSelection() // Legacy support
  }

  // Enhanced image operations
  const handleImageUpdate = async (imageId: string, updates: Partial<GalleryImage>) => {
    try {
      const response = await fetch('/api/gallery', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageId, updates })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update image')
      }

      // Update both contexts
      updateImage(imageId, updates)
    } catch (error) {
      console.error('Error updating image:', error)
      toastHelpers.error('Update Failed', 'Could not update image')
    }
  }

  const handleImageDelete = async (imageId: string) => {
    try {
      const response = await fetch(`/api/gallery?id=${imageId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete image')
      }

      removeImage(imageId)
      toastHelpers.success('Deleted!', 'Image deleted successfully')
    } catch (error) {
      console.error('Error deleting image:', error)
      toastHelpers.error('Delete Failed', 'Could not delete image')
    }
  }

  // View controls
  const handleViewChange = (changes: Partial<GalleryView>) => {
    setView(prev => ({ ...prev, ...changes }))
  }

  return (
    <UnifiedLayout>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 p-3 sm:p-4 lg:p-6">
        <div className="space-y-4">
        {/* Unified Gallery Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
              <Images className="mr-3 h-8 w-8 text-blue-600" />
              Gallery Hub
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Unified image management with projects, filters, and organization
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={loadGalleryData}
              disabled={loading}
            >
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Gallery View Tabs */}
        <div className="flex items-center space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg w-fit">
          {[
            { id: 'recent', label: 'Recent', icon: Clock },
            { id: 'projects', label: 'Projects', icon: Folder },
            { id: 'favorites', label: 'Favorites', icon: Star },
            { id: 'archive', label: 'Archive', icon: Images }
          ].map(({ id, label, icon: Icon }) => (
            <Button
              key={id}
              variant={activeView === id ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveView(id as any)}
              className="flex items-center space-x-2"
            >
              <Icon className="h-4 w-4" />
              <span>{label}</span>
              <Badge variant="secondary" className="ml-1">
                {id === 'recent' ? Math.min(images.length, 50) :
                 id === 'favorites' ? images.filter(img => img.isFavorite).length :
                 id === 'projects' ? images.filter(img => img.folderId).length :
                 images.filter(img => new Date(img.createdAt) < new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length}
              </Badge>
            </Button>
          ))}
        </div>

        {/* Optimized Layout - Responsive Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
          {/* Folder Manager - Compact */}
          <div className="xl:col-span-1">
            <FolderManager
              folders={folders}
              selectedFolderId={filter.folderId}
              onFolderSelect={(folderId) => setFilter(prev => ({ ...prev, folderId }))}
              onFolderCreate={handleFolderCreate}
              onFolderUpdate={handleFolderUpdate}
              onFolderDelete={handleFolderDelete}
            />
          </div>

          {/* Filter Panel - Compact */}
          <div className="xl:col-span-1">
            <FilterPanel
              filter={filter}
              sort={sort}
              folders={folders}
              availableTags={availableTags}
              availableModels={availableModels}
              onFilterChange={setFilter}
              onSortChange={setSort}
              onReset={() => {
                setFilter(createEmptyFilter())
                setSort(createDefaultSort())
              }}
            />
          </div>

          {/* Gallery Content - Expanded space */}
          <div className="xl:col-span-3">
            {error && (
              <Card className="border-red-200 bg-red-50 dark:bg-red-900/10">
                <CardContent className="p-4">
                  <p className="text-red-700 dark:text-red-400">{error}</p>
                </CardContent>
              </Card>
            )}

            {loading ? (
              <Card>
                <CardContent className="p-12">
                  <div className="text-center">
                    <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-500">Loading your gallery...</p>
                  </div>
                </CardContent>
              </Card>
            ) : filteredAndSortedImages.length === 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>No Images Found</CardTitle>
                  <CardDescription>
                    {activeView === 'recent' ? 'No recent images to display' :
                     activeView === 'favorites' ? 'No favorite images yet' :
                     activeView === 'projects' ? 'No project images found' :
                     'No archived images found'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12 text-gray-500">
                    <Images className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg mb-2">
                      {images.length === 0 ? 'No images yet' : 'No images match your current view'}
                    </p>
                    <p className="text-sm">
                      {images.length === 0 ?
                        'Start generating images to build your gallery.' :
                        'Try switching to a different view or adjusting your filters.'
                      }
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {/* View Controls */}
                <div className="flex items-center justify-between">
                  <p className="text-gray-600 dark:text-gray-400">
                    {filteredAndSortedImages.length} images
                    {selection.selectedIds.size > 0 && (
                      <span className="ml-2 text-blue-600 dark:text-blue-400">
                        • {selection.selectedIds.size} selected
                      </span>
                    )}
                    {selectedCount > 0 && (
                      <span className="ml-2 text-blue-600 dark:text-blue-400">
                        • {selectedCount} selected (legacy)
                      </span>
                    )}
                  </p>

                  <div className="flex items-center gap-2">
                    <Button
                      variant={view.mode === 'grid' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleViewChange({ mode: 'grid' })}
                    >
                      <Grid3X3 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={view.mode === 'list' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleViewChange({ mode: 'list' })}
                    >
                      <List className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelection(prev => ({ ...prev, isSelecting: !prev.isSelecting }))}
                    >
                      {selection.isSelecting ? 'Exit Select' : 'Select'}
                    </Button>
                  </div>
                </div>

                {/* Optimized Images Grid */}
                <div className={cn(
                  "grid gap-3",
                  view.mode === 'grid'
                    ? view.size === 'small'
                      ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8"
                      : view.size === 'large'
                      ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                      : "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
                    : "grid-cols-1"
                )}>
                  {filteredAndSortedImages.map((image) => (
                    <EnhancedImageCard
                      key={image.id}
                      image={image}
                      view={view}
                      isSelected={selection.selectedIds.has(image.id)}
                      isSelecting={selection.isSelecting}
                      onSelect={handleImageSelect}
                      onPreview={setPreviewImage}
                      onUpdate={handleImageUpdate}
                      onDelete={handleImageDelete}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Enhanced Batch Action Bar */}
        <BatchActionBar
          selection={selection}
          folders={folders}
          onBatchOperation={handleBatchOperation}
          onSelectionChange={handleSelectionChange}
          onClearSelection={handleClearSelection}
        />

        {/* Batch operations now handled by BatchActionBar component - no duplicate needed */}

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
      </div>
    </UnifiedLayout>
  )
}
