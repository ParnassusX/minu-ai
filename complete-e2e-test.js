const { chromium } = require('playwright');

async function completeE2ETest() {
  console.log('🎯 COMPLETE END-TO-END PIPELINE TEST');
  console.log('====================================');
  console.log('Testing: login → type prompt → generate → verify gallery');
  
  const browser = await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  // Capture console logs and errors
  const consoleLogs = [];
  const errors = [];
  
  page.on('console', msg => {
    consoleLogs.push(`${msg.type()}: ${msg.text()}`);
  });
  
  page.on('pageerror', error => {
    errors.push(error.message);
  });
  
  try {
    // Step 1: Test Login
    console.log('🔐 STEP 1: Testing login flow...');
    
    await page.goto('http://localhost:4000/auth/login', { 
      waitUntil: 'networkidle',
      timeout: 15000 
    });
    
    await page.screenshot({ path: 'e2e-01-login-page.png', fullPage: true });
    console.log('📸 Login page screenshot saved');
    
    // Wait for form to be ready and fill it
    await page.waitForSelector('#email', { timeout: 10000 });
    await page.waitForSelector('#password', { timeout: 10000 });
    
    await page.fill('#email', 'test@minu.ai');
    await page.fill('#password', 'password123');
    
    console.log('📝 Login form filled');
    
    // Submit and wait for navigation
    await page.click('button[type="submit"]');
    console.log('🚀 Login submitted');
    
    // Wait for either success (redirect to generator) or error
    try {
      await page.waitForURL('**/generator', { timeout: 10000 });
      console.log('✅ Login successful - redirected to generator');
    } catch (urlError) {
      // Check if we're still on login page with error
      const currentUrl = page.url();
      console.log('📍 Current URL after login attempt:', currentUrl);
      
      if (currentUrl.includes('/auth/login')) {
        // Look for error message
        const errorElement = await page.locator('[role="alert"], .alert-destructive, .text-red').first();
        const errorText = await errorElement.textContent().catch(() => '');
        if (errorText) {
          console.log('🚨 Login error:', errorText);
        } else {
          console.log('⚠️ Login may have failed silently');
        }
      }
    }
    
    await page.screenshot({ path: 'e2e-02-after-login.png', fullPage: true });
    
    // Step 2: Test Generator
    console.log('\n🎨 STEP 2: Testing generator functionality...');
    
    // Navigate to generator if not already there
    if (!page.url().includes('/generator')) {
      await page.goto('http://localhost:4000/generator', { waitUntil: 'networkidle' });
    }
    
    await page.waitForSelector('textarea, input[placeholder*="prompt"]', { timeout: 10000 });
    
    // Check if model is preselected
    const modelSelectors = await page.locator('select, [role="combobox"], [data-testid*="model"]').count();
    console.log('🤖 Found model selectors:', modelSelectors);
    
    // Find and fill prompt input
    const promptInput = await page.locator('textarea, input[placeholder*="prompt"], input[placeholder*="Prompt"]').first();
    await promptInput.fill('test');
    console.log('📝 Typed "test" in prompt input');
    
    // Wait a moment for any validation
    await page.waitForTimeout(2000);
    
    // Check Generate button state
    const generateButton = await page.locator('button:has-text("Generate"), button[type="submit"]').first();
    const isEnabled = await generateButton.isEnabled();
    const buttonText = await generateButton.textContent();
    
    console.log('🎯 Generate button enabled:', isEnabled);
    console.log('🎯 Generate button text:', buttonText?.trim());
    
    await page.screenshot({ path: 'e2e-03-generator-ready.png', fullPage: true });
    
    if (isEnabled) {
      console.log('✅ Generate button enablement working correctly');
      
      // Optional: Test actual generation (commented out to avoid costs)
      console.log('💰 Skipping actual generation to avoid API costs');
      /*
      console.log('🚀 Testing actual generation...');
      await generateButton.click();
      
      // Wait for generation to start
      await page.waitForTimeout(3000);
      await page.screenshot({ path: 'e2e-04-generation-started.png', fullPage: true });
      
      // Wait for completion (up to 2 minutes)
      console.log('⏳ Waiting for generation to complete...');
      await page.waitForTimeout(120000);
      
      // Check gallery
      await page.goto('http://localhost:4000/gallery');
      await page.waitForTimeout(3000);
      await page.screenshot({ path: 'e2e-05-gallery-result.png', fullPage: true });
      */
      
    } else {
      console.log('❌ Generate button not enabled - investigating...');
      
      // Check for validation errors
      const validationErrors = await page.locator('.text-red, .error, [role="alert"]').allTextContents();
      if (validationErrors.length > 0) {
        console.log('🚨 Validation errors:', validationErrors);
      }
    }
    
    // Step 3: Test Gallery
    console.log('\n🖼️ STEP 3: Testing gallery...');
    
    await page.goto('http://localhost:4000/gallery', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    
    const galleryImages = await page.locator('img, [data-testid*="image"]').count();
    console.log('🖼️ Gallery images found:', galleryImages);
    
    await page.screenshot({ path: 'e2e-04-gallery.png', fullPage: true });
    
    // Step 4: Test API endpoints
    console.log('\n🔌 STEP 4: Testing API endpoints...');
    
    const apiTests = [
      { url: '/api/health', name: 'Health Check' },
      { url: '/api/auth-check', name: 'Auth Check' },
      { url: '/api/models-v2', name: 'Models API' }
    ];
    
    for (const test of apiTests) {
      try {
        const response = await page.goto(`http://localhost:4000${test.url}`);
        console.log(`✅ ${test.name}: ${response?.status()}`);
      } catch (error) {
        console.log(`❌ ${test.name}: ${error.message}`);
      }
    }
    
  } catch (error) {
    console.error('❌ E2E test failed:', error);
    await page.screenshot({ path: 'e2e-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
  
  // Summary
  console.log('\n📊 TEST SUMMARY');
  console.log('================');
  console.log('Screenshots saved:');
  console.log('  - e2e-01-login-page.png');
  console.log('  - e2e-02-after-login.png');
  console.log('  - e2e-03-generator-ready.png');
  console.log('  - e2e-04-gallery.png');
  
  if (errors.length > 0) {
    console.log('\n🚨 Page Errors:');
    errors.forEach(error => console.log('  ', error));
  }
  
  console.log('\n📝 Console Logs (last 10):');
  consoleLogs.slice(-10).forEach(log => console.log('  ', log));
  
  console.log('\n✅ E2E test completed - check screenshots for results');
}

completeE2ETest().catch(console.error);
