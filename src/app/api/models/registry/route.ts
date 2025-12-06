/**
 * Dynamic Model Registry API
 * Provides model discovery and auto-updating capabilities
 * Supports adaptive UI based on model capabilities
 */

import { NextRequest, NextResponse } from 'next/server'
import { ALL_MODELS } from '@/components/generator-v2/lib/models'
import { ModelSchema } from '@/components/generator-v2/types/models'

// Extended model capabilities for adaptive UI
export interface ExtendedModelCapabilities {
  // Input types
  supportsTextPrompt: boolean
  supportsImageInput: boolean
  supportsMultipleImages: boolean
  supportsFrameToFrame: boolean // For video models with start/end frames
  supportsReferenceImage: boolean // For style/reference-based generation
  
  // Output types
  outputType: 'image' | 'video' | 'enhanced-image'
  supportsBatchOutput: boolean
  maxBatchSize: number
  
  // Advanced features
  supportsNegativePrompt: boolean
  supportsPromptEnhancement: boolean
  supportsInpainting: boolean
  supportsOutpainting: boolean
  supportsVariations: boolean
  supportsControlNet: boolean
  
  // E-commerce specific
  supportsProductPhotography: boolean
  supportsBackgroundRemoval: boolean
  supportsMultiAngle: boolean
  supportsMeasurementOverlay: boolean
}

// Batch template for e-commerce
export interface ProductBatchTemplate {
  id: string
  name: string
  description: string
  imageTypes: {
    id: string
    name: string
    promptTemplate: string
    requiredInputs: string[]
    outputAspectRatio: string
  }[]
}

// Pre-defined batch templates for stores
const PRODUCT_BATCH_TEMPLATES: ProductBatchTemplate[] = [
  {
    id: 'standard-product',
    name: 'Standard Product Photography',
    description: 'Generate 10 professional product images for e-commerce',
    imageTypes: [
      {
        id: 'hero',
        name: 'Hero Shot',
        promptTemplate: 'Professional product photography of {product_name}, clean white background, centered, high resolution, studio lighting',
        requiredInputs: ['product_image'],
        outputAspectRatio: '1:1'
      },
      {
        id: 'lifestyle',
        name: 'Lifestyle Shot',
        promptTemplate: '{product_name} in natural lifestyle setting, warm ambient lighting, appealing context',
        requiredInputs: ['product_image'],
        outputAspectRatio: '16:9'
      },
      {
        id: 'detail-1',
        name: 'Detail Close-up 1',
        promptTemplate: 'Extreme close-up detail shot of {product_name}, showing texture and quality, macro photography',
        requiredInputs: ['product_image'],
        outputAspectRatio: '1:1'
      },
      {
        id: 'detail-2',
        name: 'Detail Close-up 2',
        promptTemplate: 'Close-up of key feature of {product_name}, product detail photography, studio lighting',
        requiredInputs: ['product_image'],
        outputAspectRatio: '1:1'
      },
      {
        id: 'angle-45',
        name: '45° Angle View',
        promptTemplate: '{product_name} photographed at 45 degree angle, professional product photography, clean background',
        requiredInputs: ['product_image'],
        outputAspectRatio: '1:1'
      },
      {
        id: 'angle-side',
        name: 'Side Profile',
        promptTemplate: 'Side profile view of {product_name}, clean product photography, white background',
        requiredInputs: ['product_image'],
        outputAspectRatio: '4:3'
      },
      {
        id: 'scale',
        name: 'Scale Reference',
        promptTemplate: '{product_name} with scale reference, showing actual size proportions',
        requiredInputs: ['product_image'],
        outputAspectRatio: '1:1'
      },
      {
        id: 'packaging',
        name: 'With Packaging',
        promptTemplate: '{product_name} displayed with its packaging, unboxing photography style',
        requiredInputs: ['product_image'],
        outputAspectRatio: '4:3'
      },
      {
        id: 'features',
        name: 'Features Highlight',
        promptTemplate: '{product_name} with highlighted key features, infographic style product photography',
        requiredInputs: ['product_image'],
        outputAspectRatio: '16:9'
      },
      {
        id: 'brand',
        name: 'Brand Showcase',
        promptTemplate: '{product_name} with brand logo placement, premium brand photography style',
        requiredInputs: ['product_image', 'brand_logo'],
        outputAspectRatio: '1:1'
      }
    ]
  }
]

