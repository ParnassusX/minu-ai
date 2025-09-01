/**
 * Generation API V2 - Minu.AI Generator V2
 * Clean, stable API endpoint for content generation
 */

import { NextRequest, NextResponse } from 'next/server'
import Replicate from 'replicate'
import { validateGenerationRequest } from '@/components/generator-v2/lib/validation/schemas'
import { getModelById } from '@/components/generator-v2/lib/models'
import { API_ERROR_CODES, HTTP_STATUS } from '@/components/generator-v2/types/api'
import { UnifiedStorageService } from '@/lib/storage/unifiedStorage'
import { createClient } from '@/lib/supabase/server'

// Initialize Replicate client
const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN || '',
})

// Error response helper
const errorResponse = (
  code: string,
  message: string,
  userMessage: string,
  statusCode: number = HTTP_STATUS.BAD_REQUEST
) => {
  return NextResponse.json(
    {
      success: false,
      error: {
        code,
        message,
        userMessage,
        statusCode,
        retryable: statusCode >= 500
      },
      timestamp: new Date().toISOString(),
      requestId: `req_${Date.now()}_${Math.random().toString(36).substring(2)}`
    },
    { status: statusCode }
  )
}

// Success response helper
const successResponse = (data: any) => {
  return NextResponse.json({
    success: true,
    data,
    timestamp: new Date().toISOString(),
    requestId: `req_${Date.now()}_${Math.random().toString(36).substring(2)}`
  })
}

