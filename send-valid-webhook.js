const crypto = require('crypto');

async function main() {
  const secret = process.env.REPLICATE_WEBHOOK_SECRET;
  if (!secret) {
    console.error('Missing REPLICATE_WEBHOOK_SECRET in environment');
    process.exit(1);
  }
  const base = process.env.BASE_URL || 'http://localhost:4000';

  // Minimal realistic payload (matches what our handler expects)
  const payload = {
    id: 'local-test-' + Date.now(),
    status: 'succeeded',
    output: ['https://replicate.delivery/pbxt/test-image.jpg'],
    input: { prompt: 'webhook-valid-test', model: 'flux-schnell' },
    model: 'black-forest-labs/flux-schnell',
    version: 'local-test-version',
    created_at: new Date().toISOString(),
    completed_at: new Date().toISOString()
  };

  const body = JSON.stringify(payload);
  const h = crypto.createHmac('sha256', secret);
  h.update(body);
  const sig = h.digest('hex');

  const res = await fetch(`${base}/api/replicate/webhook`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-replicate-signature': sig },
    body
  });

  console.log('Valid webhook POST status:', res.status);
  try { console.log('Body:', await res.text()); } catch {}
}

main().catch(err => { console.error(err); process.exit(1); });
