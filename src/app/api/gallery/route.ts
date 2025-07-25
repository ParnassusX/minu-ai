import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { env, performanceConfig } from '@/lib/config/environment'
import { Database } from '@/types/database'
import { getUnifiedStorageService } from '@/lib/storage/unifiedStorage'
import { StorageErrorHandler } from '@/lib/storage/errorHandling'

import { GalleryImage } from '@/types/gallery'

// Helper function to get authenticated user (secure)
async function getAuthenticatedUser() {
  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  // In development mode, use the real authenticated user if available
  if (process.env.NODE_ENV === 'development') {
    console.log('Development mode: Using real authenticated user for gallery access')
    // Don't override with mock user - use the real authenticated user
  }

  if (authError || !user) {
    return { user: null, error: 'Unauthorized' }
  }

  return { user, error: null }
}

// Helper function to convert database row to GalleryImage
function dbRowToGalleryImage(row: Database['public']['Tables']['images']['Row']): GalleryImage {
  // Check if URL is from persistent storage (Cloudinary/Supabase) or temporary (Replicate)
  const isPersistent = row.file_path.includes('cloudinary.com') ||
                      row.file_path.includes('supabase.co/storage') ||
                      row.file_path.includes('generated-content') ||
                      row.file_path.includes('dev-generated-content')

  // Determine storage provider
  const provider = row.file_path.includes('cloudinary.com') ? 'cloudinary' :
                  row.file_path.includes('supabase.co') ? 'supabase' : 'replicate'

  return {
    id: row.id,
    url: row.file_path,
    prompt: row.original_prompt,
    model: row.model || 'unknown',
    parameters: (row.parameters as Record<string, any>) || {},
    width: row.width || 1024,
    height: row.height || 1024,
    cost: row.cost ? Number(row.cost) : undefined,
    generationTime: row.generation_time || undefined,
    tags: row.tags || [],
    folderId: row.folder_id,
    isFavorite: row.is_favorite,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    storage: {
      persistent: isPersistent,
      provider: provider,
      accessible: true // Will be validated if needed
    },
    metadata: {
      size: undefined,
      format: undefined
    }
  }
}

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

    // Parse pagination parameters with performance optimization
    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(
      performanceConfig.galleryPageSize,
      parseInt(searchParams.get('limit') || performanceConfig.galleryPageSize.toString())
    )
    const offset = (page - 1) * limit

    // Fetch user's images from database with optimized query (select only needed fields)
    const supabase = createClient()
    const { data: images, error: dbError } = await supabase
      .from('images')
      .select('id, file_path, original_prompt, model, parameters, created_at, width, height, cost, generation_time, tags, is_favorite, folder_id')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (dbError) {
      console.error('Database error fetching images:', dbError)

      // In development mode, return empty array instead of error
      if (process.env.NODE_ENV === 'development') {
        console.log('Development mode: Returning empty gallery due to database error')
        return NextResponse.json({
          success: true,
          images: [],
          pagination: {
            page,
            limit,
            hasMore: false
          }
        })
      }

      return NextResponse.json(
        { error: 'Failed to fetch gallery images' },
        { status: 500 }
      )
    }

    // Convert database rows to GalleryImage format
    const galleryImages = images.map((row: any) => dbRowToGalleryImage(row))

    return NextResponse.json({
      success: true,
      images: galleryImages,
      pagination: {
        page,
        limit,
        hasMore: images.length === limit
      }
    })
  } catch (error) {
    console.error('Error fetching gallery images:', error)
    return NextResponse.json(
      { error: 'Failed to fetch gallery images' },
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
    const { images, prompt, model, parameters, cost, generationTime } = body

    if (!images || !Array.isArray(images)) {
      return NextResponse.json(
        { error: 'Images array is required' },
        { status: 400 }
      )
    }

    // Prepare database records
    // SECURITY: Always use authenticated client - no RLS bypass
    const supabase = createClient()
    const imageRecords = images.map((imageUrl: string) => ({
      user_id: user.id,
      original_prompt: prompt || 'No prompt provided',
      file_path: imageUrl,
      model: model || 'flux-dev',
      parameters: parameters || {},
      width: parameters?.width || 1024,
      height: parameters?.height || 1024,
      cost: cost ? Number(cost) / images.length : null,
      generation_time: generationTime || null,
      tags: [],
      is_favorite: false,
      folder_id: null
    }))

    // Insert into database
    const { data: insertedImages, error: dbError } = await supabase
      .from('images')
      .insert(imageRecords)
      .select()

    if (dbError) {
      console.error('Database error inserting images:', dbError)
      return NextResponse.json(
        { error: 'Failed to save images to gallery' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      addedImages: insertedImages.length,
      images: insertedImages.map(dbRowToGalleryImage)
    })
  } catch (error) {
    console.error('Error adding images to gallery:', error)
    return NextResponse.json(
      { error: 'Failed to add images to gallery' },
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
    const { imageId, updates } = body

    if (!imageId) {
      return NextResponse.json(
        { error: 'Image ID is required' },
        { status: 400 }
      )
    }

    // Prepare database updates (convert GalleryImage fields to database fields)
    const dbUpdates: any = {}
    if (updates.isFavorite !== undefined) dbUpdates.is_favorite = updates.isFavorite
    if (updates.favorite !== undefined) dbUpdates.is_favorite = updates.favorite // backward compatibility
    if (updates.tags !== undefined) dbUpdates.tags = updates.tags
    if (updates.folderId !== undefined) dbUpdates.folder_id = updates.folderId
    if (updates.prompt !== undefined) dbUpdates.original_prompt = updates.prompt
    if (updates.model !== undefined) dbUpdates.model = updates.model
    if (updates.parameters !== undefined) dbUpdates.parameters = updates.parameters

    // Update in database
    // SECURITY: Always use authenticated client - no RLS bypass
    const supabase = createClient()
    const { data: updatedImage, error: dbError } = await supabase
      .from('images')
      .update(dbUpdates)
      .eq('id', imageId)
      .eq('user_id', user.id) // Ensure user can only update their own images
      .select()
      .single()

    if (dbError) {
      console.error('Database error updating image:', dbError)
      return NextResponse.json(
        { error: 'Failed to update gallery image' },
        { status: 500 }
      )
    }

    if (!updatedImage) {
      return NextResponse.json(
        { error: 'Image not found or access denied' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      image: dbRowToGalleryImage(updatedImage)
    })
  } catch (error) {
    console.error('Error updating gallery image:', error)
    return NextResponse.json(
      { error: 'Failed to update gallery image' },
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
    const imageId = searchParams.get('id')

    if (!imageId) {
      return NextResponse.json(
        { error: 'Image ID is required' },
        { status: 400 }
      )
    }

    // Delete from database
    // SECURITY: Always use authenticated client - no RLS bypass
    const supabase = createClient()
    const { error: dbError } = await supabase
      .from('images')
      .delete()
      .eq('id', imageId)
      .eq('user_id', user.id) // Ensure user can only delete their own images

    if (dbError) {
      console.error('Database error deleting image:', dbError)
      return NextResponse.json(
        { error: 'Failed to delete gallery image' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Image deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting gallery image:', error)
    return NextResponse.json(
      { error: 'Failed to delete gallery image' },
      { status: 500 }
    )
  }
}
