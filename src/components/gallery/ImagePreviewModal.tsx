'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  X, 
  Download, 
  Heart, 
  Share2, 
  Trash2, 
  ChevronLeft, 
  ChevronRight,
  Calendar,
  Clock,
  DollarSign,
  Maximize2,
  Copy,
  ExternalLink
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { GalleryImage } from '@/types/gallery'

interface ImagePreviewModalProps {
  image: GalleryImage | null
  images: GalleryImage[]
  isOpen: boolean
  onClose: () => void
  onDownload: (image: GalleryImage) => void
  onToggleFavorite: (image: GalleryImage) => void
  onDelete: (image: GalleryImage) => void
}

export function ImagePreviewModal({
  image,
  images,
  isOpen,
  onClose,
  onDownload,
  onToggleFavorite,
  onDelete
}: ImagePreviewModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    if (image && images.length > 0) {
      const index = images.findIndex(img => img.id === image.id)
      setCurrentIndex(index >= 0 ? index : 0)
    }
  }, [image, images])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return
      
      switch (e.key) {
        case 'Escape':
          onClose()
          break
        case 'ArrowLeft':
          navigatePrevious()
          break
        case 'ArrowRight':
          navigateNext()
          break
        case 'd':
        case 'D':
          if (currentImage) onDownload(currentImage)
          break
        case 'f':
        case 'F':
          if (currentImage) onToggleFavorite(currentImage)
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, currentIndex, images])

  if (!isOpen || !image || images.length === 0) return null

  const currentImage = images[currentIndex]
  const canNavigate = images.length > 1

  const navigatePrevious = () => {
    if (canNavigate) {
      setCurrentIndex(prev => prev > 0 ? prev - 1 : images.length - 1)
    }
  }

  const navigateNext = () => {
    if (canNavigate) {
      setCurrentIndex(prev => prev < images.length - 1 ? prev + 1 : 0)
    }
  }

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const copyPrompt = () => {
    navigator.clipboard.writeText(currentImage.prompt)
  }

  const openInNewTab = () => {
    window.open(currentImage.url, '_blank')
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm">
      {/* Modal Content */}
      <div className="relative h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-black/50 backdrop-blur-sm">
          <div className="flex items-center space-x-4">
            <Badge variant="outline" className="bg-white/10 text-white border-white/20">
              {currentImage.model}
            </Badge>
            <div className="text-white text-sm">
              {currentIndex + 1} of {images.length}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Action Buttons */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onToggleFavorite(currentImage)}
              className={cn(
                "text-white hover:bg-white/20",
                currentImage.isFavorite && "text-red-400"
              )}
            >
              <Heart className={cn("h-4 w-4", currentImage.isFavorite && "fill-current")} />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDownload(currentImage)}
              className="text-white hover:bg-white/20"
            >
              <Download className="h-4 w-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={openInNewTab}
              className="text-white hover:bg-white/20"
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="text-white hover:bg-white/20"
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(currentImage)}
              className="text-red-400 hover:bg-red-500/20"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-white hover:bg-white/20"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex">
          {/* Navigation Buttons */}
          {canNavigate && (
            <>
              <Button
                variant="ghost"
                size="lg"
                onClick={navigatePrevious}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-10 text-white hover:bg-white/20 h-12 w-12 rounded-full"
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>
              
              <Button
                variant="ghost"
                size="lg"
                onClick={navigateNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-10 text-white hover:bg-white/20 h-12 w-12 rounded-full"
              >
                <ChevronRight className="h-6 w-6" />
              </Button>
            </>
          )}

          {/* Image Container */}
          <div className="flex-1 flex items-center justify-center p-8">
            <img
              src={currentImage.url}
              alt={currentImage.prompt}
              className={cn(
                "max-w-full max-h-full object-contain rounded-lg shadow-2xl",
                isFullscreen && "max-w-none max-h-none w-full h-full object-cover"
              )}
            />
          </div>

          {/* Sidebar */}
          {!isFullscreen && (
            <div className="w-80 bg-black/50 backdrop-blur-sm p-6 overflow-y-auto">
              <div className="space-y-6">
                {/* Prompt */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-white font-semibold">Prompt</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={copyPrompt}
                      className="text-white hover:bg-white/20 h-6 w-6 p-0"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                  <p className="text-gray-300 text-sm leading-relaxed">
                    {currentImage.prompt}
                  </p>
                </div>

                {/* Metadata */}
                <div className="space-y-3">
                  <h3 className="text-white font-semibold">Details</h3>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center text-gray-300">
                      <Calendar className="h-4 w-4 mr-2" />
                      {formatDate(currentImage.createdAt)}
                    </div>
                    
                    <div className="flex items-center text-gray-300">
                      <span className="w-4 h-4 mr-2 text-center">📐</span>
                      {currentImage.width}×{currentImage.height}
                    </div>
                    
                    {currentImage.cost && (
                      <div className="flex items-center text-gray-300">
                        <DollarSign className="h-4 w-4 mr-2" />
                        ${currentImage.cost.toFixed(4)}
                      </div>
                    )}
                    
                    {currentImage.generationTime && (
                      <div className="flex items-center text-gray-300">
                        <Clock className="h-4 w-4 mr-2" />
                        {currentImage.generationTime}s
                      </div>
                    )}
                  </div>
                </div>

                {/* Parameters */}
                {Object.keys(currentImage.parameters).length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-white font-semibold">Parameters</h3>
                    <div className="space-y-2 text-sm">
                      {Object.entries(currentImage.parameters).map(([key, value]) => (
                        <div key={key} className="flex justify-between text-gray-300">
                          <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                          <span>{String(value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
