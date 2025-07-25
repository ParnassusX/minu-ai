import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserErrorMessage } from '@/lib/utils/errorHandling'
import { savePromptFromGeneration, updatePromptSuccess } from '@/lib/services/automaticPromptService'

// Image editing using Replicate MCP (FLUX Kontext Pro)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      image,
      prompt,
      aspectRatio = 'match_input_image',
      outputFormat = 'jpg',
      safetyTolerance = 2,
      seed,
      model = 'flux-kontext-pro'
    } = body

    // Validate required fields
    if (!image || typeof image !== 'string') {
      return NextResponse.json(
        { error: 'Image is required and must be a valid URL or base64 string' },
        { status: 400 }
      )
    }

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return NextResponse.json(
        { error: 'Prompt is required and must be a non-empty string' },
        { status: 400 }
      )
    }

    if (prompt.length > 1000) {
      return NextResponse.json(
        { error: 'Prompt must be less than 1000 characters' },
        { status: 400 }
      )
    }

    // Get user from Supabase (optional for dev mode)
    let userId: string | null = null
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      userId = user?.id || null
    } catch (authError) {
      console.log('Auth not available in dev mode, proceeding without user')
    }

    // Prepare Replicate API request
    const replicateApiUrl = 'https://api.replicate.com/v1/predictions'
    const replicateToken = process.env.REPLICATE_API_TOKEN

    if (!replicateToken) {
      throw new Error('Replicate API token not configured')
    }

    // FLUX Kontext Pro model version (official Black Forest Labs model)
    const modelVersion = '15589a1a9e6b240d246752fc688267b847db4858910cc390794703384b6a5443'

    const replicateInput = {
      prompt: prompt.trim(),
      input_image: image,
      aspect_ratio: aspectRatio,
      output_format: outputFormat,
      safety_tolerance: safetyTolerance,
      ...(seed && { seed })
    }

    const replicatePayload = {
      version: modelVersion,
      input: replicateInput
    }

    console.log('Editing image with FLUX Kontext Pro:', {
      prompt: prompt.substring(0, 100) + (prompt.length > 100 ? '...' : ''),
      aspectRatio,
      outputFormat,
      safetyTolerance
    })

    const startTime = Date.now()

    // Call Replicate API
    const replicateResponse = await fetch(replicateApiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${replicateToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(replicatePayload),
    })

    if (!replicateResponse.ok) {
      const errorData = await replicateResponse.text()
      console.error('Replicate API error:', {
        status: replicateResponse.status,
        statusText: replicateResponse.statusText,
        error: errorData
      })
      throw new Error(`Replicate API error: ${replicateResponse.status} ${replicateResponse.statusText}`)
    }

    const prediction = await replicateResponse.json()
    console.log('Image editing started:', prediction.id)

    // Poll for completion (editing is usually faster than generation)
    let finalPrediction = prediction
    let attempts = 0
    const maxAttempts = 60 // 5 minutes max (5 second intervals)

    while (finalPrediction.status === 'starting' || finalPrediction.status === 'processing') {
      if (attempts >= maxAttempts) {
        throw new Error('Image editing timeout - please try again')
      }

      await new Promise(resolve => setTimeout(resolve, 5000)) // Wait 5 seconds
      attempts++

      const statusResponse = await fetch(`${replicateApiUrl}/${prediction.id}`, {
        headers: {
          'Authorization': `Token ${replicateToken}`,
        },
      })

      if (!statusResponse.ok) {
        throw new Error('Failed to check image editing status')
      }

      finalPrediction = await statusResponse.json()
      console.log(`Image editing status (attempt ${attempts}):`, finalPrediction.status)
    }

    if (finalPrediction.status === 'failed') {
      throw new Error(finalPrediction.error || 'Image editing failed')
    }

    if (finalPrediction.status === 'canceled') {
      throw new Error('Image editing was canceled')
    }

    if (!finalPrediction.output || !Array.isArray(finalPrediction.output) || finalPrediction.output.length === 0) {
      throw new Error('No edited image output received')
    }

    const generationTime = Math.round((Date.now() - startTime) / 1000)
    const estimatedCost = 0.25 // FLUX Fill Dev estimated cost

    console.log('Image editing completed:', {
      id: finalPrediction.id,
      generationTime: `${generationTime}s`,
      cost: `$${estimatedCost}`,
      outputCount: finalPrediction.output.length
    })

    // Automatic prompt saving with analytics
    let promptId: string | null = null
    if (userId) {
      try {
        // Save prompt automatically (with deduplication)
        promptId = await savePromptFromGeneration({
          content: prompt.trim(),
          category: 'edit_instruction',
          modelUsed: model,
          parameters: {
            aspect_ratio: aspectRatio,
            output_format: outputFormat,
            safety_tolerance: safetyTolerance,
            ...(seed && { seed })
          },
          sourceType: 'editing',
          userId
        })

        // Update prompt success analytics
        if (promptId) {
          await updatePromptSuccess(promptId, true, generationTime * 1000, estimatedCost)
        }

        console.log('Edit prompt automatically saved:', promptId)
      } catch (promptError) {
        console.warn('Error saving edit prompt automatically:', promptError)
        // Don't fail the entire request if prompt saving fails
      }
    }

    // Save to database if user is authenticated
    let savedEdit = null
    if (userId) {
      try {
        const supabase = createClient()
        
        // Save edit record to the image_edits table
        const { data: editData, error: editError } = await supabase
          .from('image_edits')
          .insert({
            user_id: userId,
            original_image_url: image,
            edited_image_url: finalPrediction.output,
            mask_url: null, // FLUX Kontext doesn't use masks
            prompt: prompt.trim(),
            model_used: model,
            parameters: {
              aspect_ratio: aspectRatio,
              output_format: outputFormat,
              safety_tolerance: safetyTolerance,
              ...(seed && { seed })
            },
            generation_time: generationTime * 1000, // Convert to milliseconds
            cost: estimatedCost,
            replicate_id: finalPrediction.id,
            prompt_id: promptId // Link to the automatically saved prompt
          })
          .select()
          .single()

        if (editError) {
          console.error('Error saving edit to database:', editError)
        } else {
          savedEdit = editData
          console.log('Edit saved to database:', savedEdit.id)
        }
      } catch (dbError) {
        console.error('Database error:', dbError)
        // Continue without failing the request
      }
    }

    // Return success response
    return NextResponse.json({
      success: true,
      edit: {
        id: savedEdit?.id || finalPrediction.id,
        originalImageUrl: image,
        maskUrl: null, // FLUX Kontext doesn't use masks
        editedImageUrl: finalPrediction.output,
        additionalOutputs: [], // FLUX Kontext returns single output
        prompt: prompt.trim(),
        model: model,
        generationTime,
        cost: estimatedCost,
        replicateId: finalPrediction.id,
        metadata: {
          aspectRatio,
          outputFormat,
          safetyTolerance,
          ...(seed && { seed }),
          actualOutputCount: 1
        }
      }
    })

  } catch (error) {
    console.error('Image editing error:', error)
    const userErrorMessage = getUserErrorMessage(error)
    
    return NextResponse.json(
      { 
        error: userErrorMessage,
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
