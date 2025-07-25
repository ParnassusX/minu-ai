/**
 * Storage Progress Component
 * Displays progress for storage operations with detailed status
 */

'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Typography } from '@/components/ui/typography'
import { Icons } from '@/components/ui/premium-icons'
import { PremiumButton, GlassCard } from '@/components/ui/premium-glass'

export interface StorageProgressData {
  stage: 'downloading' | 'uploading' | 'storing' | 'complete' | 'error'
  fileIndex: number
  totalFiles: number
  progress: number // 0-100
  message?: string
  error?: string
  bytesTransferred?: number
  totalBytes?: number
}

interface StorageProgressProps {
  progress: StorageProgressData
  onCancel?: () => void
  onRetry?: () => void
  className?: string
}

export function StorageProgress({
  progress,
  onCancel,
  onRetry,
  className
}: StorageProgressProps) {
  const [animatedProgress, setAnimatedProgress] = useState(0)

  // Animate progress changes
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedProgress(progress.progress)
    }, 100)
    return () => clearTimeout(timer)
  }, [progress.progress])

  const getStageIcon = () => {
    switch (progress.stage) {
      case 'downloading':
        return <Icons.download className="animate-pulse" />
      case 'uploading':
        return <Icons.upload className="animate-pulse" />
      case 'storing':
        return <Icons.save className="animate-pulse" />
      case 'complete':
        return <Icons.check className="text-green-500" />
      case 'error':
        return <Icons.warning className="text-red-500" />
      default:
        return <Icons.loader className="animate-spin" />
    }
  }

  const getStageLabel = () => {
    switch (progress.stage) {
      case 'downloading':
        return 'Downloading from Replicate'
      case 'uploading':
        return 'Uploading to storage'
      case 'storing':
        return 'Saving to database'
      case 'complete':
        return 'Storage complete'
      case 'error':
        return 'Storage failed'
      default:
        return 'Processing'
    }
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  return (
    <GlassCard
      variant="elevated"
      size="md"
      className={cn("p-4 space-y-4", className)}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {getStageIcon()}
          <div>
            <Typography variant="body-sm" className="font-medium">
              {getStageLabel()}
            </Typography>
            <Typography variant="body-xs" color="muted">
              File {progress.fileIndex + 1} of {progress.totalFiles}
            </Typography>
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex items-center gap-2">
          {progress.stage === 'error' && onRetry && (
            <PremiumButton
              variant="outline"
              size="sm"
              onClick={onRetry}
              className="h-8"
            >
              <Icons.refresh size="xs" />
              Retry
            </PremiumButton>
          )}
          {onCancel && progress.stage !== 'complete' && progress.stage !== 'error' && (
            <PremiumButton
              variant="ghost"
              size="sm"
              onClick={onCancel}
              className="h-8"
            >
              <Icons.close size="xs" />
              Cancel
            </PremiumButton>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      {progress.stage !== 'error' && (
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span>{Math.round(animatedProgress)}%</span>
            {progress.bytesTransferred && progress.totalBytes && (
              <span>
                {formatBytes(progress.bytesTransferred)} / {formatBytes(progress.totalBytes)}
              </span>
            )}
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
            <div
              className={cn(
                "h-full transition-all duration-300 ease-out rounded-full",
                progress.stage === 'complete' 
                  ? "bg-green-500" 
                  : "bg-gradient-to-r from-blue-500 to-purple-500"
              )}
              style={{ width: `${animatedProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Message */}
      {progress.message && (
        <Typography variant="body-xs" color="muted" className="text-center">
          {progress.message}
        </Typography>
      )}

      {/* Error Message */}
      {progress.error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <Typography variant="body-sm" className="text-red-700 dark:text-red-300">
            {progress.error}
          </Typography>
        </div>
      )}

      {/* File Progress Grid */}
      {progress.totalFiles > 1 && (
        <div className="grid grid-cols-8 gap-1">
          {Array.from({ length: progress.totalFiles }, (_, i) => (
            <div
              key={i}
              className={cn(
                "h-2 rounded-full transition-colors duration-200",
                i < progress.fileIndex 
                  ? "bg-green-500" 
                  : i === progress.fileIndex 
                    ? "bg-blue-500" 
                    : "bg-gray-200 dark:bg-gray-700"
              )}
            />
          ))}
        </div>
      )}
    </GlassCard>
  )
}

/**
 * Compact Storage Progress for inline display
 */
interface CompactStorageProgressProps {
  progress: StorageProgressData
  className?: string
}

export function CompactStorageProgress({
  progress,
  className
}: CompactStorageProgressProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      {progress.stage === 'error' ? (
        <Icons.warning className="text-red-500" size="xs" />
      ) : progress.stage === 'complete' ? (
        <Icons.check className="text-green-500" size="xs" />
      ) : (
        <Icons.loader className="animate-spin" size="xs" />
      )}
      
      <div className="flex-1 min-w-0">
        <Typography variant="body-xs" className="truncate">
          {progress.message || `${Math.round(progress.progress)}% complete`}
        </Typography>
      </div>
      
      {progress.stage !== 'error' && progress.stage !== 'complete' && (
        <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-1">
          <div
            className="h-full bg-blue-500 rounded-full transition-all duration-300"
            style={{ width: `${progress.progress}%` }}
          />
        </div>
      )}
    </div>
  )
}

/**
 * Storage Error Display
 */
interface StorageErrorProps {
  error: string
  onRetry?: () => void
  onDismiss?: () => void
  className?: string
}

export function StorageError({
  error,
  onRetry,
  onDismiss,
  className
}: StorageErrorProps) {
  return (
    <GlassCard
      variant="elevated"
      className={cn("p-4 border-red-200 dark:border-red-800", className)}
    >
      <div className="flex items-start gap-3">
        <Icons.warning className="text-red-500 mt-0.5" size="sm" />
        <div className="flex-1 min-w-0">
          <Typography variant="body-sm" className="font-medium text-red-700 dark:text-red-300">
            Storage Error
          </Typography>
          <Typography variant="body-xs" color="muted" className="mt-1">
            {error}
          </Typography>
        </div>
        <div className="flex items-center gap-2">
          {onRetry && (
            <PremiumButton
              variant="outline"
              size="sm"
              onClick={onRetry}
              className="h-8"
            >
              <Icons.refresh size="xs" />
              Retry
            </PremiumButton>
          )}
          {onDismiss && (
            <PremiumButton
              variant="ghost"
              size="sm"
              onClick={onDismiss}
              className="h-8"
            >
              <Icons.close size="xs" />
            </PremiumButton>
          )}
        </div>
      </div>
    </GlassCard>
  )
}

export default StorageProgress
