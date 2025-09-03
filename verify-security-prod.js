const { chromium } = require('playwright');
const crypto = require('crypto');

(async () => {
  const results = { headers: {}, svg: {}, webhook: {}, rateLimit: {}, pii: {}, webhookRequirement: {}, e2e: {} };
  const base = 'http://localhost:4000';

  // 1) Build already run. Server assumed started via `npx next start -p 4000`

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // 2) Security Configuration Verification
    // 2a) API headers Cache-Control
    const healthResp = await page.request.get(`${base}/api/health`);
    results.headers.status = healthResp.status();
    results.headers.cacheControl = healthResp.headers()['cache-control'] || healthResp.headers()['Cache-Control'];

    // 2b) SVG disabled check via Next Image optimizer route
    const svgUrl = encodeURIComponent('https://example.com/test.svg');
    const imgResp = await page.request.get(`${base}/_next/image?url=${svgUrl}&w=64&q=75`);
    results.svg.status = imgResp.status();

    // 2c) Webhook signature verification (invalid signature should 401)
    const payload = { id: 'test', status: 'succeeded', output: ['https://example.com/a.jpg'], input: { prompt: 'x' }, model: 'replicate/test' };
    const body = JSON.stringify(payload);
    const badSigResp = await page.request.post(`${base}/api/replicate/webhook`, {
      headers: { 'content-type': 'application/json', 'x-replicate-signature': 'invalid' },
      data: body
    });
    results.webhook.invalidStatus = badSigResp.status();

    // 3) Authentication and rate limiting
    // Login
    await page.goto(`${base}/auth/login`, { waitUntil: 'networkidle' });
    await page.fill('#email', 'test@minu.ai');
    await page.fill('#password', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/generator', { timeout: 15000 }).catch(() => {});
    results.e2e.postLoginUrl = page.url();

    // Generator UI: type prompt and check button enabled
    if (!results.e2e.postLoginUrl.includes('/generator')) {
      await page.goto(`${base}/generator`, { waitUntil: 'networkidle' });
    }
    const promptLocator = page.locator('textarea, input[placeholder*="prompt"], input[placeholder*="Prompt"]').first();
    await promptLocator.fill('test');
    await page.waitForTimeout(1000);
    const genBtn = page.locator('button:has-text("Generate"), button[type="submit"]').first();
    results.e2e.generateEnabled = await genBtn.isEnabled().catch(() => false);

    // 3) Rate limiting on /api/generate-v2 (send minimal body to avoid costs)
    // Make 105 rapid POSTs with {} to hit the limit (100 in prod)
    let lastStatus = 0;
    const cookieHeader = (await context.cookies()).map(c => `${c.name}=${c.value}`).join('; ');
    for (let i = 0; i < 105; i++) {
      const r = await page.request.post(`${base}/api/generate-v2`, {
        headers: { 'content-type': 'application/json', 'cookie': cookieHeader },
        data: {}
      });
      lastStatus = r.status();
      if (lastStatus === 429) break;
    }
    results.rateLimit.status = lastStatus;

    // 4) Webhook requirement enforcement (503 when no HTTPS webhook configured)
    // Reuse a valid auth session and call once with a minimal valid body to get past validation
    const genBody = { model: 'replicate/flux1', mode: 'images', input: { prompt: 'test' }, options: {} };
    const genResp = await page.request.post(`${base}/api/generate-v2`, {
      headers: { 'content-type': 'application/json', 'cookie': cookieHeader },
      data: genBody
    });
    results.webhookRequirement.status = genResp.status();

    // 5) PII logging cannot be directly asserted, but status codes should return as expected without server errors.

  } catch (e) {
    results.error = e.message;
  } finally {
    await browser.close();
  }

  console.log('--- VERIFICATION RESULTS ---');
  console.log(JSON.stringify(results, null, 2));
})();
