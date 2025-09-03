/**
 * Performance Optimization Configuration
 * Handles CDN setup, image optimization, and performance monitoring
 */

export interface PerformanceConfig {
  cdn: {
    enabled: boolean
    baseUrl: string
    imageOptimization: boolean
    compression: boolean
    caching: {
      staticAssets: number // seconds
      images: number // seconds
      api: number // seconds
    }
  }
  images: {
    formats: string[]
    quality: number
    sizes: number[]
    placeholder: 'blur' | 'empty'
    loading: 'lazy' | 'eager'
  }
  api: {
    timeout: number
    retries: number
    rateLimit: {
      windowMs: number
      maxRequests: number
    }
  }
  monitoring: {
    enabled: boolean
    vitals: boolean
    errors: boolean
    performance: boolean
  }
}

/**
 * Get performance configuration based on environment
 */
export function getPerformanceConfig(): PerformanceConfig {
  const isProduction = process.env.NODE_ENV === 'production'
  const isDevelopment = process.env.NODE_ENV === 'development'

  return {
    cdn: {
      enabled: isProduction,
      baseUrl: process.env.NEXT_PUBLIC_CDN_URL || '',
      imageOptimization: true,
      compression: isProduction,
      caching: {
        staticAssets: isProduction ? 31536000 : 3600, // 1 year in prod, 1 hour in dev
        images: isProduction ? 2592000 : 3600, // 30 days in prod, 1 hour in dev
        api: isProduction ? 300 : 0 // 5 minutes in prod, no cache in dev
      }
    },
    images: {
      formats: ['webp', 'avif', 'jpeg', 'png'],
      quality: isProduction ? 85 : 75,
      sizes: [320, 640, 768, 1024, 1280, 1920],
      placeholder: 'blur',
      loading: 'lazy'
    },
    api: {
      timeout: 30000, // 30 seconds
      retries: 3,
      rateLimit: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        maxRequests: isProduction ? 100 : 1000
      }
    },
    monitoring: {
      enabled: isProduction,
      vitals: true,
      errors: true,
      performance: true
    }
  }
}

/**
 * Image optimization utilities
 */
export class ImageOptimizer {
  private config: PerformanceConfig

  constructor() {
    this.config = getPerformanceConfig()
  }

  /**
   * Generate optimized image URL
   */
  getOptimizedImageUrl(
    src: string,
    options: {
      width?: number
      height?: number
      quality?: number
      format?: string
    } = {}
  ): string {
    if (!this.config.cdn.enabled || !this.config.cdn.imageOptimization) {
      return src
    }

    const params = new URLSearchParams()
    
    if (options.width) params.set('w', options.width.toString())
    if (options.height) params.set('h', options.height.toString())
    if (options.quality) params.set('q', options.quality.toString())
    if (options.format) params.set('f', options.format)

    // Auto-optimize for modern browsers
    params.set('auto', 'format,compress')

    const baseUrl = this.config.cdn.baseUrl || ''
    const separator = src.includes('?') ? '&' : '?'
    
    return `${baseUrl}${src}${separator}${params.toString()}`
  }

  /**
   * Generate responsive image srcSet
   */
  generateSrcSet(src: string, sizes: number[] = this.config.images.sizes): string {
    return sizes
      .map(size => `${this.getOptimizedImageUrl(src, { width: size })} ${size}w`)
      .join(', ')
  }

  /**
   * Get optimal image format for browser
   */
  getOptimalFormat(userAgent?: string): string {
    if (!userAgent) return 'webp'

    // Check for AVIF support (Chrome 85+, Firefox 93+)
    if (userAgent.includes('Chrome/') && this.getChromeVersion(userAgent) >= 85) {
      return 'avif'
    }

    // Check for WebP support (most modern browsers)
    if (userAgent.includes('Chrome/') || userAgent.includes('Firefox/') || userAgent.includes('Safari/')) {
      return 'webp'
    }

    return 'jpeg'
  }

  private getChromeVersion(userAgent: string): number {
    const match = userAgent.match(/Chrome\/(\d+)/)
    return match ? parseInt(match[1], 10) : 0
  }
}

