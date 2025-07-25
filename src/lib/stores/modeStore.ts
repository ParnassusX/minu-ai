/**
 * Mode Store - Zustand store for managing generator mode state
 * Handles mode switching, URL synchronization, and state persistence
 */

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { GeneratorMode, ModeStore, MODE_CONFIGS } from '@/lib/types/modes'

interface ExtendedModeStore extends ModeStore {
  // URL synchronization
  syncWithURL: (searchParams: URLSearchParams) => void
  syncModeToURL: () => void
  updateURL: (updateFn: (params: URLSearchParams) => void) => void

  // Mode validation
  validateMode: (mode: string) => mode is GeneratorMode

  // Mode history
  getModeHistory: () => GeneratorMode[]
  clearHistory: () => void

  // Internal state
  modeHistory: GeneratorMode[]
  lastModeChange: number
}

export const useModeStore = create<ExtendedModeStore>()(
  persist(
    (set, get) => ({
      // Initial state
      currentMode: 'images',
      previousMode: null,
      isTransitioning: false,
      modeHistory: ['images'],
      lastModeChange: Date.now(),

      // Core actions
      setMode: (mode: GeneratorMode) => {
        const state = get()
        
        // Prevent unnecessary updates
        if (state.currentMode === mode && !state.isTransitioning) {
          return
        }

        // Validate mode
        if (!state.validateMode(mode)) {
          console.warn(`Invalid mode: ${mode}. Falling back to 'images'`)
          mode = 'images'
        }

        set((state) => ({
          previousMode: state.currentMode,
          currentMode: mode,
          isTransitioning: true,
          modeHistory: [...state.modeHistory.slice(-9), mode], // Keep last 10 modes
          lastModeChange: Date.now()
        }))

        // End transition after a brief delay for animations
        setTimeout(() => {
          set({ isTransitioning: false })
        }, 150)
      },

      resetMode: () => {
        set({
          currentMode: 'images',
          previousMode: null,
          isTransitioning: false,
          modeHistory: ['images'],
          lastModeChange: Date.now()
        })
      },

      canSwitchMode: () => {
        const state = get()
        // Prevent rapid mode switching
        return !state.isTransitioning && (Date.now() - state.lastModeChange) > 100
      },

      // URL synchronization
      syncWithURL: (searchParams: URLSearchParams) => {
        const modeParam = searchParams.get('mode')
        const state = get()

        if (modeParam && state.validateMode(modeParam) && modeParam !== state.currentMode) {
          state.setMode(modeParam)
        }
      },

      updateURL: (updateFn: (params: URLSearchParams) => void) => {
        if (typeof window !== 'undefined') {
          const url = new URL(window.location.href)
          updateFn(url.searchParams)

          // Update URL without triggering navigation
          window.history.replaceState({}, '', url.toString())
        }
      },

      // URL sync methods
      syncModeToURL: () => {
        const state = get()
        state.updateURL((params) => {
          params.set('mode', state.currentMode)
        })
      },

      // Mode validation
      validateMode: (mode: string): mode is GeneratorMode => {
        return mode in MODE_CONFIGS
      },

      // Mode history
      getModeHistory: () => {
        return get().modeHistory
      },

      clearHistory: () => {
        set({ modeHistory: [get().currentMode] })
      }
    }),
    {
      name: 'minu-ai-mode-store',
      storage: createJSONStorage(() => localStorage),
      // Only persist essential state
      partialize: (state) => ({
        currentMode: state.currentMode,
        modeHistory: state.modeHistory.slice(-5) // Keep only last 5 modes
      }),
      // Handle hydration
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Ensure we have a valid mode after hydration
          if (!state.validateMode(state.currentMode)) {
            state.currentMode = 'images'
          }
          state.isTransitioning = false
          state.lastModeChange = Date.now()
        }
      }
    }
  )
)

// Hooks for common mode operations
export const useCurrentMode = () => useModeStore((state) => state.currentMode)
export const useSetMode = () => useModeStore((state) => state.setMode)
export const useCanSwitchMode = () => useModeStore((state) => state.canSwitchMode())
export const useModeTransition = () => useModeStore((state) => state.isTransitioning)



// Hook for mode-specific data
export const useModeConfig = () => {
  const currentMode = useCurrentMode()
  return MODE_CONFIGS[currentMode]
}

// Hook for supported models in current mode
export const useModeSupportedModels = () => {
  const currentMode = useCurrentMode()
  return MODE_CONFIGS[currentMode].supportedModels
}

// Hook for mode-specific default parameters
export const useModeDefaultParameters = () => {
  const currentMode = useCurrentMode()
  return MODE_CONFIGS[currentMode].defaultParameters
}

// Hook for URL synchronization
export const useModeURLSync = () => {
  const { syncWithURL, updateURL, currentMode } = useModeStore()
  
  // Update URL when mode changes
  const syncModeToURL = () => {
    updateURL((params) => {
      params.set('mode', currentMode)
    })
  }

  return { syncWithURL, syncModeToURL }
}

// Utility function to get mode from URL
export const getModeFromURL = (): GeneratorMode => {
  if (typeof window === 'undefined') return 'images'
  
  const params = new URLSearchParams(window.location.search)
  const mode = params.get('mode')
  
  if (mode && mode in MODE_CONFIGS) {
    return mode as GeneratorMode
  }
  
  return 'images'
}

// Utility function to check if model is supported in current mode
export const useIsModelSupported = (modelId: string) => {
  const supportedModels = useModeSupportedModels()
  return supportedModels.includes(modelId)
}