// Health check endpoint
export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      success: true,
      status: 'operational',
      version: '2.0.0',
      timestamp: new Date().toISOString(),
      endpoints: {
        generation: '/api/generate-v2',
        models: '/api/models-v2',
        enhancement: '/api/enhance-prompt-v2'
      },
      environment: process.env.NODE_ENV,
      hasReplicateToken: !!process.env.REPLICATE_API_TOKEN,
      hasGeminiKey: !!process.env.GEMINI_API_KEY
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Health check failed' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Proper user authentication - required for all environments
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return errorResponse(
        API_ERROR_CODES.UNAUTHORIZED,
        'Authentication required',
        'Please sign in to generate content.',
        HTTP_STATUS.UNAUTHORIZED
      )
    }

    console.log(`🔐 Generation request from user: ${user.id} (${user.email})`)

    // Parse request body
    const body = await request.json()
    console.log('📥 Generation request received:', {
      model: body.model,
      mode: body.mode,
      hasInput: !!body.input
    })

    // Validate request structure
    const validation = validateGenerationRequest(body)
    if (!validation.success) {
      console.error('❌ Validation failed:', validation.error)
      return errorResponse(
        API_ERROR_CODES.INVALID_INPUT,
        validation.error.message,
        'Invalid request format. Please check your input parameters.'
      )
    }

    const { model: modelId, mode, input, options = {} } = body

    // Get model configuration
    const model = getModelById(modelId.split('/').pop() || modelId)
    if (!model) {
      console.error('❌ Model not found:', modelId)
      return errorResponse(
        API_ERROR_CODES.INVALID_MODEL,
        `Model ${modelId} not found`,
        'The selected model is not available. Please choose a different model.'
      )
    }

    // Validate model supports the requested mode
    if (!model.supportedModes.includes(mode)) {
      console.error('❌ Model mode mismatch:', { model: model.name, mode, supported: model.supportedModes })
      return errorResponse(
        API_ERROR_CODES.INVALID_INPUT,
        `Model ${model.name} does not support ${mode} mode`,
        `This model doesn't support ${mode} generation. Please select a compatible model.`
      )
    }
    // Guard: prompt must be present and non-empty
    if (!input || typeof input.prompt !== 'string' || input.prompt.trim().length === 0) {
      console.error('❌ Missing or empty prompt in request input')
      return errorResponse(
        API_ERROR_CODES.INVALID_INPUT,
        'Prompt is required',
        'Please enter a prompt to generate.'
      )
    }


    // Prepare Replicate input
    const replicateInput: Record<string, any> = {}

    // Map common parameters
    if (input.prompt) replicateInput.prompt = input.prompt
    if (input.aspect_ratio) replicateInput.aspect_ratio = input.aspect_ratio
    if (input.output_format) replicateInput.output_format = input.output_format
    if (input.seed) replicateInput.seed = input.seed
    if (input.safety_tolerance !== undefined) replicateInput.safety_tolerance = input.safety_tolerance
    if (input.prompt_upsampling !== undefined) replicateInput.prompt_upsampling = input.prompt_upsampling

    // Map image input parameters
    if (input.input_image) replicateInput.input_image = input.input_image
    if (input.image) replicateInput.image = input.image
    if (input.last_frame_image) replicateInput.last_frame_image = input.last_frame_image

    // Map video parameters
    if (input.duration) replicateInput.duration = input.duration
    if (input.resolution) replicateInput.resolution = input.resolution
    if (input.fps) replicateInput.fps = input.fps
    if (input.camera_fixed !== undefined) replicateInput.camera_fixed = input.camera_fixed

    console.log('🚀 Starting generation with:', {
      model: model.replicateModel,
      mode,
      inputKeys: Object.keys(replicateInput),
      inputSample: Object.keys(replicateInput).reduce((acc, key) => {
        acc[key] = typeof replicateInput[key] === 'string' && replicateInput[key].length > 50
          ? replicateInput[key].substring(0, 50) + '...'
          : replicateInput[key]
        return acc
      }, {} as any)
    })

    // Validate Replicate API token
    if (!process.env.REPLICATE_API_TOKEN) {
      console.error('❌ Missing Replicate API token')
      return errorResponse(
        API_ERROR_CODES.UNAUTHORIZED,
        'Replicate API token not configured',
        'API configuration error. Please contact support.',
        HTTP_STATUS.INTERNAL_SERVER_ERROR
      )
    }

    // Create Replicate prediction with error handling
    let prediction
    try {
      const webhookUrl = options.webhook || process.env.REPLICATE_WEBHOOK_URL
      const predictionConfig: any = {
        model: model.replicateModel,
        input: {
          ...replicateInput,
          // include userId for webhook context if supported downstream
          userId: user.id
        }
      }

      // Only include webhook configuration if webhook URL is valid and reachable by Replicate (HTTPS)
      if (webhookUrl && webhookUrl.startsWith('https://')) {
        predictionConfig.webhook = webhookUrl
        predictionConfig.webhook_events_filter = ['completed']
      }

      prediction = await replicate.predictions.create(predictionConfig)
      console.log('✅ Replicate prediction created:', prediction.id)
    } catch (replicateError: any) {
      console.error('❌ Replicate API error:', replicateError)

      // Handle specific Replicate errors
      if (replicateError.message?.includes('authentication')) {
        return errorResponse(
          API_ERROR_CODES.UNAUTHORIZED,
          replicateError.message,
          'Authentication failed with Replicate API.',
          HTTP_STATUS.UNAUTHORIZED
        )
      }

      if (replicateError.message?.includes('model not found')) {
        return errorResponse(
          API_ERROR_CODES.INVALID_MODEL,
          replicateError.message,
          'The selected model is not available on Replicate.',
          HTTP_STATUS.BAD_REQUEST
        )
      }

      throw replicateError // Re-throw for general error handling
    }

    // Create generation result object (exclude PII like email in prod logs)
    const result = {
      id: prediction.id,
      status: prediction.status as any,
      model: model.replicateModel,
      mode,
      input: replicateInput,
      userId: user.id,
      output: prediction.output ? {
        urls: Array.isArray(prediction.output) ? prediction.output : [prediction.output],
        metadata: {
          format: input.output_format || 'jpg',
          width: 1024,
          height: 1024,
          size: 0
        },
        storage: {
          publicUrl: Array.isArray(prediction.output) ? prediction.output[0] : prediction.output
        }
      } : undefined,
      error: prediction.error ? {
        code: API_ERROR_CODES.GENERATION_FAILED,
        message: prediction.error,
        userMessage: 'Generation failed. Please try again.',
        statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
        retryable: true
      } : undefined,
      progress: 0,
      estimatedTime: model.performance.averageTime,
      cost: input.duration
        ? (model.pricing.costPerSecond || 0) * input.duration
        : (model.pricing.costPerImage || model.pricing.costPerUpscale || 0),
      createdAt: prediction.created_at || new Date().toISOString(),
      completedAt: prediction.completed_at
    }

    // Helper to persist outputs (Cloudinary + Supabase gallery)
    async function persistOutputs(urls: string[], meta: { prompt: string, model: string, mode: string }) {
      const unifiedStorage = new UnifiedStorageService()
      const supabase = createClient()

      const savedItems: any[] = []
      for (let i = 0; i < urls.length; i++) {
        const url = urls[i]
        const filenameBase = `${result.id}_${i}`
        const isVideo = (input.output_format || '').toLowerCase() === 'mp4' || meta.mode === 'video'
        const mimeType = isVideo ? 'video/mp4' : 'image/jpeg'

        // Upload to persistent storage (Cloudinary primary, Supabase fallback)
        const stored = await unifiedStorage.storeFromUrl(url, {
          originalUrl: url,
          filename: `${filenameBase}.${isVideo ? 'mp4' : 'jpg'}`,
          mimeType,
          generatedAt: new Date().toISOString(),
          modelUsed: meta.model,
          prompt: meta.prompt,
          userId: result.userId
        })

        if (!stored.success || !stored.data) {
          console.warn('⚠️ Storage failed, keeping original URL:', url)
          continue
        }

        // Save to gallery (images table)
        const { data, error } = await supabase
          .from('images')
          .insert({
            user_id: result.userId,
            original_prompt: meta.prompt,
            file_path: stored.data.secureUrl || stored.data.url,
            model: meta.model,
            parameters: input || {},
            width: stored.data.metadata.width || 1024,
            height: stored.data.metadata.height || 1024,
            cost: result.cost || null,
            generation_time: null,
            tags: [],
            is_favorite: false,
            folder_id: null
          })
          .select()
          .single()

        if (error) {
          console.error('❌ Failed to save gallery item:', error)
          continue
        }

        savedItems.push(data)
      }

      return savedItems
    }

    // If prediction is already complete, persist and return final result
    if (prediction.status === 'succeeded' && prediction.output) {
      result.status = 'completed'
      result.progress = 100
      result.completedAt = new Date().toISOString()

      try {
        const saved = await persistOutputs(result.output!.urls, {
          prompt: replicateInput.prompt || '',
          model: model.replicateModel,
          mode
        })
        console.log(`✅ Persisted ${saved.length} output(s) to gallery`)
      } catch (persistError) {
        console.error('❌ Error persisting outputs:', persistError)
      }

      return successResponse(result)
    }

    // If prediction failed immediately
    if (prediction.status === 'failed') {
      result.status = 'failed'
      result.error = {
        code: API_ERROR_CODES.GENERATION_FAILED,
        message: prediction.error || 'Generation failed',
        userMessage: 'Generation failed. Please try again with different parameters.',
        statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
        retryable: true
      }

      console.error('❌ Generation failed immediately:', prediction.error)
      return successResponse(result)
    }

    // Prefer webhooks for reliable completion; if webhook not configured, fall back to lightweight polling
    const webhookUrl = options.webhook || process.env.REPLICATE_WEBHOOK_URL
    if (webhookUrl) {
      console.log('🔔 Using webhook for completion updates:', webhookUrl)
    } else {
      console.log('⏳ Webhook not configured, starting lightweight polling')
      pollPrediction(prediction.id, model, result, async (finalUrls?: string[]) => {
        if (finalUrls && finalUrls.length > 0) {
          try {
            const saved = await persistOutputs(finalUrls, {
              prompt: replicateInput.prompt || '',
              model: model.replicateModel,
              mode
            })
            console.log(`✅ Persisted ${saved.length} output(s) via polling`)
          } catch (persistError) {
            console.error('❌ Error persisting outputs (polling):', persistError)
          }
        }
      })
    }

    return successResponse(result)

  } catch (error: any) {
    console.error('❌ Generation API error:', error)

    // Handle specific error types
    if (error.message?.includes('authentication')) {
      return errorResponse(
        API_ERROR_CODES.UNAUTHORIZED,
        error.message,
        'Authentication failed. Please check your API configuration.',
        HTTP_STATUS.UNAUTHORIZED
      )
    }

    if (error.message?.includes('rate limit')) {
      return errorResponse(
        API_ERROR_CODES.RATE_LIMIT_EXCEEDED,
        error.message,
        'Rate limit exceeded. Please wait a moment before trying again.',
        HTTP_STATUS.TOO_MANY_REQUESTS
      )
    }

    if (error.message?.includes('quota')) {
      return errorResponse(
        API_ERROR_CODES.QUOTA_EXCEEDED,
        error.message,
        'Usage quota exceeded. Please check your account limits.',
        HTTP_STATUS.FORBIDDEN
      )
    }

    // Generic error
    return errorResponse(
      API_ERROR_CODES.INTERNAL_ERROR,
      error.message || 'Unknown error occurred',
      'An unexpected error occurred. Please try again.',
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    )
  }
}

// Simplified polling function (in production, this would use webhooks or a queue)
async function pollPrediction(
  predictionId: string,
  model: any,
  result: any,
  onComplete?: (finalUrls?: string[]) => Promise<void> | void
) {
  try {
    let attempts = 0
    const maxAttempts = 60 // 5 minutes max

    const poll = async () => {
      if (attempts >= maxAttempts) {
        console.log('⏰ Polling timeout for prediction:', predictionId)
        return
      }

      attempts++

      try {
        const prediction = await replicate.predictions.get(predictionId)

        if (prediction.status === 'succeeded') {
          console.log('✅ Prediction completed:', predictionId)
          const urls = Array.isArray(prediction.output) ? prediction.output : [prediction.output]
          if (onComplete) await onComplete(urls)
          return
        }

        if (prediction.status === 'failed') {
          console.error('❌ Prediction failed:', predictionId, prediction.error)
          return
        }

        // Continue polling
        setTimeout(poll, 5000)
      } catch (error) {
        console.error('❌ Polling error:', error)
        setTimeout(poll, 10000)
      }
    }

    // Start polling after initial delay
    setTimeout(poll, 2000)
  } catch (error) {
    console.error('❌ Failed to start polling:', error)
  }
}
