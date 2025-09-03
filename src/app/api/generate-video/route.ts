import { NextRequest, NextResponse } from 'next/server'
import { getReplicateService } from '@/lib/replicate'
import { getAuthenticatedUser } from '@/lib/auth/server'
import { PromptService } from '@/lib/prompts/promptService'
import { UnifiedStorageService } from '@/lib/storage/unifiedStorage'

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
      // Image inputs for Seedance models (REAL API PARAMETERS)
      image,              // Start frame for Seedance
      last_frame_image,   // End frame for Seedance
      // Legacy support
      first_frame_image,
      subject_reference,
      firstFrameImage,
      subjectReference,
      promptOptimizer = true,
      ...otherParams
    } = body

    // Support both new Seedance API and legacy parameter names
    const startFrame = image || first_frame_image || firstFrameImage
    const endFrame = last_frame_image
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

    // Schema-specific validation
    if (modelId === 'seedance-1-lite' || modelId === 'seedance-1-pro') {
      // Validate duration against schema enum [5, 10]
      if (duration && ![5, 10].includes(duration)) {
        return NextResponse.json(
          { error: 'Duration must be 5 or 10 seconds for Seedance models' },
          { status: 400 }
        )
      }

      // Validate fps (fixed at 24 for Seedance models)
      if (fps && fps !== 24) {
        return NextResponse.json(
          { error: 'FPS must be 24 for Seedance models' },
          { status: 400 }
        )
      }

      // Validate resolution based on model
      if (modelId === 'seedance-1-lite') {
        const validResolutions = ['480p', '720p']
        if (otherParams.resolution && !validResolutions.includes(otherParams.resolution)) {
          return NextResponse.json(
            { error: `Resolution must be one of: ${validResolutions.join(', ')} for Seedance Lite` },
            { status: 400 }
          )
        }
      } else if (modelId === 'seedance-1-pro') {
        const validResolutions = ['480p', '1080p']
        if (otherParams.resolution && !validResolutions.includes(otherParams.resolution)) {
          return NextResponse.json(
            { error: `Resolution must be one of: ${validResolutions.join(', ')} for Seedance Pro` },
            { status: 400 }
          )
        }
      }

      // Validate aspect ratio
      const validAspectRatios = ['16:9', '4:3', '1:1', '3:4', '9:16', '21:9', '9:21']
      if (aspectRatio && !validAspectRatios.includes(aspectRatio)) {
        return NextResponse.json(
          { error: `Aspect ratio must be one of: ${validAspectRatios.join(', ')}` },
          { status: 400 }
        )
      }
    } else {
      // General validation for other models
      if (duration && (duration < 1 || duration > 30)) {
        return NextResponse.json(
          { error: 'Duration must be between 1 and 30 seconds' },
          { status: 400 }
        )
      }
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

    // Generate videos using ReplicateService with proper Seedance parameters
    const response = await replicateService.generateVideos(prompt, {
      modelId,
      duration,
      fps,
      aspectRatio,
      // Seedance 1 Lite parameters (REAL API)
      image: startFrame,
      last_frame_image: endFrame,
      // Legacy support
      first_frame_image: startFrame,
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

    // Store videos in Cloudinary and get permanent URLs
    console.log('📤 Storing generated videos...')
    const unifiedStorage = new UnifiedStorageService()
    const storedVideos = []

    for (const [index, videoData] of (response.data || []).entries()) {
      if (videoData.url) {
        try {
          console.log(`📤 Storing video ${index + 1}/${response.data?.length || 0}: ${videoData.url}`)

          const storageResult = await unifiedStorage.storeFromUrl(videoData.url, {
            originalUrl: videoData.url,
            filename: `video-${Date.now()}-${index}.mp4`,
            mimeType: 'video/mp4',
            generatedAt: new Date().toISOString(),
            modelUsed: modelId,
            prompt: prompt,
            userId: user.id,
            duration: duration
          })

          if (storageResult.success && storageResult.data) {
            console.log(`✅ Video ${index + 1} stored successfully: ${storageResult.data.url}`)
            storedVideos.push({
              ...videoData,
              url: storageResult.data.url,
              secureUrl: storageResult.data.secureUrl,
              provider: storageResult.data.provider,
              publicId: storageResult.data.publicId
            })
          } else {
            console.error(`❌ Failed to store video ${index + 1}:`, storageResult.error)
            // Fallback to original URL if storage fails
            storedVideos.push(videoData)
          }
        } catch (storageError) {
          console.error(`❌ Storage error for video ${index + 1}:`, storageError)
          // Fallback to original URL if storage fails
          storedVideos.push(videoData)
        }
      } else {
        console.warn(`⚠️ Video ${index + 1} has no URL, skipping storage`)
        storedVideos.push(videoData)
      }
    }

    // Return successful response with stored videos
    return NextResponse.json({
      success: true,
      videos: storedVideos,
      cost: response.cost,
      generationTime: response.estimatedTime,
      model: modelId,
      stored: storedVideos.length,
      total: response.data?.length || 0
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
