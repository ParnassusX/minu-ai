import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth/server'

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const { user, error: authError } = await getAuthenticatedUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { apiKey, provider } = body

    if (!apiKey || !provider) {
      return NextResponse.json(
        { error: 'API key and provider are required' },
        { status: 400 }
      )
    }

    let isValid = false
    let errorMessage = ''

    try {
      switch (provider) {
        case 'replicate':
          // Validate Replicate API key
          const replicateResponse = await fetch('https://api.replicate.com/v1/account', {
            headers: {
              'Authorization': `Token ${apiKey}`,
              'Content-Type': 'application/json'
            }
          })
          
          if (replicateResponse.ok) {
            isValid = true
          } else {
            errorMessage = 'Invalid Replicate API key'
          }
          break

        case 'gemini':
          // Validate Gemini API key by making a simple request
          const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`)
          
          if (geminiResponse.ok) {
            isValid = true
          } else {
            errorMessage = 'Invalid Gemini API key'
          }
          break

        default:
          return NextResponse.json(
            { error: 'Unsupported provider' },
            { status: 400 }
          )
      }
    } catch (error) {
      console.error(`Error validating ${provider} API key:`, error)
      errorMessage = `Failed to validate ${provider} API key`
    }

    return NextResponse.json({
      valid: isValid,
      provider,
      error: errorMessage || undefined
    })
  } catch (error) {
    console.error('Error validating API key:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
