'use client'

import { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GlassCard, PremiumButton } from '@/components/ui/premium-glass'
import { Icons } from '@/components/ui/premium-icons'
import { cn } from '@/lib/utils'

interface Prompt {
  id: string
  content: string
  category: 'style' | 'subject' | 'lighting' | 'composition' | 'mood' | 'custom'
  color: string
  tags: string[]
  createdAt: Date
  updatedAt: Date
  isFavorite: boolean
}

interface PostItNoteProps {
  prompt: Prompt
  isDragging?: boolean
  onSelect: () => void
  onUpdate: (updates: Partial<Prompt>) => void
  onDelete: () => void
}

const CATEGORY_COLORS = {
  style: 'bg-blue-500/20 border-blue-500/30 text-blue-300',
  subject: 'bg-green-500/20 border-green-500/30 text-green-300',
  lighting: 'bg-yellow-500/20 border-yellow-500/30 text-yellow-300',
  composition: 'bg-purple-500/20 border-purple-500/30 text-purple-300',
  mood: 'bg-red-500/20 border-red-500/30 text-red-300',
  custom: 'bg-neutral-500/20 border-neutral-500/30 text-neutral-300',
}

const CATEGORY_ICONS = {
  style: Icons.palette,
  subject: Icons.target,
  lighting: Icons.zap,
  composition: Icons.layers,
  mood: Icons.brain,
  custom: Icons.plus,
}

export function PostItNote({ prompt, isDragging, onSelect, onUpdate, onDelete }: PostItNoteProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(prompt.content)
  const [isHovered, setIsHovered] = useState(false)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: prompt.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const CategoryIcon = CATEGORY_ICONS[prompt.category]

  const handleSave = () => {
    if (editContent.trim() !== prompt.content) {
      onUpdate({ content: editContent.trim() })
    }
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditContent(prompt.content)
    setIsEditing(false)
  }

  const toggleFavorite = () => {
    onUpdate({ isFavorite: !prompt.isFavorite })
  }

  const formatDate = (date: Date) => {
    return new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(
      Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
      'day'
    )
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative transition-all duration-200",
        isDragging || isSortableDragging ? "opacity-50 scale-105 rotate-2" : "",
        isHovered ? "scale-105 rotate-1" : ""
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      {...attributes}
    >
      <GlassCard
        variant="interactive"
        size="md"
        className={cn(
          "h-48 flex flex-col justify-between cursor-pointer transition-all duration-200",
          "hover:shadow-lg hover:border-primary-500/30",
          "transform-gpu", // Hardware acceleration
          prompt.isFavorite && "ring-2 ring-primary-500/50"
        )}
        onClick={onSelect}
      >
        
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className={cn(
            "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
            CATEGORY_COLORS[prompt.category]
          )}>
            <CategoryIcon size="xs" />
            {prompt.category}
          </div>
          
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <PremiumButton
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                toggleFavorite()
              }}
              className={cn(
                "h-6 w-6 p-0",
                prompt.isFavorite ? "text-yellow-400" : "text-text-muted"
              )}
            >
              <Icons.star size="xs" />
            </PremiumButton>
            
            <PremiumButton
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                setIsEditing(true)
              }}
              className="h-6 w-6 p-0 text-text-muted hover:text-text-primary"
            >
              <Icons.edit size="xs" />
            </PremiumButton>
            
            <PremiumButton
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                onDelete()
              }}
              className="h-6 w-6 p-0 text-text-muted hover:text-error-500"
            >
              <Icons.delete size="xs" />
            </PremiumButton>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 py-2">
          {isEditing ? (
            <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full h-20 p-2 bg-surface-glass border border-surface-border rounded-lg text-sm text-text-primary placeholder:text-text-muted resize-none focus:border-primary-500 focus:outline-none"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.ctrlKey) {
                    handleSave()
                  } else if (e.key === 'Escape') {
                    handleCancel()
                  }
                }}
              />
              <div className="flex justify-end gap-1">
                <PremiumButton
                  variant="ghost"
                  size="sm"
                  onClick={handleCancel}
                  className="h-6 px-2 text-xs"
                >
                  Cancel
                </PremiumButton>
                <PremiumButton
                  variant="primary"
                  size="sm"
                  onClick={handleSave}
                  className="h-6 px-2 text-xs"
                >
                  Save
                </PremiumButton>
              </div>
            </div>
          ) : (
            <p className="text-sm text-text-primary leading-relaxed line-clamp-4">
              {prompt.content}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-text-muted">
          <span>{formatDate(prompt.updatedAt)}</span>
          
          {/* Drag Handle */}
          <div
            {...listeners}
            className="p-1 rounded cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Icons.more size="xs" className="rotate-90" />
          </div>
        </div>

        {/* Tags */}
        {prompt.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {prompt.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="px-2 py-0.5 bg-surface-glass/50 text-xs text-text-muted rounded-full"
              >
                #{tag}
              </span>
            ))}
            {prompt.tags.length > 3 && (
              <span className="px-2 py-0.5 bg-surface-glass/50 text-xs text-text-muted rounded-full">
                +{prompt.tags.length - 3}
              </span>
            )}
          </div>
        )}
      </GlassCard>
    </div>
  )
}

// Add CSS for line-clamp utility
const styles = `
  .line-clamp-4 {
    display: -webkit-box;
    -webkit-line-clamp: 4;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
`

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style')
  styleSheet.textContent = styles
  document.head.appendChild(styleSheet)
}
