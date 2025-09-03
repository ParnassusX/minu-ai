import { NextRequest, NextResponse } from 'next/server'
import { UnifiedStorageService } from '@/lib/storage/unifiedStorage'
import { createClient } from '@/lib/supabase/server'

// Simple signature verification (optional): Replicate supports webhook secret
function verifySignature(request: NextRequest): boolean {
  const expected = process.env.REPLICATE_WEBHOOK_SECRET
  if (!expected) return true // allow if not configured
  const received = request.headers.get('replicate-signature') || request.headers.get('x-replicate-signature')
  return !!received && received === expected
}

export async function POST(request: NextRequest) {
  try {
    if (!verifySignature(request)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const payload = await request.json()
    // Replicate webhook payloads include id, status, output, input, model, etc.
    const { id, status, output, input, model } = payload

    console.log('🔔 Replicate webhook received:', { id, status, hasOutput: !!output })

    if (status !== 'succeeded' || !output) {
      return NextResponse.json({ success: true })
    }

    const urls: string[] = Array.isArray(output) ? output : [output]
    const unifiedStorage = new UnifiedStorageService()
    const supabase = createClient()

    // Try to extract userId from input if passed
    const userId = input?.userId || input?.user_id || null

    const savedItems: any[] = []

    for (let i = 0; i < urls.length; i++) {
      const url = urls[i]
      const isVideo = (input?.output_format || '').toLowerCase() === 'mp4' || input?.mode === 'video'

      const stored = await unifiedStorage.storeFromUrl(url, {
        originalUrl: url,
        filename: `${id}_${i}.${isVideo ? 'mp4' : 'jpg'}`,
        mimeType: isVideo ? 'video/mp4' : 'image/jpeg',
        generatedAt: new Date().toISOString(),
        modelUsed: model || input?.model || 'unknown',
        prompt: input?.prompt || '',
        userId: userId || undefined
      })

      if (!stored.success || !stored.data) {
        console.warn('⚠️ Webhook storage failed for URL:', url)
        continue
      }

      if (userId) {
        const { data, error } = await supabase
          .from('images')
          .insert({
            user_id: userId,
            original_prompt: input?.prompt || '',
            file_path: stored.data.secureUrl || stored.data.url,
            model: model || input?.model || 'unknown',
            parameters: input || {},
            width: stored.data.metadata.width || 1024,
            height: stored.data.metadata.height || 1024,
            cost: null,
            generation_time: null,
            tags: [],
            is_favorite: false,
            folder_id: null
          })
          .select()
          .single()

        if (error) {
          console.error('❌ Webhook gallery insert failed:', error)
        } else {
          savedItems.push(data)
        }
      }
    }

    return NextResponse.json({ success: true, saved: savedItems.length })
  } catch (error) {
    console.error('❌ Webhook error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

