'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { GlassPanel } from '@/components/ui/glass'
import { Typography } from '@/components/ui/typography'
import { useGenerationProgress } from '@/lib/hooks/useWebSocket'
import { 
  GenerationProgressData, 
  formatGenerationProgress, 
  formatEstimatedTime 
} from '@/types/websocket'
import { 
  Clock, 
  Zap, 
  X, 
  CheckCircle, 
  XCircle, 
  Loader2,
  Users,
  DollarSign,
  Eye,
  EyeOff
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Helper function to get status icon
function getStatusIcon(status: string) {
  switch (status) {
    case 'queued':
      return <Users className="h-4 w-4 text-blue-500" />
    case 'processing':
      return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
    case 'completed':
      return <CheckCircle className="h-4 w-4 text-green-500" />
    case 'failed':
      return <XCircle className="h-4 w-4 text-red-500" />
    case 'cancelled':
      return <X className="h-4 w-4 text-gray-500" />
    default:
      return <Zap className="h-4 w-4 text-gray-500" />
  }
}

interface GenerationProgressTrackerProps {
  generationId?: string
  onComplete?: (generationId: string, success: boolean) => void
  onCancel?: (generationId: string) => void
  compact?: boolean
  className?: string
}

export function GenerationProgressTracker({
  generationId,
  onComplete,
  onCancel,
  compact = false,
  className
}: GenerationProgressTrackerProps) {
  const { 
    activeGenerations, 
    getGeneration, 
    startTracking, 
    stopTracking, 
    cancelGeneration,
    isConnected 
  } = useGenerationProgress()
  
  const [isMinimized, setIsMinimized] = useState(false)
  const [showAll, setShowAll] = useState(false)

  // Track specific generation if provided
  useEffect(() => {
    if (generationId && isConnected) {
      startTracking(generationId)
      return () => stopTracking(generationId)
    }
  }, [generationId, isConnected, startTracking, stopTracking])

  // Handle completion callbacks
  useEffect(() => {
    activeGenerations.forEach(generation => {
      if (generation.status === 'completed' || generation.status === 'failed') {
        onComplete?.(generation.generationId, generation.status === 'completed')
      }
    })
  }, [activeGenerations, onComplete])

  const handleCancel = (genId: string) => {
    cancelGeneration(genId)
    onCancel?.(genId)
  }



  const getStatusColor = (status: string) => {
    switch (status) {
      case 'queued': return 'bg-blue-500'
      case 'processing': return 'bg-blue-500'
      case 'completed': return 'bg-green-500'
      case 'failed': return 'bg-red-500'
      case 'cancelled': return 'bg-gray-500'
      default: return 'bg-gray-500'
    }
  }

  if (!isConnected) {
    return (
      <GlassPanel variant="subtle" className={cn("p-4", className)}>
        <div className="flex items-center gap-2 text-gray-500">
          <XCircle className="h-4 w-4" />
          <Typography variant="body-sm">Real-time tracking unavailable</Typography>
        </div>
      </GlassPanel>
    )
  }

  if (activeGenerations.length === 0) {
    return null
  }

  const displayGenerations = showAll ? activeGenerations : activeGenerations.slice(0, 3)
  const hasMore = activeGenerations.length > 3

  if (compact) {
    return (
      <div className={cn("space-y-2", className)}>
        {displayGenerations.map((generation) => (
          <CompactProgressItem
            key={generation.generationId}
            generation={generation}
            onCancel={handleCancel}
          />
        ))}
        {hasMore && !showAll && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAll(true)}
            className="w-full"
          >
            Show {activeGenerations.length - 3} more
          </Button>
        )}
      </div>
    )
  }

  return (
    <GlassPanel variant="elevated" className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <Typography variant="h6" color="high-contrast" className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-blue-600" />
          Generation Progress
          {activeGenerations.length > 0 && (
            <Badge variant="secondary">{activeGenerations.length}</Badge>
          )}
        </Typography>
        
        <div className="flex items-center gap-2">
          {hasMore && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAll(!showAll)}
            >
              {showAll ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {showAll ? 'Show Less' : `+${activeGenerations.length - 3}`}
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMinimized(!isMinimized)}
          >
            {isMinimized ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {!isMinimized && (
        <div className="space-y-3">
          {displayGenerations.map((generation) => (
            <FullProgressItem
              key={generation.generationId}
              generation={generation}
              onCancel={handleCancel}
            />
          ))}
        </div>
      )}
    </GlassPanel>
  )
}

function CompactProgressItem({ 
  generation, 
  onCancel 
}: { 
  generation: GenerationProgressData
  onCancel: (id: string) => void 
}) {
  const canCancel = generation.status === 'queued' || generation.status === 'processing'

  return (
    <div className="flex items-center gap-3 p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
      {getStatusIcon(generation.status)}
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <Typography variant="body-sm" color="high-contrast" className="truncate">
            {generation.prompt?.slice(0, 40) || `Generation ${generation.generationId.slice(0, 8)}`}...
          </Typography>
          <Typography variant="body-xs" color="muted">
            {generation.progress}%
          </Typography>
        </div>
        
        <Progress 
          value={generation.progress} 
          className="h-1"
        />
      </div>

      {canCancel && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onCancel(generation.generationId)}
          className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
        >
          <X className="h-3 w-3" />
        </Button>
      )}
    </div>
  )
}

function FullProgressItem({ 
  generation, 
  onCancel 
}: { 
  generation: GenerationProgressData
  onCancel: (id: string) => void 
}) {
  const canCancel = generation.status === 'queued' || generation.status === 'processing'

  return (
    <Card>
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getStatusIcon(generation.status)}
              <Typography variant="body-sm" color="high-contrast" className="font-medium">
                {formatGenerationProgress(generation)}
              </Typography>
            </div>
            
            <div className="flex items-center gap-2">
              {generation.cost && (
                <Badge variant="outline" className="text-xs">
                  <DollarSign className="h-3 w-3 mr-1" />
                  ${generation.cost.toFixed(4)}
                </Badge>
              )}
              {canCancel && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onCancel(generation.generationId)}
                  className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Prompt */}
          {generation.prompt && (
            <Typography variant="body-xs" color="muted" className="line-clamp-2">
              {generation.prompt}
            </Typography>
          )}

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-600 dark:text-gray-400">
                {generation.currentStep || 'Processing'}
              </span>
              <span className="text-gray-600 dark:text-gray-400">
                {generation.progress}%
              </span>
            </div>
            
            <Progress 
              value={generation.progress} 
              className="h-2"
            />
          </div>

          {/* Additional Info */}
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-4">
              {generation.model && (
                <span>Model: {generation.model}</span>
              )}
              {generation.queuePosition && (
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {generation.queuePosition}/{generation.totalInQueue}
                </span>
              )}
            </div>
            
            {generation.estimatedTime && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatEstimatedTime(generation.estimatedTime)}
              </span>
            )}
          </div>

          {/* Error Message */}
          {generation.error && (
            <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-800">
              <Typography variant="body-xs" className="text-red-700 dark:text-red-400">
                {generation.error}
              </Typography>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
