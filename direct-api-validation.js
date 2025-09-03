const { chromium } = require('playwright');
const fs = require('fs');

async function directApiValidation() {
  console.log('=== DIRECT API VALIDATION WITH REAL CALLS ===');
  console.log('Testing complete pipeline with actual API calls...');
  
  const results = {
    timestamp: new Date().toISOString(),
    server: { status: 'UNKNOWN' },
    authentication: { status: 'UNKNOWN' },
    generation: { status: 'UNKNOWN' },
    gallery: { status: 'UNKNOWN' },
    evidence: []
  };

  let browser, context, page;

  try {
    // 1. Wait for server
    console.log('\n1. Checking server status...');
    let serverReady = false;
    
    for (let i = 0; i < 30; i++) {
      try {
        const response = await fetch('http://localhost:3000/api/health');
        if (response.ok) {
          serverReady = true;
          results.server.status = 'RUNNING';
          results.server.headers = Object.fromEntries(response.headers.entries());
          console.log('✓ Server is running on localhost:3000');
          console.log(`✓ Cache-Control: ${response.headers.get('cache-control')}`);
          break;
        }
      } catch (error) {
        console.log(`  Attempt ${i + 1}: Server not ready (${error.message})`);
      }
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    if (!serverReady) {
      throw new Error('Server not accessible after 60 seconds');
    }

    // 2. Start browser
    console.log('\n2. Starting browser automation...');
    browser = await chromium.launch({ 
      headless: false,
      slowMo: 500,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    context = await browser.newContext({
      viewport: { width: 1280, height: 720 }
    });
    page = await context.newPage();

    // 3. Test authentication
    console.log('\n3. Testing authentication...');
    await page.goto('http://localhost:3000/auth/login');
    await page.waitForLoadState('networkidle');
    
    // Screenshot login page
    await page.screenshot({ path: 'direct-validation-01-login.png', fullPage: true });
    results.evidence.push('direct-validation-01-login.png');
    console.log('✓ Login page screenshot saved');

    // Perform login
    const emailField = page.locator('#email');
    const passwordField = page.locator('#password');
    const submitButton = page.locator('button[type="submit"]');

    if (await emailField.isVisible() && await passwordField.isVisible()) {
      await emailField.fill('test@minu.ai');
      await passwordField.fill('password123');
      await submitButton.click();
      
      // Wait for navigation
      await page.waitForTimeout(5000);
      const currentUrl = page.url();
      
      results.authentication.loginSuccessful = !currentUrl.includes('/auth/login');
      results.authentication.redirectUrl = currentUrl;
      console.log(`✓ Login result: ${results.authentication.loginSuccessful ? 'SUCCESS' : 'FAILED'}`);
      console.log(`✓ Current URL: ${currentUrl}`);
      
      if (results.authentication.loginSuccessful) {
        results.authentication.status = 'SUCCESS';
      }
    }

    // 4. Test generator interface
    console.log('\n4. Testing generator interface...');
    await page.goto('http://localhost:3000/generator');
    await page.waitForLoadState('networkidle');
    
    // Screenshot generator
    await page.screenshot({ path: 'direct-validation-02-generator.png', fullPage: true });
    results.evidence.push('direct-validation-02-generator.png');
    console.log('✓ Generator page screenshot saved');

    // Test prompt input and generate button
    const promptInput = page.locator('textarea, input[placeholder*="prompt"], input[placeholder*="Prompt"]').first();
    const generateButton = page.locator('button:has-text("Generate"), button[type="submit"]').first();

    if (await promptInput.isVisible()) {
      const testPrompt = `Direct validation test - ${new Date().toISOString()}`;
      await promptInput.fill(testPrompt);
      await page.waitForTimeout(1000);
      
      const isEnabled = await generateButton.isEnabled();
      console.log(`✓ Generate button enabled: ${isEnabled}`);
      
      if (isEnabled) {
        // Get session cookies for API calls
        const cookies = await context.cookies();
        const cookieHeader = cookies.map(c => `${c.name}=${c.value}`).join('; ');
        
        // 5. Test direct API call
        console.log('\n5. Making direct API call to generate-v2...');
        const apiBody = {
          model: 'flux-schnell',
          mode: 'images',
          input: {
            prompt: testPrompt,
            aspect_ratio: '1:1',
            output_format: 'jpg'
          },
          options: {}
        };

        try {
          const apiResponse = await fetch('http://localhost:3000/api/generate-v2', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Cookie': cookieHeader
            },
            body: JSON.stringify(apiBody)
          });

          const apiData = await apiResponse.json();
          results.generation.apiStatus = apiResponse.status;
          results.generation.apiResponse = apiData;
          results.generation.attempted = true;
          
          console.log(`✓ API Response Status: ${apiResponse.status}`);
          console.log(`✓ API Response: ${JSON.stringify(apiData, null, 2)}`);
          
          if (apiResponse.ok) {
            results.generation.status = 'SUCCESS';
            console.log('✓ Generation API call successful');
            
            // Wait for potential completion
            console.log('Waiting for generation to potentially complete...');
            await page.waitForTimeout(30000); // Wait 30 seconds
            
            // Take screenshot after waiting
            await page.screenshot({ path: 'direct-validation-03-after-generation.png', fullPage: true });
            results.evidence.push('direct-validation-03-after-generation.png');
          } else {
            results.generation.status = 'FAILED';
            console.log('✗ Generation API call failed');
          }
          
        } catch (error) {
          results.generation.status = 'ERROR';
          results.generation.error = error.message;
          console.log(`✗ API call error: ${error.message}`);
        }
      }
    }

    // 6. Test gallery
    console.log('\n6. Testing gallery...');
    await page.goto('http://localhost:3000/gallery');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // Screenshot gallery
    await page.screenshot({ path: 'direct-validation-04-gallery.png', fullPage: true });
    results.evidence.push('direct-validation-04-gallery.png');
    console.log('✓ Gallery screenshot saved');

    // Count images in gallery
    const imageElements = await page.locator('img[src*="cloudinary"], img[src*="replicate"], img[src*="supabase"]').count();
    results.gallery.imageCount = imageElements;
    results.gallery.hasImages = imageElements > 0;
    results.gallery.status = imageElements > 0 ? 'HAS_IMAGES' : 'EMPTY';
    console.log(`✓ Gallery contains ${imageElements} images`);

    // Test gallery API directly
    const cookies = await context.cookies();
    const cookieHeader = cookies.map(c => `${c.name}=${c.value}`).join('; ');
    
    try {
      const galleryApiResponse = await fetch('http://localhost:3000/api/gallery', {
        headers: { 'Cookie': cookieHeader }
      });
      
      if (galleryApiResponse.ok) {
        const galleryData = await galleryApiResponse.json();
        results.gallery.apiWorks = true;
        results.gallery.apiRecordCount = Array.isArray(galleryData?.data) ? galleryData.data.length : 0;
        console.log(`✓ Gallery API works: ${results.gallery.apiRecordCount} records`);
        
        // Log recent records
        if (galleryData?.data?.length > 0) {
          console.log('Recent gallery records:');
          galleryData.data.slice(0, 5).forEach((record, i) => {
            console.log(`  ${i + 1}. ID: ${record.id}, Model: ${record.model || 'unknown'}, Created: ${record.created_at}`);
          });
        }
      }
    } catch (error) {
      console.log(`Gallery API error: ${error.message}`);
    }

    // 7. Final evidence screenshots
    console.log('\n7. Taking final evidence screenshots...');
    
    // Final generator state
    await page.goto('http://localhost:3000/generator');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'direct-validation-final-generator.png', fullPage: true });
    
    // Final gallery state  
    await page.goto('http://localhost:3000/gallery');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'direct-validation-final-gallery.png', fullPage: true });
    
    results.evidence.push('direct-validation-final-generator.png');
    results.evidence.push('direct-validation-final-gallery.png');
    console.log('✓ Final evidence screenshots saved');

  } catch (error) {
    console.error(`Validation error: ${error.message}`);
    results.error = error.message;
    
    if (page) {
      try {
        await page.screenshot({ path: 'direct-validation-error.png', fullPage: true });
        results.evidence.push('direct-validation-error.png');
      } catch {}
    }
  } finally {
    if (browser) {
      await browser.close();
    }
  }

  // 8. Save results
  fs.writeFileSync('direct-api-validation-results.json', JSON.stringify(results, null, 2));
  
  console.log('\n=== DIRECT VALIDATION RESULTS ===');
  console.log(`Server: ${results.server.status}`);
  console.log(`Authentication: ${results.authentication.status}`);
  console.log(`Generation API: ${results.generation.status} (${results.generation.apiStatus})`);
  console.log(`Gallery: ${results.gallery.status} (${results.gallery.imageCount} images, ${results.gallery.apiRecordCount} API records)`);
  console.log(`Evidence Files: ${results.evidence.length}`);
  console.log('\n✓ Results saved to: direct-api-validation-results.json');
  console.log('✓ Evidence screenshots saved');

  return results;
}

// Execute validation
directApiValidation().catch(console.error);
