import { NextRequest, NextResponse } from 'next/server'
import { UnifiedStorageService } from '@/lib/storage/unifiedStorage'
import { createClient } from '@/lib/supabase/server'
import crypto from 'crypto'

// Verify HMAC-SHA256 signature from Replicate using raw body
async function verifySignature(request: NextRequest, rawBody: ArrayBuffer): Promise<boolean> {
  const secret = process.env.REPLICATE_WEBHOOK_SECRET
  if (!secret) {
    // In production, require a secret; in development, allow missing for convenience
    return process.env.NODE_ENV !== 'production'
  }

  const signature = request.headers.get('x-replicate-signature') || request.headers.get('replicate-signature')
  if (!signature) return false

  const hmac = crypto.createHmac('sha256', secret)
  hmac.update(Buffer.from(rawBody))
  const digest = hmac.digest('hex')
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest))
}

export async function POST(request: NextRequest) {
  try {
    // Read raw body first for signature verification
    const raw = await request.arrayBuffer()
    const isValid = await verifySignature(request, raw)
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const payload = JSON.parse(Buffer.from(raw).toString('utf-8'))
    // Replicate webhook payloads include id, status, output, input, model, etc.
    const { id, status, output, input, model } = payload

    // Minimal log without PII
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

      // First try direct URL storage (fast path)
      let stored = await unifiedStorage.storeFromUrl(url, {
        originalUrl: url,
        filename: `${id}_${i}.${isVideo ? 'mp4' : 'jpg'}`,
        mimeType: isVideo ? 'video/mp4' : 'image/jpeg',
        generatedAt: new Date().toISOString(),
        modelUsed: model || input?.model || 'unknown',
        prompt: input?.prompt || '',
        userId: userId || undefined
      })

      // If replicate.delivery requires auth or direct fetch failed, download with Replicate token and store buffer
      const needsAuthFetch = !stored.success || url.includes('replicate.delivery')
      if (needsAuthFetch && process.env.REPLICATE_API_TOKEN) {
        try {
          const res = await fetch(url, {
            headers: { Authorization: `Bearer ${process.env.REPLICATE_API_TOKEN}` }
          })
          if (res.ok) {
            const arrayBuf = await res.arrayBuffer()
            const buffer = Buffer.from(arrayBuf)
            stored = await unifiedStorage.storeBuffer(buffer, {
              originalUrl: url,
              filename: `${id}_${i}.${isVideo ? 'mp4' : 'jpg'}`,
              mimeType: isVideo ? 'video/mp4' : 'image/jpeg',
              generatedAt: new Date().toISOString(),
              modelUsed: model || input?.model || 'unknown',
              prompt: input?.prompt || '',
              userId: userId || undefined
            })
          }
        } catch (e) {
          console.warn('⚠️ Authenticated fetch from replicate.delivery failed:', e)
        }
      }

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

