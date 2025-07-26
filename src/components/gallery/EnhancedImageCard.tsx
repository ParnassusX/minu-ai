'use client'

import { useState } from 'react'
import { GlassCard, PremiumButton, PremiumBadge } from '@/components/ui/premium-glass'
import { Icons } from '@/components/ui/premium-icons'
import { Typography } from '@/components/ui/typography'
import { GalleryImage, GalleryView, formatCost, formatGenerationTime, getImageResolution, getMegapixels } from '@/types/gallery'
import { cn } from '@/lib/utils'

interface EnhancedImageCardProps {
  image: GalleryImage
  view: GalleryView
  isSelected?: boolean
  isSelecting?: boolean
  onSelect?: (imageId: string, selected: boolean) => void
  onPreview?: (image: GalleryImage) => void
  onUpdate?: (imageId: string, updates: Partial<GalleryImage>) => void
  onDelete?: (imageId: string) => void
  className?: string
}

export function EnhancedImageCard({
  image,
  view,
  isSelected = false,
  isSelecting = false,
  onSelect,
  onPreview,
  onUpdate,
  onDelete,
  className
}: EnhancedImageCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [showActions, setShowActions] = useState(false)

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation()
    onUpdate?.(image.id, { isFavorite: !image.isFavorite })
  }

  const handleSelect = (e: React.MouseEvent) => {
    e.stopPropagation()
    onSelect?.(image.id, !isSelected)
  }

  const handlePreview = () => {
    if (!isSelecting) {
      onPreview?.(image)
    }
  }

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation()
    await navigator.clipboard.writeText(image.prompt)
  }

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      const { downloadHighQualityImage } = await import('@/lib/download/imageDownload')
      await downloadHighQualityImage(image.url, image.id, 'luxury')
    } catch (error) {
      console.error('Download failed:', error)
      // Fallback to simple download
      const link = document.createElement('a')
      link.href = image.url
      link.download = `image-${image.id}-hq.jpg`
      link.click()
    }
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm('Are you sure you want to delete this image?')) {
      onDelete?.(image.id)
    }
  }

  const cardSize = view.size === 'small' ? 'h-48' : view.size === 'large' ? 'h-80' : 'h-64'
  const isCompact = view.mode === 'list' || view.size === 'small'

  return (
    <GlassCard
      variant="interactive"
      size="md"
      className={cn(
        "group relative transition-all duration-300 cursor-pointer",
        "hover:shadow-glass-lg hover:scale-[1.01]", // Reduced scale to prevent clipping
        "overflow-visible", // Allow content to be visible during hover
        isSelected && "ring-2 ring-primary-500 ring-offset-1", // Reduced ring offset
        isSelecting && "cursor-default",
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handlePreview}
    >
      {/* Selection Checkbox */}
      {isSelecting && (
        <div className="absolute top-3 left-3 z-20">
          <PremiumButton
            variant="glass"
            size="sm"
            onClick={handleSelect}
            className="h-8 w-8 p-0 rounded-full"
          >
            {isSelected ? (
              <Icons.check size="sm" variant="primary" />
            ) : (
              <Icons.square size="sm" variant="glass" />
            )}
          </PremiumButton>
        </div>
      )}

      {/* Storage Status Indicator */}
      {image.storage && !image.storage.persistent && (
        <div className="absolute top-3 right-14 z-20">
          <PremiumBadge variant="warning" className="text-xs">
            <Icons.clock size="xs" />
            Temp
          </PremiumBadge>
        </div>
      )}

      {/* Favorite Button */}
      <div className="absolute top-3 right-3 z-20">
        <PremiumButton
          variant="glass"
          size="sm"
          onClick={handleToggleFavorite}
          className={cn(
            "h-8 w-8 p-0 rounded-full transition-all duration-300",
            !isHovered && !image.isFavorite && "opacity-0"
          )}
        >
          {image.isFavorite ? (
            <Icons.heart size="sm" variant="error" />
          ) : (
            <Icons.heart size="sm" variant="glass" />
          )}
        </PremiumButton>
      </div>

      {/* Image Container - Optimized for Performance */}
      <div className={cn("relative overflow-hidden rounded-t-lg", cardSize)}>
        <img
          src={image.url}
          alt={image.prompt}
          className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-[1.03]"
          loading="lazy"
          decoding="async"
          onLoad={(e) => {
            // Fade in effect after load
            e.currentTarget.style.opacity = '1'
          }}
          style={{ opacity: 0, transition: 'opacity 0.3s ease' }}
        />
        
        {/* Overlay with quick actions */}
        <div className={cn(
          "absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300",
          "flex items-center justify-center gap-3",
          isHovered ? "opacity-100" : "opacity-0"
        )}>
          <PremiumButton
            variant="glass"
            size="sm"
            onClick={handleCopy}
            className="h-10 w-10 p-0 rounded-full"
          >
            <Icons.copy size="sm" variant="glass" />
          </PremiumButton>
          <PremiumButton
            variant="glass"
            size="sm"
            onClick={handleDownload}
            className="h-10 w-10 p-0 rounded-full"
          >
            <Icons.download size="sm" variant="glass" />
          </PremiumButton>
          <PremiumButton
            variant="glass"
            size="sm"
            onClick={() => setShowActions(!showActions)}
            className="h-10 w-10 p-0 rounded-full"
          >
            <Icons.more size="sm" variant="glass" />
          </PremiumButton>
        </div>
      </div>

      {/* Content - Optimized spacing */}
      {view.showMetadata && (
        <div className="p-3 space-y-2">
          {/* Prompt */}
          <div className="min-h-0">
            <Typography
              variant={isCompact ? "body-xs" : "body-sm"}
              color="high-contrast"
              className={cn(
                "break-words",
                isCompact ? "line-clamp-1" : "line-clamp-2"
              )}
            >
              {image.prompt}
            </Typography>
          </div>

          {/* Tags */}
          {view.showTags && image.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {image.tags.slice(0, isCompact ? 2 : 3).map((tag) => (
                <PremiumBadge key={tag} variant="glass" className="text-xs">
                  {tag}
                </PremiumBadge>
              ))}
              {image.tags.length > (isCompact ? 2 : 3) && (
                <PremiumBadge variant="primary" className="text-xs">
                  +{image.tags.length - (isCompact ? 2 : 3)}
                </PremiumBadge>
              )}
            </div>
          )}

          {/* Metadata - Compact grid */}
          {!isCompact && (
            <div className="grid grid-cols-2 gap-1.5 text-xs min-h-0">
              <div className="flex items-center gap-1 min-w-0">
                <Icons.monitor size="xs" variant="muted" />
                <Typography variant="body-xs" color="medium-contrast" className="truncate">
                  {getImageResolution(image)}
                </Typography>
              </div>
              <div className="flex items-center gap-1 min-w-0">
                <Typography variant="body-xs" color="medium-contrast" className="truncate">
                  {getMegapixels(image)}
                </Typography>
              </div>
              {image.cost && (
                <div className="flex items-center gap-1 min-w-0">
                  <Icons.dollar size="xs" variant="muted" />
                  <Typography variant="body-xs" color="medium-contrast" className="truncate">
                    {formatCost(image.cost)}
                  </Typography>
                </div>
              )}
              {image.generationTime && (
                <div className="flex items-center gap-1 min-w-0">
                  <Icons.clock size="xs" variant="muted" />
                  <Typography variant="body-xs" color="medium-contrast" className="truncate">
                    {formatGenerationTime(image.generationTime)}
                  </Typography>
                </div>
              )}
              {/* Storage Information */}
              {image.storage && (
                <div className="flex items-center gap-1 col-span-2 min-w-0">
                  <Icons.database size="xs" variant="muted" />
                  <Typography variant="body-xs" color="medium-contrast" className="truncate">
                    {image.storage.persistent ? 'Stored permanently' : 'Temporary URL'}
                  </Typography>
                  {image.storage.persistent && (
                    <PremiumBadge variant="success" className="text-xs ml-1 flex-shrink-0">
                      {image.storage.provider}
                    </PremiumBadge>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Model */}
          <div className="flex items-center justify-between">
            <PremiumBadge variant="default" className="text-xs">
              {image.model}
            </PremiumBadge>
            <Typography variant="body-xs" color="muted">
              {new Date(image.createdAt).toLocaleDateString()}
            </Typography>
          </div>
        </div>
      )}

      {/* Extended Actions Menu */}
      {showActions && (
        <div className="absolute bottom-4 right-4 z-30">
          <GlassCard variant="elevated" size="sm" className="p-2 space-y-1 min-w-[140px]">
            <PremiumButton
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                onPreview?.(image)
                setShowActions(false)
              }}
              className="w-full justify-start text-xs"
            >
              <Icons.eye size="xs" className="mr-2" />
              View Details
            </PremiumButton>
            <PremiumButton
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                // TODO: Implement edit functionality
                setShowActions(false)
              }}
              className="w-full justify-start text-xs"
            >
              <Icons.edit size="xs" className="mr-2" />
              Edit Tags
            </PremiumButton>
            <PremiumButton
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                // TODO: Implement move to folder
                setShowActions(false)
              }}
              className="w-full justify-start text-xs"
            >
              <Icons.folder size="xs" className="mr-2" />
              Move to Folder
            </PremiumButton>
            <div className="border-t border-surface-border my-1" />
            <PremiumButton
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              className="w-full justify-start text-xs text-error-500 hover:text-error-600"
            >
              <Icons.trash size="xs" className="mr-2" />
              Delete
            </PremiumButton>
          </GlassCard>
        </div>
      )}

      {/* Click outside to close actions */}
      {showActions && (
        <div
          className="fixed inset-0 z-20"
          onClick={() => setShowActions(false)}
        />
      )}
    </GlassCard>
  )
}
