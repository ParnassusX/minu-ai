const { chromium } = require('playwright');
const fs = require('fs');

async function testGalleryDirectly() {
  console.log('=== TESTING GALLERY FUNCTIONALITY DIRECTLY ===');
  console.log('Testing gallery scrolling and image display without authentication');
  
  const results = {
    timestamp: new Date().toISOString(),
    gallery: {},
    ui: {},
    issues: []
  };

  let browser, context, page;

  try {
    // Start browser
    console.log('\n1. Starting browser...');
    browser = await chromium.launch({ headless: false, slowMo: 500 });
    context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
    page = await context.newPage();

    // Test gallery API directly (without auth)
    console.log('\n2. Testing gallery API directly...');
    try {
      const galleryApiResp = await fetch('http://localhost:4000/api/gallery');
      
      if (galleryApiResp.ok) {
        const galleryData = await galleryApiResp.json();
        results.gallery.apiWorks = true;
        results.gallery.apiRecordCount = Array.isArray(galleryData?.data) ? galleryData.data.length : 0;
        console.log(`✓ Gallery API: ${results.gallery.apiRecordCount} records`);
        
        // Show sample records
        if (galleryData?.data?.length > 0) {
          const recentRecords = galleryData.data.slice(0, 3);
          console.log('Sample gallery records:');
          recentRecords.forEach((record, i) => {
            console.log(`  ${i + 1}. Model: ${record.model || 'unknown'}, URL: ${record.image_url ? 'present' : 'missing'}`);
          });
        }
      } else {
        results.gallery.apiWorks = false;
        results.gallery.apiStatus = galleryApiResp.status;
        console.log(`✗ Gallery API failed: ${galleryApiResp.status}`);
        
        if (galleryApiResp.status === 401) {
          console.log('  → Authentication required for gallery API');
        }
      }
    } catch (error) {
      results.gallery.apiWorks = false;
      results.gallery.apiError = error.message;
      console.log(`✗ Gallery API error: ${error.message}`);
    }

    // Test models API (should work without auth)
    console.log('\n3. Testing models API...');
    try {
      const modelsResp = await fetch('http://localhost:4000/api/models-v2');
      
      if (modelsResp.ok) {
        const modelsData = await modelsResp.json();
        results.models = {
          apiWorks: true,
          modelCount: Array.isArray(modelsData?.models) ? modelsData.models.length : 0
        };
        console.log(`✓ Models API: ${results.models.modelCount} models available`);
        
        // Show priority models
        if (modelsData?.models?.length > 0) {
          const priorityModels = modelsData.models.filter(m => m.isPriority);
          console.log(`✓ Priority models: ${priorityModels.length}`);
          priorityModels.forEach(model => {
            console.log(`  - ${model.id}: ${model.name}`);
          });
        }
      } else {
        results.models = { apiWorks: false, status: modelsResp.status };
        console.log(`✗ Models API failed: ${modelsResp.status}`);
      }
    } catch (error) {
      results.models = { apiWorks: false, error: error.message };
      console.log(`✗ Models API error: ${error.message}`);
    }

    // Test generator page UI (without auth)
    console.log('\n4. Testing generator page UI...');
    await page.goto('http://localhost:4000/generator');
    await page.waitForLoadState('networkidle');
    
    // Take screenshot
    await page.screenshot({ path: 'test-generator-no-auth.png', fullPage: true });
    
    const currentUrl = page.url();
    results.ui.generatorAccessible = !currentUrl.includes('/auth/login');
    results.ui.finalUrl = currentUrl;
    
    if (results.ui.generatorAccessible) {
      console.log('✓ Generator page accessible without auth');
      
      // Test UI elements
      const promptInput = await page.locator('textarea, input[placeholder*="prompt"], input[placeholder*="Prompt"]').count();
      const generateButton = await page.locator('button:has-text("Generate"), button[type="submit"]').count();
      const modelSelector = await page.locator('select, [data-testid="model-selector"]').count();
      
      results.ui.promptInputs = promptInput;
      results.ui.generateButtons = generateButton;
      results.ui.modelSelectors = modelSelector;
      
      console.log(`✓ UI Elements found: ${promptInput} prompt inputs, ${generateButton} generate buttons, ${modelSelector} model selectors`);
      
    } else {
      console.log('✗ Generator page redirects to login');
    }

    // Test gallery page UI
    console.log('\n5. Testing gallery page UI...');
    await page.goto('http://localhost:4000/gallery');
    await page.waitForLoadState('networkidle');
    
    // Take screenshot
    await page.screenshot({ path: 'test-gallery-no-auth.png', fullPage: true });
    
    const galleryUrl = page.url();
    results.ui.galleryAccessible = !galleryUrl.includes('/auth/login');
    results.ui.galleryUrl = galleryUrl;
    
    if (results.ui.galleryAccessible) {
      console.log('✓ Gallery page accessible without auth');
      
      // Test gallery elements
      const galleryImages = await page.locator('img[src*="cloudinary"], img[src*="replicate"], img[src*="supabase"]').count();
      results.gallery.uiImageCount = galleryImages;
      
      console.log(`✓ Gallery UI: ${galleryImages} images displayed`);
      
      // Test scrolling behavior
      const initialScrollHeight = await page.evaluate(() => document.body.scrollHeight);
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(2000);
      
      const newScrollHeight = await page.evaluate(() => document.body.scrollHeight);
      results.gallery.scrollingWorks = newScrollHeight > initialScrollHeight;
      results.gallery.initialScrollHeight = initialScrollHeight;
      results.gallery.newScrollHeight = newScrollHeight;
      
      console.log(`✓ Gallery scrolling test: ${results.gallery.scrollingWorks ? 'WORKING' : 'STATIC'}`);
      console.log(`  Initial height: ${initialScrollHeight}px, New height: ${newScrollHeight}px`);
      
      // Test for duplicate images
      const imageUrls = await page.evaluate(() => {
        const imgs = Array.from(document.querySelectorAll('img[src*="cloudinary"], img[src*="replicate"], img[src*="supabase"]'));
        return imgs.map(img => img.src);
      });
      
      const uniqueUrls = new Set(imageUrls);
      results.gallery.totalImageElements = imageUrls.length;
      results.gallery.uniqueImages = uniqueUrls.size;
      results.gallery.hasDuplicates = imageUrls.length > uniqueUrls.size;
      
      console.log(`✓ Image analysis: ${imageUrls.length} elements, ${uniqueUrls.size} unique URLs`);
      if (results.gallery.hasDuplicates) {
        console.log(`⚠ Duplicate images detected - possible infinite scroll issue`);
        results.issues.push('Gallery shows duplicate images - infinite scroll may be broken');
      }
      
    } else {
      console.log('✗ Gallery page redirects to login');
    }

  } catch (error) {
    console.error(`Test error: ${error.message}`);
    results.error = error.message;
    results.issues.push(`Critical error: ${error.message}`);
    
    if (page) {
      try {
        await page.screenshot({ path: 'test-error.png', fullPage: true });
      } catch {}
    }
  } finally {
    if (browser) {
      await browser.close();
    }
  }

  // Generate summary
  console.log('\n=== DIRECT TESTING SUMMARY ===');
  console.log(`Gallery API: ${results.gallery.apiWorks ? 'WORKING' : 'BLOCKED'}`);
  console.log(`Models API: ${results.models?.apiWorks ? 'WORKING' : 'BLOCKED'}`);
  console.log(`Generator UI: ${results.ui.generatorAccessible ? 'ACCESSIBLE' : 'BLOCKED'}`);
  console.log(`Gallery UI: ${results.ui.galleryAccessible ? 'ACCESSIBLE' : 'BLOCKED'}`);
  console.log(`Issues Found: ${results.issues.length}`);
  
  if (results.issues.length > 0) {
    console.log('\nISSUES TO ADDRESS:');
    results.issues.forEach((issue, i) => {
      console.log(`  ${i + 1}. ${issue}`);
    });
  }

  // Save results
  fs.writeFileSync('direct-gallery-test-results.json', JSON.stringify(results, null, 2));
  console.log('\n✓ Results saved to: direct-gallery-test-results.json');

  return results;
}

testGalleryDirectly().catch(console.error);
