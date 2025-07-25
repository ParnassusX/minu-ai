import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { env } from '@/lib/config/environment'

interface PromptHistoryItem {
  id: string
  prompt: string
  model: string
  parameters: Record<string, any>
  timestamp: string
  tags: string[]
  favorite: boolean
  category?: string
  notes?: string
  usageCount: number
  lastUsed: string
}

// Helper function to get authenticated user (secure)
async function getAuthenticatedUser() {
  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  // In development mode, use the real authenticated user if available
  if (process.env.NODE_ENV === 'development') {
    console.log('Development mode: Using real authenticated user for prompt history access')
    // Don't override with mock user - use the real authenticated user
  }

  if (authError || !user) {
    return { user: null, error: 'Unauthorized' }
  }

  return { user, error: null }
}

export async function GET() {
  try {
    // Check authentication
    const { user, error: authError } = await getAuthenticatedUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Fetch user's prompt history from database
    // SECURITY: Always use authenticated client - no RLS bypass
    const supabase = createClient()
    const { data: prompts, error: dbError } = await supabase
      .from('prompt_history')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(env.getPerformanceConfig().galleryPageSize)

    if (dbError) {
      console.error('Database error fetching prompt history:', dbError)
      return NextResponse.json(
        { error: 'Failed to fetch prompt history' },
        { status: 500 }
      )
    }

    // Transform database rows to expected format
    const transformedPrompts = prompts.map(row => ({
      id: row.id,
      prompt: row.prompt_text,
      model: 'Unknown', // Not stored in current schema
      parameters: {},
      timestamp: row.created_at,
      tags: [],
      favorite: false,
      category: 'General',
      notes: '',
      usageCount: 1,
      lastUsed: row.created_at
    }))

    return NextResponse.json({
      success: true,
      prompts: transformedPrompts
    })
  } catch (error) {
    console.error('Error fetching prompt history:', error)
    return NextResponse.json(
      { error: 'Failed to fetch prompt history' },
      { status: 500 }
    )
  }
}

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
    const { prompt, model, parameters, tags, category, notes, variables, processedPrompt } = body

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      )
    }

    // Save prompt to database
    // SECURITY: Always use authenticated client - no RLS bypass
    const supabase = createClient()
    const { data: newPrompt, error: dbError } = await supabase
      .from('prompt_history')
      .insert({
        user_id: user.id,
        prompt_text: prompt
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database error creating prompt history:', dbError)
      return NextResponse.json(
        { error: 'Failed to save prompt to history' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      prompt: {
        id: newPrompt.id,
        prompt: newPrompt.prompt_text,
        model: model || 'Unknown',
        parameters: parameters || {},
        timestamp: newPrompt.created_at,
        tags: tags || [],
        favorite: false,
        category: category || 'General',
        notes: notes || '',
        usageCount: 1,
        lastUsed: newPrompt.created_at,
        variables: variables || [],
        processedPrompt: processedPrompt || prompt
      }
    })
  } catch (error) {
    console.error('Error adding prompt to history:', error)
    return NextResponse.json(
      { error: 'Failed to add prompt to history' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
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
    const { promptId, updates } = body

    if (!promptId) {
      return NextResponse.json(
        { error: 'Prompt ID is required' },
        { status: 400 }
      )
    }

    // Update prompt in database
    const supabase = createClient()
    const { data: updatedPrompt, error: dbError } = await supabase
      .from('prompt_history')
      .update({
        prompt_text: updates.prompt || updates.prompt_text
      })
      .eq('id', promptId)
      .eq('user_id', user.id)
      .select()
      .single()

    if (dbError) {
      console.error('Database error updating prompt:', dbError)
      return NextResponse.json(
        { error: 'Failed to update prompt' },
        { status: 500 }
      )
    }

    if (!updatedPrompt) {
      return NextResponse.json(
        { error: 'Prompt not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      prompt: {
        id: updatedPrompt.id,
        prompt: updatedPrompt.prompt_text,
        model: 'Unknown',
        parameters: {},
        timestamp: updatedPrompt.created_at,
        tags: [],
        favorite: false,
        category: 'General',
        notes: '',
        usageCount: 1,
        lastUsed: updatedPrompt.created_at
      }
    })
  } catch (error) {
    console.error('Error updating prompt:', error)
    return NextResponse.json(
      { error: 'Failed to update prompt' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Check authentication
    const { user, error: authError } = await getAuthenticatedUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const promptId = searchParams.get('id')

    if (!promptId) {
      return NextResponse.json(
        { error: 'Prompt ID is required' },
        { status: 400 }
      )
    }

    // Delete prompt from database
    const supabase = createClient()
    const { error: dbError } = await supabase
      .from('prompt_history')
      .delete()
      .eq('id', promptId)
      .eq('user_id', user.id)

    if (dbError) {
      console.error('Database error deleting prompt:', dbError)
      return NextResponse.json(
        { error: 'Failed to delete prompt' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Prompt deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting prompt:', error)
    return NextResponse.json(
      { error: 'Failed to delete prompt' },
      { status: 500 }
    )
  }
}
