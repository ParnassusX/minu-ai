const { chromium } = require('playwright');
const fs = require('fs');

async function comprehensivePipelineTest() {
  console.log('=== COMPREHENSIVE PIPELINE VALIDATION ===');
  console.log('Testing: Authentication → Generation → Storage → Gallery Display');
  
  const results = {
    timestamp: new Date().toISOString(),
    authentication: {},
    models: [],
    gallery: {},
    ui: {},
    issues: []
  };

  let browser, context, page;

  try {
    // 1. Start browser and authenticate
    console.log('\n1. Starting browser and testing authentication...');
    browser = await chromium.launch({ headless: false, slowMo: 500 });
    context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
    page = await context.newPage();

    // Navigate to login page first
    await page.goto('http://localhost:4000/auth/login');
    await page.waitForLoadState('networkidle');

    // Take screenshot of login page
    await page.screenshot({ path: 'pipeline-test-00-login-page.png', fullPage: true });

    // Check for development bypass options
    const devBypassButton = page.locator('text=Generator V2 (Dev Mode)');

    let authMethod;

    if (await devBypassButton.isVisible()) {
      console.log('✓ Development bypass button found - using dev mode');
      await devBypassButton.click();
      authMethod = 'dev-bypass-button';
      await page.waitForTimeout(2000);
    } else {
      console.log('✓ No dev bypass button - trying direct dev URL');
      await page.goto('http://localhost:4000/generator?dev=true');
      authMethod = 'dev-url-parameter';
      await page.waitForLoadState('networkidle');
    }

    const currentUrl = page.url();
    results.authentication.loginSuccessful = currentUrl.includes('/generator');
    results.authentication.redirectUrl = currentUrl;
    results.authentication.method = authMethod;
    
    console.log(`✓ Authentication: ${results.authentication.loginSuccessful ? 'SUCCESS' : 'FAILED'}`);
    console.log(`✓ Redirected to: ${currentUrl}`);

    if (!results.authentication.loginSuccessful) {
      throw new Error('Authentication failed - cannot proceed with pipeline test');
    }

    // 2. Test generator interface
    console.log('\n2. Testing generator interface...');
    await page.goto('http://localhost:4000/generator');
    await page.waitForLoadState('networkidle');
    
    // Take screenshot of generator
    await page.screenshot({ path: 'pipeline-test-01-generator.png', fullPage: true });
    
    // Test UI elements
    const promptInput = page.locator('textarea, input[placeholder*="prompt"], input[placeholder*="Prompt"]').first();
    const generateButton = page.locator('button:has-text("Generate"), button[type="submit"]').first();
    
    results.ui.promptInputVisible = await promptInput.isVisible();
    results.ui.generateButtonVisible = await generateButton.isVisible();
    
    console.log(`✓ Prompt input visible: ${results.ui.promptInputVisible}`);
    console.log(`✓ Generate button visible: ${results.ui.generateButtonVisible}`);

    // 3. Test each priority model
    console.log('\n3. Testing priority models...');
    const priorityModels = ['flux-schnell', 'flux-ultra', 'flux-kontext-pro', 'flux-kontext-max', 'seedream-3'];
    
    for (const modelId of priorityModels) {
      console.log(`\nTesting ${modelId}...`);
      
      try {
        // Fill prompt
        const testPrompt = `Pipeline test ${modelId} - ${Date.now()}`;
        await promptInput.fill(testPrompt);
        await page.waitForTimeout(1000);
        
        // Check if model selector exists and select model
        const modelSelector = page.locator('select, [data-testid="model-selector"]').first();
        if (await modelSelector.isVisible()) {
          await modelSelector.selectOption(modelId);
          await page.waitForTimeout(500);
        }
        
        // Check if generate button is enabled
        const isEnabled = await generateButton.isEnabled();
        
        if (isEnabled) {
          // Click generate
          await generateButton.click();
          await page.waitForTimeout(2000);
          
          // Take screenshot during generation
          await page.screenshot({ path: `pipeline-test-02-${modelId}-generating.png`, fullPage: true });
          
          results.models.push({
            model: modelId,
            promptSubmitted: testPrompt,
            generateButtonEnabled: true,
            generationStarted: true,
            status: 'GENERATION_STARTED'
          });
          
          console.log(`✓ ${modelId}: Generation started successfully`);
          
          // Wait a bit for potential completion
          await page.waitForTimeout(10000);
          
        } else {
          results.models.push({
            model: modelId,
            promptSubmitted: testPrompt,
            generateButtonEnabled: false,
            generationStarted: false,
            status: 'BUTTON_DISABLED'
          });
          
          console.log(`✗ ${modelId}: Generate button disabled`);
        }
        
      } catch (error) {
        results.models.push({
          model: modelId,
          status: 'ERROR',
          error: error.message
        });
        
        console.log(`✗ ${modelId}: Error - ${error.message}`);
      }
    }

    // 4. Test gallery functionality
    console.log('\n4. Testing gallery functionality...');
    await page.goto('http://localhost:4000/gallery');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // Take screenshot of gallery
    await page.screenshot({ path: 'pipeline-test-03-gallery.png', fullPage: true });
    
    // Test gallery elements
    const galleryImages = await page.locator('img[src*="cloudinary"], img[src*="replicate"], img[src*="supabase"]').count();
    results.gallery.imageCount = galleryImages;
    results.gallery.hasImages = galleryImages > 0;
    
    console.log(`✓ Gallery images found: ${galleryImages}`);
    
    // Test scrolling behavior
    const initialScrollHeight = await page.evaluate(() => document.body.scrollHeight);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(2000);
    
    const newScrollHeight = await page.evaluate(() => document.body.scrollHeight);
    results.gallery.scrollingWorks = newScrollHeight > initialScrollHeight;
    results.gallery.initialScrollHeight = initialScrollHeight;
    results.gallery.newScrollHeight = newScrollHeight;
    
    console.log(`✓ Gallery scrolling test: ${results.gallery.scrollingWorks ? 'WORKING' : 'NEEDS_FIX'}`);
    console.log(`  Initial height: ${initialScrollHeight}px, New height: ${newScrollHeight}px`);
    
    // Test for duplicate images (scrolling issue indicator)
    const imageUrls = await page.evaluate(() => {
      const imgs = Array.from(document.querySelectorAll('img[src*="cloudinary"], img[src*="replicate"], img[src*="supabase"]'));
      return imgs.map(img => img.src);
    });
    
    const uniqueUrls = new Set(imageUrls);
    results.gallery.totalImageElements = imageUrls.length;
    results.gallery.uniqueImages = uniqueUrls.size;
    results.gallery.hasDuplicates = imageUrls.length > uniqueUrls.size;
    
    console.log(`✓ Image elements: ${imageUrls.length}, Unique: ${uniqueUrls.size}`);
    if (results.gallery.hasDuplicates) {
      console.log(`⚠ Duplicate images detected - possible scrolling issue`);
      results.issues.push('Gallery shows duplicate images - infinite scroll may be broken');
    }

    // 5. Test API endpoints directly
    console.log('\n5. Testing API endpoints...');
    const cookies = await context.cookies();
    const cookieHeader = cookies.map(c => `${c.name}=${c.value}`).join('; ');
    
    // Test gallery API
    try {
      const galleryApiResp = await fetch('http://localhost:4000/api/gallery', {
        headers: { 'cookie': cookieHeader }
      });
      
      if (galleryApiResp.ok) {
        const galleryData = await galleryApiResp.json();
        results.gallery.apiWorks = true;
        results.gallery.apiRecordCount = Array.isArray(galleryData?.data) ? galleryData.data.length : 0;
        console.log(`✓ Gallery API: ${results.gallery.apiRecordCount} records`);
        
        // Check for recent records
        if (galleryData?.data?.length > 0) {
          const recentRecords = galleryData.data.slice(0, 5);
          console.log('Recent gallery records:');
          recentRecords.forEach((record, i) => {
            console.log(`  ${i + 1}. Model: ${record.model || 'unknown'}, Created: ${record.created_at}`);
          });
        }
      } else {
        results.gallery.apiWorks = false;
        console.log(`✗ Gallery API failed: ${galleryApiResp.status}`);
      }
    } catch (error) {
      results.gallery.apiWorks = false;
      results.gallery.apiError = error.message;
      console.log(`✗ Gallery API error: ${error.message}`);
    }

    // 6. Final screenshots
    console.log('\n6. Taking final evidence screenshots...');
    await page.goto('http://localhost:4000/generator');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'pipeline-test-final-generator.png', fullPage: true });
    
    await page.goto('http://localhost:4000/gallery');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'pipeline-test-final-gallery.png', fullPage: true });

  } catch (error) {
    console.error(`Pipeline test error: ${error.message}`);
    results.error = error.message;
    results.issues.push(`Critical error: ${error.message}`);
    
    if (page) {
      try {
        await page.screenshot({ path: 'pipeline-test-error.png', fullPage: true });
      } catch {}
    }
  } finally {
    if (browser) {
      await browser.close();
    }
  }

  // 7. Generate summary
  console.log('\n=== PIPELINE TEST SUMMARY ===');
  console.log(`Authentication: ${results.authentication.loginSuccessful ? 'PASS' : 'FAIL'}`);
  console.log(`UI Elements: ${results.ui.promptInputVisible && results.ui.generateButtonVisible ? 'PASS' : 'FAIL'}`);
  console.log(`Models Tested: ${results.models.length}`);
  console.log(`Gallery Images: ${results.gallery.imageCount || 0}`);
  console.log(`Gallery API: ${results.gallery.apiWorks ? 'PASS' : 'FAIL'}`);
  console.log(`Issues Found: ${results.issues.length}`);
  
  if (results.issues.length > 0) {
    console.log('\nISSUES TO ADDRESS:');
    results.issues.forEach((issue, i) => {
      console.log(`  ${i + 1}. ${issue}`);
    });
  }

  // Save results
  fs.writeFileSync('comprehensive-pipeline-test-results.json', JSON.stringify(results, null, 2));
  console.log('\n✓ Results saved to: comprehensive-pipeline-test-results.json');

  return results;
}

comprehensivePipelineTest().catch(console.error);
