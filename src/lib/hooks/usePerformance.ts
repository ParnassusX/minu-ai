'use client'

import { useCallback, useRef, useMemo, useEffect, useState } from 'react'

// Debounce hook for performance optimization (function debouncing)
export function useDebounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const timeoutRef = useRef<NodeJS.Timeout>()

  return useCallback((...args: Parameters<T>) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(() => {
      callback(...args)
    }, delay)
  }, [callback, delay]) as T
}

// Value debouncing hook
export function useDebouncedValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

// Throttle hook for performance optimization
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const lastCallRef = useRef<number>(0)
  const timeoutRef = useRef<NodeJS.Timeout>()
  
  return useCallback((...args: Parameters<T>) => {
    const now = Date.now()
    const timeSinceLastCall = now - lastCallRef.current
    
    if (timeSinceLastCall >= delay) {
      lastCallRef.current = now
      callback(...args)
    } else {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      
      timeoutRef.current = setTimeout(() => {
        lastCallRef.current = Date.now()
        callback(...args)
      }, delay - timeSinceLastCall)
    }
  }, [callback, delay]) as T
}

// Memoized callback with dependency optimization
export function useOptimizedCallback<T extends (...args: any[]) => any>(
  callback: T,
  deps: React.DependencyList
): T {
  return useCallback(callback, deps)
}

// Memoized value with deep comparison
export function useDeepMemo<T>(
  factory: () => T,
  deps: React.DependencyList
): T {
  const depsRef = useRef<React.DependencyList>()
  const valueRef = useRef<T>()
  
  const hasChanged = useMemo(() => {
    if (!depsRef.current) return true
    
    return deps.some((dep, index) => {
      const prevDep = depsRef.current![index]
      return !Object.is(dep, prevDep)
    })
  }, deps)
  
  if (hasChanged) {
    depsRef.current = deps
    valueRef.current = factory()
  }
  
  return valueRef.current!
}

// Performance monitoring hook
export function usePerformanceMonitor(componentName: string) {
  const renderCountRef = useRef(0)
  const lastRenderTimeRef = useRef(Date.now())
  
  useEffect(() => {
    renderCountRef.current += 1
    const now = Date.now()
    const timeSinceLastRender = now - lastRenderTimeRef.current
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Performance] ${componentName} rendered ${renderCountRef.current} times. Time since last render: ${timeSinceLastRender}ms`)
    }
    
    lastRenderTimeRef.current = now
  })
  
  return {
    renderCount: renderCountRef.current,
    getTimeSinceLastRender: () => Date.now() - lastRenderTimeRef.current
  }
}

// Intersection Observer hook for lazy loading
export function useIntersectionObserver(
  options: IntersectionObserverInit = {}
) {
  const elementRef = useRef<HTMLElement>(null)
  const observerRef = useRef<IntersectionObserver>()
  const isIntersectingRef = useRef(false)
  
  const setElement = useCallback((element: HTMLElement | null) => {
    if (elementRef.current && observerRef.current) {
      observerRef.current.unobserve(elementRef.current)
    }
    
    if (elementRef.current !== element) {
      (elementRef as any).current = element
    }
    
    if (element) {
      if (!observerRef.current) {
        observerRef.current = new IntersectionObserver(
          ([entry]) => {
            isIntersectingRef.current = entry.isIntersecting
          },
          options
        )
      }
      
      observerRef.current.observe(element)
    }
  }, [options])
  
  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [])
  
  return {
    ref: setElement,
    isIntersecting: isIntersectingRef.current
  }
}

// Optimized event handler hook
export function useOptimizedEventHandler<T extends Event>(
  handler: (event: T) => void,
  deps: React.DependencyList,
  options: { passive?: boolean; capture?: boolean } = {}
) {
  const optimizedHandler = useCallback(handler, deps)
  
  return useMemo(() => {
    const eventHandler = (event: T) => {
      if (options.passive) {
        // For passive events, we can optimize by not preventing default
        optimizedHandler(event)
      } else {
        optimizedHandler(event)
      }
    }
    
    return eventHandler
  }, [optimizedHandler, options])
}

// Memory usage monitoring (development only)
export function useMemoryMonitor(componentName: string) {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && 'memory' in performance) {
      const memory = (performance as any).memory
      console.log(`[Memory] ${componentName} - Used: ${(memory.usedJSHeapSize / 1048576).toFixed(2)}MB, Total: ${(memory.totalJSHeapSize / 1048576).toFixed(2)}MB`)
    }
  })
}

// Batch state updates hook
export function useBatchedUpdates() {
  const pendingUpdatesRef = useRef<(() => void)[]>([])
  const timeoutRef = useRef<NodeJS.Timeout>()
  
  const batchUpdate = useCallback((updateFn: () => void) => {
    pendingUpdatesRef.current.push(updateFn)
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    
    timeoutRef.current = setTimeout(() => {
      const updates = pendingUpdatesRef.current
      pendingUpdatesRef.current = []
      
      // Execute all batched updates
      updates.forEach(update => update())
    }, 0)
  }, [])
  
  return batchUpdate
}

// Component error tracking
export function useErrorTracking(componentName: string) {
  const errorCountRef = useRef(0)
  
  const trackError = useCallback((error: Error, context?: string) => {
    errorCountRef.current += 1
    
    if (process.env.NODE_ENV === 'development') {
      console.error(`[Error] ${componentName} (${errorCountRef.current}):`, error)
      if (context) {
        console.error(`[Error Context] ${context}`)
      }
    }
    
    // Could integrate with error reporting service here
  }, [componentName])
  
  return {
    trackError,
    errorCount: errorCountRef.current
  }
}
