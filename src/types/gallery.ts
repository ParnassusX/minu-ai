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

export interface GalleryFolder {
  id: string
  name: string
  color: string
  imageCount: number
  createdAt: string
  updatedAt: string
}

export interface GalleryFilter {
  search?: string
  folderId?: string | null
  tags?: string[]
  models?: string[]
  favorites?: boolean
  dateRange?: {
    start: string
    end: string
  }
  sizeRange?: {
    min: number
    max: number
  }
}

export interface GallerySort {
  field: 'createdAt' | 'prompt' | 'model' | 'cost' | 'generationTime' | 'width' | 'height'
  direction: 'asc' | 'desc'
}

export interface BatchOperation {
  action: 'delete' | 'move_to_folder' | 'add_tags' | 'remove_tags' | 'toggle_favorite'
  imageIds: string[]
  data?: {
    folderId?: string | null
    tags?: string[]
    favorite?: boolean
  }
}

export interface GalleryStats {
  totalImages: number
  totalFolders: number
  favoriteImages: number
  totalCost: number
  averageGenerationTime: number
  mostUsedModel: string
  popularTags: Array<{ tag: string; count: number }>
  storageUsed: number
}

export interface TagSuggestion {
  tag: string
  count: number
  category?: string
}

export interface GalleryView {
  mode: 'grid' | 'list' | 'masonry'
  size: 'small' | 'medium' | 'large'
  showMetadata: boolean
  showTags: boolean
}

export interface GallerySelection {
  selectedIds: Set<string>
  isSelecting: boolean
  selectAll: boolean
}

export interface CreateFolderRequest {
  name: string
  color?: string
}

export interface UpdateFolderRequest {
  id: string
  name?: string
  color?: string
}

export interface UpdateImageRequest {
  id: string
  tags?: string[]
  folderId?: string | null
  isFavorite?: boolean
}

export interface GalleryPreferences {
  defaultView: GalleryView
  defaultSort: GallerySort
  autoTagging: boolean
  showCost: boolean
  showGenerationTime: boolean
  compactMode: boolean
}

// Utility functions
export const createEmptyFilter = (): GalleryFilter => ({
  search: '',
  folderId: undefined,
  tags: [],
  models: [],
  favorites: undefined,
  dateRange: undefined,
  sizeRange: undefined
})

export const createDefaultSort = (): GallerySort => ({
  field: 'createdAt',
  direction: 'desc'
})

export const createDefaultView = (): GalleryView => ({
  mode: 'grid',
  size: 'medium',
  showMetadata: true,
  showTags: true
})

export const createEmptySelection = (): GallerySelection => ({
  selectedIds: new Set(),
  isSelecting: false,
  selectAll: false
})

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export const formatCost = (cost: number): string => {
  return `$${cost.toFixed(4)}`
}

export const formatGenerationTime = (time: number): string => {
  if (time < 1000) return `${time}ms`
  return `${(time / 1000).toFixed(1)}s`
}

export const getImageAspectRatio = (image: GalleryImage): number => {
  return image.width / image.height
}

export const isImagePortrait = (image: GalleryImage): boolean => {
  return getImageAspectRatio(image) < 1
}

export const isImageLandscape = (image: GalleryImage): boolean => {
  return getImageAspectRatio(image) > 1
}

export const isImageSquare = (image: GalleryImage): boolean => {
  return Math.abs(getImageAspectRatio(image) - 1) < 0.1
}

export const getImageResolution = (image: GalleryImage): string => {
  return `${image.width} × ${image.height}`
}

export const getMegapixels = (image: GalleryImage): string => {
  const mp = (image.width * image.height) / 1000000
  return `${mp.toFixed(1)}MP`
}

export const filterImages = (images: GalleryImage[], filter: GalleryFilter): GalleryImage[] => {
  return images.filter(image => {
    // Search filter
    if (filter.search) {
      const searchLower = filter.search.toLowerCase()
      const matchesSearch = 
        image.prompt.toLowerCase().includes(searchLower) ||
        image.model.toLowerCase().includes(searchLower) ||
        image.tags.some(tag => tag.toLowerCase().includes(searchLower))
      
      if (!matchesSearch) return false
    }

    // Folder filter
    if (filter.folderId !== undefined) {
      if (filter.folderId === null && image.folderId !== null) return false
      if (filter.folderId !== null && image.folderId !== filter.folderId) return false
    }

    // Tags filter
    if (filter.tags && filter.tags.length > 0) {
      const hasAllTags = filter.tags.every(tag => image.tags.includes(tag))
      if (!hasAllTags) return false
    }

    // Models filter
    if (filter.models && filter.models.length > 0) {
      if (!filter.models.includes(image.model)) return false
    }

    // Favorites filter
    if (filter.favorites !== undefined) {
      if (image.isFavorite !== filter.favorites) return false
    }

    // Date range filter
    if (filter.dateRange) {
      const imageDate = new Date(image.createdAt)
      const startDate = new Date(filter.dateRange.start)
      const endDate = new Date(filter.dateRange.end)
      
      if (imageDate < startDate || imageDate > endDate) return false
    }

    // Size range filter
    if (filter.sizeRange && image.metadata?.size) {
      if (image.metadata.size < filter.sizeRange.min || image.metadata.size > filter.sizeRange.max) {
        return false
      }
    }

    return true
  })
}

export const sortImages = (images: GalleryImage[], sort: GallerySort): GalleryImage[] => {
  return [...images].sort((a, b) => {
    let comparison = 0

    switch (sort.field) {
      case 'createdAt':
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        break
      case 'prompt':
        comparison = a.prompt.localeCompare(b.prompt)
        break
      case 'model':
        comparison = a.model.localeCompare(b.model)
        break
      case 'cost':
        comparison = (a.cost || 0) - (b.cost || 0)
        break
      case 'generationTime':
        comparison = (a.generationTime || 0) - (b.generationTime || 0)
        break
      case 'width':
        comparison = a.width - b.width
        break
      case 'height':
        comparison = a.height - b.height
        break
    }

    return sort.direction === 'asc' ? comparison : -comparison
  })
}
