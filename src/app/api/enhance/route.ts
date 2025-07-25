import { NextRequest, NextResponse } from 'next/server'
import { getReplicateService } from '@/lib/replicate'
import { getAuthenticatedUser } from '@/lib/auth/server'
import { PromptService } from '@/lib/prompts/promptService'

// Image enhancement using unified ReplicateService
export async function POST(request: NextRequest) {
  const promptService = new PromptService()
  const startTime = Date.now()

  try {
    // Get authenticated user
    const { user, error: authError } = await getAuthenticatedUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      image,
      modelId = 'real-esrgan',
      scale = 4,
      faceEnhance = true,
      denoise = true,
      ...otherParams
    } = body

    // Validate required fields
    if (!image || typeof image !== 'string') {
      return NextResponse.json(
        { error: 'Image is required and must be a valid URL or base64 string' },
        { status: 400 }
      )
    }

    // Validate scale parameter
    if (![2, 4, 8].includes(scale)) {
      return NextResponse.json(
        { error: 'Scale must be 2, 4, or 8' },
        { status: 400 }
      )
    }

    // Get Replicate service
    const replicateService = getReplicateService()

    // Check if model is available
    if (modelId && !replicateService.isModelAvailable(modelId)) {
      return NextResponse.json(
        { error: `Model ${modelId} is not available` },
        { status: 400 }
      )
    }

    // Enhance images using ReplicateService
    const response = await replicateService.enhanceImages(image, {
      modelId,
      scale,
      faceEnhance,
      denoise,
      ...otherParams
    })

    if (!response.success) {
      console.error('Replicate enhancement error:', response.error)
      return NextResponse.json(
        { error: response.error || 'Image enhancement failed' },
        { status: 500 }
      )
    }

    // Automatic prompt saving with analytics
    try {
      const generationTime = Date.now() - startTime

      // Save enhancement record
      const promptId = await promptService.savePromptFromGeneration({
        userId: user.id,
        content: `Enhanced image with ${modelId} (${scale}x scale)`,
        modelUsed: modelId,
        parameters: { scale, faceEnhance, denoise, ...otherParams },
        category: 'enhancement'
      })

      // Record successful enhancement attempt
      await promptService.recordGenerationAttempt({
        promptId,
        userId: user.id,
        successful: true,
        modelUsed: modelId,
        parameters: { scale, faceEnhance, denoise, ...otherParams },
        generationTime,
        cost: response.cost ? Number(response.cost) : undefined,
        imagesGenerated: response.data?.length || 0
      })

      console.log('Enhancement automatically saved with analytics:', promptId)
    } catch (promptError) {
      console.warn('Error saving enhancement automatically:', promptError)
      // Don't fail the entire request if prompt saving fails
    }

    // Return successful response
    return NextResponse.json({
      success: true,
      images: response.data,
      cost: response.cost,
      generationTime: response.estimatedTime,
      model: modelId
    })

  } catch (error) {
    console.error('API route error:', error)

    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('API token')) {
        return NextResponse.json(
          { error: 'Replicate API configuration error. Please check your API token.' },
          { status: 500 }
        )
      }

      if (error.message.includes('rate limit')) {
        return NextResponse.json(
          { error: 'Rate limit exceeded. Please try again later.' },
          { status: 429 }
        )
      }

      if (error.message.includes('insufficient funds')) {
        return NextResponse.json(
          { error: 'Insufficient funds in Replicate account.' },
          { status: 402 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Internal server error occurred during image enhancement' },
      { status: 500 }
    )
  }
}
