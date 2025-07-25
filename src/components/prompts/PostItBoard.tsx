'use client'

import { useState, useEffect } from 'react'
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent } from '@dnd-kit/core'
import { SortableContext, arrayMove } from '@dnd-kit/sortable'
import { GlassCard, PremiumButton, PremiumInput } from '@/components/ui/premium-glass'
import { Icons } from '@/components/ui/premium-icons'
import { PostItNote } from './PostItNote'
import { PromptTemplate } from './PromptTemplate'
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

interface PostItBoardProps {
  className?: string
  onPromptSelect?: (prompt: string) => void
  onPromptSave?: (prompt: Prompt) => void
}

const PROMPT_CATEGORIES = [
  { id: 'style', label: 'Art Style', color: '#3B82F6', icon: Icons.palette },
  { id: 'subject', label: 'Subject', color: '#10B981', icon: Icons.target },
  { id: 'lighting', label: 'Lighting', color: '#F59E0B', icon: Icons.zap },
  { id: 'composition', label: 'Composition', color: '#8B5CF6', icon: Icons.layers },
  { id: 'mood', label: 'Mood', color: '#EF4444', icon: Icons.brain },
  { id: 'custom', label: 'Custom', color: '#6B7280', icon: Icons.plus },
] as const

export function PostItBoard({ className, onPromptSelect, onPromptSave }: PostItBoardProps) {
  const [prompts, setPrompts] = useState<Prompt[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [newPrompt, setNewPrompt] = useState('')

  // Load prompts from localStorage or API
  useEffect(() => {
    const savedPrompts = localStorage.getItem('minu-ai-prompts')
    if (savedPrompts) {
      try {
        const parsed = JSON.parse(savedPrompts)
        setPrompts(parsed.map((p: any) => ({
          ...p,
          createdAt: new Date(p.createdAt),
          updatedAt: new Date(p.updatedAt)
        })))
      } catch (error) {
        console.error('Failed to load prompts:', error)
      }
    }
  }, [])

  // Save prompts to localStorage
  const savePrompts = (updatedPrompts: Prompt[]) => {
    setPrompts(updatedPrompts)
    localStorage.setItem('minu-ai-prompts', JSON.stringify(updatedPrompts))
  }

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    
    if (over && active.id !== over.id) {
      const oldIndex = prompts.findIndex(p => p.id === active.id)
      const newIndex = prompts.findIndex(p => p.id === over.id)
      
      if (oldIndex !== -1 && newIndex !== -1) {
        const reorderedPrompts = arrayMove(prompts, oldIndex, newIndex)
        savePrompts(reorderedPrompts)
      }
    }
    
    setActiveId(null)
  }

  const createNewPrompt = () => {
    if (!newPrompt.trim()) return

    const prompt: Prompt = {
      id: `prompt-${Date.now()}`,
      content: newPrompt.trim(),
      category: 'custom',
      color: PROMPT_CATEGORIES.find(c => c.id === 'custom')?.color || '#6B7280',
      tags: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      isFavorite: false
    }

    const updatedPrompts = [prompt, ...prompts]
    savePrompts(updatedPrompts)
    setNewPrompt('')
    setIsCreating(false)
    onPromptSave?.(prompt)
  }

  const updatePrompt = (id: string, updates: Partial<Prompt>) => {
    const updatedPrompts = prompts.map(p => 
      p.id === id 
        ? { ...p, ...updates, updatedAt: new Date() }
        : p
    )
    savePrompts(updatedPrompts)
  }

  const deletePrompt = (id: string) => {
    const updatedPrompts = prompts.filter(p => p.id !== id)
    savePrompts(updatedPrompts)
  }

  const filteredPrompts = prompts.filter(prompt => {
    const matchesCategory = selectedCategory === 'all' || prompt.category === selectedCategory
    const matchesSearch = searchQuery === '' || 
      prompt.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prompt.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    
    return matchesCategory && matchesSearch
  })

  const activePrompt = prompts.find(p => p.id === activeId)

  return (
    <div className={cn("w-full space-y-6", className)}>
      
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-text-primary">Prompt Board</h1>
            <p className="text-text-secondary">Organize and manage your creative prompts</p>
          </div>
          
          <PremiumButton
            variant="gradient"
            onClick={() => setIsCreating(true)}
            className="gap-2"
          >
            <Icons.plus size="sm" />
            New Prompt
          </PremiumButton>
        </div>

        {/* Search and Filters */}
        <GlassCard variant="subtle" size="sm">
          <div className="flex flex-col sm:flex-row gap-4">
            
            {/* Search */}
            <div className="flex-1">
              <PremiumInput
                variant="premium"
                placeholder="Search prompts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>

            {/* Category Filter */}
            <div className="flex gap-2 overflow-x-auto">
              <PremiumButton
                variant={selectedCategory === 'all' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setSelectedCategory('all')}
              >
                All
              </PremiumButton>
              
              {PROMPT_CATEGORIES.map(category => (
                <PremiumButton
                  key={category.id}
                  variant={selectedCategory === category.id ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => setSelectedCategory(category.id)}
                  className="gap-2 whitespace-nowrap"
                >
                  <category.icon size="xs" />
                  {category.label}
                </PremiumButton>
              ))}
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Create New Prompt Modal */}
      {isCreating && (
        <GlassCard variant="elevated" size="md">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-text-primary">Create New Prompt</h3>
              <PremiumButton
                variant="ghost"
                size="sm"
                onClick={() => setIsCreating(false)}
              >
                <Icons.close size="sm" />
              </PremiumButton>
            </div>
            
            <textarea
              value={newPrompt}
              onChange={(e) => setNewPrompt(e.target.value)}
              placeholder="Enter your prompt..."
              className="w-full h-24 p-3 bg-surface-glass border border-surface-border rounded-xl text-text-primary placeholder:text-text-muted resize-none focus:border-primary-500 focus:outline-none"
              autoFocus
            />
            
            <div className="flex justify-end gap-2">
              <PremiumButton
                variant="ghost"
                onClick={() => setIsCreating(false)}
              >
                Cancel
              </PremiumButton>
              <PremiumButton
                variant="primary"
                onClick={createNewPrompt}
                disabled={!newPrompt.trim()}
              >
                Create Prompt
              </PremiumButton>
            </div>
          </div>
        </GlassCard>
      )}

      {/* Post-it Board */}
      <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <SortableContext items={filteredPrompts.map(p => p.id)}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredPrompts.map(prompt => (
              <PostItNote
                key={prompt.id}
                prompt={prompt}
                onSelect={() => onPromptSelect?.(prompt.content)}
                onUpdate={(updates) => updatePrompt(prompt.id, updates)}
                onDelete={() => deletePrompt(prompt.id)}
              />
            ))}
          </div>
        </SortableContext>

        <DragOverlay>
          {activePrompt && (
            <PostItNote
              prompt={activePrompt}
              isDragging
              onSelect={() => {}}
              onUpdate={() => {}}
              onDelete={() => {}}
            />
          )}
        </DragOverlay>
      </DndContext>

      {/* Empty State */}
      {filteredPrompts.length === 0 && (
        <GlassCard variant="subtle" size="lg" className="text-center py-12">
          <Icons.prompts size="2xl" variant="muted" className="mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-text-primary mb-2">
            {searchQuery || selectedCategory !== 'all' ? 'No prompts found' : 'No prompts yet'}
          </h3>
          <p className="text-text-muted mb-6">
            {searchQuery || selectedCategory !== 'all' 
              ? 'Try adjusting your search or filter criteria'
              : 'Create your first prompt to get started'
            }
          </p>
          {!searchQuery && selectedCategory === 'all' && (
            <PremiumButton
              variant="primary"
              onClick={() => setIsCreating(true)}
              className="gap-2"
            >
              <Icons.plus size="sm" />
              Create First Prompt
            </PremiumButton>
          )}
        </GlassCard>
      )}
    </div>
  )
}
