/**
 * Enhancement API Endpoint - Minu.AI
 * Dedicated endpoint for image enhancement and upscaling
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Replicate from 'replicate'
import { getModelById } from '@/components/generator-v2/lib/models/modelUtils'

// Initialize Replicate client
const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN!,
})

// API Response helpers
const successResponse = (data: any) => NextResponse.json({ success: true, data })
const errorResponse = (message: string, status = 400) => 
  NextResponse.json({ success: false, error: message }, { status })

// Validation function
const validateEnhanceRequest = (body: any) => {
  const errors: string[] = []
  
  if (!body.model) errors.push('Model is required')
  if (!body.image) errors.push('Image is required')
  if (!body.mode || body.mode !== 'enhance') errors.push('Mode must be "enhance"')
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return errorResponse('Authentication required', 401)
    }

    console.log(`🔧 Enhancement request from user: ${user.id}`)

    // Parse request body
    const body = await request.json()
    console.log('📥 Enhancement request:', {
      model: body.model,
      hasImage: !!body.image,
      parameters: Object.keys(body.parameters || {})
    })

    // Validate request
    const validation = validateEnhanceRequest(body)
    if (!validation.isValid) {
      return errorResponse(`Validation failed: ${validation.errors.join(', ')}`)
    }

    const { model: modelId, image, parameters = {} } = body

    // Get model configuration
    const model = getModelById(modelId)
    if (!model) {
      return errorResponse(`Model ${modelId} not found`)
    }

    // Validate model supports enhancement
    if (!model.supportedModes.includes('enhance')) {
      return errorResponse(`Model ${model.name} does not support enhancement mode`)
    }

    // Prepare Replicate input based on model
    let replicateInput: Record<string, any> = {
      image: image
    }

    // Model-specific parameter mapping
    switch (model.id) {
      case 'real-esrgan':
        replicateInput = {
          image: image,
          scale: parameters.scale || 2,
          face_enhance: parameters.face_enhance || false
        }
        break

      case 'swinir':
        replicateInput = {
          image: image,
          task_type: parameters.task_type || 'Real-World Image Super-Resolution-Large'
        }
        break

      case 'ultimate-sd-upscale':
        replicateInput = {
          image: image,
          positive_prompt: parameters.positive_prompt || '',
          negative_prompt: parameters.negative_prompt || '',
          upscale_by: parameters.upscale_by || 2,
          steps: parameters.steps || 20,
          denoise: parameters.denoise || 0.4,
          scheduler: parameters.scheduler || 'karras',
          upscaler: parameters.upscaler || '4x-UltraSharp'
        }
        break

      default:
        // Generic enhancement parameters
        replicateInput = {
          image: image,
          scale: parameters.scale || 2,
          ...parameters
        }
    }

    console.log('🚀 Starting enhancement with:', {
      model: model.replicateModel,
      inputKeys: Object.keys(replicateInput)
    })

    // Validate Replicate API token
    if (!process.env.REPLICATE_API_TOKEN) {
      return errorResponse('Replicate API token not configured', 500)
    }

    // Create Replicate prediction
    let prediction
    try {
      prediction = await replicate.predictions.create({
        model: model.replicateModel,
        input: replicateInput,
        webhook_events_filter: ['completed']
      })
      console.log('✅ Replicate enhancement prediction created:', prediction.id)
    } catch (replicateError: any) {
      console.error('❌ Replicate API error:', replicateError)
      return errorResponse(`Enhancement failed: ${replicateError.message}`, 500)
    }

    // Create response
    const result = {
      id: prediction.id,
      status: prediction.status,
      model: model.replicateModel,
      mode: 'enhance',
      input: replicateInput,
      userId: user.id,
      output: prediction.output ? {
        urls: Array.isArray(prediction.output) ? prediction.output : [prediction.output],
        metadata: {
          format: 'jpg',
          enhanced: true,
          originalImage: image
        }
      } : undefined,
      error: prediction.error ? {
        message: prediction.error,
        retryable: true
      } : undefined,
      progress: 0,
      createdAt: new Date().toISOString(),
      estimatedCost: model.pricing.costPerImage || 0.001
    }

    console.log('✅ Enhancement request processed:', {
      predictionId: prediction.id,
      status: prediction.status,
      model: model.name
    })

    return successResponse(result)

  } catch (error: any) {
    console.error('❌ Enhancement API error:', error)
    return errorResponse(
      'Enhancement request failed. Please try again.',
      500
    )
  }
}

// Health check endpoint
export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      status: 'operational',
      endpoint: '/api/enhance',
      timestamp: new Date().toISOString(),
      hasReplicateToken: !!process.env.REPLICATE_API_TOKEN,
      supportedModels: ['real-esrgan', 'swinir', 'ultimate-sd-upscale']
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Enhancement API health check failed' },
      { status: 500 }
    )
  }
}