/**
 * Performance monitoring utilities
 */
export class PerformanceMonitor {
  private config: PerformanceConfig

  constructor() {
    this.config = getPerformanceConfig()
  }

  /**
   * Track Core Web Vitals
   */
  trackWebVitals() {
    if (!this.config.monitoring.enabled || !this.config.monitoring.vitals) {
      return
    }

    // Track Largest Contentful Paint (LCP)
    this.trackLCP()

    // Track First Input Delay (FID)
    this.trackFID()

    // Track Cumulative Layout Shift (CLS)
    this.trackCLS()
  }

  private trackLCP() {
    if (typeof window === 'undefined') return

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      const lastEntry = entries[entries.length - 1]
      
      console.log('LCP:', lastEntry.startTime)
      
      // Send to analytics service
      this.sendMetric('LCP', lastEntry.startTime)
    })

    observer.observe({ entryTypes: ['largest-contentful-paint'] })
  }

  private trackFID() {
    if (typeof window === 'undefined') return

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      entries.forEach((entry) => {
        const fidEntry = entry as any // First Input Delay entry has processingStart
        const fid = fidEntry.processingStart ? fidEntry.processingStart - entry.startTime : entry.duration
        console.log('FID:', fid)

        // Send to analytics service
        this.sendMetric('FID', fid)
      })
    })

    observer.observe({ entryTypes: ['first-input'] })
  }

  private trackCLS() {
    if (typeof window === 'undefined') return

    let clsValue = 0
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      entries.forEach((entry: any) => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value
        }
      })
      
      console.log('CLS:', clsValue)
      
      // Send to analytics service
      this.sendMetric('CLS', clsValue)
    })

    observer.observe({ entryTypes: ['layout-shift'] })
  }

  private sendMetric(name: string, value: number) {
    // In production, send to analytics service
    if (this.config.monitoring.enabled) {
      // Example: Google Analytics, DataDog, etc.
      console.log(`Performance Metric - ${name}: ${value}`)
    }
  }

  /**
   * Track API performance
   */
  trackApiCall(endpoint: string, duration: number, success: boolean) {
    if (!this.config.monitoring.enabled || !this.config.monitoring.performance) {
      return
    }

    console.log(`API Call - ${endpoint}: ${duration}ms (${success ? 'success' : 'error'})`)
    
    // Send to monitoring service
    this.sendMetric(`api_${endpoint.replace(/\//g, '_')}`, duration)
  }
}

/**
 * CDN configuration utilities
 */
export class CDNManager {
  private config: PerformanceConfig

  constructor() {
    this.config = getPerformanceConfig()
  }

  /**
   * Get CDN URL for static assets
   */
  getAssetUrl(path: string): string {
    if (!this.config.cdn.enabled || !this.config.cdn.baseUrl) {
      return path
    }

    return `${this.config.cdn.baseUrl}${path}`
  }

  /**
   * Get cache headers for different asset types
   */
  getCacheHeaders(assetType: 'static' | 'image' | 'api'): Record<string, string> {
    const cachingConfig = this.config.cdn.caching
    const maxAge = assetType === 'static' ? cachingConfig.staticAssets :
                   assetType === 'image' ? cachingConfig.images :
                   cachingConfig.api
    
    if (maxAge === 0) {
      return {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    }

    return {
      'Cache-Control': `public, max-age=${maxAge}, immutable`,
      'Expires': new Date(Date.now() + maxAge * 1000).toUTCString()
    }
  }

  /**
   * Preload critical resources
   */
  preloadCriticalResources(): string[] {
    const criticalResources = [
      '/fonts/inter-var.woff2',
      '/images/logo.svg',
      '/css/critical.css'
    ]

    return criticalResources.map(resource => this.getAssetUrl(resource))
  }
}

// Export singleton instances
export const imageOptimizer = new ImageOptimizer()
export const performanceMonitor = new PerformanceMonitor()
export const cdnManager = new CDNManager()

export default {
  getPerformanceConfig,
  ImageOptimizer,
  PerformanceMonitor,
  CDNManager,
  imageOptimizer,
  performanceMonitor,
  cdnManager
}
