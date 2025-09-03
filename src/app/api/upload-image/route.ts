import { NextRequest, NextResponse } from 'next/server'
import { UnifiedStorageService } from '@/lib/storage/unifiedStorage'

export async function POST(request: NextRequest) {
  try {
    console.log('📤 Starting image upload...')

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      console.error('❌ No file provided')
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    console.log('📋 File details:', {
      name: file.name,
      type: file.type,
      size: file.size
    })

    // Validate file type
    if (!file.type.startsWith('image/')) {
      console.error('❌ Invalid file type:', file.type)
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 })
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      console.error('❌ File too large:', file.size)
      return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 })
    }

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer())
    console.log('✅ File converted to buffer, size:', buffer.length)

    // For input images, use temporary Supabase storage only (not permanent Cloudinary)
    // This ensures input images are not stored permanently, only results are
    const unifiedStorage = new UnifiedStorageService()
    const result = await unifiedStorage.storeBufferTemporary(buffer, {
      originalUrl: '',
      filename: file.name,
      mimeType: file.type,
      generatedAt: new Date().toISOString(),
      modelUsed: 'user-upload',
      prompt: 'User uploaded image (temporary)'
    })

    console.log('📤 Upload result:', {
      success: result.success,
      provider: result.data?.provider,
      persistent: result.data?.persistent
    })

    if (!result.success || !result.data) {
      console.error('❌ Upload failed:', result.error)
      return NextResponse.json({ error: result.error || 'Upload failed' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      url: result.data.secureUrl || result.data.url,
      publicId: result.data.publicId,
      path: result.data.path,
      provider: result.data.provider,
      persistent: result.data.persistent,
      width: result.data.metadata.width,
      height: result.data.metadata.height
    })

  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
