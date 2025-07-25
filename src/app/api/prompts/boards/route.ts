import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validatePromptBoard } from '@/types/prompt'

// GET /api/prompts/boards - List user's prompt boards
export async function GET() {
  try {
    const supabase = createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: boards, error } = await supabase
      .from('prompt_boards')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching prompt boards:', error)
      return NextResponse.json({ error: 'Failed to fetch boards' }, { status: 500 })
    }

    return NextResponse.json({ boards: boards || [] })
  } catch (error) {
    console.error('Error in GET /api/prompts/boards:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/prompts/boards - Create new prompt board
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    
    // Validate request
    const validationErrors = validatePromptBoard(body)
    if (validationErrors.length > 0) {
      return NextResponse.json({ 
        error: 'Validation failed', 
        details: validationErrors 
      }, { status: 400 })
    }

    // If this is set as default, unset other defaults
    if (body.isDefault) {
      await supabase
        .from('prompt_boards')
        .update({ is_default: false })
        .eq('user_id', user.id)
    }

    const { data: board, error } = await supabase
      .from('prompt_boards')
      .insert({
        user_id: user.id,
        name: body.name,
        description: body.description,
        layout: body.layout || { width: 1200, height: 800, zoom: 1 },
        background_color: body.backgroundColor || '#1e293b',
        is_default: body.isDefault || false
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating prompt board:', error)
      return NextResponse.json({ error: 'Failed to create board' }, { status: 500 })
    }

    return NextResponse.json({ board }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/prompts/boards:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/prompts/boards - Update prompt board
export async function PUT(request: NextRequest) {
  try {
    const supabase = createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    
    if (!body.id) {
      return NextResponse.json({ error: 'Board ID is required' }, { status: 400 })
    }

    // Validate request
    const validationErrors = validatePromptBoard(body)
    if (validationErrors.length > 0) {
      return NextResponse.json({ 
        error: 'Validation failed', 
        details: validationErrors 
      }, { status: 400 })
    }

    // Check ownership
    const { data: existingBoard, error: fetchError } = await supabase
      .from('prompt_boards')
      .select('user_id')
      .eq('id', body.id)
      .single()

    if (fetchError || !existingBoard) {
      return NextResponse.json({ error: 'Board not found' }, { status: 404 })
    }

    if (existingBoard.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // If this is set as default, unset other defaults
    if (body.isDefault) {
      await supabase
        .from('prompt_boards')
        .update({ is_default: false })
        .eq('user_id', user.id)
        .neq('id', body.id)
    }

    const updateData: any = {}
    if (body.name !== undefined) updateData.name = body.name
    if (body.description !== undefined) updateData.description = body.description
    if (body.layout !== undefined) updateData.layout = body.layout
    if (body.backgroundColor !== undefined) updateData.background_color = body.backgroundColor
    if (body.isDefault !== undefined) updateData.is_default = body.isDefault

    const { data: board, error } = await supabase
      .from('prompt_boards')
      .update(updateData)
      .eq('id', body.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating prompt board:', error)
      return NextResponse.json({ error: 'Failed to update board' }, { status: 500 })
    }

    return NextResponse.json({ board })
  } catch (error) {
    console.error('Error in PUT /api/prompts/boards:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/prompts/boards - Delete prompt board
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const boardId = searchParams.get('id')

    if (!boardId) {
      return NextResponse.json({ error: 'Board ID is required' }, { status: 400 })
    }

    // Check ownership
    const { data: existingBoard, error: fetchError } = await supabase
      .from('prompt_boards')
      .select('user_id, is_default')
      .eq('id', boardId)
      .single()

    if (fetchError || !existingBoard) {
      return NextResponse.json({ error: 'Board not found' }, { status: 404 })
    }

    if (existingBoard.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Don't allow deleting the default board if it's the only one
    if (existingBoard.is_default) {
      const { count } = await supabase
        .from('prompt_boards')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)

      if (count === 1) {
        return NextResponse.json({ 
          error: 'Cannot delete the only remaining board' 
        }, { status: 400 })
      }
    }

    // Delete the board (notes will be cascade deleted)
    const { error } = await supabase
      .from('prompt_boards')
      .delete()
      .eq('id', boardId)

    if (error) {
      console.error('Error deleting prompt board:', error)
      return NextResponse.json({ error: 'Failed to delete board' }, { status: 500 })
    }

    // If we deleted the default board, set another one as default
    if (existingBoard.is_default) {
      const { data: remainingBoards } = await supabase
        .from('prompt_boards')
        .select('id')
        .eq('user_id', user.id)
        .limit(1)

      if (remainingBoards && remainingBoards.length > 0) {
        await supabase
          .from('prompt_boards')
          .update({ is_default: true })
          .eq('id', remainingBoards[0].id)
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/prompts/boards:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
