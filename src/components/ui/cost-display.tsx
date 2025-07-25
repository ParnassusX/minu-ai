'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { DollarSign, Clock, Zap, TrendingUp, Info } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface CostEstimateProps {
  modelId: string
  operation: 'generation' | 'edit' | 'enhancement'
  numOutputs?: number
  className?: string
  showDetails?: boolean
}

interface CostBreakdown {
  baseRate: number
  operationMultiplier: number
  outputMultiplier: number
  estimatedCost: number
  estimatedTime: string
  currency: string
}

interface ActualCostProps {
  cost: number
  generationTime?: number
  currency?: string
  className?: string
  variant?: 'compact' | 'detailed'
}

// Cost rates per model (in USD)
const MODEL_RATES = {
  'flux-dev': { base: 0.003, generation: 1.0, edit: 1.2, enhancement: 1.5 },
  'flux-pro': { base: 0.005, generation: 1.0, edit: 1.2, enhancement: 1.5 },
  'flux-ultra': { base: 0.012, generation: 1.0, edit: 1.2, enhancement: 1.5 },
  'flux-schnell': { base: 0.001, generation: 1.0, edit: 1.2, enhancement: 1.5 },
  'flux-kontext-pro': { base: 0.05, generation: 1.0, edit: 1.0, enhancement: 1.3 },
  'flux-kontext-max': { base: 0.12, generation: 1.0, edit: 1.0, enhancement: 1.3 },
  'sdxl-lightning': { base: 0.002, generation: 1.0, edit: 1.1, enhancement: 1.4 },
  'ideogram-v2': { base: 0.008, generation: 1.0, edit: 1.2, enhancement: 1.5 },
  'seedream-3': { base: 0.006, generation: 1.0, edit: 1.1, enhancement: 1.4 }
}

// Estimated generation times (in seconds)
const TIME_ESTIMATES = {
  'flux-dev': { generation: 25, edit: 30, enhancement: 45 },
  'flux-pro': { generation: 35, edit: 40, enhancement: 55 },
  'flux-ultra': { generation: 45, edit: 50, enhancement: 65 },
  'flux-schnell': { generation: 8, edit: 12, enhancement: 18 },
  'flux-kontext-pro': { generation: 20, edit: 25, enhancement: 35 },
  'flux-kontext-max': { generation: 30, edit: 35, enhancement: 45 },
  'sdxl-lightning': { generation: 15, edit: 20, enhancement: 30 },
  'ideogram-v2': { generation: 28, edit: 35, enhancement: 50 },
  'seedream-3': { generation: 22, edit: 28, enhancement: 40 }
}

function calculateCostBreakdown(
  modelId: string, 
  operation: 'generation' | 'edit' | 'enhancement',
  numOutputs: number = 1
): CostBreakdown {
  const rates = MODEL_RATES[modelId as keyof typeof MODEL_RATES] || MODEL_RATES['flux-dev']
  const times = TIME_ESTIMATES[modelId as keyof typeof TIME_ESTIMATES] || TIME_ESTIMATES['flux-dev']
  
  const baseRate = rates.base
  const operationMultiplier = rates[operation]
  const outputMultiplier = numOutputs
  
  const estimatedCost = baseRate * operationMultiplier * outputMultiplier
  const estimatedTimeSeconds = times[operation] * Math.max(1, numOutputs * 0.8) // Slight efficiency for multiple outputs
  
  const estimatedTime = estimatedTimeSeconds < 60 
    ? `${Math.round(estimatedTimeSeconds)}s`
    : `${Math.round(estimatedTimeSeconds / 60)}m ${Math.round(estimatedTimeSeconds % 60)}s`

  return {
    baseRate,
    operationMultiplier,
    outputMultiplier,
    estimatedCost,
    estimatedTime,
    currency: 'USD'
  }
}

export function CostEstimate({
  modelId,
  operation,
  numOutputs = 1,
  className,
  showDetails = false
}: CostEstimateProps) {
  const [breakdown, setBreakdown] = useState<CostBreakdown | null>(null)

  useEffect(() => {
    const newBreakdown = calculateCostBreakdown(modelId, operation, numOutputs)
    setBreakdown(newBreakdown)
  }, [modelId, operation, numOutputs])

  if (!breakdown) return null

  const formatCost = (cost: number) => {
    if (cost < 0.001) return '<$0.001'
    if (cost < 0.01) return `$${cost.toFixed(4)}`
    return `$${cost.toFixed(3)}`
  }

  return (
    <TooltipProvider>
      <div className={cn(
        'flex items-center gap-2 p-2 rounded-lg',
        'bg-emerald-50/50 dark:bg-emerald-900/10',
        'border border-emerald-200/50 dark:border-emerald-800/50',
        className
      )}>
        <div className="flex items-center gap-1.5">
          <DollarSign className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
            Est. {formatCost(breakdown.estimatedCost)}
          </span>
        </div>
        
        <div className="flex items-center gap-1.5">
          <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <span className="text-sm text-blue-700 dark:text-blue-300">
            ~{breakdown.estimatedTime}
          </span>
        </div>

        {showDetails && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <Info className="h-3 w-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <div className="space-y-2">
                <p className="font-medium">Cost Breakdown</p>
                <div className="text-xs space-y-1">
                  <div className="flex justify-between">
                    <span>Base rate:</span>
                    <span>{formatCost(breakdown.baseRate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Operation ({operation}):</span>
                    <span>×{breakdown.operationMultiplier}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Outputs:</span>
                    <span>×{breakdown.outputMultiplier}</span>
                  </div>
                  <hr className="border-gray-200 dark:border-gray-700" />
                  <div className="flex justify-between font-medium">
                    <span>Total:</span>
                    <span>{formatCost(breakdown.estimatedCost)}</span>
                  </div>
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  )
}

export function ActualCost({
  cost,
  generationTime,
  currency = 'USD',
  className,
  variant = 'compact'
}: ActualCostProps) {
  const formatCost = (cost: number) => {
    if (cost < 0.001) return '<$0.001'
    if (cost < 0.01) return `$${cost.toFixed(4)}`
    return `$${cost.toFixed(3)}`
  }

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${Math.round(seconds)}s`
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.round(seconds % 60)
    return `${minutes}m ${remainingSeconds}s`
  }

  if (variant === 'compact') {
    return (
      <div className={cn(
        'flex items-center gap-2',
        className
      )}>
        <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
          <DollarSign className="h-3 w-3 mr-1" />
          {formatCost(cost)}
        </Badge>
        
        {generationTime && (
          <Badge variant="outline" className="text-xs">
            <Clock className="h-3 w-3 mr-1" />
            {formatTime(generationTime)}
          </Badge>
        )}
      </div>
    )
  }

  return (
    <div className={cn(
      'p-3 rounded-lg border',
      'bg-green-50/50 dark:bg-green-900/10',
      'border-green-200/50 dark:border-green-800/50',
      className
    )}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-full bg-green-100 dark:bg-green-900/30">
            <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-green-700 dark:text-green-300">
              Generation Cost
            </p>
            <p className="text-xs text-green-600 dark:text-green-400">
              Actual usage
            </p>
          </div>
        </div>
        
        <div className="text-right">
          <p className="text-lg font-bold text-green-700 dark:text-green-300">
            {formatCost(cost)}
          </p>
          {generationTime && (
            <p className="text-xs text-green-600 dark:text-green-400">
              in {formatTime(generationTime)}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
