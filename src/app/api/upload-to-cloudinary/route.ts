import { NextRequest, NextResponse } from 'next/server'

// Use dynamic import for cloudinary to avoid SSR issues
async function getCloudinary() {
  const { v2: cloudinary } = await import('cloudinary')

  cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
  })

  return cloudinary
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { url, folder, public_id, context } = body

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      )
    }

    // Get Cloudinary instance
    const cloudinary = await getCloudinary()

    // Upload to Cloudinary using SDK
    console.log('Attempting Cloudinary upload:', {
      url,
      folder: folder || 'minu-ai',
      public_id,
      cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
    })

    const result = await cloudinary.uploader.upload(url, {
      folder: folder || 'minu-ai',
      public_id: public_id,
      context: context,
      resource_type: 'auto',
      quality: 'auto:best',
      // Remove format: 'auto' as it's invalid - let Cloudinary auto-detect
    })

    console.log('Cloudinary upload successful:', {
      public_id: result.public_id,
      secure_url: result.secure_url,
      width: result.width,
      height: result.height
    })

    return NextResponse.json({
      success: true,
      public_id: result.public_id,
      url: result.secure_url,
      secure_url: result.secure_url,
      width: result.width,
      height: result.height,
      format: result.format,
      resource_type: result.resource_type,
      created_at: result.created_at,
    })
  } catch (error) {
    console.error('Cloudinary upload error:', error)
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
      hasApiKey: !!process.env.CLOUDINARY_API_KEY,
      hasApiSecret: !!process.env.CLOUDINARY_API_SECRET
    })
    return NextResponse.json(
      {
        success: false,
        error: 'Upload failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
