import { NextRequest, NextResponse } from 'next/server'
import { getUnifiedStorageService } from '@/lib/storage/unifiedStorage'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { url, metadata } = body

    if (!url || !metadata) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: url and metadata'
      }, { status: 400 })
    }

    console.log('Unified storage upload request:', { url, metadata })

    const storageService = getUnifiedStorageService()
    const result = await storageService.storeFromUrl(url, metadata)

    console.log('Unified storage result:', result)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Unified storage error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
