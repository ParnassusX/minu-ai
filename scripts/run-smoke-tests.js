#!/usr/bin/env node
/*
  Minu.AI - Comprehensive smoke tests for 7 models (dev fallback)
  - Uses real Replicate API calls
  - Polls completion
  - Attempts storage verification via Supabase REST (service role key from .env.local)
*/

const fs = require('fs')
const path = require('path')

const LOCAL_BASE = 'http://localhost:4000'
const API_GENERATE = `${LOCAL_BASE}/api/generate-v2`

function parseEnv() {
  const envPath = path.join(process.cwd(), '.env.local')
  const content = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : ''
  const get = (key) => {
    const m = content.match(new RegExp(`^${key}=(.*)$`, 'm'))
    if (!m) return undefined
    // strip quotes if present
    return m[1].trim().replace(/^"|^'|"$|'$/g, '')
  }
  return {
    REPLICATE_API_TOKEN: process.env.REPLICATE_API_TOKEN || get('REPLICATE_API_TOKEN'),
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || get('NEXT_PUBLIC_SUPABASE_URL'),
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || get('SUPABASE_SERVICE_ROLE_KEY'),
  }
}

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

async function postJSON(url, body) {
  const res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
  const text = await res.text()
  let json
  try { json = JSON.parse(text) } catch { json = { raw: text } }
  return { status: res.status, json }
}

async function pollReplicate(predictionId, token, maxMs = 6 * 60 * 1000) {
  if (!predictionId) return { status: 'unknown' }
  const start = Date.now()
  while (Date.now() - start < maxMs) {
    const res = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
      headers: { Authorization: `Token ${token}` }
    })
    const j = await res.json()
    const s = j.status
    if (['succeeded', 'failed', 'canceled'].includes(s)) return j
    await sleep(5000)
  }
  return { status: 'timeout' }
}

async function querySupabaseImagesLikeUrl(supabaseUrl, serviceKey, like) {
  if (!supabaseUrl || !serviceKey) return { ok: false, rows: [], error: 'Missing Supabase config' }
  const url = `${supabaseUrl}/rest/v1/images?select=id,file_path,model,original_prompt,created_at&file_path=ilike.*${encodeURIComponent(like)}*`
  const res = await fetch(url, { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` } })
  if (!res.ok) return { ok: false, rows: [], error: `HTTP ${res.status}` }
  const rows = await res.json()
  return { ok: true, rows }
}

async function main() {
  const env = parseEnv()
  if (!env.REPLICATE_API_TOKEN) {
    console.error('Missing REPLICATE_API_TOKEN')
    process.exit(1)
  }

  const prompt = 'studio-quality product photo on marble, soft light'
  const img = 'https://picsum.photos/seed/minuai/1024/1024'
  const multi = ['https://picsum.photos/id/237/1024/1024','https://picsum.photos/id/1025/1024/1024']

  const tests = [
    { name: 'flux-schnell', model: 'black-forest-labs/flux-schnell', input: { prompt, output_format: 'jpg' } },
    { name: 'flux-kontext-pro', model: 'black-forest-labs/flux-kontext-pro', input: { prompt, image: img } },
    { name: 'flux-kontext-max', model: 'black-forest-labs/flux-kontext-max', input: { prompt, image: img } },
    { name: 'seedream-3', model: 'bytedance/seedream-3', input: { prompt, output_format: 'jpg' } },
    { name: 'gemini-2.5-flash-image', model: 'google/gemini-2.5-flash-image', input: { prompt, output_format: 'jpg' } },
    { name: 'nano-banana', model: 'google/nano-banana', input: { prompt, image_input: multi } },
    { name: 'qwen-image-edit', model: 'qwen/qwen-image-edit', input: { prompt, image: img } },
  ]

  const results = []

  console.log('Creating predictions...')
  for (const t of tests) {
    const { status, json } = await postJSON(API_GENERATE, { model: t.model, mode: 'images', input: t.input })
    const id = json?.data?.id
    results.push({ ...t, createStatus: status, predictionId: id, createError: id ? null : json?.error || json })
    console.log(`${t.name}: create ${status} ${id || ''}`)
  }

  console.log('\nPolling predictions on Replicate...')
  for (const r of results) {
    if (!r.predictionId) { r.final = { status: 'not-created' }; continue }
    const fin = await pollReplicate(r.predictionId, env.REPLICATE_API_TOKEN)
    r.final = { status: fin.status, outputCount: Array.isArray(fin.output) ? fin.output.length : (fin.output ? 1 : 0), output: fin.output || null, predict_time: fin.metrics?.predict_time }
    console.log(`${r.name}: ${r.predictionId} -> ${r.final.status} (${r.final.outputCount} outputs)`)    
  }

  console.log('\nVerifying storage via Supabase (file_path ilike *predictionId*)...')
  for (const r of results) {
    if (!r.predictionId) { r.gallery = { ok: false, rows: [] }; continue }
    const q = await querySupabaseImagesLikeUrl(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, r.predictionId)
    r.gallery = q
    console.log(`${r.name}: gallery rows ${q.rows.length}`)
  }

  console.log('\nSUMMARY JSON:')
  console.log(JSON.stringify(results, null, 2))

  // Also print a compact table-like report
  console.log('\nModel,Create,PredictionId,FinalStatus,Outputs,GalleriaRows,PredictTime')
  for (const r of results) {
    console.log([r.name, r.createStatus, r.predictionId || '-', r.final?.status || '-', r.final?.outputCount ?? '-', r.gallery?.rows?.length ?? '-', r.final?.predict_time ?? '-'].join(','))
  }
}

main().catch(e => { console.error(e); process.exit(1) })

