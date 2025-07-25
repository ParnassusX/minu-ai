'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Download, 
  ExternalLink, 
  Heart, 
  Share2, 
  Copy, 
  Check,
  Maximize2,
  Play,
  Pause,
  Volume2,
  VolumeX
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface GenerationResult {
  id: string
  url: string
  originalUrl?: string
  type?: 'image' | 'video'
  format?: string
  metadata?: {
    width?: number
    height?: number
    duration?: number
    model?: string
    prompt?: string
  }
}

interface GenerationResultDisplayProps {
  results: GenerationResult[]
  isVisible: boolean
  onClose?: () => void
  onDownload?: (result: GenerationResult) => void
  onAddToFavorites?: (result: GenerationResult) => void
  className?: string
}

export function GenerationResultDisplay({
  results,
  isVisible,
  onClose,
  onDownload,
  onAddToFavorites,
  className
}: GenerationResultDisplayProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState<Record<string, boolean>>({})
  const [isMuted, setIsMuted] = useState<Record<string, boolean>>({})
  const [copiedPrompt, setCopiedPrompt] = useState(false)

  const currentResult = results[selectedIndex]

  const handleDownload = async (result: GenerationResult) => {
    try {
      // Use high-quality download service for luxury photo downloads
      const { downloadHighQualityImage } = await import('@/lib/download/imageDownload')
      await downloadHighQualityImage(result.url, result.id, 'luxury')
      onDownload?.(result)
    } catch (error) {
      console.error('High-quality download failed, falling back to simple download:', error)
      // Fallback to simple download
      try {
        const response = await fetch(result.url)
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `minu-ai-${result.id}-hq.${result.format || 'jpg'}`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        onDownload?.(result)
      } catch (fallbackError) {
        console.error('Download failed completely:', fallbackError)
      }
    }
  }

  const handleCopyPrompt = async () => {
    if (currentResult?.metadata?.prompt) {
      await navigator.clipboard.writeText(currentResult.metadata.prompt)
      setCopiedPrompt(true)
      setTimeout(() => setCopiedPrompt(false), 2000)
    }
  }

  const handleVideoToggle = (resultId: string) => {
    setIsPlaying(prev => ({ ...prev, [resultId]: !prev[resultId] }))
  }

  const handleMuteToggle = (resultId: string) => {
    setIsMuted(prev => ({ ...prev, [resultId]: !prev[resultId] }))
  }

  if (!isVisible || !results.length) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 16 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className={cn(
          "bg-white/10 backdrop-blur-md rounded-lg border border-white/20 p-4 space-y-3",
          className
        )}
      >
        {/* Modern AI Platform Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <h3 className="text-base font-semibold text-white">
              Generation Complete
            </h3>
            <Badge variant="secondary" className="bg-green-500/20 text-green-300 border-green-500/30 text-xs">
              {results.length} {results.length === 1 ? 'result' : 'results'}
            </Badge>
          </div>
          {onClose && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-white/70 hover:text-white hover:bg-white/10 h-7 w-7 p-0"
            >
              ×
            </Button>
          )}
        </div>

        {/* Compact Display Area */}
        <div className="space-y-3">
          {/* Modern Result Navigation */}
          {results.length > 1 && (
            <div className="flex items-center justify-center space-x-1.5">
              {results.map((_, index) => (
                <button
                  key={`result-${index}`}
                  onClick={() => setSelectedIndex(index)}
                  className={cn(
                    "w-2.5 h-2.5 rounded-full transition-all duration-200",
                    index === selectedIndex
                      ? "bg-white scale-110"
                      : "bg-white/30 hover:bg-white/50"
                  )}
                />
              ))}
            </div>
          )}

          {/* Professional Result Display */}
          {currentResult && (
            <div className="relative bg-black/20 rounded-md overflow-hidden">
              {currentResult.type === 'video' ? (
                <div className="relative">
                  <video
                    src={currentResult.url}
                    className="w-full h-auto max-h-96 object-contain"
                    controls={false}
                    autoPlay={isPlaying[currentResult.id]}
                    muted={isMuted[currentResult.id]}
                    loop
                  />
                  
                  {/* Video Controls Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 hover:opacity-100 transition-opacity">
                    <div className="flex items-center space-x-4">
                      <Button
                        variant="ghost"
                        size="lg"
                        onClick={() => handleVideoToggle(currentResult.id)}
                        className="text-white hover:bg-white/20 rounded-full"
                      >
                        {isPlaying[currentResult.id] ? (
                          <Pause className="h-8 w-8" />
                        ) : (
                          <Play className="h-8 w-8" />
                        )}
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleMuteToggle(currentResult.id)}
                        className="text-white hover:bg-white/20 rounded-full"
                      >
                        {isMuted[currentResult.id] ? (
                          <VolumeX className="h-5 w-5" />
                        ) : (
                          <Volume2 className="h-5 w-5" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <img
                  src={currentResult.url}
                  alt="Generated result"
                  className="w-full h-auto max-h-96 object-contain"
                />
              )}
            </div>
          )}

          {/* Metadata */}
          {currentResult?.metadata && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              {currentResult.metadata.width && currentResult.metadata.height && (
                <div className="text-center">
                  <div className="text-white/70">Resolution</div>
                  <div className="text-white font-medium">
                    {currentResult.metadata.width}×{currentResult.metadata.height}
                  </div>
                </div>
              )}
              
              {currentResult.metadata.model && (
                <div className="text-center">
                  <div className="text-white/70">Model</div>
                  <div className="text-white font-medium">
                    {currentResult.metadata.model}
                  </div>
                </div>
              )}
              
              {currentResult.metadata.duration && (
                <div className="text-center">
                  <div className="text-white/70">Duration</div>
                  <div className="text-white font-medium">
                    {currentResult.metadata.duration}s
                  </div>
                </div>
              )}
              
              <div className="text-center">
                <div className="text-white/70">Format</div>
                <div className="text-white font-medium uppercase">
                  {currentResult.format || 'JPG'}
                </div>
              </div>
            </div>
          )}

          {/* Modern Action Buttons */}
          <div className="flex items-center justify-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDownload(currentResult)}
              className="text-white hover:bg-white/10 h-8 px-3"
            >
              <Download className="h-3.5 w-3.5 mr-1.5" />
              Download
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.open(currentResult.url, '_blank')}
              className="text-white hover:bg-white/10 h-8 px-3"
            >
              <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
              Open
            </Button>
            
            {currentResult.metadata?.prompt && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyPrompt}
                className="text-white hover:bg-white/10 h-8 px-3"
              >
                {copiedPrompt ? (
                  <Check className="h-3.5 w-3.5 mr-1.5" />
                ) : (
                  <Copy className="h-3.5 w-3.5 mr-1.5" />
                )}
                {copiedPrompt ? 'Copied!' : 'Copy Prompt'}
              </Button>
            )}

            {onAddToFavorites && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onAddToFavorites(currentResult)}
                className="text-white hover:bg-white/10 h-8 px-3"
              >
                <Heart className="h-3.5 w-3.5 mr-1.5" />
                Favorite
              </Button>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
