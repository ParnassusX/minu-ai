export interface Suggestion {
  id: string
  userId?: string
  category: string
  title: string
  text: string
  description?: string
  color: string
  isPublic: boolean
  usageCount: number
  position: number
  tags: string[]
  createdAt: string
  updatedAt: string
}

export interface SuggestionCategory {
  id: string
  name: string
  description: string
  color: string
  icon: string
  count: number
}

export interface DraggedSuggestion {
  id: string
  type: 'suggestion'
  suggestion: Suggestion
}

export interface SuggestionFilter {
  category?: string
  search?: string
  tags?: string[]
  isPublic?: boolean
  userId?: string
}

export interface SuggestionSort {
  field: 'title' | 'usageCount' | 'createdAt' | 'position'
  direction: 'asc' | 'desc'
}

export interface CreateSuggestionRequest {
  category: string
  title: string
  text: string
  description?: string
  color?: string
  isPublic?: boolean
  tags?: string[]
}

export interface UpdateSuggestionRequest {
  title?: string
  text?: string
  description?: string
  color?: string
  isPublic?: boolean
  tags?: string[]
  position?: number
}

export interface SuggestionStats {
  totalSuggestions: number
  categoryCounts: Record<string, number>
  popularSuggestions: Suggestion[]
  recentSuggestions: Suggestion[]
}

// Default suggestion categories
export const SUGGESTION_CATEGORIES: SuggestionCategory[] = [
  {
    id: 'camera',
    name: 'Camera',
    description: 'Camera types and equipment',
    color: '#ef4444',
    icon: 'Camera',
    count: 0
  },
  {
    id: 'style',
    name: 'Style',
    description: 'Photography and art styles',
    color: '#8b5cf6',
    icon: 'Palette',
    count: 0
  },
  {
    id: 'lighting',
    name: 'Lighting',
    description: 'Lighting conditions and setups',
    color: '#fbbf24',
    icon: 'Sun',
    count: 0
  },
  {
    id: 'mood',
    name: 'Mood',
    description: 'Atmosphere and emotional tone',
    color: '#06b6d4',
    icon: 'Heart',
    count: 0
  },
  {
    id: 'composition',
    name: 'Composition',
    description: 'Composition techniques and rules',
    color: '#22c55e',
    icon: 'Grid',
    count: 0
  },
  {
    id: 'quality',
    name: 'Quality',
    description: 'Technical quality and resolution',
    color: '#3b82f6',
    icon: 'Star',
    count: 0
  },
  {
    id: 'subject',
    name: 'Subject',
    description: 'Subject matter and themes',
    color: '#f97316',
    icon: 'User',
    count: 0
  },
  {
    id: 'environment',
    name: 'Environment',
    description: 'Settings and environments',
    color: '#84cc16',
    icon: 'MapPin',
    count: 0
  }
]

// Default colors for suggestions
export const SUGGESTION_COLORS = [
  '#ef4444', // red
  '#f97316', // orange
  '#fbbf24', // yellow
  '#22c55e', // green
  '#06b6d4', // cyan
  '#3b82f6', // blue
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#84cc16', // lime
  '#f59e0b', // amber
  '#10b981', // emerald
  '#6366f1', // indigo
  '#d946ef', // fuchsia
  '#06b6d4', // sky
  '#64748b'  // slate
]

// Utility functions
export const getSuggestionCategoryById = (id: string): SuggestionCategory | undefined => {
  return SUGGESTION_CATEGORIES.find(cat => cat.id === id)
}

export const getSuggestionCategoryByName = (name: string): SuggestionCategory | undefined => {
  return SUGGESTION_CATEGORIES.find(cat => cat.name.toLowerCase() === name.toLowerCase())
}

export const getRandomSuggestionColor = (): string => {
  return SUGGESTION_COLORS[Math.floor(Math.random() * SUGGESTION_COLORS.length)]
}

export const formatSuggestionForPrompt = (suggestion: Suggestion): string => {
  return suggestion.text
}

export const createSuggestionFromText = (
  text: string, 
  category: string = 'custom',
  title?: string
): Partial<CreateSuggestionRequest> => {
  return {
    title: title || (text.length > 30 ? text.substring(0, 30) + '...' : text),
    text,
    category,
    color: getRandomSuggestionColor(),
    isPublic: false,
    tags: []
  }
}
