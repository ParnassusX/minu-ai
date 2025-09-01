import { test, expect, request } from '@playwright/test'

// This test simulates a Replicate webhook POST and verifies storage handler responds OK.
// It does not check DB side-effects (requires test DB); it validates handler path and signature.

test('replicate webhook accepts completed payload and returns success', async ({ request }) => {
  const payload = {
    id: 'pred_test_123',
    status: 'succeeded',
    output: ['https://replicate.delivery/pbxt/sample.jpg'],
    input: {
      prompt: 'a cat',
      output_format: 'jpg',
      mode: 'images',
      userId: 'test-user-id'
    },
    model: 'black-forest-labs/flux-schnell'
  }

  const headers: Record<string, string> = {
    'content-type': 'application/json'
  }

  // If secret configured, include it
  if (process.env.REPLICATE_WEBHOOK_SECRET) {
    headers['replicate-signature'] = process.env.REPLICATE_WEBHOOK_SECRET
  }

  const res = await request.post('/api/replicate/webhook', {
    headers,
    data: payload
  })

  expect(res.ok()).toBeTruthy()
  const json = await res.json()
  expect(json.success).toBeTruthy()
})

