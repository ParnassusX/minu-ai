/**
 * User Settings API
 * Manage user-specific settings and preferences
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

    // Get user settings from profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('Error fetching profile:', profileError)
      return NextResponse.json(
        { error: 'Failed to fetch user settings' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        apiKeys: {
          replicate: profile.replicate_api_key ? '***' + profile.replicate_api_key.slice(-4) : null,
          gemini: profile.gemini_api_key ? '***' + profile.gemini_api_key.slice(-4) : null
        },
        preferences: {
          autoSave: profile.auto_save_generations || true,
          defaultModel: profile.default_model || 'flux-schnell',
          theme: profile.theme || 'system'
        },
        limits: {
          dailyGenerations: profile.daily_generation_limit || 50,
          monthlyBudget: profile.monthly_budget || 10.00
        }
      }
    })

  } catch (error) {
    console.error('User settings API error:', error)
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
    const { apiKeys, preferences, limits } = body

    // Update user profile with new settings
    const updateData: any = {}
    
    if (apiKeys?.replicate) {
      updateData.replicate_api_key = apiKeys.replicate
    }
    
    if (apiKeys?.gemini) {
      updateData.gemini_api_key = apiKeys.gemini
    }
    
    if (preferences?.autoSave !== undefined) {
      updateData.auto_save_generations = preferences.autoSave
    }
    
    if (preferences?.defaultModel) {
      updateData.default_model = preferences.defaultModel
    }
    
    if (preferences?.theme) {
      updateData.theme = preferences.theme
    }
    
    if (limits?.dailyGenerations) {
      updateData.daily_generation_limit = limits.dailyGenerations
    }
    
    if (limits?.monthlyBudget) {
      updateData.monthly_budget = limits.monthlyBudget
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', user.id)

    if (updateError) {
      console.error('Error updating profile:', updateError)
      return NextResponse.json(
        { error: 'Failed to update settings' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Settings updated successfully'
    })

  } catch (error) {
    console.error('User settings update API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
