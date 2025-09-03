/**
 * Client-side Authentication Cache
 * Reduces redundant authentication checks during navigation
 */

'use client'

import { User } from '@supabase/supabase-js'

interface AuthState {
  user: User | null
  loading: boolean
  authenticated: boolean
  lastCheck: number
  error?: string
}

interface AuthCacheConfig {
  cacheDuration: number // How long to cache auth state (ms)
  maxRetries: number // Max retries for failed auth checks
  retryDelay: number // Delay between retries (ms)
}

class ClientAuthCache {
  private state: AuthState = {
    user: null,
    loading: true,
    authenticated: false,
    lastCheck: 0
  }

  private config: AuthCacheConfig = {
    cacheDuration: 30000, // 30 seconds
    maxRetries: 3,
    retryDelay: 1000
  }

  private listeners: Set<(state: AuthState) => void> = new Set()
  private retryCount = 0
  private checkInProgress = false

  constructor(config?: Partial<AuthCacheConfig>) {
    if (config) {
      this.config = { ...this.config, ...config }
    }
  }

  /**
   * Get current auth state
   */
  getState(): AuthState {
    return { ...this.state }
  }

  /**
   * Check if auth state is still valid (not expired)
   */
  isStateValid(): boolean {
    const now = Date.now()
    return (now - this.state.lastCheck) < this.config.cacheDuration
  }

  /**
   * Subscribe to auth state changes
   */
  subscribe(listener: (state: AuthState) => void): () => void {
    this.listeners.add(listener)
    
    // Immediately call with current state
    listener(this.getState())
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener)
    }
  }

  /**
   * Update auth state and notify listeners
   */
  private updateState(updates: Partial<AuthState>) {
    this.state = {
      ...this.state,
      ...updates,
      lastCheck: Date.now()
    }

    // Notify all listeners
    this.listeners.forEach(listener => {
      try {
        listener(this.getState())
      } catch (error) {
        console.error('Auth state listener error:', error)
      }
    })
  }

  /**
   * Force refresh auth state from server
   */
  async refreshAuthState(): Promise<AuthState> {
    if (this.checkInProgress) {
      // Wait for existing check to complete
      return new Promise((resolve) => {
        const unsubscribe = this.subscribe((state) => {
          if (!state.loading) {
            unsubscribe()
            resolve(state)
          }
        })
      })
    }

    this.checkInProgress = true
    this.updateState({ loading: true, error: undefined })

    try {
      // Use the optimized auth check endpoint
      const response = await fetch('/api/auth-check', {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      })

      if (!response.ok) {
        throw new Error(`Auth check failed: ${response.status}`)
      }

      const data = await response.json()
      
      this.updateState({
        authenticated: data.authenticated || false,
        loading: false,
        error: undefined
      })

      this.retryCount = 0 // Reset retry count on success
      
    } catch (error: any) {
      console.error('Auth state refresh failed:', error)
      
      this.updateState({
        loading: false,
        error: error.message,
        authenticated: false
      })

      // Retry logic
      if (this.retryCount < this.config.maxRetries) {
        this.retryCount++
        setTimeout(() => {
          this.refreshAuthState()
        }, this.config.retryDelay * this.retryCount)
      }
    } finally {
      this.checkInProgress = false
    }

    return this.getState()
  }

  /**
   * Get auth state with automatic refresh if needed
   */
  async getAuthState(): Promise<AuthState> {
    // Return cached state if still valid
    if (this.isStateValid() && !this.state.loading) {
      return this.getState()
    }

    // Refresh if needed
    return await this.refreshAuthState()
  }

  /**
   * Clear auth cache (useful for logout)
   */
  clearCache() {
    this.updateState({
      user: null,
      authenticated: false,
      loading: false,
      error: undefined,
      lastCheck: 0
    })
    this.retryCount = 0
  }

  /**
   * Set user data directly (useful when we have user data from other sources)
   */
  setUser(user: User | null) {
    this.updateState({
      user,
      authenticated: !!user,
      loading: false,
      error: undefined
    })
  }

  /**
   * Preload auth state in background
   */
  preloadAuthState() {
    if (!this.isStateValid() && !this.checkInProgress) {
      // Start background refresh without waiting
      this.refreshAuthState().catch(() => {
        // Ignore errors in background preload
      })
    }
  }

  /**
   * Get cache statistics for debugging
   */
  getCacheStats() {
    const now = Date.now()
    return {
      isValid: this.isStateValid(),
      age: now - this.state.lastCheck,
      cacheDuration: this.config.cacheDuration,
      retryCount: this.retryCount,
      checkInProgress: this.checkInProgress,
      listenerCount: this.listeners.size,
      state: this.getState()
    }
  }
}

// Global auth cache instance
let authCacheInstance: ClientAuthCache | null = null

/**
 * Get or create the global auth cache instance
 */
export function getAuthCache(config?: Partial<AuthCacheConfig>): ClientAuthCache {
  if (!authCacheInstance) {
    authCacheInstance = new ClientAuthCache(config)
  }
  return authCacheInstance
}

/**
 * Hook for using auth cache in React components
 */
export function useAuthCache() {
  const authCache = getAuthCache()
  
  return {
    getState: () => authCache.getState(),
    getAuthState: () => authCache.getAuthState(),
    refreshAuthState: () => authCache.refreshAuthState(),
    subscribe: (listener: (state: AuthState) => void) => authCache.subscribe(listener),
    clearCache: () => authCache.clearCache(),
    setUser: (user: User | null) => authCache.setUser(user),
    preloadAuthState: () => authCache.preloadAuthState(),
    getCacheStats: () => authCache.getCacheStats()
  }
}

/**
 * Initialize auth cache with user data from AuthProvider
 */
export function initializeAuthCache(user: User | null, loading: boolean) {
  const authCache = getAuthCache()
  
  if (!loading) {
    authCache.setUser(user)
  }
}

export type { AuthState, AuthCacheConfig }
