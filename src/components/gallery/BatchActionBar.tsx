'use client'

import { useState } from 'react'
import { GlassCard, PremiumButton, PremiumInput, PremiumBadge } from '@/components/ui/premium-glass'
import { Icons } from '@/components/ui/premium-icons'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Typography } from '@/components/ui/typography'
import { toastHelpers } from '@/lib/hooks/useToast'
import { GalleryFolder, BatchOperation, GallerySelection } from '@/types/gallery'
import { cn } from '@/lib/utils'

interface BatchActionBarProps {
  selection: GallerySelection
  folders: GalleryFolder[]
  onBatchOperation: (operation: BatchOperation) => Promise<void>
  onSelectionChange: (selection: Partial<GallerySelection>) => void
  onClearSelection: () => void
  className?: string
}

export function BatchActionBar({
  selection,
  folders,
  onBatchOperation,
  onSelectionChange,
  onClearSelection,
  className
}: BatchActionBarProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [showTagInput, setShowTagInput] = useState(false)
  const [tagInput, setTagInput] = useState('')
  const [showMoveToFolder, setShowMoveToFolder] = useState(false)

  const selectedCount = selection.selectedIds.size

  if (!selection.isSelecting || selectedCount === 0) {
    return null
  }

  const handleBatchOperation = async (operation: BatchOperation) => {
    setIsProcessing(true)
    try {
      await onBatchOperation(operation)
      onClearSelection()
    } catch (error) {
      console.error('Batch operation failed:', error)
      toastHelpers.error('Operation Failed', 'Could not complete batch operation')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedCount} images? This action cannot be undone.`)) {
      return
    }

    await handleBatchOperation({
      action: 'delete',
      imageIds: Array.from(selection.selectedIds)
    })
  }

  const handleMoveToFolder = async (folderId: string | null) => {
    await handleBatchOperation({
      action: 'move_to_folder',
      imageIds: Array.from(selection.selectedIds),
      data: { folderId }
    })
    setShowMoveToFolder(false)
  }

  const handleAddTags = async () => {
    if (!tagInput.trim()) {
      toastHelpers.error('Invalid Tags', 'Please enter at least one tag')
      return
    }

    const tags = tagInput.split(',').map(tag => tag.trim()).filter(Boolean)
    
    await handleBatchOperation({
      action: 'add_tags',
      imageIds: Array.from(selection.selectedIds),
      data: { tags }
    })
    
    setTagInput('')
    setShowTagInput(false)
  }

  const handleToggleFavorite = async (favorite: boolean) => {
    await handleBatchOperation({
      action: 'toggle_favorite',
      imageIds: Array.from(selection.selectedIds),
      data: { favorite }
    })
  }

  const handleSelectAll = () => {
    onSelectionChange({ selectAll: !selection.selectAll })
  }

  return (
    <GlassCard
      variant="elevated"
      size="lg"
      className={cn(
        "fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50",
        "shadow-glass-xl border border-white/20",
        className
      )}
    >
      <div className="flex items-center gap-4">
        {/* Selection Info */}
        <div className="flex items-center gap-3">
          <PremiumButton
            variant="ghost"
            size="sm"
            onClick={handleSelectAll}
            className="flex items-center gap-2"
          >
            {selection.selectAll ? (
              <Icons.check size="sm" />
            ) : (
              <Icons.square size="sm" />
            )}
            {selection.selectAll ? 'Deselect All' : 'Select All'}
          </PremiumButton>

          <PremiumBadge variant="glass" className="px-3 py-1">
            {selectedCount} selected
          </PremiumBadge>
        </div>

        {/* Divider */}
        <div className="h-6 w-px bg-gray-300 dark:bg-gray-600" />

        {/* Quick Actions */}
        <div className="flex items-center gap-2">
          <PremiumButton
            variant="outline"
            size="sm"
            onClick={() => handleToggleFavorite(true)}
            disabled={isProcessing}
            className="flex items-center gap-2"
          >
            <Icons.heart size="sm" />
            Favorite
          </PremiumButton>

          <PremiumButton
            variant="outline"
            size="sm"
            onClick={() => handleToggleFavorite(false)}
            disabled={isProcessing}
            className="flex items-center gap-2"
          >
            <Icons.heart size="sm" variant="muted" />
            Unfavorite
          </PremiumButton>

          <PremiumButton
            variant="outline"
            size="sm"
            onClick={() => setShowMoveToFolder(!showMoveToFolder)}
            disabled={isProcessing}
            className="flex items-center gap-2"
          >
            <Icons.folder size="sm" />
            Move
          </PremiumButton>

          <PremiumButton
            variant="outline"
            size="sm"
            onClick={() => setShowTagInput(!showTagInput)}
            disabled={isProcessing}
            className="flex items-center gap-2"
          >
            <Icons.tag size="sm" />
            Tag
          </PremiumButton>
        </div>

        {/* Divider */}
        <div className="h-6 w-px bg-gray-300 dark:bg-gray-600" />

        {/* Destructive Actions */}
        <div className="flex items-center gap-2">
          <PremiumButton
            variant="outline"
            size="sm"
            onClick={handleDelete}
            disabled={isProcessing}
            className="flex items-center gap-2 text-error-600 hover:text-error-700 border-error-200 hover:border-error-300"
          >
            <Icons.trash size="sm" />
            Delete
          </PremiumButton>
        </div>

        {/* Divider */}
        <div className="h-6 w-px bg-surface-border" />

        {/* Close */}
        <PremiumButton
          variant="ghost"
          size="sm"
          onClick={onClearSelection}
          className="flex items-center gap-2"
        >
          <Icons.close size="sm" />
          Cancel
        </PremiumButton>
      </div>

      {/* Expandable Sections */}
      {showMoveToFolder && (
        <div className="mt-4 pt-4 border-t border-surface-border">
          <Typography variant="body-sm" color="medium-contrast" className="mb-2">
            Move to folder:
          </Typography>
          <div className="flex items-center gap-2">
            <Select onValueChange={(value) => handleMoveToFolder(value === 'root' ? null : value)}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select folder" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="root">
                  <div className="flex items-center gap-2">
                    <Icons.folder size="sm" />
                    Root (No folder)
                  </div>
                </SelectItem>
                {folders.map((folder) => (
                  <SelectItem key={folder.id} value={folder.id}>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded"
                        style={{ backgroundColor: folder.color }}
                      />
                      {folder.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <PremiumButton
              variant="ghost"
              size="sm"
              onClick={() => setShowMoveToFolder(false)}
            >
              Cancel
            </PremiumButton>
          </div>
        </div>
      )}

      {showTagInput && (
        <div className="mt-4 pt-4 border-t border-surface-border">
          <Typography variant="body-sm" color="medium-contrast" className="mb-2">
            Add tags (comma separated):
          </Typography>
          <div className="flex items-center gap-2">
            <PremiumInput
              variant="premium"
              placeholder="tag1, tag2, tag3"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleAddTags()
                } else if (e.key === 'Escape') {
                  setShowTagInput(false)
                  setTagInput('')
                }
              }}
              className="flex-1"
              autoFocus
            />
            <PremiumButton
              variant="primary"
              size="sm"
              onClick={handleAddTags}
              disabled={!tagInput.trim()}
            >
              Add Tags
            </PremiumButton>
            <PremiumButton
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowTagInput(false)
                setTagInput('')
              }}
            >
              Cancel
            </PremiumButton>
          </div>
        </div>
      )}

      {/* Processing Indicator */}
      {isProcessing && (
        <div className="absolute inset-0 bg-surface-glass/50 backdrop-blur-sm rounded-lg flex items-center justify-center">
          <div className="flex items-center gap-2">
            <Icons.loader size="sm" variant="primary" />
            <Typography variant="body-sm" color="medium-contrast">
              Processing...
            </Typography>
          </div>
        </div>
      )}
    </GlassCard>
  )
}
