const { chromium } = require('playwright');

async function testGenerationPipeline() {
  console.log('=== TESTING IMAGE GENERATION PIPELINE ===');
  
  let browser, context, page;

  try {
    browser = await chromium.launch({ headless: false, slowMo: 1000 });
    context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
    page = await context.newPage();

    // Step 1: Navigate to generator
    console.log('\n1. Navigating to generator...');
    await page.goto('http://localhost:4000/generator');
    
    // Wait for page to load with longer timeout
    await page.waitForTimeout(15000);
    
    const currentUrl = page.url();
    console.log(`✓ Current URL: ${currentUrl}`);
    
    // Take screenshot
    await page.screenshot({ path: 'generation-test-01-initial.png', fullPage: true });
    
    if (currentUrl.includes('/auth/login')) {
      console.log('✗ Redirected to login - authentication issue');
      return;
    }

    // Step 2: Look for generator interface elements
    console.log('\n2. Checking generator interface...');
    
    // Wait for any of these elements to appear
    try {
      await page.waitForSelector('textarea, input[placeholder*="prompt"], input[placeholder*="Prompt"], [data-testid="prompt-input"]', { timeout: 10000 });
      console.log('✓ Prompt input found');
    } catch (error) {
      console.log('✗ Prompt input not found, checking page content...');
      
      // Get page text content to debug
      const pageText = await page.textContent('body');
      console.log('Page content preview:', pageText.substring(0, 500));
      
      await page.screenshot({ path: 'generation-test-02-no-prompt.png', fullPage: true });
      return;
    }

    // Step 3: Fill in a test prompt
    console.log('\n3. Filling test prompt...');
    
    const promptInput = page.locator('textarea, input[placeholder*="prompt"], input[placeholder*="Prompt"], [data-testid="prompt-input"]').first();
    await promptInput.fill('A beautiful sunset over mountains, digital art');
    
    console.log('✓ Prompt filled');
    await page.screenshot({ path: 'generation-test-03-prompt-filled.png', fullPage: true });

    // Step 4: Look for generate button
    console.log('\n4. Looking for generate button...');
    
    const generateButton = page.locator('button:has-text("Generate"), button[type="submit"], [data-testid="generate-button"]').first();
    const isVisible = await generateButton.isVisible();
    const isEnabled = await generateButton.isEnabled();
    
    console.log(`✓ Generate button visible: ${isVisible}`);
    console.log(`✓ Generate button enabled: ${isEnabled}`);

    if (!isVisible) {
      console.log('✗ Generate button not found');
      return;
    }

    // Step 5: Test generation (click button)
    console.log('\n5. Testing image generation...');
    
    await generateButton.click();
    console.log('✓ Generate button clicked');
    
    // Wait for generation to start
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'generation-test-04-generation-started.png', fullPage: true });
    
    // Look for loading indicators or results
    const loadingIndicator = await page.locator('.animate-spin, [data-testid="loading"], text=Generating').count();
    const errorMessage = await page.locator('[role="alert"], .alert-destructive, text=Error').count();
    
    console.log(`✓ Loading indicators: ${loadingIndicator}`);
    console.log(`✓ Error messages: ${errorMessage}`);
    
    // Wait a bit more to see if generation completes
    console.log('\n6. Waiting for generation result...');
    await page.waitForTimeout(10000);
    
    await page.screenshot({ path: 'generation-test-05-final-result.png', fullPage: true });
    
    // Check for generated images
    const generatedImages = await page.locator('img[src*="cloudinary"], img[src*="replicate"], img[src*="blob:"]').count();
    console.log(`✓ Generated images found: ${generatedImages}`);
    
    if (generatedImages > 0) {
      console.log('🎉 IMAGE GENERATION SUCCESSFUL!');
    } else {
      console.log('⚠️ No generated images found - may still be processing');
    }

  } catch (error) {
    console.error('Generation pipeline test error:', error.message);
    
    if (page) {
      try {
        await page.screenshot({ path: 'generation-test-error.png', fullPage: true });
      } catch {}
    }
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

testGenerationPipeline().catch(console.error);
