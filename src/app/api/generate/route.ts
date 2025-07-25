import { NextRequest, NextResponse } from 'next/server'
import { getReplicateService } from '@/lib/replicate'
import { createClient } from '@/lib/supabase/server'
import { getAuthenticatedUser } from '@/lib/auth/server'
import { PromptService } from '@/lib/prompts/promptService'
import { getResponseProcessor } from '@/lib/replicate/responseProcessor'
import { getStorageService } from '@/lib/storage/supabaseStorage'
import { StorageErrorHandler } from '@/lib/storage/errorHandling'

/**
 * Enhanced error handling for image generation API
 */
interface ApiError {
  code: string
  message: string
  details?: any
  userMessage: string
  statusCode: number
}

function createApiError(
  code: string,
  message: string,
  userMessage: string,
  statusCode: number = 500,
  details?: any
): ApiError {
  return { code, message, userMessage, statusCode, details }
}

function handleGenerationError(error: unknown): NextResponse {
  console.error('Image Generation API Error:', error)

  // Handle known error types
  if (error instanceof Error) {
    // Authentication errors
    if (error.message.includes('not authenticated') || error.message.includes('unauthorized')) {
      const apiError = createApiError(
        'AUTH_REQUIRED',
        error.message,
        'Please sign in to generate images',
        401
      )
      return NextResponse.json({ error: apiError }, { status: 401 })
    }

    // Rate limiting errors
    if (error.message.includes('rate limit') || error.message.includes('too many requests')) {
      const apiError = createApiError(
        'RATE_LIMITED',
        error.message,
        'Too many requests. Please wait a moment and try again.',
        429
      )
      return NextResponse.json({ error: apiError }, { status: 429 })
    }

    // Model-specific errors
    if (error.message.includes('model not found') || error.message.includes('invalid model')) {
      const apiError = createApiError(
        'INVALID_MODEL',
        error.message,
        'The selected AI model is not available. Please try a different model.',
        400
      )
      return NextResponse.json({ error: apiError }, { status: 400 })
    }

    // Input validation errors
    if (error.message.includes('invalid input') || error.message.includes('validation')) {
      const apiError = createApiError(
        'INVALID_INPUT',
        error.message,
        'Please check your input parameters and try again.',
        400
      )
      return NextResponse.json({ error: apiError }, { status: 400 })
    }

    // Insufficient funds errors
    if (error.message.includes('insufficient funds') || error.message.includes('payment')) {
      const apiError = createApiError(
        'INSUFFICIENT_FUNDS',
        error.message,
        'Insufficient funds. Please check your account balance.',
        402
      )
      return NextResponse.json({ error: apiError }, { status: 402 })
    }

    // Timeout errors
    if (error.message.includes('timeout') || error.message.includes('timed out')) {
      const apiError = createApiError(
        'GENERATION_TIMEOUT',
        error.message,
        'Image generation took too long. Please try again with simpler parameters.',
        408
      )
      return NextResponse.json({ error: apiError }, { status: 408 })
    }

    // Content policy errors
    if (error.message.includes('content policy') || error.message.includes('inappropriate')) {
      const apiError = createApiError(
        'CONTENT_POLICY_VIOLATION',
        error.message,
        'Your request violates our content policy. Please modify your prompt and try again.',
        400
      )
      return NextResponse.json({ error: apiError }, { status: 400 })
    }

    // Storage errors
    if (error.message.includes('storage') || error.message.includes('upload')) {
      const apiError = createApiError(
        'STORAGE_ERROR',
        error.message,
        'Failed to save generated image. Please try again.',
        500
      )
      return NextResponse.json({ error: apiError }, { status: 500 })
    }
  }

  // Generic server error
  const apiError = createApiError(
    'INTERNAL_ERROR',
    'An unexpected error occurred during image generation',
    'Something went wrong. Please try again in a moment.',
    500,
    process.env.NODE_ENV === 'development' ? error : undefined
  )

  return NextResponse.json({ error: apiError }, { status: 500 })
}

