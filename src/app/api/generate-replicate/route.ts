// Replicate Image Generation API Route
// Handles all image generation through Replicate models

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

    const body = await request.json()
    const {
      prompt,
      modelId,
      numOutputs = 1,
      aspectRatio = '1:1',
      seed,
      ...otherParams
    } = body

    // Validate required parameters
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return NextResponse.json(
        { error: 'Prompt is required and must be a non-empty string' },
        { status: 400 }
      )
    }

    if (prompt.length > 1000) {
      return NextResponse.json(
        { error: 'Prompt is too long (max 1000 characters)' },
        { status: 400 }
      )
    }

    if (numOutputs && (numOutputs < 1 || numOutputs > 4)) {
      return NextResponse.json(
        { error: 'Number of outputs must be between 1 and 4' },
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

    // Generate images
    const response = await replicateService.generateImages(prompt, {
      modelId,
      numOutputs,
      aspectRatio,
      seed,
      ...otherParams
    })

    if (!response.success) {
      console.error('Replicate generation error:', response.error)
      return NextResponse.json(
        { error: response.error || 'Image generation failed' },
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
        modelUsed: modelId || 'auto-selected',
        parameters: { numOutputs, aspectRatio, seed, ...otherParams },
        category: 'generated'
      })

      // Record successful generation attempt
      await promptService.recordGenerationAttempt({
        promptId,
        userId: user.id,
        successful: true,
        modelUsed: modelId || 'auto-selected',
        parameters: { numOutputs, aspectRatio, seed, ...otherParams },
        generationTime,
        cost: response.cost ? Number(response.cost) : undefined,
        imagesGenerated: response.data?.length || 0
      })

      console.log('Prompt automatically saved with analytics:', promptId)
    } catch (promptError) {
      console.warn('Error saving prompt automatically:', promptError)
      // Don't fail the entire request if prompt saving fails
    }

    // Return successful response
    return NextResponse.json({
      success: true,
      images: response.data,
      cost: response.cost,
      generationTime: response.estimatedTime,
      model: modelId || 'auto-selected'
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
      { error: 'Internal server error occurred during image generation' },
      { status: 500 }
    )
  }
}

// GET endpoint to retrieve available models
export async function GET() {
  try {
    const replicateService = getReplicateService()
    
    const models = replicateService.getAvailableModels()
    const modelsByCategory = replicateService.getModelsByCategory()
    const recommendedModels = replicateService.getRecommendedModels()

    return NextResponse.json({
      success: true,
      models,
      modelsByCategory,
      recommendedModels
    })

  } catch (error) {
    console.error('Error fetching models:', error)
    return NextResponse.json(
      { error: 'Failed to fetch available models' },
      { status: 500 }
    )
  }
}
