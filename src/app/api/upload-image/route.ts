import { NextRequest, NextResponse } from 'next/server'
import { getCloudinaryStorageService } from '@/lib/storage/cloudinaryStorage'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 })
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 })
    }

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer())

    // Upload to Cloudinary
    const cloudinaryService = getCloudinaryStorageService()
    const result = await cloudinaryService.storeBuffer(buffer, {
      originalUrl: '',
      filename: file.name,
      mimeType: file.type,
      generatedAt: new Date().toISOString(),
      modelUsed: 'user-upload',
      prompt: 'User uploaded image'
    })

    if (!result.success || !result.data) {
      return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      url: result.data.secureUrl,
      publicId: result.data.publicId,
      width: result.data.metadata.width,
      height: result.data.metadata.height
    })

  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
