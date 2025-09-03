const { chromium } = require('playwright');
const fs = require('fs');

async function realEndToEndValidation() {
  console.log('=== REAL END-TO-END VALIDATION WITH ACTUAL API CALLS ===');
  console.log('Starting comprehensive validation with real image generation...');
  
  const results = {
    timestamp: new Date().toISOString(),
    server: {},
    authentication: {},
    realGeneration: {},
    gallery: {},
    evidence: []
  };

  let browser, context, page;

  try {
    // 1. Wait for server to be ready
    console.log('\n1. Waiting for development server...');
    let serverReady = false;
    for (let i = 0; i < 60; i++) {
      try {
        const response = await fetch('http://localhost:3000/api/health');
        if (response.ok) {
          serverReady = true;
          results.server.status = 'RUNNING';
          results.server.port = 3000;
          console.log('✓ Development server is running on port 3000');
          break;
        }
      } catch {}
      await new Promise(resolve => setTimeout(resolve, 2000));
      if (i % 10 === 0) console.log(`  Waiting... (${i * 2}s)`);
    }

    if (!serverReady) {
      throw new Error('Server not ready after 2 minutes');
    }

    // 2. Start browser automation
    console.log('\n2. Starting browser automation...');
    browser = await chromium.launch({ headless: false, slowMo: 1000 });
    context = await browser.newContext();
    page = await context.newPage();

    // 3. Test authentication flow
    console.log('\n3. Testing authentication flow...');
    await page.goto('http://localhost:3000/auth/login');
    await page.waitForLoadState('networkidle');
    
    // Take screenshot of login page
    await page.screenshot({ path: 'real-validation-01-login.png', fullPage: true });
    results.evidence.push('real-validation-01-login.png');
    console.log('✓ Login page screenshot saved');

    // Perform login
    await page.fill('#email', 'test@minu.ai');
    await page.fill('#password', 'password123');
    await page.click('button[type="submit"]');
    
    // Wait for redirect
    await page.waitForTimeout(5000);
    const currentUrl = page.url();
    results.authentication.loginSuccessful = !currentUrl.includes('/auth/login');
    console.log(`✓ Login successful: ${results.authentication.loginSuccessful}`);
    console.log(`✓ Redirected to: ${currentUrl}`);

    if (!results.authentication.loginSuccessful) {
      throw new Error('Authentication failed');
    }

    // 4. Navigate to generator
    console.log('\n4. Testing generator interface...');
    await page.goto('http://localhost:3000/generator');
    await page.waitForLoadState('networkidle');
    
    // Take screenshot of generator
    await page.screenshot({ path: 'real-validation-02-generator.png', fullPage: true });
    results.evidence.push('real-validation-02-generator.png');
    console.log('✓ Generator page screenshot saved');

    // 5. Test real image generation
    console.log('\n5. Performing REAL image generation...');
    
    // Fill in prompt
    const promptText = `Real validation test - ${new Date().toISOString()}`;
    const promptInput = page.locator('textarea, input[placeholder*="prompt"], input[placeholder*="Prompt"]').first();
    await promptInput.fill(promptText);
    await page.waitForTimeout(1000);

    // Check if generate button is enabled
    const generateBtn = page.locator('button:has-text("Generate"), button[type="submit"]').first();
    const isEnabled = await generateBtn.isEnabled();
    console.log(`✓ Generate button enabled: ${isEnabled}`);

    if (isEnabled) {
      // Click generate button
      console.log('Clicking generate button for REAL API call...');
      await generateBtn.click();
      
      // Wait for generation to start
      await page.waitForTimeout(3000);
      
      // Take screenshot during generation
      await page.screenshot({ path: 'real-validation-03-generating.png', fullPage: true });
      results.evidence.push('real-validation-03-generating.png');
      console.log('✓ Generation started - screenshot saved');

      // Monitor for completion (wait up to 5 minutes)
      console.log('Waiting for generation to complete...');
      let generationComplete = false;
      const startTime = Date.now();
      const timeout = 5 * 60 * 1000; // 5 minutes

      while (Date.now() - startTime < timeout) {
        try {
          // Check if generation completed by looking for success indicators
          const successIndicator = await page.locator('text=Generation complete, text=Success, img[src*="cloudinary"], img[src*="replicate"]').first().isVisible({ timeout: 5000 });
          
          if (successIndicator) {
            generationComplete = true;
            console.log('✓ Generation completed successfully!');
            break;
          }
        } catch {}
        
        await page.waitForTimeout(10000); // Check every 10 seconds
        console.log(`  Still generating... (${Math.round((Date.now() - startTime) / 1000)}s elapsed)`);
      }

      results.realGeneration.attempted = true;
      results.realGeneration.completed = generationComplete;
      results.realGeneration.prompt = promptText;
      
      if (generationComplete) {
        // Take screenshot of completed generation
        await page.screenshot({ path: 'real-validation-04-completed.png', fullPage: true });
        results.evidence.push('real-validation-04-completed.png');
        console.log('✓ Generation completion screenshot saved');
      }
    }

    // 6. Test gallery
    console.log('\n6. Testing gallery with real data...');
    await page.goto('http://localhost:3000/gallery');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // Take screenshot of gallery
    await page.screenshot({ path: 'real-validation-05-gallery.png', fullPage: true });
    results.evidence.push('real-validation-05-gallery.png');
    console.log('✓ Gallery screenshot saved');

    // Check for images in gallery
    const imageElements = await page.locator('img[src*="cloudinary"], img[src*="replicate"], img[src*="supabase"]').count();
    results.gallery.imageCount = imageElements;
    results.gallery.hasImages = imageElements > 0;
    console.log(`✓ Gallery contains ${imageElements} images`);

    // 7. Test API endpoints directly
    console.log('\n7. Testing API endpoints directly...');
    
    // Get session cookies
    const cookies = await context.cookies();
    const cookieHeader = cookies.map(c => `${c.name}=${c.value}`).join('; ');
    
    // Test gallery API
    const galleryApiResp = await fetch('http://localhost:3000/api/gallery', {
      headers: { 'cookie': cookieHeader }
    });
    
    if (galleryApiResp.ok) {
      const galleryData = await galleryApiResp.json();
      results.gallery.apiWorks = true;
      results.gallery.apiRecordCount = Array.isArray(galleryData?.data) ? galleryData.data.length : 0;
      console.log(`✓ Gallery API works: ${results.gallery.apiRecordCount} records`);
      
      // Log some sample records
      if (galleryData?.data?.length > 0) {
        console.log('Sample gallery records:');
        galleryData.data.slice(0, 3).forEach((record, i) => {
          console.log(`  ${i + 1}. ID: ${record.id}, Model: ${record.model}, Created: ${record.created_at}`);
        });
      }
    }

    // 8. Final comprehensive screenshot
    console.log('\n8. Taking final evidence screenshots...');
    
    // Generator final state
    await page.goto('http://localhost:3000/generator');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'real-validation-final-generator.png', fullPage: true });
    
    // Gallery final state
    await page.goto('http://localhost:3000/gallery');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'real-validation-final-gallery.png', fullPage: true });
    
    results.evidence.push('real-validation-final-generator.png');
    results.evidence.push('real-validation-final-gallery.png');
    console.log('✓ Final evidence screenshots saved');

  } catch (error) {
    console.error('Validation error:', error.message);
    results.error = error.message;
    
    // Take error screenshot if page exists
    if (page) {
      try {
        await page.screenshot({ path: 'real-validation-error.png', fullPage: true });
        results.evidence.push('real-validation-error.png');
      } catch {}
    }
  } finally {
    if (browser) {
      await browser.close();
    }
  }

  // 9. Save results
  fs.writeFileSync('real-e2e-validation-results.json', JSON.stringify(results, null, 2));
  
  console.log('\n=== REAL VALIDATION RESULTS ===');
  console.log(`Server Status: ${results.server.status}`);
  console.log(`Authentication: ${results.authentication.loginSuccessful ? 'SUCCESS' : 'FAILED'}`);
  console.log(`Real Generation Attempted: ${results.realGeneration?.attempted || false}`);
  console.log(`Real Generation Completed: ${results.realGeneration?.completed || false}`);
  console.log(`Gallery Images: ${results.gallery?.imageCount || 0}`);
  console.log(`Gallery API Records: ${results.gallery?.apiRecordCount || 0}`);
  console.log(`Evidence Files: ${results.evidence.length}`);
  console.log('\n✓ Results saved to: real-e2e-validation-results.json');
  console.log('✓ Evidence screenshots saved to current directory');

  return results;
}

// Execute the real validation
realEndToEndValidation().catch(console.error);
