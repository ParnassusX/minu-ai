'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Upload,
  ArrowUp,
  Download,
  Loader2,
  AlertCircle,
  CheckCircle,
  Image as ImageIcon,
  Sparkles
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface UpscalerModel {
  id: string
  name: string
  description: string
  provider: string
  pricing: {
    display: string
    costPerSecond?: number
  }
  performance: {
    speed: 'fast' | 'medium' | 'slow'
    quality: 'standard' | 'high' | 'premium'
    averageTime: number
  }
  features: string[]
}

interface UpscalerInterfaceProps {
  readonly models: UpscalerModel[]
  readonly onUpscale: (imageFile: File, modelId: string) => Promise<string>
  readonly className?: string
}

interface UpscaleResult {
  id: string
  originalImage: string
  upscaledImage: string
  modelUsed: string
  timestamp: Date
  status: 'processing' | 'completed' | 'failed'
}

export function UpscalerInterface({
  models,
  onUpscale,
  className
}: UpscalerInterfaceProps) {
  const [selectedModel, setSelectedModel] = useState(models[0]?.id || '')
  const [dragActive, setDragActive] = useState(false)
  const [uploadedImage, setUploadedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [results, setResults] = useState<UpscaleResult[]>([])
  const [error, setError] = useState<string | null>(null)

  const selectedModelData = models.find(m => m.id === selectedModel)

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const files = Array.from(e.dataTransfer.files)
    const imageFile = files.find(file => file.type.startsWith('image/'))
    
    if (imageFile) {
      handleImageUpload(imageFile)
    }
  }, [])

  const handleImageUpload = (file: File) => {
    setUploadedImage(file)
    setError(null)

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleImageUpload(file)
    }
  }

  const handleUpscale = async () => {
    if (!uploadedImage || !selectedModel) return

    setIsProcessing(true)
    setError(null)

    try {
      const upscaledImageUrl = await onUpscale(uploadedImage, selectedModel)
      
      const newResult: UpscaleResult = {
        id: Date.now().toString(),
        originalImage: imagePreview!,
        upscaledImage: upscaledImageUrl,
        modelUsed: selectedModelData?.name || selectedModel,
        timestamp: new Date(),
        status: 'completed'
      }

      setResults(prev => [newResult, ...prev])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upscale image')
    } finally {
      setIsProcessing(false)
    }
  }

  const getSpeedBadgeColor = (speed: string) => {
    switch (speed) {
      case 'fast': return 'bg-green-100 text-green-700 border-green-200'
      case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200'
      case 'slow': return 'bg-red-100 text-red-700 border-red-200'
      default: return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Model Selection */}
      <Card className="bg-white/80 backdrop-blur-sm border-gray-200/60">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center space-x-2">
            <ArrowUp className="h-5 w-5 text-indigo-500" />
            <span>Image Upscaler</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Model Selector */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {models.map((model) => (
              <button
                key={model.id}
                onClick={() => setSelectedModel(model.id)}
                className={cn(
                  "p-4 rounded-lg border text-left transition-all duration-200",
                  "hover:shadow-md hover:scale-[1.02]",
                  selectedModel === model.id
                    ? "border-indigo-300 bg-indigo-50/80 ring-2 ring-indigo-500/20"
                    : "border-gray-200 bg-white/60 hover:border-gray-300"
                )}
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-medium text-gray-900">{model.name}</h3>
                  <Badge 
                    variant="outline" 
                    className={cn("text-xs", getSpeedBadgeColor(model.performance.speed))}
                  >
                    {model.performance.speed}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 mb-2">{model.description}</p>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{model.pricing.display}</span>
                  <span>~{model.performance.averageTime}s</span>
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Upload Area */}
      <Card className="bg-white/80 backdrop-blur-sm border-gray-200/60">
        <CardContent className="p-6">
          <div
            className={cn(
              "relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200",
              dragActive
                ? "border-indigo-400 bg-indigo-50/80"
                : "border-gray-300 hover:border-gray-400",
              uploadedImage && "border-green-300 bg-green-50/80"
            )}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              type="file"
              accept="image/*"
              onChange={handleFileInput}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />

            {imagePreview ? (
              <div className="space-y-4">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="max-w-full max-h-64 mx-auto rounded-lg shadow-md"
                />
                <div className="flex items-center justify-center space-x-2 text-green-600">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium">Image ready for upscaling</span>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                  <Upload className="h-8 w-8 text-gray-400" />
                </div>
                <div>
                  <p className="text-lg font-medium text-gray-900">
                    Drop your image here or click to upload
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Supports JPG, PNG, WebP up to 10MB
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Upscale Button */}
          {uploadedImage && (
            <div className="mt-6 flex justify-center">
              <Button
                onClick={handleUpscale}
                disabled={isProcessing || !selectedModel}
                className="px-8 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Upscaling...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Upscale Image
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
              <span className="text-red-700">{error}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {results.length > 0 && (
        <Card className="bg-white/80 backdrop-blur-sm border-gray-200/60">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <ImageIcon className="h-5 w-5 text-green-500" />
              <span>Upscaled Images</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {results.map((result) => (
                <div key={result.id} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Original</p>
                      <img
                        src={result.originalImage}
                        alt="Original"
                        className="w-full rounded-lg border border-gray-200"
                      />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Upscaled</p>
                      <img
                        src={result.upscaledImage}
                        alt="Upscaled"
                        className="w-full rounded-lg border border-gray-200"
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-500">
                      <span>Model: {result.modelUsed}</span>
                      <span className="mx-2">•</span>
                      <span>{result.timestamp.toLocaleTimeString()}</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const link = document.createElement('a')
                        link.href = result.upscaledImage
                        link.download = `upscaled-${result.id}.jpg`
                        link.click()
                      }}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