// Map existing models to extended capabilities
function getExtendedCapabilities(model: ModelSchema): ExtendedModelCapabilities {
  const base: ExtendedModelCapabilities = {
    supportsTextPrompt: true,
    supportsImageInput: model.capabilities.supportsImageInput,
    supportsMultipleImages: model.capabilities.supportsMultipleImages,
    supportsFrameToFrame: false,
    supportsReferenceImage: false,
    outputType: 'image',
    supportsBatchOutput: false,
    maxBatchSize: 1,
    supportsNegativePrompt: false,
    supportsPromptEnhancement: false,
    supportsInpainting: false,
    supportsOutpainting: false,
    supportsVariations: false,
    supportsControlNet: false,
    supportsProductPhotography: false,
    supportsBackgroundRemoval: false,
    supportsMultiAngle: false,
    supportsMeasurementOverlay: false
  }
  
  // Enhance based on model category and tags
  switch (model.category) {
    case 'video-generation':
      base.outputType = 'video'
      base.supportsFrameToFrame = model.parameters.some(p => p.name === 'last_frame_image')
      break
    case 'image-enhancement':
      base.outputType = 'enhanced-image'
      break
    case 'image-editing':
      base.supportsInpainting = true
      base.supportsReferenceImage = true
      base.supportsMultipleImages = true
      break
  }
  
  // Models with image input and editing category support context-aware editing
  // Using capabilities/tags instead of hardcoded IDs for flexibility
  if (model.capabilities.supportsImageInput && model.tags?.includes('context-aware')) {
    base.supportsReferenceImage = true
    base.supportsProductPhotography = true
    base.supportsVariations = true
  }
  
  // Also check for kontext in tags for backward compatibility
  if (model.tags?.some(t => t.includes('kontext') || t.includes('context'))) {
    base.supportsReferenceImage = true
    base.supportsProductPhotography = true
    base.supportsVariations = true
  }
  
  // Models with multiple image support are good for product photography
  if (model.capabilities.supportsMultipleImages && model.capabilities.maxImages >= 2) {
    base.supportsProductPhotography = true
    base.supportsReferenceImage = true
    base.supportsMultipleImages = true
    base.maxBatchSize = model.capabilities.maxImages
    base.supportsVariations = true
  }
  
  // Image editing category models support background removal
  if (model.category === 'image-editing') {
    base.supportsBackgroundRemoval = true
  }
  
  // Enhancement models
  if (model.category === 'image-enhancement') {
    base.supportsBatchOutput = true
    base.maxBatchSize = 10
  }
  
  return base
}

// Replicate API model response interface
interface ReplicateModelResponse {
  url: string
  owner: string
  name: string
  description?: string
  visibility: string
  latest_version?: {
    id: string
    created_at: string
  }
}

