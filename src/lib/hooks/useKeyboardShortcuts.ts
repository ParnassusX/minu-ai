'use client'

import { useHotkeys } from 'react-hotkeys-hook'
import { useRouter } from 'next/navigation'
import { useCallback } from 'react'

interface KeyboardShortcutsConfig {
  onGenerate?: () => void
  onDownload?: () => void
  onUpscale?: () => void
  onClear?: () => void
  onToggleGallery?: () => void
  onTogglePromptBuilder?: () => void
  onToggleDarkMode?: () => void
  onSelectAll?: () => void
  onEscape?: () => void
  onShowHelp?: () => void
}

export function useKeyboardShortcuts(config: KeyboardShortcutsConfig = {}) {
  const router = useRouter()

  // Navigation shortcuts
  useHotkeys('ctrl+1', () => router.push('/'), { preventDefault: true })
  useHotkeys('ctrl+2', () => router.push('/generator'), { preventDefault: true })
  useHotkeys('ctrl+3', () => router.push('/gallery'), { preventDefault: true })
  useHotkeys('ctrl+4', () => router.push('/prompt-builder'), { preventDefault: true })

  // Action shortcuts
  useHotkeys('ctrl+enter', () => {
    config.onGenerate?.()
  }, { preventDefault: true, enableOnFormTags: true })

  useHotkeys('ctrl+d', () => {
    config.onDownload?.()
  }, { preventDefault: true })

  useHotkeys('ctrl+u', () => {
    config.onUpscale?.()
  }, { preventDefault: true })

  useHotkeys('ctrl+shift+c', () => {
    config.onClear?.()
  }, { preventDefault: true })

  useHotkeys('g', () => {
    config.onToggleGallery?.()
  })

  useHotkeys('p', () => {
    config.onTogglePromptBuilder?.()
  })

  useHotkeys('ctrl+shift+d', () => {
    config.onToggleDarkMode?.()
  }, { preventDefault: true })

  useHotkeys('ctrl+a', () => {
    config.onSelectAll?.()
  }, { preventDefault: true })

  useHotkeys('escape', () => {
    config.onEscape?.()
  })

  // Help shortcut
  useHotkeys('ctrl+/', () => {
    config.onShowHelp?.()
  }, { preventDefault: true })

  return {
    shortcuts: {
      navigation: [
        { key: 'Ctrl+1', description: 'Go to Dashboard' },
        { key: 'Ctrl+2', description: 'Go to Generator' },
        { key: 'Ctrl+3', description: 'Go to Gallery' },
        { key: 'Ctrl+4', description: 'Go to Prompt Builder' }
      ],
      actions: [
        { key: 'Ctrl+Enter', description: 'Generate Image' },
        { key: 'Ctrl+D', description: 'Download Selected' },
        { key: 'Ctrl+U', description: 'Upscale Image' },
        { key: 'Ctrl+Shift+C', description: 'Clear Form' },
        { key: 'Ctrl+A', description: 'Select All' },
        { key: 'Escape', description: 'Cancel/Close' }
      ],
      interface: [
        { key: 'G', description: 'Toggle Gallery View' },
        { key: 'P', description: 'Toggle Prompt Builder' },
        { key: 'Ctrl+Shift+D', description: 'Toggle Dark Mode' },
        { key: 'Ctrl+/', description: 'Show Help' }
      ]
    }
  }
}

// Hook for displaying keyboard shortcuts help
export function useKeyboardShortcutsHelp() {
  const { shortcuts } = useKeyboardShortcuts()

  const showHelp = useCallback(() => {
    // This could be enhanced to show a modal or toast
    console.table([
      ...shortcuts.navigation,
      ...shortcuts.actions,
      ...shortcuts.interface
    ])
  }, [shortcuts])

  return { showHelp, shortcuts }
}
