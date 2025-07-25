'use client'

import { useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Images,
  FolderPlus,
  Folder,
  Search,
  Grid3X3,
  List,
  Download,
  Trash2,
  Star,
  Move,
  Filter,
  SortAsc,
  SortDesc
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface GalleryImage {
  id: string
  url: string
  name: string
  prompt?: string
  model?: string
  timestamp: Date
  tags: string[]
  folder?: string
  favorite: boolean
  metadata?: {
    width: number
    height: number
    size: number
    format: string
  }
}

interface GalleryFolder {
  id: string
  name: string
  imageCount: number
  createdAt: Date
  color?: string
}

interface GalleryManagerProps {
  readonly images: GalleryImage[]
  readonly onImageUpdate: (imageId: string, updates: Partial<GalleryImage>) => void
  readonly onImageDelete: (imageId: string) => void
  readonly onFolderCreate: (name: string) => void
  readonly onFolderDelete: (folderId: string) => void
  readonly onImageMove: (imageId: string, folderId: string | null) => void
  readonly className?: string
}

type ViewMode = 'grid' | 'list'
type SortBy = 'date' | 'name' | 'model' | 'size'
type SortOrder = 'asc' | 'desc'

const ImageCard = ({ image, onUpdate, onDelete }: {
  image: GalleryImage
  onUpdate: (imageId: string, updates: Partial<GalleryImage>) => void
  onDelete: (imageId: string) => void
}) => {
  return (
    <div className="relative group transition-all duration-200"
    >
      <div className="relative overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow">
        <img
          src={image.url}
          alt={image.name}
          className="w-full h-48 object-cover"
        />
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors">
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="flex space-x-1">
              <Button
                size="sm"
                variant="secondary"
                className="h-8 w-8 p-0 bg-white/90 hover:bg-white"
                onClick={() => onUpdate(image.id, { favorite: !image.favorite })}
              >
                <Star className={cn(
                  "h-4 w-4",
                  image.favorite ? "text-yellow-500 fill-yellow-500" : "text-gray-600"
                )} />
              </Button>
              <Button
                size="sm"
                variant="secondary"
                className="h-8 w-8 p-0 bg-white/90 hover:bg-white"
                onClick={async () => {
                  try {
                    const { downloadHighQualityImage } = await import('@/lib/download/imageDownload')
                    await downloadHighQualityImage(image.url, image.id, 'luxury')
                  } catch (error) {
                    console.error('Download failed:', error)
                    // Fallback to simple download
                    const link = document.createElement('a')
                    link.href = image.url
                    link.download = `${image.name}-hq.jpg`
                    link.click()
                  }
                }}
              >
                <Download className="h-4 w-4 text-gray-600" />
              </Button>
              <Button
                size="sm"
                variant="secondary"
                className="h-8 w-8 p-0 bg-white/90 hover:bg-red-50"
                onClick={() => onDelete(image.id)}
              >
                <Trash2 className="h-4 w-4 text-red-600" />
              </Button>
            </div>
          </div>
        </div>

        {/* Image Info */}
        <div className="p-3">
          <h3 className="font-medium text-sm text-gray-900 truncate">{image.name}</h3>
          {image.prompt && (
            <p className="text-xs text-gray-500 mt-1 line-clamp-2">{image.prompt}</p>
          )}
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center space-x-2">
              {image.model && (
                <Badge variant="outline" className="text-xs">
                  {image.model}
                </Badge>
              )}
              {image.favorite && (
                <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
              )}
            </div>
            <span className="text-xs text-gray-400">
              {image.timestamp.toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

const DroppableFolder = ({ folder, onDrop, onDelete }: {
  folder: GalleryFolder
  onDrop: (imageId: string, folderId: string) => void
  onDelete: (folderId: string) => void
}) => {
  // Temporarily disable drag and drop for Phase 1
  // const [{ isOver }, drop] = useDrop(() => ({
  //   accept: 'image',
  //   drop: (item: { id: string; type: string }) => {
  //     if (item.type === 'image') {
  //       onDrop(item.id, folder.id)
  //     }
  //   },
  //   collect: (monitor) => ({
  //     isOver: monitor.isOver(),
  //   }),
  // }))

  return (
    <div
      className={cn(
        "p-4 border-2 border-dashed rounded-lg transition-all duration-200 cursor-pointer",
        "border-gray-300 hover:border-gray-400"
        // isOver ? "border-indigo-400 bg-indigo-50" : "border-gray-300 hover:border-gray-400"
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className={cn(
            "p-2 rounded-lg",
            folder.color ? `bg-${folder.color}-100` : "bg-gray-100"
          )}>
            <Folder className={cn(
              "h-5 w-5",
              folder.color ? `text-${folder.color}-600` : "text-gray-600"
            )} />
          </div>
          <div>
            <h3 className="font-medium text-gray-900">{folder.name}</h3>
            <p className="text-sm text-gray-500">{folder.imageCount} images</p>
          </div>
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onDelete(folder.id)}
          className="opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Trash2 className="h-4 w-4 text-red-600" />
        </Button>
      </div>
    </div>
  )
}

export function GalleryManager({
  images,
  onImageUpdate,
  onImageDelete,
  onFolderCreate,
  onFolderDelete,
  onImageMove,
  className
}: GalleryManagerProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [sortBy, setSortBy] = useState<SortBy>('date')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null)
  const [newFolderName, setNewFolderName] = useState('')
  const [showNewFolderInput, setShowNewFolderInput] = useState(false)

  // Mock folders - in real app, these would come from props or API
  const folders: GalleryFolder[] = [
    { id: 'portraits', name: 'Portraits', imageCount: 12, createdAt: new Date(), color: 'blue' },
    { id: 'landscapes', name: 'Landscapes', imageCount: 8, createdAt: new Date(), color: 'green' },
    { id: 'abstract', name: 'Abstract', imageCount: 15, createdAt: new Date(), color: 'purple' },
  ]

  // Filter and sort images
  const filteredImages = images
    .filter(image => {
      const matchesSearch = !searchQuery || 
        image.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        image.prompt?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        image.model?.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesFolder = !selectedFolder || image.folder === selectedFolder
      
      return matchesSearch && matchesFolder
    })
    .sort((a, b) => {
      let comparison = 0
      
      switch (sortBy) {
        case 'date':
          comparison = a.timestamp.getTime() - b.timestamp.getTime()
          break
        case 'name':
          comparison = a.name.localeCompare(b.name)
          break
        case 'model':
          comparison = (a.model || '').localeCompare(b.model || '')
          break
        case 'size':
          comparison = (a.metadata?.size || 0) - (b.metadata?.size || 0)
          break
      }
      
      return sortOrder === 'asc' ? comparison : -comparison
    })

  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      onFolderCreate(newFolderName.trim())
      setNewFolderName('')
      setShowNewFolderInput(false)
    }
  }

  return (
    <div className={cn("space-y-6", className)}>
        {/* Header */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Images className="h-5 w-5 text-indigo-500" />
              <span>Gallery Manager</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search and Controls */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search images..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                {/* View Mode */}
                <div className="flex border border-gray-200 rounded-lg p-1">
                  <Button
                    size="sm"
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    onClick={() => setViewMode('grid')}
                    className="h-8 px-3"
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    onClick={() => setViewMode('list')}
                    className="h-8 px-3"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>

                {/* Sort Controls */}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                >
                  {sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {/* Folder Management */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-gray-900">Folders</h3>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowNewFolderInput(true)}
                >
                  <FolderPlus className="h-4 w-4 mr-2" />
                  New Folder
                </Button>
              </div>

              {showNewFolderInput && (
                <div className="flex space-x-2">
                  <Input
                    placeholder="Folder name"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleCreateFolder()}
                  />
                  <Button onClick={handleCreateFolder}>Create</Button>
                  <Button variant="outline" onClick={() => setShowNewFolderInput(false)}>
                    Cancel
                  </Button>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {folders.map((folder) => (
                  <DroppableFolder
                    key={folder.id}
                    folder={folder}
                    onDrop={onImageMove}
                    onDelete={onFolderDelete}
                  />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Images Grid */}
        <Card>
          <CardContent className="p-6">
            {filteredImages.length === 0 ? (
              <div className="text-center py-12">
                <Images className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No images found</h3>
                <p className="text-gray-500">
                  {searchQuery ? 'Try adjusting your search terms' : 'Start generating images to see them here'}
                </p>
              </div>
            ) : (
              <div className={cn(
                viewMode === 'grid' 
                  ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
                  : "space-y-4"
              )}>
                {filteredImages.map((image) => (
                  <ImageCard
                    key={image.id}
                    image={image}
                    onUpdate={onImageUpdate}
                    onDelete={onImageDelete}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
  )
}
