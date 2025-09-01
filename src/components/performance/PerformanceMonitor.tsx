'use client'

import { useEffect } from 'react'
import { performanceMonitor } from '@/lib/config/performance'

interface PerformanceMonitorProps {
  enabled?: boolean
}

/**
 * Performance monitoring component that tracks Core Web Vitals
 * and other performance metrics in production
 */
export function PerformanceMonitor({ enabled = true }: PerformanceMonitorProps) {
  useEffect(() => {
    if (!enabled || process.env.NODE_ENV !== 'production') {
      return
    }

    // Initialize performance monitoring
    performanceMonitor.trackWebVitals()

    // Track page load performance
    const trackPageLoad = () => {
      if (typeof window !== 'undefined' && window.performance) {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
        
        if (navigation) {
          const metrics = {
            dns: navigation.domainLookupEnd - navigation.domainLookupStart,
            tcp: navigation.connectEnd - navigation.connectStart,
            ttfb: navigation.responseStart - navigation.requestStart,
            download: navigation.responseEnd - navigation.responseStart,
            domParse: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
            domReady: navigation.domContentLoadedEventEnd - navigation.fetchStart,
            load: navigation.loadEventEnd - navigation.fetchStart
          }

          console.log('Page Load Metrics:', metrics)
          
          // Send metrics to monitoring service
          Object.entries(metrics).forEach(([key, value]) => {
            if (value > 0) {
              performanceMonitor.trackApiCall(`page_load_${key}`, value, true)
            }
          })
        }
      }
    }

    // Track when page is fully loaded
    if (document.readyState === 'complete') {
      trackPageLoad()
    } else {
      window.addEventListener('load', trackPageLoad)
    }

    // Track resource loading performance
    const trackResourcePerformance = () => {
      if (typeof window !== 'undefined' && window.performance) {
        const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[]
        
        resources.forEach((resource) => {
          const duration = resource.responseEnd - resource.startTime
          const resourceType = resource.initiatorType
          
          if (duration > 1000) { // Only track slow resources (>1s)
            console.log(`Slow Resource - ${resourceType}: ${resource.name} (${duration}ms)`)
            performanceMonitor.trackApiCall(`slow_resource_${resourceType}`, duration, true)
          }
        })
      }
    }

    // Track resource performance after initial load
    setTimeout(trackResourcePerformance, 2000)

    // Cleanup
    return () => {
      window.removeEventListener('load', trackPageLoad)
    }
  }, [enabled])

  // This component doesn't render anything
  return null
}

/**
 * Hook for tracking API call performance
 */
export function useApiPerformanceTracking() {
  const trackApiCall = (endpoint: string, startTime: number, success: boolean) => {
    const duration = Date.now() - startTime
    performanceMonitor.trackApiCall(endpoint, duration, success)
  }

  return { trackApiCall }
}

/**
 * Higher-order component for tracking component render performance
 */
export function withPerformanceTracking<T extends object>(
  WrappedComponent: React.ComponentType<T>,
  componentName: string
) {
  return function PerformanceTrackedComponent(props: T) {
    useEffect(() => {
      const startTime = performance.now()
      
      return () => {
        const renderTime = performance.now() - startTime
        if (renderTime > 100) { // Only track slow renders (>100ms)
          console.log(`Slow Render - ${componentName}: ${renderTime}ms`)
          performanceMonitor.trackApiCall(`component_render_${componentName}`, renderTime, true)
        }
      }
    }, [])

    return <WrappedComponent {...props} />
  }
}

/**
 * Performance metrics display component for development
 */
export function PerformanceMetrics() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') {
      return
    }

    const logPerformanceMetrics = () => {
      if (typeof window !== 'undefined' && window.performance) {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
        
        if (navigation) {
          console.group('🚀 Performance Metrics')
          console.log('DNS Lookup:', `${(navigation.domainLookupEnd - navigation.domainLookupStart).toFixed(2)}ms`)
          console.log('TCP Connection:', `${(navigation.connectEnd - navigation.connectStart).toFixed(2)}ms`)
          console.log('Time to First Byte:', `${(navigation.responseStart - navigation.requestStart).toFixed(2)}ms`)
          console.log('Download Time:', `${(navigation.responseEnd - navigation.responseStart).toFixed(2)}ms`)
          console.log('DOM Parse:', `${(navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart).toFixed(2)}ms`)
          console.log('DOM Ready:', `${(navigation.domContentLoadedEventEnd - navigation.fetchStart).toFixed(2)}ms`)
          console.log('Page Load:', `${(navigation.loadEventEnd - navigation.fetchStart).toFixed(2)}ms`)
          console.groupEnd()
        }

        // Log memory usage if available
        if ('memory' in performance) {
          const memory = (performance as any).memory
          console.group('💾 Memory Usage')
          console.log('Used:', `${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`)
          console.log('Total:', `${(memory.totalJSHeapSize / 1024 / 1024).toFixed(2)} MB`)
          console.log('Limit:', `${(memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)} MB`)
          console.groupEnd()
        }
      }
    }

    // Log metrics after page load
    if (document.readyState === 'complete') {
      setTimeout(logPerformanceMetrics, 1000)
    } else {
      window.addEventListener('load', () => {
        setTimeout(logPerformanceMetrics, 1000)
      })
    }
  }, [])

  return null
}

export default PerformanceMonitor
