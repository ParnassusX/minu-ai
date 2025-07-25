export * from './database'
export * from './flux'

export interface User {
  id: string
  email: string
  fullName?: string
  role: 'owner' | 'manager' | 'user'
  preferences: Record<string, any>
}

export interface Suggestion {
  id: string
  category: string
  text: string
  isPublic: boolean
  userId?: string
}

export interface PromptTemplate {
  id: string
  name: string
  templateText: string
  category?: string
  isPublic: boolean
  userId: string
}

export interface GeneratedImage {
  id: string
  userId: string
  originalPrompt: string
  parameters: Record<string, any>
  filePath: string
  width?: number
  height?: number
  isFavorite: boolean
  createdAt: string
}
