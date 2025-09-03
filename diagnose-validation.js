const fs = require('fs');
const http = require('http');

function httpGet(url) {
  return new Promise((resolve) => {
    try {
      const req = http.get(url, (res) => {
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          const body = Buffer.concat(chunks).toString('utf8');
          resolve({ ok: true, statusCode: res.statusCode, headers: res.headers, body });
        });
      });
      req.on('error', (err) => resolve({ ok: false, error: err.message }));
      req.setTimeout(5000, () => { try { req.destroy(); } catch (e) {}; resolve({ ok: false, error: 'timeout' }); });
    } catch (e) {
      resolve({ ok: false, error: e.message });
    }
  });
}

(async () => {
  const result = {
    ts: new Date().toISOString(),
    node: {
      version: process.version,
      versions: process.versions,
      cwd: process.cwd(),
      env: {
        NODE_ENV: process.env.NODE_ENV,
        REPLICATE_WEBHOOK_URL: !!process.env.REPLICATE_WEBHOOK_URL,
        REPLICATE_WEBHOOK_SECRET: !!process.env.REPLICATE_WEBHOOK_SECRET,
        REPLICATE_API_TOKEN: !!process.env.REPLICATE_API_TOKEN,
        CLOUDINARY_URL: !!process.env.CLOUDINARY_URL,
        NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      }
    },
    servers: {},
    playwright: {},
    notes: []
  };

  // Probe servers
  result.servers.local3000 = await httpGet('http://localhost:3000/api/health');
  result.servers.local4000 = await httpGet('http://localhost:4000/api/health');
  
  // Try gallery
  result.servers.gallery3000 = await httpGet('http://localhost:3000/api/gallery');
  result.servers.gallery4000 = await httpGet('http://localhost:4000/api/gallery');

  // Try to require playwright
  try {
    const pkg = require('@playwright/test/package.json');
    result.playwright.packageVersion = pkg.version;
    const { chromium } = require('playwright');
    result.playwright.chromiumDefined = typeof chromium === 'object';
  } catch (e) {
    result.playwright.error = e.message;
  }

  fs.writeFileSync('diagnostics.json', JSON.stringify(result, null, 2));
  console.log('Diagnostics written to diagnostics.json');
})();
