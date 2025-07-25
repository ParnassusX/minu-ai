'use client'

import { useState } from 'react'
import { GlassCard, PremiumButton } from '@/components/ui/premium-glass'
import { Icons } from '@/components/ui/premium-icons'
import { cn } from '@/lib/utils'

interface Template {
  id: string
  name: string
  description: string
  content: string
  category: string
  tags: string[]
  isBuiltIn: boolean
  usageCount: number
}

interface PromptTemplateProps {
  className?: string
  onTemplateSelect?: (template: Template) => void
}

const BUILT_IN_TEMPLATES: Template[] = [
  {
    id: 'portrait-professional',
    name: 'Professional Portrait',
    description: 'High-quality professional headshot style',
    content: 'Professional headshot of [SUBJECT], clean background, studio lighting, sharp focus, high resolution, corporate style',
    category: 'Photography',
    tags: ['portrait', 'professional', 'headshot'],
    isBuiltIn: true,
    usageCount: 0
  },
  {
    id: 'landscape-cinematic',
    name: 'Cinematic Landscape',
    description: 'Epic landscape with cinematic feel',
    content: 'Cinematic landscape of [LOCATION], golden hour lighting, dramatic clouds, wide angle, epic composition, highly detailed',
    category: 'Landscape',
    tags: ['landscape', 'cinematic', 'nature'],
    isBuiltIn: true,
    usageCount: 0
  },
  {
    id: 'art-digital-painting',
    name: 'Digital Art Style',
    description: 'Modern digital painting aesthetic',
    content: 'Digital painting of [SUBJECT], vibrant colors, artistic brush strokes, concept art style, trending on artstation',
    category: 'Art',
    tags: ['digital', 'painting', 'art'],
    isBuiltIn: true,
    usageCount: 0
  },
  {
    id: 'product-commercial',
    name: 'Product Photography',
    description: 'Clean commercial product shot',
    content: 'Commercial product photography of [PRODUCT], white background, studio lighting, high resolution, clean composition',
    category: 'Product',
    tags: ['product', 'commercial', 'clean'],
    isBuiltIn: true,
    usageCount: 0
  },
  {
    id: 'character-fantasy',
    name: 'Fantasy Character',
    description: 'Fantasy character design',
    content: 'Fantasy character design of [CHARACTER], detailed armor, magical elements, epic pose, fantasy art style, highly detailed',
    category: 'Character',
    tags: ['fantasy', 'character', 'design'],
    isBuiltIn: true,
    usageCount: 0
  },
  {
    id: 'architecture-modern',
    name: 'Modern Architecture',
    description: 'Contemporary architectural photography',
    content: 'Modern architecture photography of [BUILDING], clean lines, minimalist design, natural lighting, architectural photography',
    category: 'Architecture',
    tags: ['architecture', 'modern', 'building'],
    isBuiltIn: true,
    usageCount: 0
  }
]

export function PromptTemplate({ className, onTemplateSelect }: PromptTemplateProps) {
  const [templates, setTemplates] = useState<Template[]>(BUILT_IN_TEMPLATES)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const categories = ['all', ...Array.from(new Set(templates.map(t => t.category)))]

  const filteredTemplates = templates.filter(template => {
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory
    const matchesSearch = searchQuery === '' || 
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    
    return matchesCategory && matchesSearch
  })

  const handleTemplateUse = (template: Template) => {
    // Update usage count
    const updatedTemplates = templates.map(t => 
      t.id === template.id 
        ? { ...t, usageCount: t.usageCount + 1 }
        : t
    )
    setTemplates(updatedTemplates)
    
    // Notify parent component
    onTemplateSelect?.(template)
  }

  return (
    <div className={cn("space-y-6", className)}>
      
      {/* Header */}
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">Prompt Templates</h2>
          <p className="text-text-secondary">Pre-built prompts to get you started quickly</p>
        </div>

        {/* Search and Filter */}
        <GlassCard variant="subtle" size="sm">
          <div className="flex flex-col sm:flex-row gap-4">
            
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Icons.search 
                  size="sm" 
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted" 
                />
                <input
                  type="text"
                  placeholder="Search templates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-surface-glass border border-surface-border rounded-lg text-text-primary placeholder:text-text-muted focus:border-primary-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Category Filter */}
            <div className="flex gap-2 overflow-x-auto">
              {categories.map(category => (
                <PremiumButton
                  key={category}
                  variant={selectedCategory === category ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className="whitespace-nowrap"
                >
                  {category === 'all' ? 'All' : category}
                </PremiumButton>
              ))}
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTemplates.map(template => (
          <GlassCard
            key={template.id}
            variant="interactive"
            size="md"
            className="group hover:border-primary-500/30 transition-all duration-200"
          >
            <div className="space-y-4">
              
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-text-primary group-hover:text-primary-400 transition-colors">
                    {template.name}
                  </h3>
                  <p className="text-sm text-text-secondary mt-1">
                    {template.description}
                  </p>
                </div>
                
                {template.isBuiltIn && (
                  <div className="ml-2">
                    <Icons.star 
                      size="sm" 
                      variant="warning" 
                      className="text-yellow-400" 
                    />
                  </div>
                )}
              </div>

              {/* Content Preview */}
              <div className="p-3 bg-surface-glass/50 rounded-lg border border-surface-border/50">
                <p className="text-sm text-text-primary leading-relaxed line-clamp-3">
                  {template.content}
                </p>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-1">
                {template.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-primary-500/20 text-primary-300 text-xs rounded-full"
                  >
                    #{tag}
                  </span>
                ))}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-2 border-t border-surface-border/50">
                <div className="flex items-center gap-2 text-xs text-text-muted">
                  <Icons.activity size="xs" />
                  <span>Used {template.usageCount} times</span>
                </div>
                
                <div className="flex gap-2">
                  <PremiumButton
                    variant="ghost"
                    size="sm"
                    onClick={() => navigator.clipboard.writeText(template.content)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Icons.copy size="sm" />
                  </PremiumButton>
                  
                  <PremiumButton
                    variant="primary"
                    size="sm"
                    onClick={() => handleTemplateUse(template)}
                    className="gap-2"
                  >
                    <Icons.zap size="sm" />
                    Use Template
                  </PremiumButton>
                </div>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Empty State */}
      {filteredTemplates.length === 0 && (
        <GlassCard variant="subtle" size="lg" className="text-center py-12">
          <Icons.search size="2xl" variant="muted" className="mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-text-primary mb-2">
            No templates found
          </h3>
          <p className="text-text-muted mb-6">
            Try adjusting your search or filter criteria
          </p>
          <PremiumButton
            variant="ghost"
            onClick={() => {
              setSearchQuery('')
              setSelectedCategory('all')
            }}
          >
            Clear Filters
          </PremiumButton>
        </GlassCard>
      )}
    </div>
  )
}
