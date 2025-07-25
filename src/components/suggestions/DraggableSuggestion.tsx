'use client'

import { useState, useRef } from 'react'
import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Typography } from '@/components/ui/typography'
import { toastHelpers } from '@/lib/hooks/useToast'
import { Suggestion } from '@/types/suggestion'
import { 
  GripVertical, 
  Copy, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff, 
  Star,
  TrendingUp,
  Plus
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface DraggableSuggestionProps {
  suggestion: Suggestion
  onEdit?: (suggestion: Suggestion) => void
  onDelete?: (id: string) => void
  onUse?: (suggestion: Suggestion) => void
  onTogglePublic?: (id: string, isPublic: boolean) => void
  isDragging?: boolean
  className?: string
  showActions?: boolean
  compact?: boolean
}

export function DraggableSuggestion({
  suggestion,
  onEdit,
  onDelete,
  onUse,
  onTogglePublic,
  className,
  showActions = true,
  compact = false
}: DraggableSuggestionProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [isPressed, setIsPressed] = useState(false)
  const dragRef = useRef<HTMLDivElement>(null)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging
  } = useDraggable({
    id: suggestion.id,
    data: {
      type: 'suggestion',
      suggestion
    }
  })

  const style = {
    transform: CSS.Translate.toString(transform),
  }

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation()
    await navigator.clipboard.writeText(suggestion.text)
    toastHelpers.success('Copied!', 'Suggestion copied to clipboard')
  }

  const handleUse = (e: React.MouseEvent) => {
    e.stopPropagation()
    onUse?.(suggestion)
  }

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    onEdit?.(suggestion)
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    onDelete?.(suggestion.id)
  }

  const handleTogglePublic = (e: React.MouseEvent) => {
    e.stopPropagation()
    onTogglePublic?.(suggestion.id, !suggestion.isPublic)
  }

  // Calculate rotation for post-it effect
  const rotation = (parseInt(suggestion.id.slice(-2), 16) % 6) - 3 // -3 to 3 degrees

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative cursor-pointer select-none transition-all duration-200",
        "hover:z-10 focus:z-10",
        isDragging && "z-50 opacity-80 scale-105",
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      {...attributes}
      {...listeners}
    >
      {/* Post-it Note */}
      <div
        className={cn(
          "relative p-4 rounded-lg shadow-lg transition-all duration-200",
          "border-t-4 border-l border-r border-b",
          "transform-gpu",
          compact ? "min-h-[80px]" : "min-h-[120px]",
          isHovered && "shadow-xl scale-105",
          isPressed && "scale-95",
          isDragging && "shadow-2xl rotate-3"
        )}
        style={{
          backgroundColor: suggestion.color + '20', // 20% opacity
          borderTopColor: suggestion.color,
          borderLeftColor: suggestion.color + '40',
          borderRightColor: suggestion.color + '40',
          borderBottomColor: suggestion.color + '40',
          transform: `rotate(${rotation}deg)`,
        }}
      >
        {/* Tape Effect */}
        <div
          className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-8 h-4 rounded-sm opacity-60"
          style={{
            backgroundColor: suggestion.color + '60',
            boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.1)'
          }}
        />

        {/* Content */}
        <div className="relative z-10">
          {/* Header */}
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1 min-w-0">
              <Typography 
                variant={compact ? "body-sm" : "body"} 
                color="high-contrast"
                className="font-semibold line-clamp-1"
              >
                {suggestion.title}
              </Typography>
              {!compact && suggestion.description && (
                <Typography variant="body-xs" color="muted" className="line-clamp-1 mt-1">
                  {suggestion.description}
                </Typography>
              )}
            </div>
            
            {showActions && (
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleUse}
                  className="h-6 w-6 p-0 hover:bg-white/50"
                >
                  <Plus className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopy}
                  className="h-6 w-6 p-0 hover:bg-white/50"
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>

          {/* Main Text */}
          <Typography 
            variant={compact ? "body-xs" : "body-sm"} 
            color="medium-contrast"
            className={compact ? "line-clamp-2" : "line-clamp-3"}
          >
            {suggestion.text}
          </Typography>

          {/* Tags */}
          {!compact && suggestion.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {suggestion.tags.slice(0, 2).map((tag) => (
                <Badge 
                  key={tag} 
                  variant="secondary" 
                  className="text-xs px-1 py-0 h-4"
                  style={{ backgroundColor: suggestion.color + '30' }}
                >
                  {tag}
                </Badge>
              ))}
              {suggestion.tags.length > 2 && (
                <Badge variant="secondary" className="text-xs px-1 py-0 h-4">
                  +{suggestion.tags.length - 2}
                </Badge>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-2">
              {suggestion.isPublic && (
                <Eye className="h-3 w-3 text-green-600" />
              )}
              {suggestion.usageCount > 0 && (
                <div className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-gray-500" />
                  <Typography variant="body-xs" color="muted">
                    {suggestion.usageCount}
                  </Typography>
                </div>
              )}
            </div>

            {/* Action Menu */}
            {showActions && (
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {onTogglePublic && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleTogglePublic}
                    className="h-6 w-6 p-0 hover:bg-white/50"
                  >
                    {suggestion.isPublic ? (
                      <Eye className="h-3 w-3 text-green-600" />
                    ) : (
                      <EyeOff className="h-3 w-3 text-gray-400" />
                    )}
                  </Button>
                )}
                
                {onEdit && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleEdit}
                    className="h-6 w-6 p-0 hover:bg-white/50"
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                )}
                
                {onDelete && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDelete}
                    className="h-6 w-6 p-0 hover:bg-white/50 text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Drag Handle */}
        <div 
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-50 transition-opacity cursor-grab active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4 text-gray-600" />
        </div>

        {/* Shadow overlay for depth */}
        <div 
          className="absolute inset-0 rounded-lg pointer-events-none"
          style={{
            background: `linear-gradient(135deg, transparent 0%, ${suggestion.color}10 100%)`,
            boxShadow: `inset 0 1px 0 rgba(255,255,255,0.3), inset 0 -1px 0 rgba(0,0,0,0.1)`
          }}
        />
      </div>

      {/* Drag Preview */}
      {isDragging && (
        <div className="fixed inset-0 pointer-events-none z-50">
          <div 
            className="absolute p-3 rounded-lg shadow-2xl border-2 backdrop-blur-sm"
            style={{
              backgroundColor: suggestion.color + '90',
              borderColor: suggestion.color,
              transform: 'rotate(5deg)'
            }}
          >
            <Typography variant="body-sm" className="text-white font-medium">
              {suggestion.title}
            </Typography>
          </div>
        </div>
      )}
    </div>
  )
}
