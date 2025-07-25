// Phase 2: Prompt Management System Types

export interface PromptBoard {
  id: string
  userId: string
  name: string
  description?: string
  layout: {
    width: number
    height: number
    zoom: number
  }
  backgroundColor: string
  isDefault: boolean
  createdAt: string
  updatedAt: string
}

export interface PromptNote {
  id: string
  boardId: string
  userId: string
  content: string
  title?: string
  position: {
    x: number
    y: number
  }
  size: {
    width: number
    height: number
  }
  color: string
  category: string
  tags: string[]
  isEnhanced: boolean
  enhancedContent?: string
  usageCount: number
  lastUsedAt?: string
  createdAt: string
  updatedAt: string
}

export interface ProjectTemplate {
  id: string
  userId: string
  name: string
  description?: string
  category: string
  settings: Record<string, any>
  defaultPrompts: PromptNote[]
  isPublic: boolean
  usageCount: number
  createdAt: string
  updatedAt: string
}

export interface PromptCategory {
  id: string
  userId: string
  name: string
  color: string
  icon: string
  description?: string
  sortOrder: number
  createdAt: string
}

export interface PromptUsage {
  id: string
  userId: string
  promptNoteId: string
  projectId?: string
  modelUsed?: string
  generationSuccessful: boolean
  usedAt: string
}

export interface WorkflowSession {
  id: string
  userId: string
  sessionType: 'prompt_creation' | 'generation' | 'organization'
  boardId?: string
  projectId?: string
  actions: WorkflowAction[]
  durationSeconds?: number
  completed: boolean
  startedAt: string
  completedAt?: string
}

export interface WorkflowAction {
  type: string
  timestamp: string
  data: Record<string, any>
}

// UI State Types
export interface PromptBoardState {
  selectedNotes: Set<string>
  draggedNote?: PromptNote
  isSelecting: boolean
  viewMode: 'board' | 'list'
  zoom: number
  panOffset: { x: number; y: number }
}

export interface PromptBoardFilters {
  search?: string
  categories?: string[]
  tags?: string[]
  dateRange?: {
    start: string
    end: string
  }
  usageRange?: {
    min: number
    max: number
  }
}

// API Request/Response Types
export interface CreatePromptBoardRequest {
  name: string
  description?: string
  backgroundColor?: string
  isDefault?: boolean
}

export interface UpdatePromptBoardRequest {
  id: string
  name?: string
  description?: string
  layout?: Partial<PromptBoard['layout']>
  backgroundColor?: string
  isDefault?: boolean
}

export interface CreatePromptNoteRequest {
  boardId: string
  content: string
  title?: string
  position?: { x: number; y: number }
  size?: { width: number; height: number }
  color?: string
  category?: string
  tags?: string[]
}

export interface UpdatePromptNoteRequest {
  id: string
  content?: string
  title?: string
  position?: { x: number; y: number }
  size?: { width: number; height: number }
  color?: string
  category?: string
  tags?: string[]
  isEnhanced?: boolean
  enhancedContent?: string
}

export interface CreateProjectTemplateRequest {
  name: string
  description?: string
  category: string
  settings?: Record<string, any>
  defaultPrompts?: Partial<PromptNote>[]
  isPublic?: boolean
}

export interface ApplyPromptToGeneratorRequest {
  promptNoteId: string
  projectId?: string
  enhancePrompt?: boolean
}

// Utility Functions
export const createEmptyPromptBoard = (): Partial<PromptBoard> => ({
  name: 'New Board',
  layout: { width: 1200, height: 800, zoom: 1 },
  backgroundColor: '#1e293b',
  isDefault: false
})

export const createEmptyPromptNote = (boardId: string): Partial<PromptNote> => ({
  boardId,
  content: '',
  position: { x: 100, y: 100 },
  size: { width: 200, height: 150 },
  color: '#fef3c7',
  category: 'general',
  tags: [],
  isEnhanced: false,
  usageCount: 0
})

export const createEmptyBoardState = (): PromptBoardState => ({
  selectedNotes: new Set(),
  isSelecting: false,
  viewMode: 'board',
  zoom: 1,
  panOffset: { x: 0, y: 0 }
})

export const createEmptyFilters = (): PromptBoardFilters => ({
  search: '',
  categories: [],
  tags: []
})

