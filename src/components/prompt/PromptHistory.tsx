'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { GlassCard, GlassPanel } from '@/components/ui/glass'
import { Typography, Spacing } from '@/components/ui/typography'
import { toastHelpers } from '@/lib/hooks/useToast'
import { 
  History, 
  Search, 
  Star, 
  StarOff, 
  Copy, 
  Trash2, 
  Filter,
  Calendar,
  TrendingUp,
  Eye,
  MoreHorizontal,
  Download,
  Tag
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface PromptHistoryItem {
  id: string
  prompt: string
  model: string
  parameters: Record<string, any>
  timestamp: string
  tags: string[]
  favorite: boolean
  category: string
  notes: string
  usageCount: number
  lastUsed: string
  generatedImages?: number
  success?: boolean
}

interface PromptHistoryProps {
  onSelectPrompt: (prompt: string) => void
  className?: string
}

export function PromptHistory({ onSelectPrompt, className }: PromptHistoryProps) {
  const [prompts, setPrompts] = useState<PromptHistoryItem[]>([])
  const [filteredPrompts, setFilteredPrompts] = useState<PromptHistoryItem[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [selectedModel, setSelectedModel] = useState('All')
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)
  const [sortBy, setSortBy] = useState<'recent' | 'usage' | 'success'>('recent')
  const [isLoading, setIsLoading] = useState(true)

  // Fetch prompt history
  useEffect(() => {
    fetchPromptHistory()
  }, [])

  // Filter and sort prompts
  useEffect(() => {
    let filtered = prompts

    if (searchQuery) {
      filtered = filtered.filter(prompt =>
        prompt.prompt.toLowerCase().includes(searchQuery.toLowerCase()) ||
        prompt.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
        prompt.notes.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    if (selectedCategory !== 'All') {
      filtered = filtered.filter(prompt => prompt.category === selectedCategory)
    }

    if (selectedModel !== 'All') {
      filtered = filtered.filter(prompt => prompt.model === selectedModel)
    }

    if (showFavoritesOnly) {
      filtered = filtered.filter(prompt => prompt.favorite)
    }

    // Sort prompts
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'usage':
          return b.usageCount - a.usageCount
        case 'success':
          return (b.success ? 1 : 0) - (a.success ? 1 : 0)
        case 'recent':
        default:
          return new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime()
      }
    })

    setFilteredPrompts(filtered)
  }, [prompts, searchQuery, selectedCategory, selectedModel, showFavoritesOnly, sortBy])

  const fetchPromptHistory = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/prompt-history')
      
      if (response.ok) {
        const data = await response.json()
        setPrompts(data.prompts || [])
      } else {
        console.error('Failed to fetch prompt history')
      }
    } catch (error) {
      console.error('Error fetching prompt history:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggleFavorite = async (id: string) => {
    const prompt = prompts.find(p => p.id === id)
    if (!prompt) return

    try {
      const response = await fetch(`/api/prompt-history/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          favorite: !prompt.favorite
        })
      })

      if (response.ok) {
        setPrompts(prev => prev.map(p => 
          p.id === id ? { ...p, favorite: !p.favorite } : p
        ))
        toastHelpers.success(
          prompt.favorite ? 'Removed from Favorites' : 'Added to Favorites',
          'Prompt updated successfully'
        )
      }
    } catch (error) {
      toastHelpers.error('Update Failed', 'Could not update favorite status')
    }
  }

  const handleDeletePrompt = async (id: string) => {
    try {
      const response = await fetch(`/api/prompt-history/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setPrompts(prev => prev.filter(p => p.id !== id))
        toastHelpers.success('Deleted', 'Prompt removed from history')
      }
    } catch (error) {
      toastHelpers.error('Delete Failed', 'Could not delete prompt')
    }
  }

  const handleSelectPrompt = (prompt: PromptHistoryItem) => {
    onSelectPrompt(prompt.prompt)
    
    // Update usage count
    setPrompts(prev => prev.map(p => 
      p.id === prompt.id 
        ? { ...p, usageCount: p.usageCount + 1, lastUsed: new Date().toISOString() }
        : p
    ))
    
    toastHelpers.success('Prompt Applied', 'Prompt has been loaded into the editor')
  }

  const handleCopyPrompt = async (prompt: string) => {
    await navigator.clipboard.writeText(prompt)
    toastHelpers.success('Copied!', 'Prompt copied to clipboard')
  }

  const handleExportHistory = () => {
    const data = {
      prompts: prompts,
      exportedAt: new Date().toISOString(),
      totalPrompts: prompts.length,
      version: '1.0'
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `prompt-history-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    
    if (diffInHours < 1) {
      return 'Just now'
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`
    } else if (diffInHours < 168) {
      return `${Math.floor(diffInHours / 24)}d ago`
    } else {
      return date.toLocaleDateString()
    }
  }

  const getUniqueCategories = () => {
    const categories = [...new Set(prompts.map(p => p.category))]
    return categories.filter(Boolean)
  }

  const getUniqueModels = () => {
    const models = [...new Set(prompts.map(p => p.model))]
    return models.filter(Boolean)
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
    <GlassCard variant="premium" className={cn("overflow-hidden shadow-glass-xl", className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/20">
              <History className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <Typography variant="h4" color="high-contrast">
                Prompt History
              </Typography>
              <Typography variant="body-sm" color="muted">
                {filteredPrompts.length} of {prompts.length} prompts
              </Typography>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
              className={cn(showFavoritesOnly && "bg-yellow-100 dark:bg-yellow-900/20")}
            >
              <Star className={cn("h-4 w-4", showFavoritesOnly && "fill-yellow-500 text-yellow-500")} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleExportHistory}
            >
              <Download className="h-4 w-4" />
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
              placeholder="Search prompts, tags, or notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Categories</SelectItem>
                {getUniqueCategories().map(category => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={selectedModel} onValueChange={setSelectedModel}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Model" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Models</SelectItem>
                {getUniqueModels().map(model => (
                  <SelectItem key={model} value={model}>
                    {model}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Most Recent</SelectItem>
                <SelectItem value="usage">Most Used</SelectItem>
                <SelectItem value="success">Most Successful</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Prompt List */}
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {filteredPrompts.map((prompt) => (
            <Card key={prompt.id} className="group hover:shadow-md transition-all duration-200">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="secondary" className="text-xs">
                        {prompt.model}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {prompt.category}
                      </Badge>
                      {prompt.success && (
                        <Badge variant="default" className="text-xs bg-green-100 text-green-800">
                          Success
                        </Badge>
                      )}
                    </div>
                    
                    <p className="text-sm text-gray-900 dark:text-gray-100 line-clamp-2 mb-2">
                      {prompt.prompt}
                    </p>
                    
                    {prompt.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {prompt.tags.slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            <Tag className="h-3 w-3 mr-1" />
                            {tag}
                          </Badge>
                        ))}
                        {prompt.tags.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{prompt.tags.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}
                    
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(prompt.lastUsed)}
                      </span>
                      <span className="flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        Used {prompt.usageCount} times
                      </span>
                      {prompt.generatedImages && (
                        <span>
                          {prompt.generatedImages} images
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleFavorite(prompt.id)}
                      className="p-1 h-auto"
                    >
                      {prompt.favorite ? (
                        <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                      ) : (
                        <StarOff className="h-4 w-4 text-gray-400" />
                      )}
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSelectPrompt(prompt)}
                      className="p-1 h-auto"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopyPrompt(prompt.prompt)}
                      className="p-1 h-auto"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeletePrompt(prompt.id)}
                      className="p-1 h-auto text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredPrompts.length === 0 && (
          <div className="text-center py-8">
            <History className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <Typography variant="body" color="muted">
              {prompts.length === 0 
                ? "No prompts in history yet" 
                : "No prompts found matching your criteria"
              }
            </Typography>
          </div>
        )}
      </CardContent>
    </GlassCard>
  )
}
