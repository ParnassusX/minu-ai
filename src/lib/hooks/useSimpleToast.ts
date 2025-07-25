'use client'

import { useState, useCallback } from 'react'

interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'warning' | 'info'
  duration?: number
}

let toastId = 0

export function useSimpleToast() {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((message: string, type: Toast['type'] = 'info', duration = 3000) => {
    const id = (++toastId).toString()
    const toast: Toast = { id, message, type, duration }
    
    setToasts(prev => [...prev, toast])
    
    if (duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id))
      }, duration)
    }
    
    return {
      id,
      dismiss: () => setToasts(prev => prev.filter(t => t.id !== id))
    }
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const clearAll = useCallback(() => {
    setToasts([])
  }, [])

  return {
    toasts,
    addToast,
    removeToast,
    clearAll,
    success: (message: string) => addToast(message, 'success'),
    error: (message: string) => addToast(message, 'error'),
    warning: (message: string) => addToast(message, 'warning'),
    info: (message: string) => addToast(message, 'info'),
    loading: (message: string) => addToast(message, 'info', 0) // No auto-dismiss
  }
}

// Simple toast helpers for backward compatibility
export const toastHelpers = {
  success: (title: string, description?: string) => {
    console.log(`✅ ${title}${description ? `: ${description}` : ''}`)
  },
  error: (title: string, description?: string) => {
    console.error(`❌ ${title}${description ? `: ${description}` : ''}`)
  },
  warning: (title: string, description?: string) => {
    console.warn(`⚠️ ${title}${description ? `: ${description}` : ''}`)
  },
  info: (title: string, description?: string) => {
    console.info(`ℹ️ ${title}${description ? `: ${description}` : ''}`)
  },
  loading: (title: string, description?: string) => {
    console.log(`⏳ ${title}${description ? `: ${description}` : ''}`)
    return {
      dismiss: () => console.log('✅ Loading dismissed')
    }
  }
}
