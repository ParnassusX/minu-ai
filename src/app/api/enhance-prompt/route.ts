import { NextRequest, NextResponse } from 'next/server'
import { enhancePromptWithGemini } from '@/lib/gemini/api'

export async function POST(request: NextRequest) {
  try {
    // Skip authentication in development mode
    const isDevelopment = process.env.NODE_ENV === 'development'

    if (!isDevelopment) {
      // TODO: Add authentication for production
      // const supabase = createServerClient()
      // const { data: { session }, error: authError } = await supabase.auth.getSession()
      // if (authError || !session) {
      //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      // }
    }

    const body = await request.json()
    const { prompt, maxTokens, temperature } = body

    // Validate required parameters
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return NextResponse.json(
        { error: 'Prompt is required and must be a non-empty string' },
        { status: 400 }
      )
    }

    if (prompt.length > 500) {
      return NextResponse.json(
        { error: 'Prompt is too long for enhancement (max 500 characters)' },
        { status: 400 }
      )
    }

    // Validate optional parameters
    if (maxTokens && (maxTokens < 50 || maxTokens > 150)) {
      return NextResponse.json(
        { error: 'Max tokens must be between 50 and 150 for optimal FLUX prompts' },
        { status: 400 }
      )
    }

    if (temperature && (temperature < 0 || temperature > 1)) {
      return NextResponse.json(
        { error: 'Temperature must be between 0 and 1' },
        { status: 400 }
      )
    }

    // Enhance prompt using Gemini
    const enhancedPrompt = await enhancePromptWithGemini({
      prompt: prompt.trim(),
      maxTokens,
      temperature
    })

    return NextResponse.json({
      success: true,
      originalPrompt: prompt.trim(),
      enhancedPrompt,
      improvement: {
        originalLength: prompt.trim().length,
        enhancedLength: enhancedPrompt.length,
        expansionRatio: Math.round((enhancedPrompt.length / prompt.trim().length) * 100) / 100
      }
    })
  } catch (error) {
    console.error('Prompt enhancement error:', error)

    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        return NextResponse.json(
          { error: 'Gemini API configuration error. Please check your API key.' },
          { status: 500 }
        )
      }

      if (error.message.includes('quota')) {
        return NextResponse.json(
          { error: 'Gemini API quota exceeded. Please try again later.' },
          { status: 429 }
        )
      }

      if (error.message.includes('safety')) {
        return NextResponse.json(
          { error: 'Prompt was blocked by safety filters. Please try a different prompt.' },
          { status: 400 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Failed to enhance prompt. Please try again.' },
      { status: 500 }
    )
  }
}
