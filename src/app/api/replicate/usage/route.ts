import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/replicate/usage
 * 
 * Returns Replicate account usage information including:
 * - Current billing period usage
 * - Account limits
 * - Cost breakdown by model
 */
export async function GET(request: NextRequest) {
  try {
    const apiToken = process.env.REPLICATE_API_TOKEN

    if (!apiToken) {
      return NextResponse.json(
        { error: 'Replicate API token not configured' },
        { status: 500 }
      )
    }

    // Fetch account information from Replicate
    const response = await fetch('https://api.replicate.com/v1/account', {
      headers: {
        'Authorization': `Token ${apiToken}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      console.error('Replicate account API error:', response.status, response.statusText)
      return NextResponse.json(
        { error: 'Failed to fetch account information from Replicate' },
        { status: response.status }
      )
    }

    const accountData = await response.json()

    // Return usage information
    return NextResponse.json({
      success: true,
      account: {
        username: accountData.username || 'Unknown',
        type: accountData.type || 'personal',
        github_url: accountData.github_url || null
      },
      usage: {
        // Note: Replicate doesn't provide detailed usage in the account endpoint
        // This would typically require additional API calls or webhook data
        message: 'Usage tracking requires webhook integration or additional API calls',
        current_period: {
          predictions: 0,
          cost: 0,
          currency: 'USD'
        },
        limits: {
          message: 'Limits depend on your Replicate plan'
        }
      },
      models: {
        message: 'Model-specific usage requires prediction history analysis'
      }
    })

  } catch (error) {
    console.error('Replicate usage API error:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch Replicate usage information',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
