import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAuthenticatedUser } from '@/lib/auth/server'

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

    const supabase = createClient()
    
    // Get user settings from database
    const { data: settings, error: dbError } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (dbError && dbError.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('Database error fetching settings:', dbError)
      return NextResponse.json(
        { error: 'Failed to fetch settings' },
        { status: 500 }
      )
    }

    // Return settings or defaults if none exist
    const userSettings = settings || {
      replicateApiKey: '',
      geminiApiKey: '',
      defaultModel: 'flux-schnell',
      imageQuality: 'standard',
      autoSave: true,
      notificationPreferences: {
        email: true,
        generation: true,
        errors: true
      }
    }

    return NextResponse.json(userSettings)
  } catch (error) {
    console.error('Error fetching settings:', error)
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
    const {
      replicateApiKey,
      geminiApiKey,
      defaultModel,
      imageQuality,
      autoSave,
      notificationPreferences
    } = body

    // Basic validation
    if (defaultModel && !['flux-schnell', 'flux-dev', 'sdxl'].includes(defaultModel)) {
      return NextResponse.json(
        { error: 'Invalid default model' },
        { status: 400 }
      )
    }

    if (imageQuality && !['standard', 'high', 'luxury'].includes(imageQuality)) {
      return NextResponse.json(
        { error: 'Invalid image quality setting' },
        { status: 400 }
      )
    }

    const supabase = createClient()

    // Prepare settings data
    const settingsData = {
      user_id: user.id,
      replicate_api_key: replicateApiKey || null,
      gemini_api_key: geminiApiKey || null,
      default_model: defaultModel || 'flux-schnell',
      image_quality: imageQuality || 'standard',
      auto_save: autoSave ?? true,
      notification_preferences: notificationPreferences || {
        email: true,
        generation: true,
        errors: true
      },
      updated_at: new Date().toISOString()
    }

    // Upsert settings (insert or update)
    const { data: savedSettings, error: dbError } = await supabase
      .from('user_settings')
      .upsert(settingsData, {
        onConflict: 'user_id',
        ignoreDuplicates: false
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database error saving settings:', dbError)
      return NextResponse.json(
        { error: 'Failed to save settings' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      settings: savedSettings
    })
  } catch (error) {
    console.error('Error saving settings:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
