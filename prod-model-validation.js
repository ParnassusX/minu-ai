const { chromium } = require('playwright');
const http = require('http');

const PRIORITY_MODELS = [
  'flux-schnell',
  'flux-ultra',
  'flux-kontext-pro',
  'flux-kontext-max',
  'seedream-3'
];

const BASE_URL = process.env.BASE_URL || 'http://localhost:4000';

async function wait(ms) { return new Promise(r => setTimeout(r, ms)); }

async function checkUrlOk(url) {
  return new Promise((resolve) => {
    try {
      const req = http.get(url, (res) => {
        resolve(res.statusCode >= 200 && res.statusCode < 400);
      });
      req.on('error', () => resolve(false));
      req.setTimeout(5000, () => { try { req.destroy(); } catch {}; resolve(false); });
    } catch {
      resolve(false);
    }
  });
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const results = [];

  try {
    // Login
    await page.goto(`${BASE_URL}/auth/login`, { waitUntil: 'networkidle' });
    await page.fill('#email', 'test@minu.ai');
    await page.fill('#password', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/generator', { timeout: 20000 });

    // For each model
    for (const modelId of PRIORITY_MODELS) {
      const prompt = `minu-audit ${modelId} ${Date.now()}`;
      const body = {
        model: modelId,
        mode: 'images',
        input: { prompt },
        options: {}
      };

      // Call generation API with session cookies
      const cookieHeader = (await context.cookies()).map(c => `${c.name}=${c.value}`).join('; ');
      const resp = await page.request.post(`${BASE_URL}/api/generate-v2`, {
        headers: { 'content-type': 'application/json', 'cookie': cookieHeader },
        data: body
      });

      const status = resp.status();
      const json = await resp.json().catch(() => ({}));

      // If webhook missing in prod, API will return 503; abort this model
      if (status >= 500) {
        results.push({ model: modelId, status, error: json?.error || 'server error' });
        continue;
      }

      // Poll gallery for up to 6 minutes for this prompt
      let found = null;
      const started = Date.now();
      while (Date.now() - started < 6 * 60 * 1000) {
        const g = await page.request.get(`${BASE_URL}/api/gallery`);
        const gJson = await g.json().catch(() => ({}));
        const items = Array.isArray(gJson?.data) ? gJson.data : [];
        found = items.find(i => (i?.original_prompt || '').includes(prompt));
        if (found) break;
        await wait(5000);
      }

      if (!found) {
        results.push({ model: modelId, status, error: 'timeout waiting gallery' });
        continue;
      }

      // Verify the image URL is reachable
      const url = found.file_path;
      const ok = await checkUrlOk(url);

      results.push({
        model: modelId,
        status,
        galleryId: found.id,
        file: url,
        reachable: ok,
        createdAt: found.created_at
      });
    }

    // Final gallery screenshot
    await page.goto(`${BASE_URL}/gallery`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'prod-gallery-after.png', fullPage: true });

  } catch (e) {
    console.log('ERROR:', e.message);
  } finally {
    await browser.close();
  }

  console.log('--- MODEL VALIDATION RESULTS ---');
  console.log(JSON.stringify(results, null, 2));
})();
