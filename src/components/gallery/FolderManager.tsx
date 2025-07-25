'use client'

import { useState, useEffect } from 'react'
import { GlassCard, PremiumButton, PremiumInput, PremiumBadge } from '@/components/ui/premium-glass'
import { Icons } from '@/components/ui/premium-icons'
import { Typography } from '@/components/ui/typography'
import { toastHelpers } from '@/lib/hooks/useToast'
import { GalleryFolder, CreateFolderRequest, UpdateFolderRequest } from '@/types/gallery'
import { HexColorPicker } from 'react-colorful'
import { cn } from '@/lib/utils'

interface FolderManagerProps {
  folders: GalleryFolder[]
  selectedFolderId?: string | null
  onFolderSelect: (folderId: string | null) => void
  onFolderCreate: (folder: CreateFolderRequest) => Promise<void>
  onFolderUpdate: (folder: UpdateFolderRequest) => Promise<void>
  onFolderDelete: (folderId: string) => Promise<void>
  className?: string
}

const FOLDER_COLORS = [
  '#3b82f6', // blue
  '#ef4444', // red
  '#22c55e', // green
  '#f59e0b', // amber
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#84cc16', // lime
  '#f97316', // orange
  '#6366f1', // indigo
]

export function FolderManager({
  folders,
  selectedFolderId,
  onFolderSelect,
  onFolderCreate,
  onFolderUpdate,
  onFolderDelete,
  className
}: FolderManagerProps) {
  const [isCreating, setIsCreating] = useState(false)
  const [editingFolder, setEditingFolder] = useState<GalleryFolder | null>(null)
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [newFolderColor, setNewFolderColor] = useState(FOLDER_COLORS[0])

  const resetForm = () => {
    setNewFolderName('')
    setNewFolderColor(FOLDER_COLORS[0])
    setIsCreating(false)
    setEditingFolder(null)
    setShowColorPicker(false)
  }

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      toastHelpers.error('Invalid Name', 'Folder name cannot be empty')
      return
    }

    try {
      await onFolderCreate({
        name: newFolderName.trim(),
        color: newFolderColor
      })
      resetForm()
      toastHelpers.success('Created!', 'Folder created successfully')
    } catch (error) {
      console.error('Error creating folder:', error)
      toastHelpers.error('Creation Failed', 'Could not create folder')
    }
  }

  const handleUpdateFolder = async () => {
    if (!editingFolder || !newFolderName.trim()) {
      toastHelpers.error('Invalid Name', 'Folder name cannot be empty')
      return
    }

    try {
      await onFolderUpdate({
        id: editingFolder.id,
        name: newFolderName.trim(),
        color: newFolderColor
      })
      resetForm()
      toastHelpers.success('Updated!', 'Folder updated successfully')
    } catch (error) {
      console.error('Error updating folder:', error)
      toastHelpers.error('Update Failed', 'Could not update folder')
    }
  }

  const handleDeleteFolder = async (folder: GalleryFolder) => {
    if (folder.imageCount > 0) {
      toastHelpers.error('Cannot Delete', 'Move images out of folder first')
      return
    }

    if (!confirm(`Are you sure you want to delete "${folder.name}"?`)) {
      return
    }

    try {
      await onFolderDelete(folder.id)
      if (selectedFolderId === folder.id) {
        onFolderSelect(null)
      }
      toastHelpers.success('Deleted!', 'Folder deleted successfully')
    } catch (error) {
      console.error('Error deleting folder:', error)
      toastHelpers.error('Delete Failed', 'Could not delete folder')
    }
  }

  const handleEditFolder = (folder: GalleryFolder) => {
    setEditingFolder(folder)
    setNewFolderName(folder.name)
    setNewFolderColor(folder.color)
    setIsCreating(true)
  }

  return (
    <GlassCard variant="elevated" size="md" className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <Typography variant="h6" color="high-contrast">
          Folders
        </Typography>
        <PremiumButton
          variant="ghost"
          size="sm"
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2"
        >
          <Icons.folder size="sm" />
          New
        </PremiumButton>
      </div>

      {/* All Images (Root) */}
      <div
        className={cn(
          "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-300",
          "hover:bg-surface-glass/50",
          selectedFolderId === null && "bg-primary-100 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800"
        )}
        onClick={() => onFolderSelect(null)}
      >
        <div className="p-2 rounded-lg bg-surface-glass">
          <Icons.gallery size="sm" variant="muted" />
        </div>
        <div className="flex-1">
          <Typography variant="body-sm" color="high-contrast" className="font-medium">
            All Images
          </Typography>
          <Typography variant="body-xs" color="muted">
            {folders.reduce((total, folder) => total + folder.imageCount, 0)} images
          </Typography>
        </div>
      </div>

      {/* Folder List */}
      <div className="space-y-2">
        {folders.map((folder) => (
          <div
            key={folder.id}
            className={cn(
              "group flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-200",
              "hover:bg-white/50 dark:hover:bg-gray-800/50",
              selectedFolderId === folder.id && "bg-blue-100 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800"
            )}
            onClick={() => onFolderSelect(folder.id)}
          >
            <div
              className="p-2 rounded-lg"
              style={{ backgroundColor: folder.color + '20' }}
            >
              {selectedFolderId === folder.id ? (
                <Icons.folder size="sm" style={{ color: folder.color }} />
              ) : (
                <Icons.folder size="sm" style={{ color: folder.color }} />
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <Typography variant="body-sm" color="high-contrast" className="font-medium truncate">
                {folder.name}
              </Typography>
              <Typography variant="body-xs" color="muted">
                {folder.imageCount} images
              </Typography>
            </div>

            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <PremiumButton
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  handleEditFolder(folder)
                }}
                className="h-8 w-8 p-0"
              >
                <Icons.edit size="xs" />
              </PremiumButton>
              {folder.imageCount === 0 && (
                <PremiumButton
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDeleteFolder(folder)
                  }}
                  className="h-8 w-8 p-0 text-error-500 hover:text-error-700"
                >
                  <Icons.trash size="xs" />
                </PremiumButton>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Create/Edit Folder Form */}
      {isCreating && (
        <GlassCard variant="subtle" size="sm" className="space-y-4">
          <Typography variant="h6" color="medium-contrast">
            {editingFolder ? 'Edit Folder' : 'Create New Folder'}
          </Typography>

          <div>
            <Typography variant="body-sm" color="medium-contrast" className="mb-2 block font-medium">
              Folder Name
            </Typography>
            <PremiumInput
              variant="premium"
              placeholder="Enter folder name"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  editingFolder ? handleUpdateFolder() : handleCreateFolder()
                } else if (e.key === 'Escape') {
                  resetForm()
                }
              }}
              autoFocus
            />
          </div>

          <div>
            <Typography variant="body-sm" color="medium-contrast" className="mb-2 block font-medium">
              Color
            </Typography>
            <div className="flex items-center gap-3">
              <PremiumButton
                variant="outline"
                size="sm"
                onClick={() => setShowColorPicker(!showColorPicker)}
                className="flex items-center gap-2"
              >
                <div
                  className="w-4 h-4 rounded border"
                  style={{ backgroundColor: newFolderColor }}
                />
                <Icons.palette size="sm" />
              </PremiumButton>
              
              <div className="flex gap-1">
                {FOLDER_COLORS.map(color => (
                  <button
                    key={color}
                    className={cn(
                      "w-6 h-6 rounded border-2 transition-all",
                      newFolderColor === color 
                        ? "border-gray-400 scale-110" 
                        : "border-gray-200 hover:border-gray-400"
                    )}
                    style={{ backgroundColor: color }}
                    onClick={() => setNewFolderColor(color)}
                  />
                ))}
              </div>
            </div>
            
            {showColorPicker && (
              <div className="mt-3 p-3 border rounded-lg bg-white dark:bg-gray-800">
                <HexColorPicker
                  color={newFolderColor}
                  onChange={setNewFolderColor}
                />
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            <PremiumButton
              variant="ghost"
              onClick={resetForm}
            >
              <Icons.close size="sm" className="mr-2" />
              Cancel
            </PremiumButton>

            <PremiumButton
              variant="primary"
              onClick={editingFolder ? handleUpdateFolder : handleCreateFolder}
              disabled={!newFolderName.trim()}
            >
              <Icons.save size="sm" className="mr-2" />
              {editingFolder ? 'Update' : 'Create'}
            </PremiumButton>
          </div>
        </GlassCard>
      )}

      {folders.length === 0 && !isCreating && (
        <div className="text-center py-6">
          <Icons.folder size="lg" variant="muted" className="mx-auto mb-2" />
          <Typography variant="body-sm" color="muted">
            No folders yet. Create your first folder to organize images.
          </Typography>
        </div>
      )}
    </GlassCard>
  )
}
