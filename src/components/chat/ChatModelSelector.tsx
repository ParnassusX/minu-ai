'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { ChevronDown, Zap, Crown, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface ChatModel {
  id: string
  name: string
  description: string
  tier: 'pro' | 'max'
  costPer1K: number
  capabilities: string[]
  recommended?: boolean
}

interface ChatModelSelectorProps {
  selectedModel: string
  onModelChange: (modelId: string) => void
  className?: string
  disabled?: boolean
}

const CHAT_MODELS: ChatModel[] = [
  {
    id: 'flux-kontext-pro',
    name: 'FLUX Kontext Pro',
    description: 'Fast, high-quality image editing with excellent instruction following',
    tier: 'pro',
    costPer1K: 0.05,
    capabilities: [
      'Fast generation (15-30s)',
      'High quality edits',
      'Good instruction following',
      'Style transfers'
    ],
    recommended: true
  },
  {
    id: 'flux-kontext-max',
    name: 'FLUX Kontext Max',
    description: 'Premium model with superior quality and advanced editing capabilities',
    tier: 'max',
    costPer1K: 0.12,
    capabilities: [
      'Superior quality',
      'Complex edits',
      'Advanced style control',
      'Precise modifications',
      'Better detail preservation'
    ]
  }
]

export function ChatModelSelector({
  selectedModel,
  onModelChange,
  className,
  disabled = false
}: ChatModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)

  const currentModel = CHAT_MODELS.find(model => model.id === selectedModel) || CHAT_MODELS[0]

  const getTierIcon = (tier: 'pro' | 'max') => {
    return tier === 'max' ? Crown : Zap
  }

  const getTierColor = (tier: 'pro' | 'max') => {
    return tier === 'max' 
      ? 'text-amber-600 dark:text-amber-400' 
      : 'text-blue-600 dark:text-blue-400'
  }

  const getTierBadgeColor = (tier: 'pro' | 'max') => {
    return tier === 'max'
      ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
      : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
  }

  return (
    <div className={cn('space-y-2', className)}>
      {/* Model Selector */}
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              'w-full justify-between h-auto p-4',
              'bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm',
              'border-gray-200/50 dark:border-gray-700/50',
              'hover:bg-white/60 dark:hover:bg-gray-800/60',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
            disabled={disabled}
          >
            <div className="flex items-center gap-3">
              <div className={cn(
                'p-2 rounded-lg',
                currentModel.tier === 'max' 
                  ? 'bg-amber-100 dark:bg-amber-900/30' 
                  : 'bg-blue-100 dark:bg-blue-900/30'
              )}>
                {(() => {
                  const Icon = getTierIcon(currentModel.tier)
                  return <Icon className={cn('h-4 w-4', getTierColor(currentModel.tier))} />
                })()}
              </div>
              
              <div className="text-left">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {currentModel.name}
                  </span>
                  {currentModel.recommended && (
                    <Badge variant="secondary" className="text-xs bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                      Recommended
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  ${currentModel.costPer1K.toFixed(3)} per edit
                </p>
              </div>
            </div>
            
            <ChevronDown className={cn(
              'h-4 w-4 text-gray-500 transition-transform',
              isOpen && 'rotate-180'
            )} />
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent className="w-80 p-2" align="start">
          {CHAT_MODELS.map((model) => {
            const Icon = getTierIcon(model.tier)
            const isSelected = model.id === selectedModel
            
            return (
              <DropdownMenuItem
                key={model.id}
                onClick={() => {
                  onModelChange(model.id)
                  setIsOpen(false)
                }}
                className={cn(
                  'p-4 cursor-pointer rounded-lg',
                  isSelected && 'bg-blue-50 dark:bg-blue-900/20'
                )}
              >
                <div className="flex items-start gap-3 w-full">
                  <div className={cn(
                    'p-2 rounded-lg flex-shrink-0',
                    model.tier === 'max' 
                      ? 'bg-amber-100 dark:bg-amber-900/30' 
                      : 'bg-blue-100 dark:bg-blue-900/30'
                  )}>
                    <Icon className={cn('h-4 w-4', getTierColor(model.tier))} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {model.name}
                      </span>
                      <Badge 
                        variant="outline" 
                        className={cn('text-xs', getTierBadgeColor(model.tier))}
                      >
                        {model.tier.toUpperCase()}
                      </Badge>
                      {model.recommended && (
                        <Badge variant="secondary" className="text-xs bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                          Recommended
                        </Badge>
                      )}
                    </div>
                    
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {model.description}
                    </p>
                    
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          Cost per edit:
                        </span>
                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                          ${model.costPer1K.toFixed(3)}
                        </span>
                      </div>
                      
                      <div className="flex flex-wrap gap-1 mt-2">
                        {model.capabilities.slice(0, 3).map((capability, index) => (
                          <Badge 
                            key={index}
                            variant="outline" 
                            className="text-xs bg-gray-50 dark:bg-gray-800"
                          >
                            {capability}
                          </Badge>
                        ))}
                        {model.capabilities.length > 3 && (
                          <Badge variant="outline" className="text-xs bg-gray-50 dark:bg-gray-800">
                            +{model.capabilities.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </DropdownMenuItem>
            )
          })}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Model Info */}
      <div className="flex items-start gap-2 p-3 bg-blue-50/50 dark:bg-blue-900/10 rounded-lg border border-blue-200/50 dark:border-blue-800/50">
        <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
        <div className="text-sm text-blue-700 dark:text-blue-300">
          <p className="font-medium mb-1">About {currentModel.name}</p>
          <p className="text-blue-600 dark:text-blue-400">
            {currentModel.description}
          </p>
        </div>
      </div>
    </div>
  )
}
