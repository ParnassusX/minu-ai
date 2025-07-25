'use client'

import { useEffect, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { GlassPanel } from '@/components/ui/glass'
import { Typography } from '@/components/ui/typography'
import { useRealTimeGallery } from '@/lib/hooks/useWebSocket'
import { toastHelpers } from '@/lib/hooks/useToast'
import { GalleryUpdateData } from '@/types/websocket'
import { 
  RefreshCw, 
  CheckCircle, 
  AlertCircle, 
  Plus, 
  Trash2, 
  Edit,
  FolderPlus,
  Eye,
  EyeOff
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface RealTimeGallerySyncProps {
  onGalleryUpdate?: (updates: GalleryUpdateData[]) => void
  onRefreshNeeded?: () => void
  autoApplyUpdates?: boolean
  showUpdateBanner?: boolean
  className?: string
}

export function RealTimeGallerySync({
  onGalleryUpdate,
  onRefreshNeeded,
  autoApplyUpdates = false,
  showUpdateBanner = true,
  className
}: RealTimeGallerySyncProps) {
  const {
    pendingUpdates,
    lastUpdateTime,
    hasUpdates,
    clearPendingUpdates,
    getUpdatesByType,
    isConnected
  } = useRealTimeGallery()

  const [isMinimized, setIsMinimized] = useState(false)
  const [lastProcessedTime, setLastProcessedTime] = useState<Date | null>(null)

  // Auto-apply updates if enabled
  useEffect(() => {
    if (autoApplyUpdates && hasUpdates) {
      handleApplyUpdates()
    }
  }, [autoApplyUpdates, hasUpdates])

  // Notify parent component of updates
  useEffect(() => {
    if (hasUpdates && onGalleryUpdate) {
      onGalleryUpdate(pendingUpdates)
    }
  }, [pendingUpdates, hasUpdates, onGalleryUpdate])

  // Show toast notifications for important updates
  useEffect(() => {
    if (!hasUpdates || !lastUpdateTime) return

    const newImages = getUpdatesByType('image_added')
    const deletedImages = getUpdatesByType('image_deleted')
    const newFolders = getUpdatesByType('folder_created')

    if (newImages.length > 0) {
      toastHelpers.success(
        'New Images!', 
        `${newImages.length} new image${newImages.length > 1 ? 's' : ''} generated`
      )
    }

    if (deletedImages.length > 0) {
      toastHelpers.info(
        'Images Removed', 
        `${deletedImages.length} image${deletedImages.length > 1 ? 's' : ''} deleted`
      )
    }

    if (newFolders.length > 0) {
      toastHelpers.info(
        'New Folder', 
        `Folder "${newFolders[0].data?.name}" created`
      )
    }
  }, [lastUpdateTime, hasUpdates, getUpdatesByType])

  const handleApplyUpdates = useCallback(() => {
    if (!hasUpdates) return

    setLastProcessedTime(new Date())
    clearPendingUpdates()
    onRefreshNeeded?.()
    
    toastHelpers.success('Updated!', 'Gallery synchronized with latest changes')
  }, [hasUpdates, clearPendingUpdates, onRefreshNeeded])

  const getUpdateIcon = (action: string) => {
    switch (action) {
      case 'image_added':
        return <Plus className="h-3 w-3 text-green-600" />
      case 'image_deleted':
        return <Trash2 className="h-3 w-3 text-red-600" />
      case 'image_updated':
        return <Edit className="h-3 w-3 text-blue-600" />
      case 'folder_created':
        return <FolderPlus className="h-3 w-3 text-purple-600" />
      case 'folder_updated':
        return <Edit className="h-3 w-3 text-purple-600" />
      case 'folder_deleted':
        return <Trash2 className="h-3 w-3 text-red-600" />
      case 'batch_operation_completed':
        return <CheckCircle className="h-3 w-3 text-green-600" />
      default:
        return <RefreshCw className="h-3 w-3 text-gray-600" />
    }
  }

  const getUpdateDescription = (update: GalleryUpdateData) => {
    switch (update.action) {
      case 'image_added':
        return `New image generated`
      case 'image_deleted':
        return `Image deleted`
      case 'image_updated':
        return `Image updated`
      case 'folder_created':
        return `Folder "${update.data?.name}" created`
      case 'folder_updated':
        return `Folder "${update.data?.name}" updated`
      case 'folder_deleted':
        return `Folder deleted`
      case 'batch_operation_completed':
        return `Batch operation completed (${update.affectedCount} items)`
      default:
        return `Gallery updated`
    }
  }

  const groupedUpdates = pendingUpdates.reduce((acc, update) => {
    if (!acc[update.action]) {
      acc[update.action] = []
    }
    acc[update.action].push(update)
    return acc
  }, {} as Record<string, GalleryUpdateData[]>)

  if (!isConnected) {
    return (
      <GlassPanel variant="subtle" className={cn("p-3", className)}>
        <div className="flex items-center gap-2 text-gray-500">
          <AlertCircle className="h-4 w-4" />
          <Typography variant="body-sm">Real-time sync unavailable</Typography>
        </div>
      </GlassPanel>
    )
  }

  if (!hasUpdates && !showUpdateBanner) {
    return null
  }

  if (!hasUpdates) {
    return (
      <GlassPanel variant="subtle" className={cn("p-3", className)}>
        <div className="flex items-center gap-2 text-green-600">
          <CheckCircle className="h-4 w-4" />
          <Typography variant="body-sm">Gallery synchronized</Typography>
          {lastProcessedTime && (
            <Typography variant="body-xs" color="muted">
              Last updated {lastProcessedTime.toLocaleTimeString()}
            </Typography>
          )}
        </div>
      </GlassPanel>
    )
  }

  return (
    <GlassPanel 
      variant="elevated" 
      className={cn(
        "border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20",
        className
      )}
    >
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <RefreshCw className="h-5 w-5 text-blue-600" />
            <div>
              <Typography variant="body-sm" color="high-contrast" className="font-medium">
                Gallery Updates Available
              </Typography>
              <Typography variant="body-xs" color="medium-contrast">
                {pendingUpdates.length} pending update{pendingUpdates.length > 1 ? 's' : ''}
              </Typography>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMinimized(!isMinimized)}
            >
              {isMinimized ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            </Button>
            
            <Button
              size="sm"
              onClick={handleApplyUpdates}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Apply Updates
            </Button>
          </div>
        </div>

        {!isMinimized && (
          <div className="mt-4 space-y-2">
            {Object.entries(groupedUpdates).map(([action, updates]) => (
              <div
                key={action}
                className="flex items-center justify-between p-2 bg-white/50 dark:bg-gray-800/50 rounded"
              >
                <div className="flex items-center gap-2">
                  {getUpdateIcon(action)}
                  <Typography variant="body-xs" color="medium-contrast">
                    {getUpdateDescription(updates[0])}
                  </Typography>
                </div>
                
                {updates.length > 1 && (
                  <Badge variant="secondary" className="text-xs">
                    {updates.length}
                  </Badge>
                )}
              </div>
            ))}

            {lastUpdateTime && (
              <div className="pt-2 border-t border-blue-200 dark:border-blue-800">
                <Typography variant="body-xs" color="muted">
                  Last update: {lastUpdateTime.toLocaleTimeString()}
                </Typography>
              </div>
            )}
          </div>
        )}
      </div>
    </GlassPanel>
  )
}

// Connection status indicator component
export function ConnectionStatusIndicator({ className }: { className?: string }) {
  const { isConnected } = useRealTimeGallery()
  const [showDetails, setShowDetails] = useState(false)

  return (
    <div className={cn("relative", className)}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowDetails(!showDetails)}
        className="flex items-center gap-2"
      >
        <div className={cn(
          "w-2 h-2 rounded-full",
          isConnected ? "bg-green-500" : "bg-red-500"
        )} />
        <Typography variant="body-xs" color="muted">
          {isConnected ? 'Live' : 'Offline'}
        </Typography>
      </Button>

      {showDetails && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowDetails(false)}
          />
          
          <GlassPanel 
            variant="elevated"
            className="absolute right-0 top-full mt-2 w-64 z-50 p-3"
          >
            <Typography variant="body-sm" color="high-contrast" className="font-medium mb-2">
              Real-time Connection
            </Typography>
            
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span>Status:</span>
                <span className={cn(
                  "font-medium",
                  isConnected ? "text-green-600" : "text-red-600"
                )}>
                  {isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span>Features:</span>
                <span className="text-gray-600">
                  {isConnected ? 'All active' : 'Unavailable'}
                </span>
              </div>
              
              <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                <Typography variant="body-xs" color="muted">
                  {isConnected 
                    ? 'Gallery updates, progress tracking, and notifications are working in real-time.'
                    : 'Real-time features are currently unavailable. Some features may require manual refresh.'
                  }
                </Typography>
              </div>
            </div>
          </GlassPanel>
        </>
      )}
    </div>
  )
}
