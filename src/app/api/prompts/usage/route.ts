import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST /api/prompts/usage - Track prompt usage
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    
    if (!body.promptNoteId) {
      return NextResponse.json({ error: 'Prompt note ID is required' }, { status: 400 })
    }

    // Verify note ownership
    const { data: note, error: noteError } = await supabase
      .from('prompt_notes')
      .select('user_id')
      .eq('id', body.promptNoteId)
      .single()

    if (noteError || !note || note.user_id !== user.id) {
      return NextResponse.json({ error: 'Note not found or access denied' }, { status: 404 })
    }

    // Record usage
    const { data: usage, error } = await supabase
      .from('prompt_usage')
      .insert({
        user_id: user.id,
        prompt_note_id: body.promptNoteId,
        project_id: body.projectId || null,
        model_used: body.modelUsed || null,
        generation_successful: body.generationSuccessful !== false,
        used_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Error recording prompt usage:', error)
      return NextResponse.json({ error: 'Failed to record usage' }, { status: 500 })
    }

    return NextResponse.json({ usage }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/prompts/usage:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET /api/prompts/usage - Get usage analytics
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const promptNoteId = searchParams.get('promptNoteId')
    const projectId = searchParams.get('projectId')
    const days = parseInt(searchParams.get('days') || '30')

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    let query = supabase
      .from('prompt_usage')
      .select(`
        *,
        prompt_notes!inner(id, content, title, category)
      `)
      .eq('user_id', user.id)
      .gte('used_at', startDate.toISOString())
      .order('used_at', { ascending: false })

    if (promptNoteId) {
      query = query.eq('prompt_note_id', promptNoteId)
    }

    if (projectId) {
      query = query.eq('project_id', projectId)
    }

    const { data: usage, error } = await query

    if (error) {
      console.error('Error fetching prompt usage:', error)
      return NextResponse.json({ error: 'Failed to fetch usage data' }, { status: 500 })
    }

    // Calculate analytics
    const analytics = {
      totalUsage: usage?.length || 0,
      successfulGenerations: usage?.filter(u => u.generation_successful).length || 0,
      failedGenerations: usage?.filter(u => !u.generation_successful).length || 0,
      uniquePrompts: new Set(usage?.map(u => u.prompt_note_id)).size,
      uniqueProjects: new Set(usage?.filter(u => u.project_id).map(u => u.project_id)).size,
      modelUsage: usage?.reduce((acc: Record<string, number>, u) => {
        if (u.model_used) {
          acc[u.model_used] = (acc[u.model_used] || 0) + 1
        }
        return acc
      }, {}),
      categoryUsage: usage?.reduce((acc: Record<string, number>, u) => {
        const category = u.prompt_notes?.category || 'unknown'
        acc[category] = (acc[category] || 0) + 1
        return acc
      }, {}),
      dailyUsage: usage?.reduce((acc: Record<string, number>, u) => {
        const date = new Date(u.used_at).toISOString().split('T')[0]
        acc[date] = (acc[date] || 0) + 1
        return acc
      }, {})
    }

    return NextResponse.json({ 
      usage: usage || [], 
      analytics,
      period: { days, startDate: startDate.toISOString() }
    })
  } catch (error) {
    console.error('Error in GET /api/prompts/usage:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
