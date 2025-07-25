'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { GlassPanel } from '@/components/ui/glass'
import { Typography } from '@/components/ui/typography'
import { HexColorPicker } from 'react-colorful'
import { 
  Suggestion, 
  CreateSuggestionRequest, 
  SUGGESTION_CATEGORIES,
  SUGGESTION_COLORS,
  getRandomSuggestionColor 
} from '@/types/suggestion'
import { 
  Plus, 
  X, 
  Palette, 
  Tag, 
  Globe, 
  Lock,
  Save,
  RotateCcw
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface SuggestionManagerProps {
  suggestions: Suggestion[]
  onCreateSuggestion: (suggestion: CreateSuggestionRequest) => Promise<Suggestion | null>
  onUpdateSuggestion: (id: string, updates: any) => Promise<void>
  onDeleteSuggestion: (id: string) => Promise<void>
  onClose: () => void
}

export function SuggestionManager({
  suggestions,
  onCreateSuggestion,
  onUpdateSuggestion,
  onDeleteSuggestion,
  onClose
}: SuggestionManagerProps) {
  const [isCreating, setIsCreating] = useState(false)
  const [editingSuggestion, setEditingSuggestion] = useState<Suggestion | null>(null)
  const [showColorPicker, setShowColorPicker] = useState(false)
  
  // Form state
  const [formData, setFormData] = useState<CreateSuggestionRequest>({
    category: 'custom',
    title: '',
    text: '',
    description: '',
    color: getRandomSuggestionColor(),
    isPublic: false,
    tags: []
  })

  const [tagInput, setTagInput] = useState('')

  const resetForm = () => {
    setFormData({
      category: 'custom',
      title: '',
      text: '',
      description: '',
      color: getRandomSuggestionColor(),
      isPublic: false,
      tags: []
    })
    setTagInput('')
    setEditingSuggestion(null)
    setIsCreating(false)
  }

  const handleStartCreate = () => {
    resetForm()
    setIsCreating(true)
  }

  const handleStartEdit = (suggestion: Suggestion) => {
    setFormData({
      category: suggestion.category,
      title: suggestion.title,
      text: suggestion.text,
      description: suggestion.description || '',
      color: suggestion.color,
      isPublic: suggestion.isPublic,
      tags: suggestion.tags
    })
    setTagInput(suggestion.tags.join(', '))
    setEditingSuggestion(suggestion)
    setIsCreating(true)
  }

  const handleSubmit = async () => {
    if (!formData.title.trim() || !formData.text.trim()) {
      return
    }

    const suggestionData = {
      ...formData,
      tags: tagInput.split(',').map(tag => tag.trim()).filter(Boolean)
    }

    if (editingSuggestion) {
      await onUpdateSuggestion(editingSuggestion.id, suggestionData)
    } else {
      await onCreateSuggestion(suggestionData)
    }

    resetForm()
  }

  const handleAddTag = (tag: string) => {
    const currentTags = tagInput.split(',').map(t => t.trim()).filter(Boolean)
    if (!currentTags.includes(tag)) {
      setTagInput(currentTags.concat(tag).join(', '))
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    const currentTags = tagInput.split(',').map(t => t.trim()).filter(Boolean)
    setTagInput(currentTags.filter(tag => tag !== tagToRemove).join(', '))
  }

  const quickTags = ['photography', 'portrait', 'landscape', 'cinematic', 'artistic', 'professional', 'vintage', 'modern']

  return (
    <GlassPanel variant="elevated" className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <Typography variant="h5" color="high-contrast">
          Suggestion Manager
        </Typography>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Create/Edit Form */}
      {isCreating ? (
        <div className="space-y-4">
          <Typography variant="h6" color="medium-contrast">
            {editingSuggestion ? 'Edit Suggestion' : 'Create New Suggestion'}
          </Typography>

          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                Title
              </label>
              <Input
                placeholder="Suggestion title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                Category
              </label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="custom">Custom</SelectItem>
                  {SUGGESTION_CATEGORIES.map(category => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Text Content */}
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
              Suggestion Text
            </label>
            <Textarea
              placeholder="The text that will be added to prompts"
              value={formData.text}
              onChange={(e) => setFormData(prev => ({ ...prev, text: e.target.value }))}
              rows={3}
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
              Description (Optional)
            </label>
            <Input
              placeholder="Brief description of this suggestion"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            />
          </div>

          {/* Color Picker */}
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
              Color
            </label>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowColorPicker(!showColorPicker)}
                className="flex items-center gap-2"
              >
                <div 
                  className="w-4 h-4 rounded border"
                  style={{ backgroundColor: formData.color }}
                />
                <Palette className="h-4 w-4" />
              </Button>
              
              <div className="flex gap-1">
                {SUGGESTION_COLORS.slice(0, 8).map(color => (
                  <button
                    key={color}
                    className="w-6 h-6 rounded border-2 border-gray-200 hover:border-gray-400 transition-colors"
                    style={{ backgroundColor: color }}
                    onClick={() => setFormData(prev => ({ ...prev, color }))}
                  />
                ))}
              </div>
            </div>
            
            {showColorPicker && (
              <div className="mt-3 p-3 border rounded-lg bg-white dark:bg-gray-800">
                <HexColorPicker
                  color={formData.color}
                  onChange={(color) => setFormData(prev => ({ ...prev, color }))}
                />
              </div>
            )}
          </div>

          {/* Tags */}
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
              Tags
            </label>
            <Input
              placeholder="Enter tags separated by commas"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
            />
            
            {/* Quick Tags */}
            <div className="flex flex-wrap gap-1 mt-2">
              {quickTags.map(tag => (
                <Button
                  key={tag}
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddTag(tag)}
                  className="text-xs h-6"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  {tag}
                </Button>
              ))}
            </div>
            
            {/* Current Tags */}
            {tagInput && (
              <div className="flex flex-wrap gap-1 mt-2">
                {tagInput.split(',').map(tag => tag.trim()).filter(Boolean).map(tag => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="text-xs cursor-pointer hover:bg-red-100"
                    onClick={() => handleRemoveTag(tag)}
                  >
                    <Tag className="h-3 w-3 mr-1" />
                    {tag}
                    <X className="h-3 w-3 ml-1" />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Settings */}
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex items-center gap-2">
              {formData.isPublic ? (
                <Globe className="h-4 w-4 text-green-600" />
              ) : (
                <Lock className="h-4 w-4 text-gray-400" />
              )}
              <span className="text-sm font-medium">
                {formData.isPublic ? 'Public' : 'Private'}
              </span>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFormData(prev => ({ ...prev, isPublic: !prev.isPublic }))}
            >
              {formData.isPublic ? 'Make Private' : 'Make Public'}
            </Button>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={resetForm}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            
            <Button
              onClick={handleSubmit}
              disabled={!formData.title.trim() || !formData.text.trim()}
            >
              <Save className="h-4 w-4 mr-2" />
              {editingSuggestion ? 'Update' : 'Create'}
            </Button>
          </div>
        </div>
      ) : (
        /* Management Overview */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Typography variant="body" color="medium-contrast">
              Manage your suggestions and create new ones
            </Typography>
            <Button onClick={handleStartCreate}>
              <Plus className="h-4 w-4 mr-2" />
              New Suggestion
            </Button>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <Typography variant="body-sm" color="muted">Total</Typography>
              <Typography variant="h6" color="high-contrast">{suggestions.length}</Typography>
            </div>
            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <Typography variant="body-sm" color="muted">Public</Typography>
              <Typography variant="h6" color="high-contrast">
                {suggestions.filter(s => s.isPublic).length}
              </Typography>
            </div>
            <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <Typography variant="body-sm" color="muted">Categories</Typography>
              <Typography variant="h6" color="high-contrast">
                {new Set(suggestions.map(s => s.category)).size}
              </Typography>
            </div>
            <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
              <Typography variant="body-sm" color="muted">Most Used</Typography>
              <Typography variant="h6" color="high-contrast">
                {Math.max(...suggestions.map(s => s.usageCount), 0)}
              </Typography>
            </div>
          </div>

          {/* Recent Suggestions */}
          <div>
            <Typography variant="h6" color="medium-contrast" className="mb-3">
              Recent Suggestions
            </Typography>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {suggestions.slice(0, 5).map(suggestion => (
                <div
                  key={suggestion.id}
                  className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: suggestion.color }}
                    />
                    <div>
                      <Typography variant="body-sm" color="high-contrast">
                        {suggestion.title}
                      </Typography>
                      <Typography variant="body-xs" color="muted">
                        {suggestion.category} • Used {suggestion.usageCount} times
                      </Typography>
                    </div>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleStartEdit(suggestion)}
                  >
                    Edit
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </GlassPanel>
  )
}
