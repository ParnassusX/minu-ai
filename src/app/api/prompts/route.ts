import { NextRequest, NextResponse } from 'next/server'
import { PromptService } from '@/lib/prompts/promptService'
import { getAuthenticatedUser } from '@/lib/auth/server'

const promptService = new PromptService()

// GET /api/prompts - List user's prompts with filtering and search
export async function GET(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthenticatedUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('search')
    const category = searchParams.get('category')
    const promptType = searchParams.get('type')
    const minSuccessRate = searchParams.get('min_success_rate')
    const limit = parseInt(searchParams.get('limit') || '20')
    const sort = searchParams.get('sort') || 'recent' // recent, success_rate, usage

    let prompts

    if (query) {
      // Search prompts
      prompts = await promptService.searchPrompts(user.id, query, {
        category: category || undefined,
        promptType: promptType || undefined,
        minSuccessRate: minSuccessRate ? parseFloat(minSuccessRate) : undefined
      })
    } else if (sort === 'success_rate') {
      // Get top performing prompts
      prompts = await promptService.getTopPerformingPrompts(user.id, limit)
    } else {
      // Get recent prompts (default)
      prompts = await promptService.getRecentPrompts(user.id, limit)
    }

    return NextResponse.json({
      success: true,
      data: prompts,
      count: prompts.length
    })

  } catch (error) {
    console.error('Error fetching prompts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch prompts' },
      { status: 500 }
    )
  }
}

// POST /api/prompts - Create a new prompt (manual save)
export async function POST(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthenticatedUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      content,
      title,
      enhancedContent,
      category,
      tags,
      promptType = 'standard'
    } = body

    // Validate required fields
    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      )
    }

    if (content.length > 2000) {
      return NextResponse.json(
        { error: 'Content is too long (max 2000 characters)' },
        { status: 400 }
      )
    }

    // Save prompt
    const promptId = await promptService.savePromptFromGeneration({
      userId: user.id,
      content,
      title,
      enhancedContent,
      category,
      tags,
      promptType
    })

    return NextResponse.json({
      success: true,
      data: { id: promptId },
      message: 'Prompt saved successfully'
    })

  } catch (error) {
    console.error('Error creating prompt:', error)
    return NextResponse.json(
      { error: 'Failed to create prompt' },
      { status: 500 }
    )
  }
}

// PUT /api/prompts - Update prompt usage (for tracking)
export async function PUT(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthenticatedUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { promptId, action } = body

    if (!promptId || !action) {
      return NextResponse.json(
        { error: 'Prompt ID and action are required' },
        { status: 400 }
      )
    }

    if (action === 'use') {
      // This endpoint can be called when a prompt is used from history
      // The actual usage tracking happens automatically during generation
      return NextResponse.json({
        success: true,
        message: 'Prompt usage tracked'
      })
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Error updating prompt:', error)
    return NextResponse.json(
      { error: 'Failed to update prompt' },
      { status: 500 }
    )
  }
}
