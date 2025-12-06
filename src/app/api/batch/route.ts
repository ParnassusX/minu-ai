/**
 * Batch Processing API
 * Supports bulk image generation for e-commerce and product photography
 * Designed for stores needing 100+ products with 10 images each
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ALL_MODELS } from '@/components/generator-v2/lib/models'

// Batch job status types
export type BatchJobStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'paused' | 'cancelled'

// Batch job configuration
export interface BatchJobConfig {
  id: string
  name: string
  description?: string
  userId: string
  
  // Input products
  products: BatchProduct[]
  
  // Generation settings
  modelId: string
  templateId?: string
  imageTypesToGenerate: string[]
  
  // Processing options
  priority: 'low' | 'normal' | 'high'
  parallelism: number // How many concurrent generations
  retryOnFailure: boolean
  maxRetries: number
  
  // Output settings
  outputFormat: 'jpg' | 'png' | 'webp'
  outputQuality: number
  saveToGallery: boolean
  
  // Status
  status: BatchJobStatus
  progress: BatchProgress
  
  // Timestamps
  createdAt: string
  startedAt?: string
  completedAt?: string
}

export interface BatchProduct {
  id: string
  name: string
  referenceImages: string[] // URLs or base64
  metadata?: Record<string, any>
  customPrompts?: Record<string, string> // Override templates per image type
}

export interface BatchProgress {
  totalProducts: number
  completedProducts: number
  totalImages: number
  completedImages: number
  failedImages: number
  estimatedTimeRemaining?: number // seconds
  currentProductId?: string
  currentImageType?: string
}

// Image type template
export interface ImageTypeTemplate {
  id: string
  name: string
  description: string
  promptTemplate: string
  aspectRatio: string
  modelRecommendation?: string
  requiredInputs: ('product_image' | 'brand_logo' | 'background_image')[]
  category: 'hero' | 'lifestyle' | 'detail' | 'angle' | 'scale' | 'packaging' | 'feature' | 'brand'
}

// Default image type templates for e-commerce
const DEFAULT_IMAGE_TEMPLATES: ImageTypeTemplate[] = [
  {
    id: 'hero-main',
    name: 'Hero Main',
    description: 'Primary product image on white background',
    promptTemplate: 'Professional e-commerce product photography of {product_name}, centered on pure white background, soft studio lighting, high resolution, commercial quality',
    aspectRatio: '1:1',
    requiredInputs: ['product_image'],
    category: 'hero'
  },
  {
    id: 'hero-angled',
    name: 'Hero Angled',
    description: '45-degree angle hero shot',
    promptTemplate: '{product_name} photographed at elegant 45-degree angle, clean white background, professional studio lighting',
    aspectRatio: '1:1',
    requiredInputs: ['product_image'],
    category: 'hero'
  },
  {
    id: 'lifestyle-context',
    name: 'Lifestyle in Context',
    description: 'Product in natural usage setting',
    promptTemplate: '{product_name} shown in beautiful lifestyle setting, natural warm lighting, aspirational context, magazine quality',
    aspectRatio: '16:9',
    requiredInputs: ['product_image'],
    category: 'lifestyle'
  },
  {
    id: 'detail-texture',
    name: 'Detail - Texture',
    description: 'Close-up showing material texture',
    promptTemplate: 'Extreme macro close-up of {product_name}, showcasing material texture and craftsmanship, detailed product photography',
    aspectRatio: '1:1',
    requiredInputs: ['product_image'],
    category: 'detail'
  },
  {
    id: 'detail-feature',
    name: 'Detail - Key Feature',
    description: 'Highlight a key product feature',
    promptTemplate: 'Close-up highlighting the key feature of {product_name}, professional product detail shot, clean focus',
    aspectRatio: '4:3',
    requiredInputs: ['product_image'],
    category: 'detail'
  },
  {
    id: 'angle-side',
    name: 'Side View',
    description: 'Side profile of product',
    promptTemplate: 'Side profile view of {product_name}, pure white background, even studio lighting, product catalog style',
    aspectRatio: '4:3',
    requiredInputs: ['product_image'],
    category: 'angle'
  },
  {
    id: 'angle-back',
    name: 'Back View',
    description: 'Rear view of product',
    promptTemplate: 'Rear view of {product_name}, showing back details, white background, professional product photography',
    aspectRatio: '1:1',
    requiredInputs: ['product_image'],
    category: 'angle'
  },
  {
    id: 'scale-reference',
    name: 'Scale Reference',
    description: 'Show product size/scale',
    promptTemplate: '{product_name} with subtle scale reference showing actual size, clean composition, helpful sizing context',
    aspectRatio: '16:9',
    requiredInputs: ['product_image'],
    category: 'scale'
  },
  {
    id: 'packaging-box',
    name: 'With Packaging',
    description: 'Product with retail packaging',
    promptTemplate: '{product_name} elegantly displayed with its premium packaging, unboxing photography style, aspirational',
    aspectRatio: '4:3',
    requiredInputs: ['product_image'],
    category: 'packaging'
  },
  {
    id: 'brand-showcase',
    name: 'Brand Showcase',
    description: 'Product with brand elements',
    promptTemplate: '{product_name} in branded presentation, incorporating brand identity and logo, premium brand photography',
    aspectRatio: '1:1',
    requiredInputs: ['product_image', 'brand_logo'],
    category: 'brand'
  }
]

// GET: List batch jobs or get specific job
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }
    
    const { searchParams } = new URL(request.url)
    const jobId = searchParams.get('jobId')
    const includeTemplates = searchParams.get('templates') === 'true'
    
    if (jobId) {
      // Get specific job
      const { data: job, error } = await supabase
        .from('batch_jobs')
        .select('*')
        .eq('id', jobId)
        .eq('user_id', user.id)
        .single()
      
      if (error || !job) {
        return NextResponse.json({ success: false, error: 'Job not found' }, { status: 404 })
      }
      
      return NextResponse.json({
        success: true,
        job
      })
    }
    
    // List all jobs for user
    const { data: jobs, error } = await supabase
      .from('batch_jobs')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)
    
    return NextResponse.json({
      success: true,
      jobs: jobs || [],
      ...(includeTemplates ? {
        imageTemplates: DEFAULT_IMAGE_TEMPLATES,
        recommendedModels: ALL_MODELS.filter(m => 
          m.capabilities.supportsImageInput || m.id === 'nano-banana' || m.id.includes('kontext')
        ).map(m => ({
          id: m.id,
          name: m.name,
          costPerImage: m.pricing.costPerImage,
          averageTime: m.performance.averageTime,
          supportsMultipleImages: m.capabilities.supportsMultipleImages
        }))
      } : {})
    })
  } catch (error) {
    console.error('Batch GET error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// POST: Create new batch job
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }
    
    const body = await request.json()
    const {
      name,
      description,
      products,
      modelId = 'nano-banana', // Default to Nano Banana for product photography
      templateId,
      imageTypesToGenerate = DEFAULT_IMAGE_TEMPLATES.map(t => t.id),
      priority = 'normal',
      parallelism = 2,
      retryOnFailure = true,
      maxRetries = 3,
      outputFormat = 'jpg',
      outputQuality = 90,
      saveToGallery = true
    } = body
    
    // Validate inputs
    if (!name || !products || !Array.isArray(products) || products.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Name and at least one product are required'
      }, { status: 400 })
    }
    
    // Validate model exists
    const model = ALL_MODELS.find(m => m.id === modelId)
    if (!model) {
      return NextResponse.json({
        success: false,
        error: `Model ${modelId} not found`
      }, { status: 400 })
    }
    
    // Calculate estimated cost and time
    const totalImages = products.length * imageTypesToGenerate.length
    const estimatedCost = totalImages * (model.pricing.costPerImage || 0.01)
    const estimatedTime = totalImages * model.performance.averageTime / parallelism
    
    // Create batch job - using slice() instead of deprecated substr()
    const jobId = `batch_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`
    
    const newJob: Partial<BatchJobConfig> = {
      id: jobId,
      name,
      description,
      userId: user.id,
      products: products.map((p: any) => ({
        id: p.id || `product_${Math.random().toString(36).slice(2, 11)}`,
        name: p.name,
        referenceImages: p.referenceImages || [],
        metadata: p.metadata || {},
        customPrompts: p.customPrompts || {}
      })),
      modelId,
      templateId,
      imageTypesToGenerate,
      priority,
      parallelism,
      retryOnFailure,
      maxRetries,
      outputFormat,
      outputQuality,
      saveToGallery,
      status: 'pending',
      progress: {
        totalProducts: products.length,
        completedProducts: 0,
        totalImages,
        completedImages: 0,
        failedImages: 0,
        estimatedTimeRemaining: estimatedTime
      },
      createdAt: new Date().toISOString()
    }
    
    // Try to save to database
    // Note: The batch_jobs table may need to be created via migration
    // If table doesn't exist, job is returned but not persisted (in-memory only)
    let persisted = false
    try {
      const { error } = await supabase
        .from('batch_jobs')
        .insert({
          id: jobId,
          user_id: user.id,
          name,
          description,
          config: newJob,
          status: 'pending',
          created_at: new Date().toISOString()
        })
      
      if (error) {
        console.warn('Could not save batch job to database:', error.message)
      } else {
        persisted = true
      }
    } catch (dbError) {
      console.warn('Batch jobs table may not exist - job created in memory only:', dbError)
    }
    
    return NextResponse.json({
      success: true,
      job: newJob,
      persisted, // Indicates if job was saved to database
      estimates: {
        totalImages,
        estimatedCost: `$${estimatedCost.toFixed(2)}`,
        estimatedTimeMinutes: Math.ceil(estimatedTime / 60),
        costPerProduct: `$${(estimatedCost / products.length).toFixed(2)}`
      },
      imageTemplates: DEFAULT_IMAGE_TEMPLATES.filter(t => 
        imageTypesToGenerate.includes(t.id)
      ),
      message: `Batch job "${name}" created successfully. Ready to process ${products.length} products with ${imageTypesToGenerate.length} images each.${!persisted ? ' Note: Job not persisted - batch_jobs table may need migration.' : ''}`
    })
  } catch (error) {
    console.error('Batch POST error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// PATCH: Update batch job status (start, pause, resume, cancel)
export async function PATCH(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }
    
    const body = await request.json()
    const { jobId, action } = body
    
    if (!jobId || !action) {
      return NextResponse.json({
        success: false,
        error: 'Job ID and action are required'
      }, { status: 400 })
    }
    
    const validActions = ['start', 'pause', 'resume', 'cancel']
    if (!validActions.includes(action)) {
      return NextResponse.json({
        success: false,
        error: `Invalid action. Must be one of: ${validActions.join(', ')}`
      }, { status: 400 })
    }
    
    // Map action to status
    const statusMap: Record<string, BatchJobStatus> = {
      start: 'processing',
      pause: 'paused',
      resume: 'processing',
      cancel: 'cancelled'
    }
    
    const newStatus = statusMap[action]
    
    // Update in database
    try {
      const { error } = await supabase
        .from('batch_jobs')
        .update({ 
          status: newStatus,
          ...(action === 'start' ? { started_at: new Date().toISOString() } : {}),
          ...(action === 'cancel' ? { completed_at: new Date().toISOString() } : {})
        })
        .eq('id', jobId)
        .eq('user_id', user.id)
      
      if (error) {
        console.warn('Could not update batch job:', error.message)
      }
    } catch (dbError) {
      console.warn('Database update failed:', dbError)
    }
    
    return NextResponse.json({
      success: true,
      jobId,
      action,
      newStatus,
      message: `Batch job ${jobId} ${action}ed successfully`
    })
  } catch (error) {
    console.error('Batch PATCH error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
