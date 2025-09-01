/**
 * Utilities - Minu.AI Generator V2
 * Common utility functions for the generator system
 */

import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { GeneratorError } from '../types/generator'
import { APIError, APIErrorCode } from '../types/api'

// Tailwind CSS class merging utility
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Delay utility for async operations
export const delay = (ms: number): Promise<void> => 
  new Promise(resolve => setTimeout(resolve, ms))

// Debounce utility
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

// Throttle utility
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

// Random ID generation
export const generateId = (prefix = ''): string => {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2)
  return `${prefix}${timestamp}${random}`
}

// File size formatting
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// Duration formatting
export const formatDuration = (seconds: number): string => {
  if (seconds < 60) return `${Math.round(seconds)}s`
  
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.round(seconds % 60)
  
  if (minutes < 60) {
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`
  }
  
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  
  return `${hours}h ${remainingMinutes}m`
}

// Cost formatting
export const formatCost = (cost: number, currency = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 3,
    maximumFractionDigits: 3
  }).format(cost)
}

// Date formatting
export const formatDate = (date: string | Date): string => {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(d)
}

// Relative time formatting
export const formatRelativeTime = (date: string | Date): string => {
  const d = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffSeconds = Math.floor(diffMs / 1000)
  const diffMinutes = Math.floor(diffSeconds / 60)
  const diffHours = Math.floor(diffMinutes / 60)
  const diffDays = Math.floor(diffHours / 24)
  
  if (diffSeconds < 60) return 'just now'
  if (diffMinutes < 60) return `${diffMinutes}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  
  return formatDate(d)
}

// URL validation
export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

// Image URL validation
export const isValidImageUrl = (url: string): boolean => {
  if (!isValidUrl(url)) return false
  
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif']
  const urlLower = url.toLowerCase()
  
  return imageExtensions.some(ext => urlLower.includes(ext)) ||
         url.includes('replicate.delivery') ||
         url.includes('cloudinary.com') ||
         url.includes('supabase.co')
}

// Error handling utilities
export const createGeneratorError = (
  code: string,
  message: string,
  field?: string,
  severity: 'error' | 'warning' | 'info' = 'error'
): GeneratorError => ({
  code,
  message,
  field,
  severity,
  recoverable: severity !== 'error',
  suggestions: []
})

export const mapAPIErrorToGeneratorError = (apiError: APIError): GeneratorError => ({
  code: apiError.code,
  message: apiError.userMessage || apiError.message,
  severity: 'error',
  recoverable: apiError.retryable,
  suggestions: []
})

// Validation utilities
export const validatePrompt = (prompt: string): GeneratorError[] => {
  const errors: GeneratorError[] = []
  
  if (!prompt.trim()) {
    errors.push(createGeneratorError(
      'PROMPT_REQUIRED',
      'Please enter a prompt',
      'prompt'
    ))
  }
  
  if (prompt.length > 1000) {
    errors.push(createGeneratorError(
      'PROMPT_TOO_LONG',
      'Prompt must be less than 1000 characters',
      'prompt'
    ))
  }
  
  return errors
}

export const validateImageFile = (file: File): GeneratorError[] => {
  const errors: GeneratorError[] = []
  
  // Check file size (10MB limit)
  if (file.size > 10 * 1024 * 1024) {
    errors.push(createGeneratorError(
      'FILE_TOO_LARGE',
      'File size must be less than 10MB',
      'image'
    ))
  }
  
  // Check file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  if (!allowedTypes.includes(file.type)) {
    errors.push(createGeneratorError(
      'INVALID_FILE_TYPE',
      'File must be a JPEG, PNG, WebP, or GIF image',
      'image'
    ))
  }
  
  return errors
}

// Local storage utilities
export const storage = {
  get: <T>(key: string, defaultValue: T): T => {
    if (typeof window === 'undefined') return defaultValue
    
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : defaultValue
    } catch {
      return defaultValue
    }
  },
  
  set: <T>(key: string, value: T): void => {
    if (typeof window === 'undefined') return
    
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
      console.warn('Failed to save to localStorage:', error)
    }
  },
  
  remove: (key: string): void => {
    if (typeof window === 'undefined') return
    localStorage.removeItem(key)
  },
  
  clear: (): void => {
    if (typeof window === 'undefined') return
    localStorage.clear()
  }
}

// Retry utility with exponential backoff
export const retry = async <T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> => {
  let lastError: Error
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error
      
      if (attempt === maxRetries) break
      
      const delayMs = baseDelay * Math.pow(2, attempt)
      await delay(delayMs)
    }
  }
  
  throw lastError!
}

// Progress calculation utility
export const calculateProgress = (current: number, total: number): number => {
  if (total === 0) return 0
  return Math.min(Math.max((current / total) * 100, 0), 100)
}

// Safe JSON parsing
export const safeJsonParse = <T>(json: string, defaultValue: T): T => {
  try {
    return JSON.parse(json)
  } catch {
    return defaultValue
  }
}
