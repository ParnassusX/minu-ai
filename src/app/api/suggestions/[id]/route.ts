import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAuthenticatedUser } from '@/lib/auth/server'
import { UpdateSuggestionRequest } from '@/types/suggestion'

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

    // Fetch suggestion
    const supabase = createClient()
    const { data: suggestion, error: dbError } = await supabase
      .from('suggestions')
      .select('*')
      .eq('id', id)
      .or(`is_public.eq.true,user_id.eq.${user.id}`)
      .single()

    if (dbError || !suggestion) {
      return NextResponse.json(
        { error: 'Suggestion not found' },
        { status: 404 }
      )
    }

    // Transform response
    const transformedSuggestion = {
      id: suggestion.id,
      userId: suggestion.user_id,
      category: suggestion.category,
      title: suggestion.title || suggestion.text.substring(0, 30),
      text: suggestion.text,
      description: suggestion.description || '',
      color: suggestion.color || '#fbbf24',
      isPublic: suggestion.is_public,
      usageCount: suggestion.usage_count || 0,
      position: suggestion.position || 0,
      tags: suggestion.tags || [],
      createdAt: suggestion.created_at,
      updatedAt: suggestion.updated_at
    }

    return NextResponse.json({
      success: true,
      suggestion: transformedSuggestion
    })
  } catch (error) {
    console.error('Error fetching suggestion:', error)
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
    const body: UpdateSuggestionRequest = await request.json()

    // Update suggestion
    const supabase = createClient()
    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    // Only update provided fields
    if (body.title !== undefined) updateData.title = body.title
    if (body.text !== undefined) updateData.text = body.text
    if (body.description !== undefined) updateData.description = body.description
    if (body.color !== undefined) updateData.color = body.color
    if (body.isPublic !== undefined) updateData.is_public = body.isPublic
    if (body.tags !== undefined) updateData.tags = body.tags
    if (body.position !== undefined) updateData.position = body.position

    const { data: updatedSuggestion, error: dbError } = await supabase
      .from('suggestions')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id) // Ensure user can only update their own suggestions
      .select()
      .single()

    if (dbError) {
      console.error('Database error updating suggestion:', dbError)
      return NextResponse.json(
        { error: 'Failed to update suggestion' },
        { status: 500 }
      )
    }

    if (!updatedSuggestion) {
      return NextResponse.json(
        { error: 'Suggestion not found or access denied' },
        { status: 404 }
      )
    }

    // Transform response
    const transformedSuggestion = {
      id: updatedSuggestion.id,
      userId: updatedSuggestion.user_id,
      category: updatedSuggestion.category,
      title: updatedSuggestion.title,
      text: updatedSuggestion.text,
      description: updatedSuggestion.description || '',
      color: updatedSuggestion.color,
      isPublic: updatedSuggestion.is_public,
      usageCount: updatedSuggestion.usage_count,
      position: updatedSuggestion.position,
      tags: updatedSuggestion.tags || [],
      createdAt: updatedSuggestion.created_at,
      updatedAt: updatedSuggestion.updated_at
    }

    return NextResponse.json({
      success: true,
      suggestion: transformedSuggestion
    })
  } catch (error) {
    console.error('Error updating suggestion:', error)
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

    // Delete suggestion
    const supabase = createClient()
    const { error: dbError } = await supabase
      .from('suggestions')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id) // Ensure user can only delete their own suggestions

    if (dbError) {
      console.error('Database error deleting suggestion:', dbError)
      return NextResponse.json(
        { error: 'Failed to delete suggestion' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Suggestion deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting suggestion:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Increment usage count when suggestion is used
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()
    const { action } = body

    if (action === 'increment_usage') {
      const supabase = createClient()
      
      // Call the database function to increment usage
      const { error: dbError } = await supabase
        .rpc('increment_suggestion_usage', { suggestion_id: id })

      if (dbError) {
        console.error('Database error incrementing usage:', dbError)
        return NextResponse.json(
          { error: 'Failed to increment usage' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'Usage count incremented'
      })
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error processing suggestion action:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
