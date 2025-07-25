import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAuthenticatedUser } from '@/lib/auth/server'
import { CreateSuggestionRequest, SuggestionFilter, SuggestionSort } from '@/types/suggestion'

export async function GET(request: NextRequest) {
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
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const isPublic = searchParams.get('isPublic')
    const sortField = searchParams.get('sortField') || 'position'
    const sortDirection = searchParams.get('sortDirection') || 'asc'
    const limit = parseInt(searchParams.get('limit') || '50')

    // Build query
    const supabase = createClient()
    let query = supabase
      .from('suggestions')
      .select('*')

    // Apply filters
    if (category) {
      query = query.eq('category', category)
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,text.ilike.%${search}%`)
    }

    if (isPublic !== null) {
      if (isPublic === 'true') {
        query = query.eq('is_public', true)
      } else {
        query = query.or(`is_public.eq.true,user_id.eq.${user.id}`)
      }
    } else {
      // Default: show public suggestions and user's own suggestions
      query = query.or(`is_public.eq.true,user_id.eq.${user.id}`)
    }

    // Apply sorting
    const ascending = sortDirection === 'asc'
    switch (sortField) {
      case 'usageCount':
        query = query.order('usage_count', { ascending })
        break
      case 'createdAt':
        query = query.order('created_at', { ascending })
        break
      case 'title':
        query = query.order('title', { ascending })
        break
      case 'position':
      default:
        query = query.order('position', { ascending }).order('created_at', { ascending: false })
        break
    }

    query = query.limit(limit)

    const { data: suggestions, error: dbError } = await query

    if (dbError) {
      console.error('Database error fetching suggestions:', dbError)
      return NextResponse.json(
        { error: 'Failed to fetch suggestions' },
        { status: 500 }
      )
    }

    // Transform data to match our interface
    const transformedSuggestions = suggestions?.map(suggestion => ({
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
    })) || []

    return NextResponse.json({
      success: true,
      suggestions: transformedSuggestions,
      total: transformedSuggestions.length
    })
  } catch (error) {
    console.error('Error fetching suggestions:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
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

    const body: CreateSuggestionRequest = await request.json()
    const { category, title, text, description, color, isPublic, tags } = body

    if (!category || !title || !text) {
      return NextResponse.json(
        { error: 'Category, title, and text are required' },
        { status: 400 }
      )
    }

    // Get the next position for this category
    const supabase = createClient()
    const { data: maxPositionData } = await supabase
      .from('suggestions')
      .select('position')
      .eq('category', category)
      .eq('user_id', user.id)
      .order('position', { ascending: false })
      .limit(1)

    const nextPosition = (maxPositionData?.[0]?.position || 0) + 1

    // Create suggestion
    const { data: newSuggestion, error: dbError } = await supabase
      .from('suggestions')
      .insert({
        user_id: user.id,
        category,
        title,
        text,
        description: description || '',
        color: color || '#fbbf24',
        is_public: isPublic || false,
        tags: tags || [],
        position: nextPosition,
        usage_count: 0
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database error creating suggestion:', dbError)
      return NextResponse.json(
        { error: 'Failed to create suggestion' },
        { status: 500 }
      )
    }

    // Transform response
    const transformedSuggestion = {
      id: newSuggestion.id,
      userId: newSuggestion.user_id,
      category: newSuggestion.category,
      title: newSuggestion.title,
      text: newSuggestion.text,
      description: newSuggestion.description || '',
      color: newSuggestion.color,
      isPublic: newSuggestion.is_public,
      usageCount: newSuggestion.usage_count,
      position: newSuggestion.position,
      tags: newSuggestion.tags || [],
      createdAt: newSuggestion.created_at,
      updatedAt: newSuggestion.updated_at
    }

    return NextResponse.json({
      success: true,
      suggestion: transformedSuggestion
    })
  } catch (error) {
    console.error('Error creating suggestion:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
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
    const { suggestions } = body

    if (!Array.isArray(suggestions)) {
      return NextResponse.json(
        { error: 'Suggestions array is required' },
        { status: 400 }
      )
    }

    // Bulk update suggestions (for reordering)
    const supabase = createClient()
    const updates = suggestions.map(suggestion => ({
      id: suggestion.id,
      position: suggestion.position,
      updated_at: new Date().toISOString()
    }))

    const { error: dbError } = await supabase
      .from('suggestions')
      .upsert(updates, { onConflict: 'id' })

    if (dbError) {
      console.error('Database error updating suggestions:', dbError)
      return NextResponse.json(
        { error: 'Failed to update suggestions' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Suggestions updated successfully'
    })
  } catch (error) {
    console.error('Error updating suggestions:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
