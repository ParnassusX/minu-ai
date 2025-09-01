'use client'

import Image from 'next/image'
import { useState, useEffect } from 'react'
import { imageOptimizer } from '@/lib/config/performance'
import { cn } from '@/lib/utils'

interface OptimizedImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
  priority?: boolean
  quality?: number
  placeholder?: 'blur' | 'empty'
  blurDataURL?: string
  sizes?: string
  fill?: boolean
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down'
  objectPosition?: string
  onLoad?: () => void
  onError?: () => void
}

/**
 * Optimized image component with automatic format detection,
 * responsive sizing, and performance monitoring
 */
export function OptimizedImage({
  src,
  alt,
  width,
  height,
  className,
  priority = false,
  quality,
  placeholder = 'blur',
  blurDataURL,
  sizes,
  fill = false,
  objectFit = 'cover',
  objectPosition = 'center',
  onLoad,
  onError
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [loadTime, setLoadTime] = useState<number | null>(null)

  // Generate optimized image URL
  const optimizedSrc = imageOptimizer.getOptimizedImageUrl(src, {
    width,
    height,
    quality
  })

  // Generate responsive srcSet if sizes are provided
  const srcSet = sizes ? imageOptimizer.generateSrcSet(src) : undefined

  // Generate blur placeholder if not provided
  const defaultBlurDataURL = blurDataURL || generateBlurDataURL(width || 400, height || 300)

  useEffect(() => {
    const startTime = performance.now()
    setLoadTime(startTime)
  }, [src])

  const handleLoad = () => {
    setIsLoading(false)
    if (loadTime) {
      const duration = performance.now() - loadTime
      console.log(`Image loaded: ${src} (${duration.toFixed(2)}ms)`)
    }
    onLoad?.()
  }

  const handleError = () => {
    setIsLoading(false)
    setHasError(true)
    console.error(`Failed to load image: ${src}`)
    onError?.()
  }

  if (hasError) {
    return (
      <div 
        className={cn(
          "flex items-center justify-center bg-gray-100 dark:bg-gray-800 text-gray-400",
          className
        )}
        style={{ width, height }}
      >
        <svg
          className="w-8 h-8"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </div>
    )
  }

  return (
    <div className={cn("relative overflow-hidden", className)}>
      <Image
        src={optimizedSrc}
        alt={alt}
        width={fill ? undefined : width}
        height={fill ? undefined : height}
        fill={fill}
        priority={priority}
        quality={quality}
        placeholder={placeholder}
        blurDataURL={placeholder === 'blur' ? defaultBlurDataURL : undefined}
        sizes={sizes}
        className={cn(
          "transition-opacity duration-300",
          isLoading ? "opacity-0" : "opacity-100",
          fill && `object-${objectFit}`,
          fill && objectPosition && `object-${objectPosition}`
        )}
        style={!fill ? { objectFit, objectPosition } : undefined}
        onLoad={handleLoad}
        onError={handleError}
      />
      
      {/* Loading skeleton */}
      {isLoading && (
        <div 
          className={cn(
            "absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse",
            "flex items-center justify-center"
          )}
        >
          <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
        </div>
      )}
    </div>
  )
}

/**
 * Generate a simple blur data URL for placeholder
 */
function generateBlurDataURL(width: number, height: number): string {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  
  const ctx = canvas.getContext('2d')
  if (!ctx) return ''
  
  // Create a simple gradient blur effect
  const gradient = ctx.createLinearGradient(0, 0, width, height)
  gradient.addColorStop(0, '#f3f4f6')
  gradient.addColorStop(1, '#e5e7eb')
  
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, width, height)
  
  return canvas.toDataURL()
}

/**
 * Responsive image component with automatic sizing
 */
export function ResponsiveImage({
  src,
  alt,
  aspectRatio = '16/9',
  className,
  ...props
}: Omit<OptimizedImageProps, 'width' | 'height' | 'fill'> & {
  aspectRatio?: string
}) {
  return (
    <div 
      className={cn("relative w-full", className)}
      style={{ aspectRatio }}
    >
      <OptimizedImage
        src={src}
        alt={alt}
        fill
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        {...props}
      />
    </div>
  )
}

/**
 * Gallery image component optimized for grid layouts
 */
export function GalleryImage({
  src,
  alt,
  className,
  onClick,
  ...props
}: OptimizedImageProps & {
  onClick?: () => void
}) {
  return (
    <div 
      className={cn(
        "relative aspect-square cursor-pointer group overflow-hidden rounded-lg",
        "hover:scale-105 transition-transform duration-200",
        className
      )}
      onClick={onClick}
    >
      <OptimizedImage
        src={src}
        alt={alt}
        fill
        sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
        className="group-hover:brightness-110 transition-all duration-200"
        {...props}
      />
      
      {/* Hover overlay */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200" />
    </div>
  )
}

export default OptimizedImage
