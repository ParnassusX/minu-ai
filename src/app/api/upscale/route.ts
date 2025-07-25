import { NextRequest, NextResponse } from 'next/server'
import { getReplicateService } from '@/lib/replicate'
import { getAuthenticatedUser } from '@/lib/auth/server'
import { PromptService } from '@/lib/prompts/promptService'

export async function POST(request: NextRequest) {
  const promptService = new PromptService()
  const startTime = Date.now()

  try {
    // Get authenticated user
    const { user, error: authError } = await getAuthenticatedUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const imageFile = formData.get('image') as File
    const modelId = (formData.get('modelId') as string) || 'real-esrgan'
    const scale = parseInt(formData.get('scale') as string) || 4
    const faceEnhance = formData.get('faceEnhance') === 'true'
    const denoise = formData.get('denoise') === 'true'

    if (!imageFile) {
      return NextResponse.json(
        { error: 'No image file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    if (!imageFile.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload an image.' },
        { status: 400 }
      )
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (imageFile.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 10MB.' },
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

    console.log(`Upscaling image with model: ${modelId}`)
    console.log(`Image size: ${imageFile.size} bytes`)
    console.log(`Scale factor: ${scale}x`)

    // Convert file to base64 for Replicate API
    const arrayBuffer = await imageFile.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const base64Image = `data:${imageFile.type};base64,${buffer.toString('base64')}`

    // Get Replicate service
    const replicateService = getReplicateService()

    // Check if model is available
    if (!replicateService.isModelAvailable(modelId)) {
      return NextResponse.json(
        { error: `Model ${modelId} is not available` },
        { status: 400 }
      )
    }

    // Enhance images using ReplicateService
    const response = await replicateService.enhanceImages(base64Image, {
      modelId,
      scale,
      faceEnhance,
      denoise
    })

    if (!response.success) {
      console.error('Replicate upscaling error:', response.error)
      return NextResponse.json(
        { error: response.error || 'Image upscaling failed' },
        { status: 500 }
      )
    }

    // Automatic prompt saving with analytics
    try {
      const generationTime = Date.now() - startTime

      // Save upscaling record
      const promptId = await promptService.savePromptFromGeneration({
        userId: user.id,
        content: `Upscaled image with ${modelId} (${scale}x scale)`,
        modelUsed: modelId,
        parameters: { scale, faceEnhance, denoise },
        category: 'upscale'
      })

      // Record successful upscaling attempt
      await promptService.recordGenerationAttempt({
        promptId,
        userId: user.id,
        successful: true,
        modelUsed: modelId,
        parameters: { scale, faceEnhance, denoise },
        generationTime,
        cost: response.cost ? Number(response.cost) : undefined,
        imagesGenerated: response.data?.length || 0
      })

      console.log('Upscaling automatically saved with analytics:', promptId)
    } catch (promptError) {
      console.warn('Error saving upscaling automatically:', promptError)
      // Don't fail the entire request if prompt saving fails
    }

    // Return successful response
    return NextResponse.json({
      success: true,
      images: response.data,
      cost: response.cost,
      generationTime: response.estimatedTime,
      model: modelId,
      metadata: {
        originalFileName: imageFile.name,
        originalSize: imageFile.size,
        scale,
        faceEnhance,
        denoise
      }
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
      { error: 'Internal server error occurred during image upscaling' },
      { status: 500 }
    )
  }
}
