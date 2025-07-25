import { NextRequest, NextResponse } from 'next/server'
import { getReplicateService } from '@/lib/replicate'
import { getAuthenticatedUser } from '@/lib/auth/server'
import { PromptService } from '@/lib/prompts/promptService'

// Video generation using unified ReplicateService
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
      prompt,
      modelId = 'minimax-video-01', // Default to MiniMax but support other models
      duration = 5,
      fps = 24,
      aspectRatio = '16:9',
      seed,
      // Image inputs for Seedance models
      first_frame_image,
      subject_reference,
      // Legacy support
      firstFrameImage,
      subjectReference,
      promptOptimizer = true,
      ...otherParams
    } = body

    // Support legacy parameter names
    const firstFrame = first_frame_image || firstFrameImage
    const subjectRef = subject_reference || subjectReference

    // Validate required parameters
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return NextResponse.json(
        { error: 'Prompt is required and must be a non-empty string' },
        { status: 400 }
      )
    }

    if (prompt.length > 2000) {
      return NextResponse.json(
        { error: 'Prompt must be less than 2000 characters' },
        { status: 400 }
      )
    }

    // Validate duration
    if (duration && (duration < 1 || duration > 30)) {
      return NextResponse.json(
        { error: 'Duration must be between 1 and 30 seconds' },
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

    // Generate videos using ReplicateService
    const response = await replicateService.generateVideos(prompt, {
      modelId,
      duration,
      fps,
      aspectRatio,
      first_frame_image: firstFrame,
      subject_reference: subjectRef,
      seed,
      prompt_optimizer: promptOptimizer,
      ...otherParams
    })

    if (!response.success) {
      console.error('Replicate video generation error:', response.error)
      return NextResponse.json(
        { error: response.error || 'Video generation failed' },
        { status: 500 }
      )
    }

    // Automatic prompt saving with analytics
    try {
      const generationTime = Date.now() - startTime

      // Save prompt automatically (with deduplication)
      const promptId = await promptService.savePromptFromGeneration({
        userId: user.id,
        content: prompt,
        modelUsed: modelId,
        parameters: { duration, fps, aspectRatio, seed, ...otherParams },
        category: 'generated'
      })

      // Record successful generation attempt
      await promptService.recordGenerationAttempt({
        promptId,
        userId: user.id,
        successful: true,
        modelUsed: modelId,
        parameters: { duration, fps, aspectRatio, seed, ...otherParams },
        generationTime,
        cost: response.cost ? Number(response.cost) : undefined,
        imagesGenerated: response.data?.length || 0
      })

      console.log('Video prompt automatically saved with analytics:', promptId)
    } catch (promptError) {
      console.warn('Error saving video prompt automatically:', promptError)
      // Don't fail the entire request if prompt saving fails
    }

    // Return successful response
    return NextResponse.json({
      success: true,
      videos: response.data,
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
      { error: 'Internal server error occurred during video generation' },
      { status: 500 }
    )
  }
}
