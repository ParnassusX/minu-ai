import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validatePromptNote } from '@/types/prompt'

// GET /api/prompts/notes - List prompt notes for a board
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const boardId = searchParams.get('boardId')

    if (!boardId) {
      return NextResponse.json({ error: 'Board ID is required' }, { status: 400 })
    }

    // Verify board ownership
    const { data: board, error: boardError } = await supabase
      .from('prompt_boards')
      .select('user_id')
      .eq('id', boardId)
      .single()

    if (boardError || !board || board.user_id !== user.id) {
      return NextResponse.json({ error: 'Board not found or access denied' }, { status: 404 })
    }

    const { data: notes, error } = await supabase
      .from('prompt_notes')
      .select('*')
      .eq('board_id', boardId)
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('Error fetching prompt notes:', error)
      return NextResponse.json({ error: 'Failed to fetch notes' }, { status: 500 })
    }

    return NextResponse.json({ notes: notes || [] })
  } catch (error) {
    console.error('Error in GET /api/prompts/notes:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/prompts/notes - Create new prompt note
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    
    // Validate request
    const validationErrors = validatePromptNote(body)
    if (validationErrors.length > 0) {
      return NextResponse.json({ 
        error: 'Validation failed', 
        details: validationErrors 
      }, { status: 400 })
    }

    if (!body.boardId) {
      return NextResponse.json({ error: 'Board ID is required' }, { status: 400 })
    }

    // Verify board ownership
    const { data: board, error: boardError } = await supabase
      .from('prompt_boards')
      .select('user_id')
      .eq('id', body.boardId)
      .single()

    if (boardError || !board || board.user_id !== user.id) {
      return NextResponse.json({ error: 'Board not found or access denied' }, { status: 404 })
    }

    const { data: note, error } = await supabase
      .from('prompt_notes')
      .insert({
        board_id: body.boardId,
        user_id: user.id,
        content: body.content,
        title: body.title,
        position: body.position || { x: 100, y: 100 },
        size: body.size || { width: 200, height: 150 },
        color: body.color || '#fef3c7',
        category: body.category || 'general',
        tags: body.tags || [],
        is_enhanced: false,
        usage_count: 0
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating prompt note:', error)
      return NextResponse.json({ error: 'Failed to create note' }, { status: 500 })
    }

    return NextResponse.json({ note }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/prompts/notes:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/prompts/notes - Update prompt note
export async function PUT(request: NextRequest) {
  try {
    const supabase = createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    
    if (!body.id) {
      return NextResponse.json({ error: 'Note ID is required' }, { status: 400 })
    }

    // Validate request
    const validationErrors = validatePromptNote(body)
    if (validationErrors.length > 0) {
      return NextResponse.json({ 
        error: 'Validation failed', 
        details: validationErrors 
      }, { status: 400 })
    }

    // Check ownership
    const { data: existingNote, error: fetchError } = await supabase
      .from('prompt_notes')
      .select('user_id')
      .eq('id', body.id)
      .single()

    if (fetchError || !existingNote) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 })
    }

    if (existingNote.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const updateData: any = {}
    if (body.content !== undefined) updateData.content = body.content
    if (body.title !== undefined) updateData.title = body.title
    if (body.position !== undefined) updateData.position = body.position
    if (body.size !== undefined) updateData.size = body.size
    if (body.color !== undefined) updateData.color = body.color
    if (body.category !== undefined) updateData.category = body.category
    if (body.tags !== undefined) updateData.tags = body.tags
    if (body.isEnhanced !== undefined) updateData.is_enhanced = body.isEnhanced
    if (body.enhancedContent !== undefined) updateData.enhanced_content = body.enhancedContent
    if (body.usageCount !== undefined) updateData.usage_count = body.usageCount
    if (body.lastUsedAt !== undefined) updateData.last_used_at = body.lastUsedAt

    const { data: note, error } = await supabase
      .from('prompt_notes')
      .update(updateData)
      .eq('id', body.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating prompt note:', error)
      return NextResponse.json({ error: 'Failed to update note' }, { status: 500 })
    }

    return NextResponse.json({ note })
  } catch (error) {
    console.error('Error in PUT /api/prompts/notes:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/prompts/notes - Delete prompt note
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const noteId = searchParams.get('id')

    if (!noteId) {
      return NextResponse.json({ error: 'Note ID is required' }, { status: 400 })
    }

    // Check ownership
    const { data: existingNote, error: fetchError } = await supabase
      .from('prompt_notes')
      .select('user_id')
      .eq('id', noteId)
      .single()

    if (fetchError || !existingNote) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 })
    }

    if (existingNote.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { error } = await supabase
      .from('prompt_notes')
      .delete()
      .eq('id', noteId)

    if (error) {
      console.error('Error deleting prompt note:', error)
      return NextResponse.json({ error: 'Failed to delete note' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/prompts/notes:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
