import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

// Helper function to get authenticated user (secure)
async function getAuthenticatedUser() {
  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  // SECURITY: Removed development mode authentication bypass
  // All environments now require proper authentication
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

    // Fetch user's folders with image counts
    const supabase = createClient()
    const { data: folders, error: dbError } = await supabase
      .from('folders')
      .select(`
        id,
        name,
        color,
        created_at,
        updated_at,
        images:images(count)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (dbError) {
      console.error('Database error fetching folders:', dbError)
      return NextResponse.json(
        { error: 'Failed to fetch folders' },
        { status: 500 }
      )
    }

    // Transform data to include image counts
    const transformedFolders = folders?.map(folder => ({
      id: folder.id,
      name: folder.name,
      color: folder.color || '#3b82f6',
      imageCount: Array.isArray(folder.images) ? folder.images.length : (folder.images as any)?.count || 0,
      createdAt: folder.created_at,
      updatedAt: folder.updated_at
    })) || []

    return NextResponse.json({
      success: true,
      folders: transformedFolders
    })
  } catch (error) {
    console.error('Error fetching folders:', error)
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
    const { name, color } = body

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Folder name is required' },
        { status: 400 }
      )
    }

    // Check if folder name already exists for this user
    const supabase = createClient()
    const { data: existingFolder } = await supabase
      .from('folders')
      .select('id')
      .eq('user_id', user.id)
      .eq('name', name.trim())
      .single()

    if (existingFolder) {
      return NextResponse.json(
        { error: 'Folder name already exists' },
        { status: 400 }
      )
    }

    // Create new folder using authenticated client
    // SECURITY: Removed service client bypass - all operations use authenticated client
    const { data: newFolder, error: dbError } = await supabase
      .from('folders')
      .insert({
        user_id: user.id,
        name: name.trim(),
        color: color || '#3b82f6'
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database error creating folder:', dbError)
      return NextResponse.json(
        { error: 'Failed to create folder' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      folder: {
        id: newFolder.id,
        name: newFolder.name,
        color: newFolder.color,
        imageCount: 0,
        createdAt: newFolder.created_at,
        updatedAt: newFolder.updated_at
      }
    })
  } catch (error) {
    console.error('Error creating folder:', error)
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
    const { id, name, color } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Folder ID is required' },
        { status: 400 }
      )
    }

    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (name !== undefined) {
      if (!name.trim()) {
        return NextResponse.json(
          { error: 'Folder name cannot be empty' },
          { status: 400 }
        )
      }
      updateData.name = name.trim()
    }

    if (color !== undefined) {
      updateData.color = color
    }

    // Update folder
    const supabase = createClient()
    const { data: updatedFolder, error: dbError } = await supabase
      .from('folders')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id) // Ensure user can only update their own folders
      .select()
      .single()

    if (dbError) {
      console.error('Database error updating folder:', dbError)
      return NextResponse.json(
        { error: 'Failed to update folder' },
        { status: 500 }
      )
    }

    if (!updatedFolder) {
      return NextResponse.json(
        { error: 'Folder not found or access denied' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      folder: {
        id: updatedFolder.id,
        name: updatedFolder.name,
        color: updatedFolder.color,
        imageCount: 0, // Will be updated by client
        createdAt: updatedFolder.created_at,
        updatedAt: updatedFolder.updated_at
      }
    })
  } catch (error) {
    console.error('Error updating folder:', error)
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
        { error: 'Folder ID is required' },
        { status: 400 }
      )
    }

    // Check if folder has images
    const supabase = createClient()
    const { data: images } = await supabase
      .from('images')
      .select('id')
      .eq('folder_id', id)
      .eq('user_id', user.id)
      .limit(1)

    if (images && images.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete folder that contains images. Move images first.' },
        { status: 400 }
      )
    }

    // Delete folder
    const { error: dbError } = await supabase
      .from('folders')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id) // Ensure user can only delete their own folders

    if (dbError) {
      console.error('Database error deleting folder:', dbError)
      return NextResponse.json(
        { error: 'Failed to delete folder' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Folder deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting folder:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
