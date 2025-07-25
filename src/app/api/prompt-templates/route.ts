import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAuthenticatedUser } from '@/lib/auth/server'

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

    // Fetch user's prompt templates from database
    const supabase = createClient()
    const { data: templates, error: dbError } = await supabase
      .from('prompt_templates')
      .select('*')
      .or(`user_id.eq.${user.id},is_public.eq.true`)
      .order('created_at', { ascending: false })

    if (dbError) {
      console.error('Database error fetching prompt templates:', dbError)
      return NextResponse.json(
        { error: 'Failed to fetch prompt templates' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      templates: templates || []
    })
  } catch (error) {
    console.error('Error fetching prompt templates:', error)
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

    const body = await request.json()
    const { name, description, template, category, tags, isPublic } = body

    if (!name || !template) {
      return NextResponse.json(
        { error: 'Name and template are required' },
        { status: 400 }
      )
    }

    // Extract variables from template
    const variables = [...new Set((template.match(/\{([^}]+)\}/g) || []).map((match: string) => match.slice(1, -1)))]

    // Save template to database
    const supabase = createClient()
    const { data: newTemplate, error: dbError } = await supabase
      .from('prompt_templates')
      .insert({
        user_id: user.id,
        name,
        template_text: template,
        category: category || 'Custom',
        is_public: isPublic || false
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database error creating prompt template:', dbError)
      return NextResponse.json(
        { error: 'Failed to create prompt template' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      template: {
        id: newTemplate.id,
        name: newTemplate.name,
        description: description || '',
        template: newTemplate.template_text,
        category: newTemplate.category,
        variables,
        isPublic: newTemplate.is_public,
        isFavorite: false,
        usageCount: 0,
        createdAt: newTemplate.created_at,
        updatedAt: newTemplate.updated_at,
        tags: tags || []
      }
    })
  } catch (error) {
    console.error('Error creating prompt template:', error)
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
    const { id, name, description, template, category, tags, isPublic } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Template ID is required' },
        { status: 400 }
      )
    }

    // Extract variables from template
    const variables = [...new Set((template.match(/\{([^}]+)\}/g) || []).map((match: string) => match.slice(1, -1)))]

    // Update template in database
    const supabase = createClient()
    const { data: updatedTemplate, error: dbError } = await supabase
      .from('prompt_templates')
      .update({
        name,
        template_text: template,
        category: category || 'Custom',
        is_public: isPublic || false,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', user.id) // Ensure user can only update their own templates
      .select()
      .single()

    if (dbError) {
      console.error('Database error updating prompt template:', dbError)
      return NextResponse.json(
        { error: 'Failed to update prompt template' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      template: {
        id: updatedTemplate.id,
        name: updatedTemplate.name,
        description: description || '',
        template: updatedTemplate.template_text,
        category: updatedTemplate.category,
        variables,
        isPublic: updatedTemplate.is_public,
        isFavorite: false,
        usageCount: 0,
        createdAt: updatedTemplate.created_at,
        updatedAt: updatedTemplate.updated_at,
        tags: tags || []
      }
    })
  } catch (error) {
    console.error('Error updating prompt template:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
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
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Template ID is required' },
        { status: 400 }
      )
    }

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
        { error: 'Failed to delete prompt template' },
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
