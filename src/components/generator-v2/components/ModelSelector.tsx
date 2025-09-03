/**
 * Model Selector Component - Minu.AI Generator V2
 * Clean, accessible model selection dropdown
 */

'use client'

import React from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Zap, Crown, Sparkles, Clock } from 'lucide-react'
import { ModelSchema } from '../types/models'
import { formatCost } from '../lib/utils'

interface ModelSelectorProps {
  models: ModelSchema[]
  selectedModel: ModelSchema | null
  onModelSelect: (model: ModelSchema) => void
  disabled?: boolean
  className?: string
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({
  models,
  selectedModel,
  onModelSelect,
  disabled = false,
  className
}) => {
  const handleValueChange = (modelId: string) => {
    const model = models.find(m => m.id === modelId)
    if (model) {
      onModelSelect(model)
    }
  }
  
  const getModelIcon = (model: ModelSchema) => {
    if (model.isPriority) {
      return <Crown className="w-4 h-4 text-yellow-500" />
    }
    
    switch (model.performance.speed) {
      case 'fast':
        return <Zap className="w-4 h-4 text-green-500" />
      case 'medium':
        return <Clock className="w-4 h-4 text-blue-500" />
      case 'slow':
        return <Sparkles className="w-4 h-4 text-purple-500" />
      default:
        return null
    }
  }
  
  const getModelBadges = (model: ModelSchema) => {
    const badges = []
    
    if (model.isPriority) {
      badges.push(
        <Badge key="priority" variant="secondary" className="text-xs">
          Priority
        </Badge>
      )
    }
    
    if (model.performance.speed === 'fast') {
      badges.push(
        <Badge key="fast" variant="outline" className="text-xs text-green-600">
          Fast
        </Badge>
      )
    }
    
    if (model.capabilities.supportsImageInput) {
      badges.push(
        <Badge key="image-input" variant="outline" className="text-xs text-blue-600">
          Image Input
        </Badge>
      )
    }
    
    return badges
  }
  
  const getModelCost = (model: ModelSchema) => {
    if (model.pricing.costPerImage) {
      return formatCost(model.pricing.costPerImage)
    }
    if (model.pricing.costPerSecond) {
      return `${formatCost(model.pricing.costPerSecond)}/sec`
    }
    if (model.pricing.costPerUpscale) {
      return formatCost(model.pricing.costPerUpscale)
    }
    return 'Free'
  }
  
  if (models.length === 0) {
    return (
      <div className="text-sm text-gray-500 dark:text-gray-400 p-3 text-center">
        No models available for this mode
      </div>
    )
  }
  
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Select Model
      </label>
      
      <Select
        value={selectedModel?.id || ''}
        onValueChange={handleValueChange}
        disabled={disabled}
      >
        <SelectTrigger className="w-full" data-testid="model-selector">
          <SelectValue placeholder="Choose a model...">
            {selectedModel && (
              <div className="flex items-center gap-2">
                {getModelIcon(selectedModel)}
                <span className="truncate">{selectedModel.name}</span>
              </div>
            )}
          </SelectValue>
        </SelectTrigger>
        
        <SelectContent>
          {models.map((model) => (
            <SelectItem key={model.id} value={model.id} data-testid={`model-option-${model.id}`}>
              <div className="flex flex-col gap-1 py-1">
                {/* Model Name and Icon */}
                <div className="flex items-center gap-2">
                  {getModelIcon(model)}
                  <span className="font-medium">{model.name}</span>
                  <span className="text-xs text-gray-500 ml-auto">
                    {getModelCost(model)}
                  </span>
                </div>
                
                {/* Model Description */}
                <div className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                  {model.description}
                </div>
                
                {/* Model Badges */}
                <div className="flex flex-wrap gap-1 mt-1">
                  {getModelBadges(model)}
                </div>
                
                {/* Model Stats */}
                <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                  <span>~{model.performance.averageTime}s</span>
                  <span>{model.provider}</span>
                  <span>{Math.round(model.performance.reliability * 100)}% reliable</span>
                </div>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      {/* Selected Model Details */}
      {selectedModel && (
        <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                {getModelIcon(selectedModel)}
                <h4 className="font-medium text-sm truncate">
                  {selectedModel.name}
                </h4>
              </div>
              
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                {selectedModel.description}
              </p>
              
              <div className="flex flex-wrap gap-1 mb-2">
                {getModelBadges(selectedModel)}
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-gray-500">Speed:</span>
                  <span className="ml-1 capitalize">{selectedModel.performance.speed}</span>
                </div>
                <div>
                  <span className="text-gray-500">Avg Time:</span>
                  <span className="ml-1">{selectedModel.performance.averageTime}s</span>
                </div>
                <div>
                  <span className="text-gray-500">Cost:</span>
                  <span className="ml-1">{getModelCost(selectedModel)}</span>
                </div>
                <div>
                  <span className="text-gray-500">Reliability:</span>
                  <span className="ml-1">{Math.round(selectedModel.performance.reliability * 100)}%</span>
                </div>
              </div>
              
              {selectedModel.capabilities.supportsImageInput && (
                <div className="mt-2 text-xs text-blue-600 dark:text-blue-400">
                  ✓ Supports image input ({selectedModel.capabilities.maxImages} max)
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
