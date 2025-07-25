import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAuthenticatedUser } from '@/lib/auth/server'

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
    const { action, imageIds, data } = body

    if (!action || !imageIds || !Array.isArray(imageIds) || imageIds.length === 0) {
      return NextResponse.json(
        { error: 'Action and imageIds array are required' },
        { status: 400 }
      )
    }

    const supabase = createClient()
    let result

    switch (action) {
      case 'delete':
        result = await handleBatchDelete(supabase, user.id, imageIds)
        break
      
      case 'move_to_folder':
        if (!data?.folderId && data?.folderId !== null) {
          return NextResponse.json(
            { error: 'folderId is required for move_to_folder action' },
            { status: 400 }
          )
        }
        result = await handleBatchMoveToFolder(supabase, user.id, imageIds, data.folderId)
        break
      
      case 'add_tags':
        if (!data?.tags || !Array.isArray(data.tags)) {
          return NextResponse.json(
            { error: 'tags array is required for add_tags action' },
            { status: 400 }
          )
        }
        result = await handleBatchAddTags(supabase, user.id, imageIds, data.tags)
        break
      
      case 'remove_tags':
        if (!data?.tags || !Array.isArray(data.tags)) {
          return NextResponse.json(
            { error: 'tags array is required for remove_tags action' },
            { status: 400 }
          )
        }
        result = await handleBatchRemoveTags(supabase, user.id, imageIds, data.tags)
        break
      
      case 'toggle_favorite':
        if (typeof data?.favorite !== 'boolean') {
          return NextResponse.json(
            { error: 'favorite boolean is required for toggle_favorite action' },
            { status: 400 }
          )
        }
        result = await handleBatchToggleFavorite(supabase, user.id, imageIds, data.favorite)
        break
      
      default:
        return NextResponse.json(
          { error: 'Invalid action. Supported actions: delete, move_to_folder, add_tags, remove_tags, toggle_favorite' },
          { status: 400 }
        )
    }

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      affectedCount: result.affectedCount
    })
  } catch (error) {
    console.error('Error in batch operation:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function handleBatchDelete(supabase: any, userId: string, imageIds: string[]) {
  try {
    const { error } = await supabase
      .from('images')
      .delete()
      .eq('user_id', userId)
      .in('id', imageIds)

    if (error) {
      console.error('Database error in batch delete:', error)
      return { error: 'Failed to delete images' }
    }

    return {
      message: `Successfully deleted ${imageIds.length} images`,
      affectedCount: imageIds.length
    }
  } catch (error) {
    console.error('Error in batch delete:', error)
    return { error: 'Failed to delete images' }
  }
}

async function handleBatchMoveToFolder(supabase: any, userId: string, imageIds: string[], folderId: string | null) {
  try {
    // Verify folder belongs to user if folderId is provided
    if (folderId) {
      const { data: folder } = await supabase
        .from('folders')
        .select('id')
        .eq('id', folderId)
        .eq('user_id', userId)
        .single()

      if (!folder) {
        return { error: 'Folder not found or access denied' }
      }
    }

    const { error } = await supabase
      .from('images')
      .update({ 
        folder_id: folderId,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .in('id', imageIds)

    if (error) {
      console.error('Database error in batch move:', error)
      return { error: 'Failed to move images' }
    }

    const folderName = folderId ? 'folder' : 'root'
    return {
      message: `Successfully moved ${imageIds.length} images to ${folderName}`,
      affectedCount: imageIds.length
    }
  } catch (error) {
    console.error('Error in batch move:', error)
    return { error: 'Failed to move images' }
  }
}

async function handleBatchAddTags(supabase: any, userId: string, imageIds: string[], newTags: string[]) {
  try {
    // Get current images with their tags
    const { data: images, error: fetchError } = await supabase
      .from('images')
      .select('id, tags')
      .eq('user_id', userId)
      .in('id', imageIds)

    if (fetchError) {
      console.error('Database error fetching images for tag update:', fetchError)
      return { error: 'Failed to fetch images' }
    }

    // Update each image with merged tags
    const updates = images.map((image: any) => {
      const currentTags = image.tags || []
      const mergedTags = [...new Set([...currentTags, ...newTags])]
      return {
        id: image.id,
        tags: mergedTags,
        updated_at: new Date().toISOString()
      }
    })

    const { error: updateError } = await supabase
      .from('images')
      .upsert(updates, { onConflict: 'id' })

    if (updateError) {
      console.error('Database error in batch add tags:', updateError)
      return { error: 'Failed to add tags' }
    }

    return {
      message: `Successfully added tags to ${imageIds.length} images`,
      affectedCount: imageIds.length
    }
  } catch (error) {
    console.error('Error in batch add tags:', error)
    return { error: 'Failed to add tags' }
  }
}

async function handleBatchRemoveTags(supabase: any, userId: string, imageIds: string[], tagsToRemove: string[]) {
  try {
    // Get current images with their tags
    const { data: images, error: fetchError } = await supabase
      .from('images')
      .select('id, tags')
      .eq('user_id', userId)
      .in('id', imageIds)

    if (fetchError) {
      console.error('Database error fetching images for tag removal:', fetchError)
      return { error: 'Failed to fetch images' }
    }

    // Update each image with filtered tags
    const updates = images.map((image: any) => {
      const currentTags = image.tags || []
      const filteredTags = currentTags.filter((tag: string) => !tagsToRemove.includes(tag))
      return {
        id: image.id,
        tags: filteredTags,
        updated_at: new Date().toISOString()
      }
    })

    const { error: updateError } = await supabase
      .from('images')
      .upsert(updates, { onConflict: 'id' })

    if (updateError) {
      console.error('Database error in batch remove tags:', updateError)
      return { error: 'Failed to remove tags' }
    }

    return {
      message: `Successfully removed tags from ${imageIds.length} images`,
      affectedCount: imageIds.length
    }
  } catch (error) {
    console.error('Error in batch remove tags:', error)
    return { error: 'Failed to remove tags' }
  }
}

async function handleBatchToggleFavorite(supabase: any, userId: string, imageIds: string[], favorite: boolean) {
  try {
    const { error } = await supabase
      .from('images')
      .update({ 
        is_favorite: favorite,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .in('id', imageIds)

    if (error) {
      console.error('Database error in batch favorite toggle:', error)
      return { error: 'Failed to update favorites' }
    }

    const action = favorite ? 'added to' : 'removed from'
    return {
      message: `Successfully ${action} favorites: ${imageIds.length} images`,
      affectedCount: imageIds.length
    }
  } catch (error) {
    console.error('Error in batch favorite toggle:', error)
    return { error: 'Failed to update favorites' }
  }
}
