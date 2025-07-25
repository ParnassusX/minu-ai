// Gemini API for Text Enhancement and Prompt Improvement Only
// Image generation has been moved to Replicate

export interface GeminiTextParams {
  prompt: string
  maxTokens?: number
  temperature?: number
}

export interface GeminiTextResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string
      }>
    }
    finishReason?: string
  }>
  usageMetadata?: {
    promptTokenCount: number
    candidatesTokenCount: number
    totalTokenCount: number
  }
}

export class GeminiAPIError extends Error {
  constructor(message: string, public status?: number) {
    super(message)
    this.name = 'GeminiAPIError'
  }
}

const GEMINI_API_URL = process.env.GEMINI_API_URL || 'https://generativelanguage.googleapis.com'
const GEMINI_API_KEY = process.env.GEMINI_API_KEY

export async function enhancePromptWithGemini(params: GeminiTextParams): Promise<string> {
  if (!GEMINI_API_KEY) {
    throw new GeminiAPIError('Gemini API key is not configured')
  }

  const enhancementPrompt = `You are an expert at optimizing prompts for FLUX image generation models. Your task is to enhance the given prompt while keeping it concise and under 1000 characters.

FLUX models work best with:
- Clear, specific descriptions
- Artistic style mentions (photography, digital art, etc.)
- Lighting and composition details
- Quality modifiers (high resolution, detailed, professional)
- Avoid overly complex or contradictory elements

Original prompt: "${params.prompt}"

Enhanced prompt (max 1000 characters, focus on FLUX optimization):`

  try {
    const response = await fetch(
      `${GEMINI_API_URL}/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: enhancementPrompt }]
          }],
          generationConfig: {
            maxOutputTokens: params.maxTokens || 150,
            temperature: params.temperature || 0.7
          }
        }),
      }
    )

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new GeminiAPIError(
        errorData.error?.message || `HTTP error! status: ${response.status}`,
        response.status
      )
    }

    const data = await response.json() as GeminiTextResponse

    if (!data.candidates || data.candidates.length === 0) {
      throw new GeminiAPIError('No response generated')
    }

    const enhancedText = data.candidates[0].content.parts[0]?.text
    if (!enhancedText) {
      throw new GeminiAPIError('Empty response generated')
    }

    const trimmedText = enhancedText.trim()

    // Ensure the enhanced prompt doesn't exceed 1000 characters
    if (trimmedText.length > 1000) {
      // Truncate to 1000 characters at the last complete sentence
      const truncated = trimmedText.substring(0, 1000)
      const lastPeriod = truncated.lastIndexOf('.')
      const lastComma = truncated.lastIndexOf(',')
      const cutPoint = Math.max(lastPeriod, lastComma)

      return cutPoint > 800 ? truncated.substring(0, cutPoint + 1) : truncated.substring(0, 997) + '...'
    }

    return trimmedText

  } catch (error) {
    if (error instanceof GeminiAPIError) {
      throw error
    }
    throw new GeminiAPIError(`Failed to enhance prompt: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

export async function generateTextWithGemini(params: GeminiTextParams): Promise<GeminiTextResponse> {
  if (!GEMINI_API_KEY) {
    throw new GeminiAPIError('Gemini API key is not configured')
  }

  try {
    const response = await fetch(
      `${GEMINI_API_URL}/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: params.prompt }]
          }],
          generationConfig: {
            maxOutputTokens: params.maxTokens || 1000,
            temperature: params.temperature || 0.7
          }
        }),
      }
    )

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new GeminiAPIError(
        errorData.error?.message || `HTTP error! status: ${response.status}`,
        response.status
      )
    }

    const data = await response.json()
    return data as GeminiTextResponse
  } catch (error) {
    if (error instanceof GeminiAPIError) {
      throw error
    }
    throw new GeminiAPIError(`Failed to generate text: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}
