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

    // Fetch specific template from database
    const supabase = createClient()
    const { data: template, error: dbError } = await supabase
      .from('prompt_templates')
      .select('*')
      .eq('id', id)
      .or(`user_id.eq.${user.id},is_public.eq.true`)
      .single()

    if (dbError) {
      console.error('Database error fetching prompt template:', dbError)
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      )
    }

    // Extract variables from template
    const variables = [...new Set((template.template_text.match(/\{([^}]+)\}/g) || []).map((match: string) => match.slice(1, -1)))]

    return NextResponse.json({
      success: true,
      template: {
        id: template.id,
        name: template.name,
        description: '',
        template: template.template_text,
        category: template.category,
        variables,
        isPublic: template.is_public,
        isFavorite: false,
        usageCount: 0,
        createdAt: template.created_at,
        updatedAt: template.updated_at,
        tags: []
      }
    })
  } catch (error) {
    console.error('Error fetching prompt template:', error)
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

    // Update template in database
    const supabase = createClient()
    const { data: updatedTemplate, error: dbError } = await supabase
      .from('prompt_templates')
      .update({
        ...body,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', user.id) // Ensure user can only update their own templates
      .select()
      .single()

    if (dbError) {
      console.error('Database error updating prompt template:', dbError)
      return NextResponse.json(
        { error: 'Failed to update template' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      template: updatedTemplate
    })
  } catch (error) {
    console.error('Error updating prompt template:', error)
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

    // Delete template from database
    const supabase = createClient()
    const { error: dbError } = await supabase
      .from('prompt_templates')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id) // Ensure user can only delete their own templates

    if (dbError) {
      console.error('Database error deleting prompt template:', dbError)
      return NextResponse.json(
        { error: 'Failed to delete template' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Template deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting prompt template:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
