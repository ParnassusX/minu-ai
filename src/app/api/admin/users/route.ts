/**
 * Admin Users API
 * Manage users (admin only)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

async function checkAdminAccess(supabase: any, user: any) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
    
  return profile?.role === 'admin'
}

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

    // Check admin access
    const isAdmin = await checkAdminAccess(supabase, user)
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    // Get all users with their profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError)
      return NextResponse.json(
        { error: 'Failed to fetch users' },
        { status: 500 }
      )
    }

    // Get generation counts for each user
    const usersWithStats = await Promise.all(
      profiles.map(async (profile) => {
        const { data: generations } = await supabase
          .from('generations')
          .select('id, cost, created_at')
          .eq('user_id', profile.id)

        const totalGenerations = generations?.length || 0
        const totalCost = generations?.reduce((sum, gen) => sum + (gen.cost || 0), 0) || 0
        
        // Get this month's activity
        const thisMonth = new Date()
        thisMonth.setDate(1)
        thisMonth.setHours(0, 0, 0, 0)
        
        const thisMonthGenerations = generations?.filter(gen => 
          new Date(gen.created_at) >= thisMonth
        ).length || 0

        return {
          ...profile,
          stats: {
            totalGenerations,
            totalCost,
            thisMonthGenerations,
            lastActive: generations?.[0]?.created_at || profile.created_at
          }
        }
      })
    )

    return NextResponse.json({
      success: true,
      data: {
        users: usersWithStats,
        totalUsers: usersWithStats.length,
        activeUsers: usersWithStats.filter(u => u.stats.thisMonthGenerations > 0).length
      }
    })

  } catch (error) {
    console.error('Admin users API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
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

    // Check admin access
    const isAdmin = await checkAdminAccess(supabase, user)
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { userId, updates } = body

    // Update user profile
    const { error: updateError } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)

    if (updateError) {
      console.error('Error updating user:', updateError)
      return NextResponse.json(
        { error: 'Failed to update user' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'User updated successfully'
    })

  } catch (error) {
    console.error('Admin user update API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
