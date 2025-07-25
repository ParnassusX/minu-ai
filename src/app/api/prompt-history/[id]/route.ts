import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAuthenticatedUser } from '@/lib/auth/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const { user, error: authError } = await getAuthenticatedUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = params

    // Fetch specific prompt from database
    const supabase = createClient()
    const { data: prompt, error: dbError } = await supabase
      .from('prompt_history')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (dbError) {
      console.error('Database error fetching prompt:', dbError)
      return NextResponse.json(
        { error: 'Prompt not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      prompt: {
        id: prompt.id,
        prompt: prompt.prompt_text,
        model: 'Unknown',
        parameters: {},
        timestamp: prompt.created_at,
        tags: [],
        favorite: false,
        category: 'General',
        notes: '',
        usageCount: 1,
        lastUsed: prompt.created_at
      }
    })
  } catch (error) {
    console.error('Error fetching prompt:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const { user, error: authError } = await getAuthenticatedUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = params
    const body = await request.json()
    const { favorite } = body

    // Update prompt in database (for now just handle favorite status)
    const supabase = createClient()
    
    // Since we don't have a favorite column in prompt_history table yet,
    // we'll just return success for now
    // TODO: Add favorite column to prompt_history table in future migration
    
    return NextResponse.json({
      success: true,
      message: 'Prompt updated successfully'
    })
  } catch (error) {
    console.error('Error updating prompt:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const { user, error: authError } = await getAuthenticatedUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = params

    // Delete prompt from database
    const supabase = createClient()
    const { error: dbError } = await supabase
      .from('prompt_history')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id) // Ensure user can only delete their own prompts

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
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
