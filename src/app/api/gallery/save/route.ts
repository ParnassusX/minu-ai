import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Helper function to get authenticated user
async function getAuthenticatedUser() {
  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return { user: null, error: 'Unauthorized' }
  }

  return { user, error: null }
}

export async function POST(request: NextRequest) {
  try {
    // SECURITY: Check authentication first
    const { user, error: authError } = await getAuthenticatedUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { results } = body

    if (!results || !Array.isArray(results)) {
      return NextResponse.json(
        { error: 'Results array is required' },
        { status: 400 }
      )
    }

    // Use authenticated client (not service client)
    const supabase = createClient()

    // Save each result to the gallery using the correct 'images' table
    const savedItems = []

    for (const result of results) {
      const { data, error } = await supabase
        .from('images')
        .insert({
          user_id: user.id, // SECURITY: Use authenticated user ID
          original_prompt: result.metadata.prompt || 'No prompt provided',
          file_path: result.cloudinaryUrl || result.originalUrl,
          model: result.metadata.model || 'unknown',
          parameters: result.metadata.parameters || {},
          width: result.metadata.width || 1024,
          height: result.metadata.height || 1024,
          cost: null, // Cost tracking can be added later
          generation_time: null,
          tags: [],
          is_favorite: false,
          folder_id: null
        })
        .select()
        .single()

      if (error) {
        console.error('Failed to save gallery item:', error)
        console.error('Error details:', JSON.stringify(error, null, 2))
        continue
      }

      savedItems.push(data)
    }

    return NextResponse.json({
      success: true,
      saved: savedItems.length,
      total: results.length,
      items: savedItems
    })
  } catch (error) {
    console.error('Gallery save error:', error)
    return NextResponse.json(
      { error: 'Save failed' },
      { status: 500 }
    )
  }
}
