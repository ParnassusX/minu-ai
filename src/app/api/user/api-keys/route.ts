/**
 * API Key Management System
 * Secure management of user API keys for external services
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import crypto from 'crypto'

// Validation schemas
const createApiKeySchema = z.object({
  name: z.string().min(1).max(100),
  service: z.enum(['replicate', 'openai', 'gemini', 'cloudinary']),
  key: z.string().min(1),
  description: z.string().max(500).optional()
})

const updateApiKeySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  is_active: z.boolean().optional()
})

// Encryption functions (in production, use proper key management)
function encryptApiKey(key: string): string {
  const algorithm = 'aes-256-gcm'
  const secretKey = process.env.API_KEY_ENCRYPTION_SECRET || 'default-secret-key-change-in-production'
  const iv = crypto.randomBytes(16)
  
  const cipher = crypto.createCipher(algorithm, secretKey)
  let encrypted = cipher.update(key, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  
  return `${iv.toString('hex')}:${encrypted}`
}

function decryptApiKey(encryptedKey: string): string {
  const algorithm = 'aes-256-gcm'
  const secretKey = process.env.API_KEY_ENCRYPTION_SECRET || 'default-secret-key-change-in-production'
  
  const [ivHex, encrypted] = encryptedKey.split(':')
  const iv = Buffer.from(ivHex, 'hex')
  
  const decipher = crypto.createDecipher(algorithm, secretKey)
  let decrypted = decipher.update(encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  
  return decrypted
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

    // For now, we'll store API keys in the user's profile preferences
    // In production, you'd want a separate encrypted table
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('preferences')
      .eq('id', user.id)
      .single()

    if (profileError) {
      return NextResponse.json(
        { error: 'Failed to fetch API keys' },
        { status: 500 }
      )
    }

    const apiKeys = profile?.preferences?.apiKeys || []
    
    // Return API keys with masked values for security
    const maskedApiKeys = apiKeys.map((key: any) => ({
      id: key.id,
      name: key.name,
      service: key.service,
      description: key.description,
      is_active: key.is_active,
      masked_key: maskApiKey(key.service),
      created_at: key.created_at,
      last_used: key.last_used
    }))

    return NextResponse.json({
      success: true,
      data: maskedApiKeys
    })

  } catch (error) {
    console.error('API Keys GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
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
    const validationResult = createApiKeySchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Invalid input',
          details: validationResult.error.errors
        },
        { status: 400 }
      )
    }

    const { name, service, key, description } = validationResult.data

    // Validate API key format based on service
    if (!validateApiKeyFormat(service, key)) {
      return NextResponse.json(
        { error: `Invalid ${service} API key format` },
        { status: 400 }
      )
    }

    // Get current profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('preferences')
      .eq('id', user.id)
      .single()

    if (profileError) {
      return NextResponse.json(
        { error: 'Failed to fetch profile' },
        { status: 500 }
      )
    }

    const currentApiKeys = profile?.preferences?.apiKeys || []
    
    // Check if service already has an API key
    const existingKeyIndex = currentApiKeys.findIndex((k: any) => k.service === service)
    
    const newApiKey = {
      id: crypto.randomUUID(),
      name,
      service,
      encrypted_key: encryptApiKey(key),
      description: description || '',
      is_active: true,
      created_at: new Date().toISOString(),
      last_used: null
    }

    let updatedApiKeys
    if (existingKeyIndex >= 0) {
      // Replace existing key
      updatedApiKeys = [...currentApiKeys]
      updatedApiKeys[existingKeyIndex] = newApiKey
    } else {
      // Add new key
      updatedApiKeys = [...currentApiKeys, newApiKey]
    }

    // Update profile with new API keys
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        preferences: {
          ...profile.preferences,
          apiKeys: updatedApiKeys
        },
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('Error updating API keys:', updateError)
      return NextResponse.json(
        { error: 'Failed to save API key' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        id: newApiKey.id,
        name: newApiKey.name,
        service: newApiKey.service,
        description: newApiKey.description,
        masked_key: maskApiKey(service),
        is_active: newApiKey.is_active,
        created_at: newApiKey.created_at
      },
      message: `${service} API key ${existingKeyIndex >= 0 ? 'updated' : 'added'} successfully`
    })

  } catch (error) {
    console.error('API Keys POST error:', error)
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

    const { searchParams } = new URL(request.url)
    const keyId = searchParams.get('id')
    
    if (!keyId) {
      return NextResponse.json(
        { error: 'API key ID required' },
        { status: 400 }
      )
    }

    // Get current profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('preferences')
      .eq('id', user.id)
      .single()

    if (profileError) {
      return NextResponse.json(
        { error: 'Failed to fetch profile' },
        { status: 500 }
      )
    }

    const currentApiKeys = profile?.preferences?.apiKeys || []
    const updatedApiKeys = currentApiKeys.filter((key: any) => key.id !== keyId)

    if (updatedApiKeys.length === currentApiKeys.length) {
      return NextResponse.json(
        { error: 'API key not found' },
        { status: 404 }
      )
    }

    // Update profile
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        preferences: {
          ...profile.preferences,
          apiKeys: updatedApiKeys
        },
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to delete API key' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'API key deleted successfully'
    })

  } catch (error) {
    console.error('API Keys DELETE error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper functions
function validateApiKeyFormat(service: string, key: string): boolean {
  switch (service) {
    case 'replicate':
      return key.startsWith('r8_') && key.length > 10
    case 'openai':
      return key.startsWith('sk-') && key.length > 20
    case 'gemini':
      return key.startsWith('AIza') && key.length > 30
    case 'cloudinary':
      return key.length > 10 // Basic validation
    default:
      return false
  }
}

function maskApiKey(service: string): string {
  switch (service) {
    case 'replicate':
      return 'r8_••••••••••••••••••••••••••••••••••••••••'
    case 'openai':
      return 'sk-••••••••••••••••••••••••••••••••••••••••••••••••'
    case 'gemini':
      return 'AIza••••••••••••••••••••••••••••••••••••••'
    case 'cloudinary':
      return '••••••••••••••••••••••••••••••••••••••••'
    default:
      return '••••••••••••••••••••••••••••••••••••••••'
  }
}
