import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const config = {
      cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
      hasApiKey: !!process.env.CLOUDINARY_API_KEY,
      hasApiSecret: !!process.env.CLOUDINARY_API_SECRET,
      apiKeyLength: process.env.CLOUDINARY_API_KEY?.length || 0,
      apiSecretLength: process.env.CLOUDINARY_API_SECRET?.length || 0
    }

    return NextResponse.json({
      success: true,
      config,
      allEnvVars: Object.keys(process.env).filter(key => key.includes('CLOUDINARY'))
    })
  } catch (error) {
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
