/**
 * Prompt Enhancement API V2 - Minu.AI Generator V2
 * Enhanced prompt improvement using Gemini API
 */

import { NextRequest, NextResponse } from 'next/server'

// Success response helper
const successResponse = (data: any) => {
  return NextResponse.json({
    success: true,
    data,
    timestamp: new Date().toISOString(),
    requestId: `req_${Date.now()}_${Math.random().toString(36).substring(2)}`
  })
}

// Error response helper
const errorResponse = (message: string, statusCode = 400) => {
  return NextResponse.json(
    {
      success: false,
      error: {
        message,
        statusCode
      },
      timestamp: new Date().toISOString()
    },
    { status: statusCode }
  )
}

// Enhanced prompt enhancement using Gemini API
async function enhancePromptWithGemini(prompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY
  
  if (!apiKey) {
    throw new Error('Gemini API key not configured')
  }
  
  const enhancementPrompt = `You are an expert AI art prompt engineer. Your task is to enhance the following prompt for image generation models like FLUX, SDXL, and similar AI art generators.

Rules:
1. Keep the core concept and intent of the original prompt
2. Add specific artistic details, lighting, composition, and style elements
3. Include quality enhancers like "high quality", "detailed", "professional"
4. Suggest appropriate artistic styles or techniques
5. Keep the enhanced prompt under 200 words
6. Make it more descriptive and vivid
7. Don't change the fundamental subject or concept

Original prompt: "${prompt}"

Enhanced prompt:`

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: enhancementPrompt
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 200,
          },
          safetySettings: [
            {
              category: "HARM_CATEGORY_HARASSMENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_HATE_SPEECH", 
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_DANGEROUS_CONTENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            }
          ]
        })
      }
    )

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(`Gemini API error: ${errorData.error?.message || response.statusText}`)
    }

    const data = await response.json()
    
    if (!data.candidates || data.candidates.length === 0) {
      throw new Error('No enhancement generated')
    }

    const enhancedText = data.candidates[0].content.parts[0].text.trim()
    
    // Clean up the response (remove any prefixes like "Enhanced prompt:")
    return enhancedText.replace(/^(Enhanced prompt:|Enhanced:|Prompt:)\s*/i, '').trim()
    
  } catch (error: any) {
    console.error('Gemini API error:', error)
    throw new Error(`Failed to enhance prompt: ${error.message}`)
  }
}

export async function POST(request: NextRequest) {
  try {
    // Basic authentication check (simplified for development)
    const isDevelopment = process.env.NODE_ENV === 'development'
    if (!isDevelopment) {
      const authHeader = request.headers.get('authorization')
      if (!authHeader) {
        return errorResponse('Authentication required', 401)
      }
    }

    const body = await request.json()
    const { prompt } = body

    console.log('🔮 Prompt enhancement request:', { 
      originalLength: prompt?.length,
      preview: prompt?.substring(0, 50) + (prompt?.length > 50 ? '...' : '')
    })

    // Validate prompt
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return errorResponse('Prompt is required and must be a non-empty string')
    }

    if (prompt.length > 500) {
      return errorResponse('Prompt is too long for enhancement (max 500 characters)')
    }

    // Check for inappropriate content (basic check)
    const inappropriateWords = ['nsfw', 'explicit', 'nude', 'sexual']
    const lowerPrompt = prompt.toLowerCase()
    if (inappropriateWords.some(word => lowerPrompt.includes(word))) {
      return errorResponse('Prompt contains inappropriate content')
    }

    try {
      // Enhance the prompt
      const enhancedPrompt = await enhancePromptWithGemini(prompt.trim())
      
      console.log('✅ Prompt enhanced successfully:', {
        originalLength: prompt.length,
        enhancedLength: enhancedPrompt.length,
        improvement: enhancedPrompt.length - prompt.length
      })

      return successResponse({
        originalPrompt: prompt.trim(),
        enhancedPrompt,
        metadata: {
          originalLength: prompt.length,
          enhancedLength: enhancedPrompt.length,
          improvementRatio: enhancedPrompt.length / prompt.length,
          model: 'gemini-pro',
          enhancedAt: new Date().toISOString()
        }
      })

    } catch (enhancementError: any) {
      console.error('❌ Enhancement failed:', enhancementError)
      
      // Handle specific Gemini errors
      if (enhancementError.message.includes('safety')) {
        return errorResponse('Prompt was blocked by safety filters. Please try a different prompt.')
      }
      
      if (enhancementError.message.includes('quota')) {
        return errorResponse('Enhancement service temporarily unavailable. Please try again later.')
      }
      
      if (enhancementError.message.includes('API key')) {
        return errorResponse('Enhancement service configuration error.', 500)
      }
      
      // Fallback: return original prompt with basic enhancements
      const fallbackEnhanced = `${prompt.trim()}, high quality, detailed, professional photography, sharp focus, vibrant colors`
      
      console.log('🔄 Using fallback enhancement')
      
      return successResponse({
        originalPrompt: prompt.trim(),
        enhancedPrompt: fallbackEnhanced,
        metadata: {
          originalLength: prompt.length,
          enhancedLength: fallbackEnhanced.length,
          improvementRatio: fallbackEnhanced.length / prompt.length,
          model: 'fallback',
          enhancedAt: new Date().toISOString(),
          fallback: true,
          fallbackReason: 'Gemini API unavailable'
        }
      })
    }

  } catch (error: any) {
    console.error('❌ Prompt enhancement API error:', error)
    return errorResponse(
      'Failed to enhance prompt. Please try again.',
      500
    )
  }
}
