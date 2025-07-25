import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * @deprecated Use validateModelParameters from @/lib/validation/modelValidation instead
 * This function is kept for backward compatibility but will be removed in a future version.
 *
 * Validates a prompt for image generation
 */
export function validatePrompt(prompt: string): { isValid: boolean; error?: string } {
  // Import the proper validation function
  const { validateModelParameters } = require('@/lib/validation/modelValidation')

  const result = validateModelParameters({ prompt, modelId: 'flux-dev' })

  if (!result.isValid && result.errors.length > 0) {
    return { isValid: false, error: result.errors[0] }
  }

  return { isValid: true }
}

/**
 * Generates a random seed for image generation
 */
export function generateSeed(): number {
  return Math.floor(Math.random() * 1000000)
}

/**
 * Formats a file size in bytes to human readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * Formats a duration in seconds to human readable format
 */
export function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds.toFixed(1)}s`
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}m ${remainingSeconds.toFixed(0)}s`
  } else {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${hours}h ${minutes}m`
  }
}

/**
 * Debounce function for limiting function calls
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null

  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout)
    }

    timeout = setTimeout(() => {
      func(...args)
    }, wait)
  }
}
