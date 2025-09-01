/**
 * Models API V2 - Minu.AI Generator V2
 * Endpoint for retrieving model information
 */

import { NextRequest, NextResponse } from 'next/server'
import { 
  ALL_MODELS, 
  PRIORITY_MODELS, 
  getModelsByMode, 
  getModelsByProvider,
  getModelsByCategory,
  searchModels 
} from '@/components/generator-v2/lib/models'
import { GenerationMode } from '@/components/generator-v2/types/models'

// Success response helper
const successResponse = (data: any) => {
  return NextResponse.json({
    success: true,
    data,
    timestamp: new Date().toISOString(),
    requestId: `req_${Date.now()}_${Math.random().toString(36).substring(2)}`
  })
}

// Error response helper
const errorResponse = (message: string, statusCode = 400) => {
  return NextResponse.json(
    {
      success: false,
      error: {
        message,
        statusCode
      },
      timestamp: new Date().toISOString()
    },
    { status: statusCode }
  )
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Query parameters
    const mode = searchParams.get('mode') as GenerationMode | null
    const provider = searchParams.get('provider')
    const category = searchParams.get('category')
    const priority = searchParams.get('priority') === 'true'
    const search = searchParams.get('search')
    const active = searchParams.get('active') !== 'false' // Default to true
    
    console.log('📋 Models API request:', { mode, provider, category, priority, search, active })
    console.log('📊 ALL_MODELS length:', ALL_MODELS.length)
    console.log('📊 PRIORITY_MODELS length:', PRIORITY_MODELS.length)

    if (ALL_MODELS.length === 0) {
      console.error('❌ ALL_MODELS is empty! Check model imports.')
    } else {
      console.log('✅ Models loaded:', ALL_MODELS.map(m => m.name).join(', '))
    }

    let models = ALL_MODELS
    
    // Filter by priority first if requested
    if (priority) {
      models = PRIORITY_MODELS
    }
    
    // Filter by mode
    if (mode) {
      models = getModelsByMode(mode).filter(model => 
        priority ? model.isPriority : true
      )
    }
    
    // Filter by provider
    if (provider) {
      models = models.filter(model => 
        model.provider.toLowerCase() === provider.toLowerCase()
      )
    }
    
    // Filter by category
    if (category) {
      models = models.filter(model => model.category === category)
    }
    
    // Filter by active status
    if (active) {
      models = models.filter(model => model.isActive)
    }
    
    // Search functionality
    if (search) {
      models = searchModels(models, search)
    }
    
    // Sort models (priority first, then by speed, then by name)
    models.sort((a, b) => {
      // Priority models first
      if (a.isPriority && !b.isPriority) return -1
      if (!a.isPriority && b.isPriority) return 1
      
      // Then by speed (fast first)
      const speedOrder = { fast: 0, medium: 1, slow: 2 }
      const speedDiff = speedOrder[a.performance.speed] - speedOrder[b.performance.speed]
      if (speedDiff !== 0) return speedDiff
      
      // Finally by name
      return a.name.localeCompare(b.name)
    })
    
    // Prepare response data
    const responseData = {
      models: models.map(model => ({
        id: model.id,
        name: model.name,
        description: model.description,
        owner: model.owner,
        replicateModel: model.replicateModel,
        category: model.category,
        supportedModes: model.supportedModes,
        provider: model.provider,
        version: model.version,
        
        // Pricing info
        pricing: model.pricing,
        
        // Capabilities
        capabilities: model.capabilities,
        
        // Performance metrics
        performance: model.performance,
        
        // Status
        isActive: model.isActive,
        isPriority: model.isPriority,
        tags: model.tags,
        
        // Timestamps
        createdAt: model.createdAt,
        updatedAt: model.updatedAt
      })),
      
      // Metadata
      metadata: {
        total: models.length,
        priority: models.filter(m => m.isPriority).length,
        active: models.filter(m => m.isActive).length,
        byMode: {
          images: models.filter(m => m.supportedModes.includes('images')).length,
          video: models.filter(m => m.supportedModes.includes('video')).length,
          enhance: models.filter(m => m.supportedModes.includes('enhance')).length
        },
        byProvider: models.reduce((acc, model) => {
          acc[model.provider] = (acc[model.provider] || 0) + 1
          return acc
        }, {} as Record<string, number>),
        filters: {
          mode,
          provider,
          category,
          priority,
          search,
          active
        }
      }
    }
    
    console.log('✅ Returning models:', {
      total: responseData.models.length,
      priority: responseData.metadata.priority,
      filters: responseData.metadata.filters
    })
    
    return successResponse(responseData)
    
  } catch (error: any) {
    console.error('❌ Models API error:', error)
    return errorResponse(
      'Failed to retrieve models. Please try again.',
      500
    )
  }
}

// This function should be in a dynamic route like [id]/route.ts
// For now, removing it to fix TypeScript compilation
/*
export async function GET_MODEL(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const modelId = params.id
    const model = ALL_MODELS.find(m => m.id === modelId)
    
    if (!model) {
      return errorResponse(`Model ${modelId} not found`, 404)
    }
    
    return successResponse({
      model: {
        id: model.id,
        name: model.name,
        description: model.description,
        owner: model.owner,
        replicateModel: model.replicateModel,
        category: model.category,
        supportedModes: model.supportedModes,
        provider: model.provider,
        version: model.version,
        parameters: model.parameters,
        pricing: model.pricing,
        capabilities: model.capabilities,
        performance: model.performance,
        isActive: model.isActive,
        isPriority: model.isPriority,
        tags: model.tags,
        createdAt: model.createdAt,
        updatedAt: model.updatedAt
      }
    })
    
  } catch (error: any) {
    console.error('❌ Model detail API error:', error)
    return errorResponse(
      'Failed to retrieve model details. Please try again.',
      500
    )
  }
}
*/