// Get list of available Replicate models (for auto-update feature)
async function fetchReplicateModels(): Promise<ReplicateModelResponse[]> {
  try {
    const token = process.env.REPLICATE_API_TOKEN
    if (!token) return []
    
    // Fetch popular image/video generation models
    const response = await fetch('https://api.replicate.com/v1/models', {
      headers: {
        'Authorization': `Token ${token}`
      }
    })
    
    if (!response.ok) return []
    
    const data = await response.json()
    return data.results || []
  } catch (error) {
    console.error('Failed to fetch Replicate models:', error)
    return []
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const mode = searchParams.get('mode') // 'images' | 'video' | 'enhance'
    const includeExtended = searchParams.get('extended') === 'true'
    const checkUpdates = searchParams.get('checkUpdates') === 'true'
    
    let models = ALL_MODELS
    
    // Filter by mode if specified
    if (mode) {
      models = models.filter(m => m.supportedModes.includes(mode as any))
    }
    
    // Add extended capabilities if requested
    const modelsWithCapabilities = models.map(model => ({
      ...model,
      ...(includeExtended ? { extendedCapabilities: getExtendedCapabilities(model) } : {})
    }))
    
    // Check for model updates if requested
    let availableUpdates: any[] = []
    if (checkUpdates) {
      const replicateModels = await fetchReplicateModels()
      // Compare with our registered models
      const ourModelNames = new Set(models.map(m => m.replicateModel))
      availableUpdates = replicateModels
        .filter(m => !ourModelNames.has(`${m.owner}/${m.name}`))
        .slice(0, 10) // Limit to 10 suggestions
    }
    
    return NextResponse.json({
      success: true,
      models: modelsWithCapabilities,
      totalModels: modelsWithCapabilities.length,
      categories: {
        imageGeneration: modelsWithCapabilities.filter(m => m.category === 'image-generation').length,
        videoGeneration: modelsWithCapabilities.filter(m => m.category === 'video-generation').length,
        imageEnhancement: modelsWithCapabilities.filter(m => m.category === 'image-enhancement').length,
        imageEditing: modelsWithCapabilities.filter(m => m.category === 'image-editing').length
      },
      batchTemplates: PRODUCT_BATCH_TEMPLATES,
      ...(checkUpdates ? {
        availableUpdates,
        lastChecked: new Date().toISOString()
      } : {}),
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Model registry error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// POST: Get models optimized for specific use case
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      useCase,
      requiredCapabilities = [],
      preferSpeed = false,
      preferQuality = false,
      maxCost
    } = body
    
    let models = ALL_MODELS
    
    // Filter by use case
    switch (useCase) {
      case 'product-photography':
        models = models.filter(m => {
          const ext = getExtendedCapabilities(m)
          return ext.supportsProductPhotography || ext.supportsReferenceImage
        })
        break
      case 'batch-export':
        models = models.filter(m => {
          const ext = getExtendedCapabilities(m)
          return ext.supportsBatchOutput || m.performance.speed === 'fast'
        })
        break
      case 'video-generation':
        models = models.filter(m => m.supportedModes.includes('video'))
        break
      case 'enhancement':
        models = models.filter(m => m.supportedModes.includes('enhance'))
        break
    }
    
    // Filter by required capabilities
    if (requiredCapabilities.length > 0) {
      models = models.filter(m => {
        const ext = getExtendedCapabilities(m)
        return requiredCapabilities.every((cap: string) => 
          (ext as any)[cap] === true
        )
      })
    }
    
    // Sort by preference
    if (preferSpeed) {
      models.sort((a, b) => a.performance.averageTime - b.performance.averageTime)
    } else if (preferQuality) {
      models.sort((a, b) => b.performance.reliability - a.performance.reliability)
    }
    
    // Filter by max cost
    if (maxCost) {
      models = models.filter(m => 
        (m.pricing.costPerImage || m.pricing.costPerSecond || 0) <= maxCost
      )
    }
    
    return NextResponse.json({
      success: true,
      models: models.map(m => ({
        ...m,
        extendedCapabilities: getExtendedCapabilities(m)
      })),
      recommendations: {
        bestForSpeed: models.sort((a, b) => a.performance.averageTime - b.performance.averageTime)[0]?.id,
        bestForQuality: models.sort((a, b) => b.performance.reliability - a.performance.reliability)[0]?.id,
        bestValue: models.sort((a, b) => 
          (a.pricing.costPerImage || a.pricing.costPerSecond || 0) - 
          (b.pricing.costPerImage || b.pricing.costPerSecond || 0)
        )[0]?.id
      },
      batchTemplates: useCase === 'product-photography' ? PRODUCT_BATCH_TEMPLATES : [],
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Model recommendation error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