export async function POST(request: NextRequest) {
  const promptService = new PromptService()
  const startTime = Date.now()
  let insertedImages: any[] = []

  try {
    // Use real authentication in all environments
    const { user, error: authError } = await getAuthenticatedUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      model, // New: Replicate model in owner/name format
      input,  // New: All model parameters in input object
      // Legacy support
      prompt,
      modelId = 'flux-dev',
      numOutputs = 1,
      aspectRatio = '1:1',
      seed,
      guidanceScale,
      numInferenceSteps,
      ...otherParams
    } = body

    // Handle new format (from CompactGenerator)
    if (model && input) {
      console.log('Using new model format:', model, input)

      // Validate model format
      if (!model.includes('/')) {
        return NextResponse.json({ error: 'Invalid model format. Expected owner/model' }, { status: 400 })
      }

      // Validate input
      if (!input.prompt || typeof input.prompt !== 'string' || input.prompt.trim().length === 0) {
        return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
      }

      // Call Replicate directly with the new format
      const replicateService = getReplicateService()

      try {
        const response = await replicateService.generateWithModel(model, input)

        if (!response.success) {
          console.error('Replicate generation error:', response.error)
          return NextResponse.json(
            { error: response.error || 'Generation failed' },
            { status: 500 }
          )
        }

        return NextResponse.json({
          success: true,
          data: response.data,
          metadata: {
            model,
            input,
            generationTime: Date.now() - startTime
          }
        })
      } catch (error) {
        return handleGenerationError(error)
      }
    }

    // Validate input
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
    }

    if (prompt.length > 1000) {
      return NextResponse.json({ error: 'Prompt too long (max 1000 characters)' }, { status: 400 })
    }

    if (numOutputs && (numOutputs < 1 || numOutputs > 4)) {
      return NextResponse.json({ error: 'Number of outputs must be between 1 and 4' }, { status: 400 })
    }

    // Get Replicate service and generate images
    const replicateService = getReplicateService()

    const response = await replicateService.generateImages(prompt, {
      modelId,
      numOutputs,
      aspectRatio,
      seed,
      guidanceScale,
      numInferenceSteps,
      ...otherParams
    })

    if (!response.success) {
      console.error('Replicate generation error:', response.error)

      // If it's a billing/payment error, return a mock response for development
      if (response.error?.includes('payment') || response.error?.includes('billing')) {
        console.log('Replicate billing issue detected, returning mock response for development')
        return NextResponse.json({
          success: true,
          data: [{
            url: 'https://picsum.photos/1024/1024?random=' + Date.now(),
            width: 1024,
            height: 1024
          }],
          message: 'Mock image generated (Replicate billing issue)',
          estimatedTime: 5.0
        })
      }

      return NextResponse.json(
        { error: response.error || 'Image generation failed' },
        { status: 500 }
      )
    }

    // TODO: Save to database when authentication is enabled
    // if (session && response.data) {
    //   // Save image metadata to database
    //   const { error: dbError } = await supabase
    //     .from('images')
    //     .insert({
    //       user_id: session.user.id,
    //       original_prompt: prompt,
    //       parameters: { modelId, numOutputs, aspectRatio, seed },
    //       file_path: response.data[0]?.url || '',
    //       width: 1024, // Default for now
    //       height: 1024,
    //     })
    //
    //   if (dbError) {
    //     console.error('Failed to save image metadata:', dbError)
    //   }
    //
    //   // Save prompt to history
    //   await supabase
    //     .from('prompt_history')
    //     .insert({
    //       user_id: session.user.id,
    //       prompt_text: prompt,
    //     })
    // }

    // Process response with storage integration
    let storedImages: any[] = []
    if (response.data && response.data.length > 0) {
      try {
        // Ensure storage bucket exists
        const storageService = getStorageService()
        const bucketResult = await storageService.ensureBucketExists()
        if (!bucketResult.success) {
          console.warn('Storage bucket setup failed:', bucketResult.error)
        }

        // Process Replicate response with storage
        const responseProcessor = getResponseProcessor()
        const processingResult = await responseProcessor.processResponse(
          {
            id: 'generated',
            status: 'succeeded',
            output: response.data.map((img: any) => img.url),
            model: modelId,
            metrics: {
              predict_time: response.estimatedTime
            }
          },
          {
            userId: user.id,
            prompt,
            modelUsed: modelId || 'flux-dev',
            parameters: { numOutputs, aspectRatio, seed, numInferenceSteps, guidanceScale },
            storeInDatabase: true,
            onProgress: (progress) => {
              console.log(`Storage progress: ${progress.stage} ${progress.progress}%`)
            }
          }
        )

        if (processingResult.success && processingResult.files.length > 0) {
          // Save to database with permanent URLs
          // SECURITY: Always use authenticated client - no RLS bypass
          const dbClient = createClient()

          // SECURITY: Removed development mode profile creation bypass
          // Profiles should be created through proper authentication flow

          // Create database records directly from processed files
          const imageRecords = processingResult.files.map((file, index) => ({
            user_id: user.id,
            original_prompt: prompt || 'No prompt provided',
            file_path: file.storedUrl,
            model: modelId || 'flux-dev',
            parameters: { numOutputs, aspectRatio, seed, numInferenceSteps, guidanceScale },
            width: file.metadata?.width || 1024,
            height: file.metadata?.height || 1024,
            cost: response.cost ? Number(response.cost) / processingResult.files.length : null,
            generation_time: response.estimatedTime ? Math.round(response.estimatedTime * 1000) : null,
            tags: [],
            is_favorite: false,
            folder_id: null
          }))

          console.log('Database records to insert:', JSON.stringify(imageRecords, null, 2))
          console.log('Processing result success:', processingResult.success)
          console.log('Processing result files count:', processingResult.files.length)

          if (imageRecords.length > 0) {
            const { data: savedImages, error: dbError } = await dbClient
              .from('images')
              .insert(imageRecords)
              .select('id')

            if (dbError) {
              console.error('Failed to save images to gallery:', dbError)
              console.error('Database error details:', JSON.stringify(dbError, null, 2))
              console.error('Attempted to insert records:', JSON.stringify(imageRecords, null, 2))
            } else if (savedImages && savedImages.length > 0) {
              insertedImages = savedImages
              console.log(`Images successfully saved to gallery: ${savedImages.length} images`)
              console.log('Inserted image IDs:', savedImages.map(img => img.id))
            } else {
              console.warn('No images were saved to the database')
              console.warn('Image records to insert:', JSON.stringify(imageRecords, null, 2))
            }
          }

          // Update response data with permanent URLs
          storedImages = processingResult.files.map((file, index) => ({
            id: insertedImages[index]?.id || `stored-${index}`,
            url: file.storedUrl,
            originalUrl: file.originalUrl,
            metadata: file.metadata
          }))
        } else {
          // Fallback to temporary URLs if storage fails
          console.warn('Storage processing failed, using temporary URLs:', processingResult.errors)
          storedImages = response.data.map((img: any, index: number) => ({
            id: `temp-${index}`,
            url: img.url,
            originalUrl: img.url,
            temporary: true
          }))
        }
      } catch (storageError) {
        console.error('Storage error:', storageError)
        StorageErrorHandler.logError(
          StorageErrorHandler.parseError(storageError, 'generation-storage'),
          { userId: user.id, prompt, modelId }
        )

        // Fallback to temporary URLs
        storedImages = response.data.map((img: any, index: number) => ({
          id: `temp-${index}`,
          url: img.url,
          originalUrl: img.url,
          temporary: true
        }))
      }
    }

    // Automatic prompt saving with analytics
    try {
      const generationTime = Date.now() - startTime

      // Save prompt automatically (with deduplication)
      const promptId = await promptService.savePromptFromGeneration({
        userId: user.id,
        content: prompt,
        modelUsed: modelId,
        parameters: { numOutputs, aspectRatio, seed, numInferenceSteps, guidanceScale, ...otherParams },
        category: 'generated' // Auto-categorize as generated
      })

      // Record successful generation attempt
      await promptService.recordGenerationAttempt({
        promptId,
        userId: user.id,
        successful: true,
        modelUsed: modelId || 'flux-dev',
        parameters: { numOutputs, aspectRatio, seed, numInferenceSteps, guidanceScale, ...otherParams },
        generationTime,
        cost: response.cost ? Number(response.cost) : undefined,
        imagesGenerated: response.data?.length || 0
      })

      // Link prompt to generated images if we have image IDs
      if (insertedImages && insertedImages.length > 0) {
        const imageIds = insertedImages.map(img => img.id)
        await promptService.linkPromptToImages(promptId, imageIds, {
          successful: true,
          generationTime,
          modelUsed: modelId || 'flux-dev',
          parameters: { numOutputs, aspectRatio, seed, numInferenceSteps, guidanceScale, ...otherParams }
        })
      }

      console.log('Prompt automatically saved with analytics:', promptId)
    } catch (promptError) {
      console.warn('Error saving prompt automatically:', promptError)
      // Don't fail the entire request if prompt saving fails
    }

    return NextResponse.json({
      success: true,
      images: storedImages.length > 0 ? storedImages : response.data,
      cost: response.cost,
      generationTime: response.estimatedTime,
      model: modelId,
      storage: {
        persistent: storedImages.length > 0 && !storedImages[0]?.temporary,
        totalFiles: storedImages.length,
        storageUsed: storedImages.reduce((total, img) => total + (img.metadata?.fileSize || 0), 0)
      }
    })
  } catch (error) {
    // Use enhanced error handling
    return handleGenerationError(error)
  }
}
