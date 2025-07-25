'use client'

import { useState, useEffect } from 'react'
import { GlassCard, PremiumButton, PremiumInput, PremiumBadge } from '@/components/ui/premium-glass'
import { Icons } from '@/components/ui/premium-icons'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Typography } from '@/components/ui/typography'
import { GalleryFilter, GallerySort, GalleryFolder } from '@/types/gallery'
import { useDebouncedValue } from '@/lib/hooks/usePerformance'
import { cn } from '@/lib/utils'

interface FilterPanelProps {
  filter: GalleryFilter
  sort: GallerySort
  folders: GalleryFolder[]
  availableTags: string[]
  availableModels: string[]
  onFilterChange: (filter: GalleryFilter) => void
  onSortChange: (sort: GallerySort) => void
  onReset: () => void
  className?: string
}

export function FilterPanel({
  filter,
  sort,
  folders,
  availableTags,
  availableModels,
  onFilterChange,
  onSortChange,
  onReset,
  className
}: FilterPanelProps) {
  const [searchInput, setSearchInput] = useState(filter.search || '')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [tagInput, setTagInput] = useState('')

  // Debounced search
  const debouncedSearch = useDebouncedValue(searchInput, 300)

  useEffect(() => {
    onFilterChange({ ...filter, search: debouncedSearch })
  }, [debouncedSearch])

  const handleFolderChange = (folderId: string) => {
    const newFolderId = folderId === 'all' ? undefined : folderId === 'root' ? null : folderId
    onFilterChange({ ...filter, folderId: newFolderId })
  }

  const handleTagAdd = (tag: string) => {
    if (!tag.trim() || filter.tags?.includes(tag)) return
    
    const newTags = [...(filter.tags || []), tag.trim()]
    onFilterChange({ ...filter, tags: newTags })
    setTagInput('')
  }

  const handleTagRemove = (tagToRemove: string) => {
    const newTags = filter.tags?.filter(tag => tag !== tagToRemove) || []
    onFilterChange({ ...filter, tags: newTags })
  }

  const handleModelToggle = (model: string) => {
    const currentModels = filter.models || []
    const newModels = currentModels.includes(model)
      ? currentModels.filter(m => m !== model)
      : [...currentModels, model]
    
    onFilterChange({ ...filter, models: newModels })
  }

  const handleDateRangeChange = (field: 'start' | 'end', value: string) => {
    const newDateRange = {
      start: filter.dateRange?.start || '',
      end: filter.dateRange?.end || '',
      [field]: value
    }
    
    if (!newDateRange.start && !newDateRange.end) {
      onFilterChange({ ...filter, dateRange: undefined })
    } else {
      onFilterChange({ ...filter, dateRange: newDateRange })
    }
  }

  const handleSortChange = (field: string) => {
    if (sort.field === field) {
      onSortChange({ ...sort, direction: sort.direction === 'asc' ? 'desc' : 'asc' })
    } else {
      onSortChange({ field: field as any, direction: 'desc' })
    }
  }

  const hasActiveFilters = !!(
    filter.search ||
    filter.folderId !== undefined ||
    filter.tags?.length ||
    filter.models?.length ||
    filter.favorites !== undefined ||
    filter.dateRange ||
    filter.sizeRange
  )

  return (
    <GlassCard variant="elevated" size="md" className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <Typography variant="h6" color="high-contrast">
          Filters & Sort
        </Typography>
        <div className="flex items-center gap-2">
          <PremiumButton
            variant="ghost"
            size="sm"
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            <Icons.settings size="sm" />
          </PremiumButton>
          {hasActiveFilters && (
            <PremiumButton
              variant="ghost"
              size="sm"
              onClick={onReset}
              className="text-error-500 hover:text-error-600"
            >
              <Icons.refresh size="sm" />
            </PremiumButton>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Icons.search className="absolute left-3 top-1/2 transform -translate-y-1/2" size="sm" variant="muted" />
        <PremiumInput
          variant="premium"
          placeholder="Search images, prompts, tags..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Quick Filters */}
      <div className="space-y-3">
        {/* Folder Filter */}
        <div>
          <Typography variant="body-sm" color="medium-contrast" className="mb-2">
            Folder
          </Typography>
          <Select 
            value={
              filter.folderId === undefined ? 'all' : 
              filter.folderId === null ? 'root' : 
              filter.folderId
            } 
            onValueChange={handleFolderChange}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Folders</SelectItem>
              <SelectItem value="root">
                <div className="flex items-center gap-2">
                  <Icons.folder size="sm" />
                  Root (No folder)
                </div>
              </SelectItem>
              {folders.map((folder) => (
                <SelectItem key={folder.id} value={folder.id}>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded"
                      style={{ backgroundColor: folder.color }}
                    />
                    {folder.name} ({folder.imageCount})
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Favorites Filter */}
        <div className="flex items-center gap-3">
          <Typography variant="body-sm" color="medium-contrast">
            Show only:
          </Typography>
          <div className="flex items-center gap-2">
            <Checkbox
              id="favorites"
              checked={filter.favorites === true}
              onCheckedChange={(checked) => 
                onFilterChange({ 
                  ...filter, 
                  favorites: checked ? true : undefined 
                })
              }
            />
            <label htmlFor="favorites" className="text-sm flex items-center gap-1 cursor-pointer">
              <Icons.heart size="xs" variant="muted" />
              Favorites
            </label>
          </div>
        </div>
      </div>

      {/* Sort */}
      <div>
        <Typography variant="body-sm" color="medium-contrast" className="mb-2">
          Sort by
        </Typography>
        <div className="grid grid-cols-2 gap-2">
          {[
            { field: 'createdAt', label: 'Date' },
            { field: 'prompt', label: 'Prompt' },
            { field: 'model', label: 'Model' },
            { field: 'cost', label: 'Cost' }
          ].map(({ field, label }) => (
            <PremiumButton
              key={field}
              variant={sort.field === field ? "primary" : "outline"}
              size="sm"
              onClick={() => handleSortChange(field)}
              className="flex items-center gap-2 justify-start"
            >
              <span>{label}</span>
              {sort.field === field && (
                sort.direction === 'asc' ?
                  <Icons.sortAsc size="xs" /> :
                  <Icons.sortDesc size="xs" />
              )}
            </PremiumButton>
          ))}
        </div>
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          {/* Tags Filter */}
          <div>
            <Typography variant="body-sm" color="medium-contrast" className="mb-2">
              Tags
            </Typography>
            <div className="space-y-2">
              <div className="flex gap-2">
                <PremiumInput
                  variant="premium"
                  placeholder="Add tag filter..."
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleTagAdd(tagInput)
                    }
                  }}
                  className="flex-1"
                />
                <PremiumButton
                  variant="primary"
                  size="sm"
                  onClick={() => handleTagAdd(tagInput)}
                  disabled={!tagInput.trim()}
                >
                  Add
                </PremiumButton>
              </div>
              
              {/* Active Tag Filters */}
              {filter.tags && filter.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {filter.tags.map((tag) => (
                    <PremiumBadge
                      key={tag}
                      variant="error"
                      className="cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => handleTagRemove(tag)}
                    >
                      {tag}
                      <Icons.close size="xs" className="ml-1" />
                    </PremiumBadge>
                  ))}
                </div>
              )}

              {/* Popular Tags */}
              {availableTags.length > 0 && (
                <div>
                  <Typography variant="body-xs" color="muted" className="mb-1">
                    Popular tags:
                  </Typography>
                  <div className="flex flex-wrap gap-1">
                    {availableTags.slice(0, 8).map((tag) => (
                      <PremiumBadge
                        key={tag}
                        variant="primary"
                        className="cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => handleTagAdd(tag)}
                      >
                        {tag}
                      </PremiumBadge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Models Filter */}
          <div>
            <Typography variant="body-sm" color="medium-contrast" className="mb-2">
              Models
            </Typography>
            <div className="space-y-2">
              {availableModels.map((model) => (
                <div key={model} className="flex items-center gap-2">
                  <Checkbox
                    id={`model-${model}`}
                    checked={filter.models?.includes(model) || false}
                    onCheckedChange={() => handleModelToggle(model)}
                  />
                  <label 
                    htmlFor={`model-${model}`} 
                    className="text-sm cursor-pointer flex-1"
                  >
                    {model}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Date Range Filter */}
          <div>
            <Typography variant="body-sm" color="medium-contrast" className="mb-2">
              Date Range
            </Typography>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Typography variant="body-xs" color="muted" className="mb-1 block">From</Typography>
                <PremiumInput
                  variant="premium"
                  type="date"
                  value={filter.dateRange?.start || ''}
                  onChange={(e) => handleDateRangeChange('start', e.target.value)}
                />
              </div>
              <div>
                <Typography variant="body-xs" color="muted" className="mb-1 block">To</Typography>
                <PremiumInput
                  variant="premium"
                  type="date"
                  value={filter.dateRange?.end || ''}
                  onChange={(e) => handleDateRangeChange('end', e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <Typography variant="body-xs" color="muted" className="mb-2">
            Active filters:
          </Typography>
          <div className="flex flex-wrap gap-1">
            {filter.search && (
              <PremiumBadge variant="glass">Search: {filter.search}</PremiumBadge>
            )}
            {filter.folderId !== undefined && (
              <PremiumBadge variant="glass">
                Folder: {
                  filter.folderId === null ? 'Root' :
                  folders.find(f => f.id === filter.folderId)?.name || 'Unknown'
                }
              </PremiumBadge>
            )}
            {filter.favorites && (
              <PremiumBadge variant="glass">Favorites only</PremiumBadge>
            )}
            {filter.tags?.map(tag => (
              <PremiumBadge key={tag} variant="glass">Tag: {tag}</PremiumBadge>
            ))}
            {filter.models?.map(model => (
              <PremiumBadge key={model} variant="glass">Model: {model}</PremiumBadge>
            ))}
          </div>
        </div>
      )}
    </GlassCard>
  )
}
