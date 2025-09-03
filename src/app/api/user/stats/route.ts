/**
 * User Statistics API
 * Comprehensive user statistics for profile dashboard
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    // Get user's images (generations) from database
    const { data: images, error: imagesError } = await supabase
      .from('images')
      .select('id, cost, generation_time, model, created_at, is_favorite, original_prompt')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (imagesError) {
      console.error('Error fetching images:', imagesError)
      return NextResponse.json(
        { error: 'Failed to fetch generation statistics' },
        { status: 500 }
      )
    }

    // Calculate comprehensive statistics
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    const stats = {
      totalGenerations: images?.length || 0,
      thisMonth: images?.filter(img => {
        const imgDate = new Date(img.created_at)
        return imgDate.getMonth() === currentMonth && imgDate.getFullYear() === currentYear
      }).length || 0,
      thisWeek: images?.filter(img => new Date(img.created_at) >= oneWeekAgo).length || 0,
      totalCost: images?.reduce((sum, img) => sum + (img.cost || 0), 0) || 0,
      costThisMonth: images?.filter(img => {
        const imgDate = new Date(img.created_at)
        return imgDate.getMonth() === currentMonth && imgDate.getFullYear() === currentYear
      }).reduce((sum, img) => sum + (img.cost || 0), 0) || 0,
      averageGenerationTime: images?.length > 0
        ? images.reduce((sum, img) => sum + (img.generation_time || 0), 0) / images.length
        : 0,
      favoriteCount: images?.filter(img => img.is_favorite).length || 0,
      favoriteModel: getMostUsedModel(images || []),
      recentActivity: images?.slice(0, 10).map(img => ({
        id: img.id,
        model: img.model,
        cost: img.cost,
        prompt: img.original_prompt?.substring(0, 100) + (img.original_prompt?.length > 100 ? '...' : ''),
        created_at: img.created_at
      })) || []
    }

    // Get folder statistics
    const { data: folders } = await supabase
      .from('folders')
      .select('id, name, created_at')
      .eq('user_id', user.id)

    // Get prompt statistics
    const { data: prompts } = await supabase
      .from('prompts')
      .select('id, title, created_at')
      .eq('user_id', user.id)

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          created_at: user.created_at,
          last_sign_in_at: user.last_sign_in_at
        },
        profile: profile || null,
        statistics: stats,
        folders: {
          total: folders?.length || 0,
          recent: folders?.slice(0, 5) || []
        },
        prompts: {
          total: prompts?.length || 0,
          recent: prompts?.slice(0, 5) || []
        },
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('User stats API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper function to get most used model
function getMostUsedModel(images: any[]): string {
  if (!images.length) return 'None'

  const modelCounts = images.reduce((acc, img) => {
    const model = img.model || 'Unknown'
    acc[model] = (acc[model] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return Object.entries(modelCounts)
    .sort(([,a], [,b]) => (b as number) - (a as number))[0]?.[0] || 'None'
}
