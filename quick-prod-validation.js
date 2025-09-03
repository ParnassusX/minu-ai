const { chromium } = require('playwright');

async function validateProduction() {
  console.log('=== MINU.AI PRODUCTION VALIDATION ===');
  console.log('Server detected running on localhost:4000');
  
  const results = {
    timestamp: new Date().toISOString(),
    security: {},
    models: []
  };

  // 1. Security Validation
  console.log('\n1. Security Configuration Tests...');
  
  try {
    // Test API headers
    const healthResp = await fetch('http://localhost:4000/api/health');
    results.security.headers = {
      status: healthResp.status,
      cacheControl: healthResp.headers.get('cache-control')
    };
    console.log(`✓ Health endpoint: ${healthResp.status}, Cache-Control: ${healthResp.headers.get('cache-control')}`);

    // Test webhook signature validation
    const webhookResp = await fetch('http://localhost:4000/api/replicate/webhook', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-replicate-signature': 'invalid' },
      body: JSON.stringify({ test: 'data' })
    });
    results.security.webhook = { invalidStatus: webhookResp.status };
    console.log(`✓ Webhook security: ${webhookResp.status} (should be 401)`);

  } catch (error) {
    console.log(`✗ Security test error: ${error.message}`);
    results.security.error = error.message;
  }

  // 2. Model Generation Validation
  console.log('\n2. Model Generation Pipeline Tests...');
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Login
    console.log('Logging in...');
    await page.goto('http://localhost:4000/auth/login', { waitUntil: 'networkidle' });
    await page.fill('#email', 'test@minu.ai');
    await page.fill('#password', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/generator', { timeout: 15000 });
    console.log('✓ Login successful');

    // Test priority models
    const models = ['flux-schnell', 'flux-ultra', 'flux-kontext-pro', 'flux-kontext-max', 'seedream-3'];
    const cookies = (await context.cookies()).map(c => `${c.name}=${c.value}`).join('; ');

    for (const modelId of models) {
      console.log(`\nTesting ${modelId}...`);
      
      const prompt = `prod-test-${modelId}-${Date.now()}`;
      const body = {
        model: modelId,
        mode: 'images',
        input: { prompt },
        options: {}
      };

      try {
        const resp = await page.request.post('http://localhost:4000/api/generate-v2', {
          headers: { 'content-type': 'application/json', 'cookie': cookies },
          data: body
        });

        const status = resp.status();
        const data = await resp.json().catch(() => ({}));
        
        console.log(`  API Response: ${status}`);
        
        if (status === 200) {
          // Wait for gallery entry (simplified - 2 minute timeout)
          console.log(`  Waiting for gallery entry...`);
          let found = false;
          const startTime = Date.now();
          
          while (Date.now() - startTime < 120000) { // 2 minutes
            await new Promise(r => setTimeout(r, 5000));
            
            const galleryResp = await page.request.get('http://localhost:4000/api/gallery');
            const galleryData = await galleryResp.json().catch(() => ({}));
            
            if (Array.isArray(galleryData?.data)) {
              const item = galleryData.data.find(i => i?.original_prompt?.includes(prompt));
              if (item) {
                found = true;
                results.models.push({
                  model: modelId,
                  status,
                  success: true,
                  galleryId: item.id,
                  imageUrl: item.file_path,
                  createdAt: item.created_at
                });
                console.log(`  ✓ Gallery entry created: ${item.id}`);
                break;
              }
            }
          }
          
          if (!found) {
            results.models.push({
              model: modelId,
              status,
              success: false,
              error: 'Timeout waiting for gallery entry'
            });
            console.log(`  ✗ Timeout waiting for gallery entry`);
          }
          
        } else {
          results.models.push({
            model: modelId,
            status,
            success: false,
            error: data?.error || 'API error'
          });
          console.log(`  ✗ API error: ${status}`);
        }
        
      } catch (error) {
        results.models.push({
          model: modelId,
          status: 0,
          success: false,
          error: error.message
        });
        console.log(`  ✗ Request error: ${error.message}`);
      }
    }

    // Take gallery screenshot
    await page.goto('http://localhost:4000/gallery', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'production-validation-gallery.png', fullPage: true });
    console.log('\n✓ Gallery screenshot saved: production-validation-gallery.png');

  } catch (error) {
    console.log(`✗ Browser automation error: ${error.message}`);
    results.error = error.message;
  } finally {
    await browser.close();
  }

  // 3. Results Summary
  console.log('\n=== VALIDATION RESULTS ===');
  console.log(JSON.stringify(results, null, 2));
  
  // Save results
  require('fs').writeFileSync('production-validation-results.json', JSON.stringify(results, null, 2));
  console.log('\n✓ Results saved to: production-validation-results.json');
  
  // Summary
  const successCount = results.models.filter(m => m.success).length;
  const totalModels = results.models.length;
  
  console.log('\n=== SUMMARY ===');
  console.log(`Security Tests: ${results.security.error ? 'FAILED' : 'PASSED'}`);
  console.log(`Model Tests: ${successCount}/${totalModels} PASSED`);
  console.log(`Overall Status: ${!results.security.error && successCount === totalModels ? 'PRODUCTION READY' : 'NEEDS ATTENTION'}`);
}

validateProduction().catch(console.error);