// Validation Functions
export const validatePromptBoard = (board: CreatePromptBoardRequest | UpdatePromptBoardRequest): string[] => {
  const errors: string[] = []

  if ('name' in board) {
    if (!board.name || board.name.trim().length === 0) {
      errors.push('Board name is required')
    }
    if (board.name && board.name.length > 100) {
      errors.push('Board name must be less than 100 characters')
    }
  }

  if (board.description && board.description.length > 500) {
    errors.push('Board description must be less than 500 characters')
  }

  if (board.backgroundColor && !/^#[0-9A-F]{6}$/i.test(board.backgroundColor)) {
    errors.push('Background color must be a valid hex color')
  }

  return errors
}

export const validatePromptNote = (note: CreatePromptNoteRequest | UpdatePromptNoteRequest): string[] => {
  const errors: string[] = []

  if ('content' in note) {
    if (!note.content || note.content.trim().length === 0) {
      errors.push('Note content is required')
    }
    if (note.content && note.content.length > 2000) {
      errors.push('Note content must be less than 2000 characters')
    }
  }

  if (note.title && note.title.length > 100) {
    errors.push('Note title must be less than 100 characters')
  }

  if (note.position) {
    if (note.position.x < 0 || note.position.y < 0) {
      errors.push('Note position must be positive')
    }
  }

  if (note.size) {
    if (note.size.width < 100 || note.size.height < 100) {
      errors.push('Note size must be at least 100x100 pixels')
    }
    if (note.size.width > 500 || note.size.height > 500) {
      errors.push('Note size must be at most 500x500 pixels')
    }
  }

  if (note.color && !/^#[0-9A-F]{6}$/i.test(note.color)) {
    errors.push('Note color must be a valid hex color')
  }

  if (note.tags && note.tags.length > 10) {
    errors.push('Maximum 10 tags allowed per note')
  }

  return errors
}

// Helper Functions
export const filterPromptNotes = (notes: PromptNote[], filters: PromptBoardFilters): PromptNote[] => {
  return notes.filter(note => {
    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      if (!note.content.toLowerCase().includes(searchLower) &&
          !note.title?.toLowerCase().includes(searchLower) &&
          !note.tags.some(tag => tag.toLowerCase().includes(searchLower))) {
        return false
      }
    }

    // Category filter
    if (filters.categories && filters.categories.length > 0) {
      if (!filters.categories.includes(note.category)) {
        return false
      }
    }

    // Tags filter
    if (filters.tags && filters.tags.length > 0) {
      if (!filters.tags.some(tag => note.tags.includes(tag))) {
        return false
      }
    }

    // Date range filter
    if (filters.dateRange) {
      const noteDate = new Date(note.createdAt)
      if (filters.dateRange.start && noteDate < new Date(filters.dateRange.start)) {
        return false
      }
      if (filters.dateRange.end && noteDate > new Date(filters.dateRange.end)) {
        return false
      }
    }

    // Usage range filter
    if (filters.usageRange) {
      if (note.usageCount < filters.usageRange.min || note.usageCount > filters.usageRange.max) {
        return false
      }
    }

    return true
  })
}

export const sortPromptNotes = (notes: PromptNote[], sortBy: 'created' | 'updated' | 'usage' | 'alphabetical'): PromptNote[] => {
  return [...notes].sort((a, b) => {
    switch (sortBy) {
      case 'created':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      case 'updated':
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      case 'usage':
        return b.usageCount - a.usageCount
      case 'alphabetical':
        return (a.title || a.content).localeCompare(b.title || b.content)
      default:
        return 0
    }
  })
}

export const getPromptNotePreview = (note: PromptNote, maxLength: number = 50): string => {
  const content = note.title || note.content
  return content.length > maxLength ? content.substring(0, maxLength) + '...' : content
}

export const getPromptNoteStats = (notes: PromptNote[]) => {
  const totalNotes = notes.length
  const totalUsage = notes.reduce((sum, note) => sum + note.usageCount, 0)
  const enhancedNotes = notes.filter(note => note.isEnhanced).length
  const categories = new Set(notes.map(note => note.category)).size
  const tags = new Set(notes.flatMap(note => note.tags)).size

  return {
    totalNotes,
    totalUsage,
    enhancedNotes,
    categories,
    tags,
    averageUsage: totalNotes > 0 ? totalUsage / totalNotes : 0
  }
}
