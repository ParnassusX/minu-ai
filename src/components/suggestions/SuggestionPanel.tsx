'use client'

import { useState, useEffect, useMemo } from 'react'
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent } from '@dnd-kit/core'
import { SortableContext, rectSortingStrategy } from '@dnd-kit/sortable'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { GlassCard, GlassPanel } from '@/components/ui/glass'
import { Typography, Container } from '@/components/ui/typography'
import { DraggableSuggestion } from './DraggableSuggestion'
import { SuggestionManager } from './SuggestionManager'
import { toastHelpers } from '@/lib/hooks/useToast'
import { useDebouncedValue } from '@/lib/hooks/usePerformance'
import { 
  Suggestion, 
  SUGGESTION_CATEGORIES, 
  SuggestionCategory,
  CreateSuggestionRequest 
} from '@/types/suggestion'
import { 
  Search, 
  Plus, 
  Filter, 
  Grid, 
  List, 
  Settings,
  Sparkles,
  Download,
  Upload,
  RefreshCw
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface SuggestionPanelProps {
  onSuggestionDrop?: (suggestion: Suggestion) => void
  onSuggestionUse?: (suggestion: Suggestion) => void
  className?: string
  compact?: boolean
  currentMode?: string // ADDED: For contextual filtering
  selectedModel?: { id: string; name: string; category?: string } | null // ADDED: For model-specific suggestions
}

export function SuggestionPanel({
  onSuggestionDrop,
  onSuggestionUse,
  className,
  compact = false,
  currentMode,
  selectedModel
}: SuggestionPanelProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [filteredSuggestions, setFilteredSuggestions] = useState<Suggestion[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [isLoading, setIsLoading] = useState(true)
  const [isManaging, setIsManaging] = useState(false)
  const [draggedSuggestion, setDraggedSuggestion] = useState<Suggestion | null>(null)

  // Debounced search
  const debouncedSearch = useDebouncedValue(searchQuery, 300)

  // Fetch suggestions
  useEffect(() => {
    fetchSuggestions()
  }, [])

  // ENHANCED: Filter suggestions based on search, category, and contextual relevance
  useEffect(() => {
    let filtered = suggestions

    // Category filtering
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(s => s.category.toLowerCase() === selectedCategory.toLowerCase())
    }

    // ADDED: Contextual filtering based on current mode and model
    if (currentMode && compact) { // Only apply contextual filtering in compact mode (generator)
      // Prioritize suggestions relevant to current mode
      const modeKeywords = {
        'images': ['photo', 'image', 'picture', 'art', 'painting', 'drawing', 'portrait', 'landscape'],
        'video': ['video', 'motion', 'animation', 'cinematic', 'movement', 'sequence', 'clip'],
        'enhance': ['upscale', 'enhance', 'improve', 'quality', 'resolution', 'detail', 'sharp']
      }

      const currentModeKeywords = modeKeywords[currentMode as keyof typeof modeKeywords] || []

      // Score suggestions based on relevance
      filtered = filtered.map(s => ({
        ...s,
        relevanceScore: currentModeKeywords.reduce((score, keyword) => {
          const textMatch = s.text.toLowerCase().includes(keyword) ? 2 : 0
          const titleMatch = s.title.toLowerCase().includes(keyword) ? 3 : 0
          const tagMatch = s.tags.some(tag => tag.toLowerCase().includes(keyword)) ? 1 : 0
          return score + textMatch + titleMatch + tagMatch
        }, 0)
      }))

      // If we have a selected model, boost suggestions that mention the model or its category
      if (selectedModel) {
        const modelKeywords = [
          selectedModel.name.toLowerCase(),
          selectedModel.category?.toLowerCase() || '',
          selectedModel.id.toLowerCase()
        ].filter(Boolean)

        filtered = filtered.map(s => ({
          ...s,
          relevanceScore: s.relevanceScore + modelKeywords.reduce((score, keyword) => {
            const match = s.text.toLowerCase().includes(keyword) ||
                         s.title.toLowerCase().includes(keyword) ||
                         s.tags.some(tag => tag.toLowerCase().includes(keyword))
            return score + (match ? 5 : 0) // Higher boost for model-specific matches
          }, 0)
        }))
      }
    }

    // Search filtering
    if (debouncedSearch) {
      filtered = filtered.filter(s =>
        s.title.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        s.text.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        s.tags.some(tag => tag.toLowerCase().includes(debouncedSearch.toLowerCase()))
      )
    }

    // ENHANCED: Sort by relevance score (if available), then position, then usage count
    filtered.sort((a, b) => {
      // First sort by relevance score if in contextual mode
      if ('relevanceScore' in a && 'relevanceScore' in b) {
        const scoreA = (a as any).relevanceScore || 0
        const scoreB = (b as any).relevanceScore || 0
        if (scoreA !== scoreB) {
          return scoreB - scoreA // Higher scores first
        }
      }

      // Then by position
      if (a.position !== b.position) {
        return a.position - b.position
      }

      // Finally by usage count
      return b.usageCount - a.usageCount
    })

    setFilteredSuggestions(filtered)
  }, [suggestions, selectedCategory, debouncedSearch, currentMode, selectedModel, compact])

  // Get categories with counts
  const categoriesWithCounts = useMemo(() => {
    const counts = suggestions.reduce((acc, suggestion) => {
      const category = suggestion.category.toLowerCase()
      acc[category] = (acc[category] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return [
      { id: 'all', name: 'All', count: suggestions.length },
      ...SUGGESTION_CATEGORIES.map(cat => ({
        ...cat,
        count: counts[cat.id] || 0
      }))
    ]
  }, [suggestions])

  const fetchSuggestions = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/suggestions')
      
      if (response.ok) {
        const data = await response.json()
        setSuggestions(data.suggestions || [])
      } else {
        console.error('Failed to fetch suggestions')
        toastHelpers.error('Failed to Load', 'Could not load suggestions')
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error)
      toastHelpers.error('Error', 'Failed to load suggestions')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateSuggestion = async (suggestionData: CreateSuggestionRequest) => {
    try {
      const response = await fetch('/api/suggestions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(suggestionData)
      })

      if (response.ok) {
        const data = await response.json()
        setSuggestions(prev => [data.suggestion, ...prev])
        toastHelpers.success('Created!', 'New suggestion added')
        return data.suggestion
      } else {
        throw new Error('Failed to create suggestion')
      }
    } catch (error) {
      console.error('Error creating suggestion:', error)
      toastHelpers.error('Creation Failed', 'Could not create suggestion')
      return null
    }
  }

  const handleUpdateSuggestion = async (id: string, updates: any) => {
    try {
      const response = await fetch(`/api/suggestions/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates)
      })

      if (response.ok) {
        const data = await response.json()
        setSuggestions(prev => prev.map(s => s.id === id ? data.suggestion : s))
        toastHelpers.success('Updated!', 'Suggestion updated')
      } else {
        throw new Error('Failed to update suggestion')
      }
    } catch (error) {
      console.error('Error updating suggestion:', error)
      toastHelpers.error('Update Failed', 'Could not update suggestion')
    }
  }

  const handleDeleteSuggestion = async (id: string) => {
    try {
      const response = await fetch(`/api/suggestions/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setSuggestions(prev => prev.filter(s => s.id !== id))
        toastHelpers.success('Deleted!', 'Suggestion removed')
      } else {
        throw new Error('Failed to delete suggestion')
      }
    } catch (error) {
      console.error('Error deleting suggestion:', error)
      toastHelpers.error('Delete Failed', 'Could not delete suggestion')
    }
  }

  const handleUseSuggestion = async (suggestion: Suggestion) => {
    // Increment usage count
    try {
      await fetch(`/api/suggestions/${suggestion.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'increment_usage' })
      })

      // Update local state
      setSuggestions(prev => prev.map(s => 
        s.id === suggestion.id 
          ? { ...s, usageCount: s.usageCount + 1 }
          : s
      ))
    } catch (error) {
      console.error('Error incrementing usage:', error)
    }

    // Call the callback
    onSuggestionUse?.(suggestion)
  }

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    const suggestion = suggestions.find(s => s.id === active.id)
    setDraggedSuggestion(suggestion || null)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setDraggedSuggestion(null)

    if (over && over.id === 'prompt-drop-zone') {
      const suggestion = suggestions.find(s => s.id === active.id)
      if (suggestion) {
        handleUseSuggestion(suggestion)
        onSuggestionDrop?.(suggestion)
      }
    }
  }

  const handleExportSuggestions = () => {
    const userSuggestions = suggestions.filter(s => !s.isPublic)
    const data = {
      suggestions: userSuggestions,
      exportedAt: new Date().toISOString(),
      version: '1.0'
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `suggestions-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImportSuggestions = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = async (e) => {
          try {
            const data = JSON.parse(e.target?.result as string)
            if (data.suggestions && Array.isArray(data.suggestions)) {
              // Import suggestions one by one
              for (const suggestion of data.suggestions) {
                await handleCreateSuggestion(suggestion)
              }
              toastHelpers.success('Imported!', `${data.suggestions.length} suggestions imported`)
            }
          } catch (error) {
            toastHelpers.error('Import Failed', 'Invalid file format')
          }
        }
        reader.readAsText(file)
      }
    }
    input.click()
  }

  if (isLoading) {
    return (
      <GlassCard variant="premium" className={cn("overflow-hidden shadow-glass-xl", className)}>
        <CardContent className="p-8 text-center">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mx-auto"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mx-auto"></div>
          </div>
        </CardContent>
      </GlassCard>
    )
  }

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <GlassCard variant="premium" className={cn("overflow-hidden shadow-glass-xl", className)}>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <Typography variant="h4" color="high-contrast">
                  Suggestion Library
                </Typography>
                <Typography variant="body-sm" color="muted">
                  {filteredSuggestions.length} of {suggestions.length} suggestions
                </Typography>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              >
                {viewMode === 'grid' ? <List className="h-4 w-4" /> : <Grid className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsManaging(!isManaging)}
              >
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Search and Filters */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search suggestions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleImportSuggestions}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Import
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportSuggestions}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={fetchSuggestions}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Category Tabs */}
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
            <TabsList className="grid grid-cols-4 lg:grid-cols-6 xl:grid-cols-9 gap-1 h-auto p-1">
              {categoriesWithCounts.slice(0, compact ? 4 : 9).map((category) => (
                <TabsTrigger
                  key={category.id}
                  value={category.id}
                  className="flex flex-col items-center gap-1 p-2 text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm"
                >
                  <span className="font-medium">{category.name}</span>
                  <Badge variant="secondary" className="text-xs h-4 px-1">
                    {category.count}
                  </Badge>
                </TabsTrigger>
              ))}
            </TabsList>

            {/* Suggestion Grid/List */}
            <div className="mt-6">
              <SortableContext items={filteredSuggestions.map(s => s.id)} strategy={rectSortingStrategy}>
                <div className={cn(
                  "gap-4",
                  viewMode === 'grid' 
                    ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" 
                    : "space-y-2"
                )}>
                  {filteredSuggestions.map((suggestion) => (
                    <DraggableSuggestion
                      key={suggestion.id}
                      suggestion={suggestion}
                      onUse={handleUseSuggestion}
                      onEdit={(s) => handleUpdateSuggestion(s.id, s)}
                      onDelete={handleDeleteSuggestion}
                      onTogglePublic={(id, isPublic) => handleUpdateSuggestion(id, { isPublic })}
                      compact={compact || viewMode === 'list'}
                      showActions={isManaging}
                    />
                  ))}
                </div>
              </SortableContext>

              {filteredSuggestions.length === 0 && (
                <div className="text-center py-8">
                  <Sparkles className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <Typography variant="body" color="muted">
                    {searchQuery || selectedCategory !== 'all'
                      ? "No suggestions found matching your criteria"
                      : "No suggestions yet. Create your first suggestion!"
                    }
                  </Typography>
                </div>
              )}
            </div>
          </Tabs>

          {/* Management Panel */}
          {isManaging && (
            <SuggestionManager
              suggestions={suggestions}
              onCreateSuggestion={handleCreateSuggestion}
              onUpdateSuggestion={handleUpdateSuggestion}
              onDeleteSuggestion={handleDeleteSuggestion}
              onClose={() => setIsManaging(false)}
            />
          )}
        </CardContent>
      </GlassCard>

      {/* Drag Overlay */}
      <DragOverlay>
        {draggedSuggestion && (
          <DraggableSuggestion
            suggestion={draggedSuggestion}
            isDragging
            showActions={false}
            compact
          />
        )}
      </DragOverlay>
    </DndContext>
  )
}
