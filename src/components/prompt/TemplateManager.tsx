'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { GlassCard, GlassPanel } from '@/components/ui/glass'
import { Typography, Spacing } from '@/components/ui/typography'
import { toastHelpers } from '@/lib/hooks/useToast'
import { 
  FileText, 
  Plus, 
  Edit, 
  Trash2, 
  Copy, 
  Star, 
  StarOff,
  Search,
  Filter,
  Download,
  Upload,
  Eye,
  Globe,
  Lock
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface PromptTemplate {
  id: string
  name: string
  description: string
  template: string
  category: string
  variables: string[]
  isPublic: boolean
  isFavorite: boolean
  usageCount: number
  createdAt: string
  updatedAt: string
  tags: string[]
}

interface TemplateManagerProps {
  onSelectTemplate: (template: PromptTemplate) => void
  className?: string
}

const TEMPLATE_CATEGORIES = [
  'Photography',
  'Art & Design',
  'Characters',
  'Landscapes',
  'Architecture',
  'Abstract',
  'Fashion',
  'Food',
  'Technology',
  'Fantasy',
  'Sci-Fi',
  'Custom'
]

const SAMPLE_TEMPLATES: PromptTemplate[] = [
  {
    id: 'portrait-pro',
    name: 'Professional Portrait',
    description: 'High-quality professional portrait photography',
    template: 'Professional portrait of {subject}, {lighting} lighting, {background} background, shot with {camera}, {style} style, high resolution, sharp focus',
    category: 'Photography',
    variables: ['subject', 'lighting', 'background', 'camera', 'style'],
    isPublic: true,
    isFavorite: false,
    usageCount: 45,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
    tags: ['portrait', 'professional', 'photography']
  },
  {
    id: 'landscape-scenic',
    name: 'Scenic Landscape',
    description: 'Beautiful natural landscape photography',
    template: '{time_of_day} view of {location}, {weather} weather, {season} season, {style} photography style, {mood} mood, dramatic lighting, high detail',
    category: 'Photography',
    variables: ['time_of_day', 'location', 'weather', 'season', 'style', 'mood'],
    isPublic: true,
    isFavorite: true,
    usageCount: 32,
    createdAt: '2024-01-14T15:30:00Z',
    updatedAt: '2024-01-14T15:30:00Z',
    tags: ['landscape', 'nature', 'scenic']
  },
  {
    id: 'character-fantasy',
    name: 'Fantasy Character',
    description: 'Detailed fantasy character design',
    template: '{character_type} character, {appearance} appearance, wearing {clothing}, {pose} pose, {setting} setting, fantasy art style, detailed, {mood} mood',
    category: 'Fantasy',
    variables: ['character_type', 'appearance', 'clothing', 'pose', 'setting', 'mood'],
    isPublic: true,
    isFavorite: false,
    usageCount: 28,
    createdAt: '2024-01-13T09:15:00Z',
    updatedAt: '2024-01-13T09:15:00Z',
    tags: ['fantasy', 'character', 'design']
  }
]

export function TemplateManager({ onSelectTemplate, className }: TemplateManagerProps) {
  const [templates, setTemplates] = useState<PromptTemplate[]>(SAMPLE_TEMPLATES)
  const [filteredTemplates, setFilteredTemplates] = useState<PromptTemplate[]>(SAMPLE_TEMPLATES)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<PromptTemplate | null>(null)
  
  // New template form state
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    description: '',
    template: '',
    category: 'Custom',
    tags: '',
    isPublic: false
  })

  // Filter templates based on search and category
  useEffect(() => {
    let filtered = templates

    if (searchQuery) {
      filtered = filtered.filter(template =>
        template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    }

    if (selectedCategory !== 'All') {
      filtered = filtered.filter(template => template.category === selectedCategory)
    }

    if (showFavoritesOnly) {
      filtered = filtered.filter(template => template.isFavorite)
    }

    setFilteredTemplates(filtered)
  }, [templates, searchQuery, selectedCategory, showFavoritesOnly])

  const handleCreateTemplate = () => {
    if (!newTemplate.name.trim() || !newTemplate.template.trim()) {
      toastHelpers.error('Missing Fields', 'Name and template are required')
      return
    }

    const template: PromptTemplate = {
      id: `template-${Date.now()}`,
      name: newTemplate.name,
      description: newTemplate.description,
      template: newTemplate.template,
      category: newTemplate.category,
      variables: extractVariables(newTemplate.template),
      isPublic: newTemplate.isPublic,
      isFavorite: false,
      usageCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: newTemplate.tags.split(',').map(tag => tag.trim()).filter(Boolean)
    }

    setTemplates(prev => [template, ...prev])
    setNewTemplate({
      name: '',
      description: '',
      template: '',
      category: 'Custom',
      tags: '',
      isPublic: false
    })
    setIsCreating(false)
    toastHelpers.success('Template Created', 'New template has been saved')
  }

  const handleEditTemplate = (template: PromptTemplate) => {
    setEditingTemplate(template)
    setNewTemplate({
      name: template.name,
      description: template.description,
      template: template.template,
      category: template.category,
      tags: template.tags.join(', '),
      isPublic: template.isPublic
    })
    setIsCreating(true)
  }

  const handleUpdateTemplate = () => {
    if (!editingTemplate) return

    const updatedTemplate: PromptTemplate = {
      ...editingTemplate,
      name: newTemplate.name,
      description: newTemplate.description,
      template: newTemplate.template,
      category: newTemplate.category,
      variables: extractVariables(newTemplate.template),
      isPublic: newTemplate.isPublic,
      updatedAt: new Date().toISOString(),
      tags: newTemplate.tags.split(',').map(tag => tag.trim()).filter(Boolean)
    }

    setTemplates(prev => prev.map(t => t.id === editingTemplate.id ? updatedTemplate : t))
    setEditingTemplate(null)
    setNewTemplate({
      name: '',
      description: '',
      template: '',
      category: 'Custom',
      tags: '',
      isPublic: false
    })
    setIsCreating(false)
    toastHelpers.success('Template Updated', 'Template has been updated')
  }

  const handleDeleteTemplate = (id: string) => {
    setTemplates(prev => prev.filter(t => t.id !== id))
    toastHelpers.success('Template Deleted', 'Template has been removed')
  }

  const handleToggleFavorite = (id: string) => {
    setTemplates(prev => prev.map(t => 
      t.id === id ? { ...t, isFavorite: !t.isFavorite } : t
    ))
  }

  const handleSelectTemplate = (template: PromptTemplate) => {
    // Update usage count
    setTemplates(prev => prev.map(t => 
      t.id === template.id ? { ...t, usageCount: t.usageCount + 1 } : t
    ))
    onSelectTemplate(template)
    toastHelpers.success('Template Applied', `"${template.name}" has been loaded`)
  }

  const extractVariables = (template: string): string[] => {
    const matches = template.match(/\{([^}]+)\}/g) || []
    return [...new Set(matches.map(match => match.slice(1, -1)))]
  }

  const handleExportTemplates = () => {
    const data = {
      templates: templates.filter(t => !t.isPublic), // Only export user templates
      exportedAt: new Date().toISOString(),
      version: '1.0'
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `prompt-templates-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImportTemplates = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (e) => {
          try {
            const data = JSON.parse(e.target?.result as string)
            if (data.templates && Array.isArray(data.templates)) {
              setTemplates(prev => [...data.templates, ...prev])
              toastHelpers.success('Templates Imported', `${data.templates.length} templates imported`)
            }
          } catch (error) {
            toastHelpers.error('Import Failed', 'Invalid template file format')
          }
        }
        reader.readAsText(file)
      }
    }
    input.click()
  }

  return (
    <GlassCard variant="premium" className={cn("overflow-hidden shadow-glass-xl", className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-purple-100 dark:bg-purple-900/20">
              <FileText className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <Typography variant="h4" color="high-contrast">
                Template Manager
              </Typography>
              <Typography variant="body-sm" color="muted">
                {filteredTemplates.length} of {templates.length} templates
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
              variant="outline"
              size="sm"
              onClick={() => setIsCreating(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              New
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Categories</SelectItem>
              {TEMPLATE_CATEGORIES.map(category => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Import/Export Actions */}
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleImportTemplates}
            className="text-xs"
          >
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleExportTemplates}
            className="text-xs"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>

        {/* Create/Edit Template Form */}
        {isCreating && (
          <GlassPanel variant="elevated" className="p-4 space-y-4">
            <Typography variant="h6" color="medium-contrast">
              {editingTemplate ? 'Edit Template' : 'Create New Template'}
            </Typography>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                placeholder="Template name"
                value={newTemplate.name}
                onChange={(e) => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
              />
              <Select
                value={newTemplate.category}
                onValueChange={(value) => setNewTemplate(prev => ({ ...prev, category: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TEMPLATE_CATEGORIES.map(category => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <Input
              placeholder="Description"
              value={newTemplate.description}
              onChange={(e) => setNewTemplate(prev => ({ ...prev, description: e.target.value }))}
            />
            
            <Textarea
              placeholder="Template content (use {variables} for dynamic parts)"
              value={newTemplate.template}
              onChange={(e) => setNewTemplate(prev => ({ ...prev, template: e.target.value }))}
              rows={3}
            />
            
            <Input
              placeholder="Tags (comma separated)"
              value={newTemplate.tags}
              onChange={(e) => setNewTemplate(prev => ({ ...prev, tags: e.target.value }))}
            />
            
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={newTemplate.isPublic}
                  onChange={(e) => setNewTemplate(prev => ({ ...prev, isPublic: e.target.checked }))}
                  className="rounded"
                />
                Make public
              </label>
              
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setIsCreating(false)
                    setEditingTemplate(null)
                    setNewTemplate({
                      name: '',
                      description: '',
                      template: '',
                      category: 'Custom',
                      tags: '',
                      isPublic: false
                    })
                  }}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={editingTemplate ? handleUpdateTemplate : handleCreateTemplate}
                >
                  {editingTemplate ? 'Update' : 'Create'}
                </Button>
              </div>
            </div>
          </GlassPanel>
        )}

        {/* Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates.map((template) => (
            <Card key={template.id} className="group hover:shadow-lg transition-all duration-200">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-sm font-semibold line-clamp-1">
                      {template.name}
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        {template.category}
                      </Badge>
                      {template.isPublic ? (
                        <Globe className="h-3 w-3 text-green-500" />
                      ) : (
                        <Lock className="h-3 w-3 text-gray-400" />
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleFavorite(template.id)}
                    className="p-1 h-auto"
                  >
                    {template.isFavorite ? (
                      <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                    ) : (
                      <StarOff className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0 space-y-3">
                <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                  {template.description}
                </p>
                
                <div className="flex flex-wrap gap-1">
                  {template.variables.slice(0, 3).map((variable) => (
                    <Badge key={variable} variant="outline" className="text-xs">
                      {variable}
                    </Badge>
                  ))}
                  {template.variables.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{template.variables.length - 3}
                    </Badge>
                  )}
                </div>
                
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Used {template.usageCount} times</span>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSelectTemplate(template)}
                      className="h-8 px-2 text-xs"
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      Use
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditTemplate(template)}
                      className="h-8 px-2 text-xs"
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteTemplate(template.id)}
                      className="h-8 px-2 text-xs text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredTemplates.length === 0 && (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <Typography variant="body" color="muted">
              No templates found matching your criteria
            </Typography>
          </div>
        )}
      </CardContent>
    </GlassCard>
  )
}
