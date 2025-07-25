import { NextRequest, NextResponse } from 'next/server'
import { getCloudinaryStorageService } from '@/lib/storage/cloudinaryStorage'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { url } = body

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      )
    }

    // Test the Cloudinary storage service directly
    const cloudinaryService = getCloudinaryStorageService()
    
    const metadata = {
      originalUrl: url,
      filename: 'test-image.jpg',
      mimeType: 'image/jpeg',
      generatedAt: new Date().toISOString(),
      modelUsed: 'test-model',
      prompt: 'Test prompt for direct upload'
    }

    console.log('Testing Cloudinary storage service directly...')
    
    const result = await cloudinaryService.storeFromUrl(url, metadata)
    
    console.log('Direct Cloudinary storage result:', result)

    return NextResponse.json({
      success: result.success,
      data: result.data,
      error: result.error
    })
  } catch (error) {
    console.error('Direct Cloudinary test error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Test failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
