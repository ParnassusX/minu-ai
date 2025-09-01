/**
 * User Profile Management API
 * Complete CRUD operations for user profiles
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

// Validation schemas
const updateProfileSchema = z.object({
  full_name: z.string().min(1).max(100).optional(),
  preferences: z.object({
    theme: z.enum(['light', 'dark', 'system']).optional(),
    defaultModel: z.string().optional(),
    autoSave: z.boolean().optional(),
    notifications: z.object({
      email: z.boolean().optional(),
      push: z.boolean().optional(),
      marketing: z.boolean().optional()
    }).optional(),
    privacy: z.object({
      profileVisible: z.boolean().optional(),
      showActivity: z.boolean().optional()
    }).optional()
  }).optional()
})

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

    if (profileError) {
      // If profile doesn't exist, create one
      if (profileError.code === 'PGRST116') {
        const newProfile = {
          id: user.id,
          email: user.email || '',
          full_name: user.user_metadata?.full_name || null,
          role: 'user',
          preferences: {
            theme: 'dark',
            defaultModel: 'flux-schnell',
            autoSave: true,
            notifications: {
              email: true,
              push: false,
              marketing: false
            },
            privacy: {
              profileVisible: false,
              showActivity: false
            }
          }
        }

        const { data: createdProfile, error: createError } = await supabase
          .from('profiles')
          .insert(newProfile)
          .select()
          .single()

        if (createError) {
          console.error('Error creating profile:', createError)
          return NextResponse.json(
            { error: 'Failed to create profile' },
            { status: 500 }
          )
        }

        return NextResponse.json({
          success: true,
          data: createdProfile
        })
      }

      console.error('Error fetching profile:', profileError)
      return NextResponse.json(
        { error: 'Failed to fetch profile' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: profile
    })

  } catch (error) {
    console.error('Profile GET error:', error)
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

    const body = await request.json()
    
    // Validate input
    const validationResult = updateProfileSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Invalid input',
          details: validationResult.error.errors
        },
        { status: 400 }
      )
    }

    const updateData = {
      ...validationResult.data,
      updated_at: new Date().toISOString()
    }

    // Update profile
    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', user.id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating profile:', updateError)
      return NextResponse.json(
        { error: 'Failed to update profile' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: updatedProfile,
      message: 'Profile updated successfully'
    })

  } catch (error) {
    console.error('Profile PUT error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
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

    // This is a dangerous operation - in production, you might want to:
    // 1. Soft delete (mark as deleted)
    // 2. Require additional confirmation
    // 3. Have admin approval
    // 4. Export user data first

    const { error: deleteError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', user.id)

    if (deleteError) {
      console.error('Error deleting profile:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete profile' },
        { status: 500 }
      )
    }

    // Also delete user account from auth
    const { error: authDeleteError } = await supabase.auth.admin.deleteUser(user.id)
    
    if (authDeleteError) {
      console.error('Error deleting user account:', authDeleteError)
      // Profile is deleted but auth account remains - this is recoverable
    }

    return NextResponse.json({
      success: true,
      message: 'Profile deleted successfully'
    })

  } catch (error) {
    console.error('Profile DELETE error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
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

    const body = await request.json()
    const { action, ...data } = body

    switch (action) {
      case 'update_preferences':
        const { data: updatedProfile, error: updateError } = await supabase
          .from('profiles')
          .update({ 
            preferences: data.preferences,
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id)
          .select()
          .single()

        if (updateError) {
          return NextResponse.json(
            { error: 'Failed to update preferences' },
            { status: 500 }
          )
        }

        return NextResponse.json({
          success: true,
          data: updatedProfile,
          message: 'Preferences updated successfully'
        })

      case 'reset_preferences':
        const defaultPreferences = {
          theme: 'dark',
          defaultModel: 'flux-schnell',
          autoSave: true,
          notifications: {
            email: true,
            push: false,
            marketing: false
          },
          privacy: {
            profileVisible: false,
            showActivity: false
          }
        }

        const { data: resetProfile, error: resetError } = await supabase
          .from('profiles')
          .update({ 
            preferences: defaultPreferences,
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id)
          .select()
          .single()

        if (resetError) {
          return NextResponse.json(
            { error: 'Failed to reset preferences' },
            { status: 500 }
          )
        }

        return NextResponse.json({
          success: true,
          data: resetProfile,
          message: 'Preferences reset to defaults'
        })

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('Profile PATCH error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
