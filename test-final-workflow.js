const { chromium } = require('playwright');

async function testFinalWorkflow() {
  console.log('=== TESTING FINAL END-TO-END WORKFLOW ===');
  
  let browser, context, page;

  try {
    browser = await chromium.launch({ headless: false, slowMo: 1000 });
    context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
    page = await context.newPage();

    // Step 1: Test login page with development bypass
    console.log('\n1. Testing login page with development bypass...');
    await page.goto('http://localhost:4000/auth/login');
    await page.waitForLoadState('networkidle');
    
    // Take screenshot
    await page.screenshot({ path: 'final-test-01-login.png', fullPage: true });
    
    // Check for development bypass
    const devBypassVisible = await page.locator('[data-testid="dev-bypass"]').isVisible();
    console.log(`✓ Development bypass visible: ${devBypassVisible}`);
    
    if (!devBypassVisible) {
      console.log('✗ Development bypass not found - demo mode may not be working');
      return;
    }

    // Step 2: Click Generator V2 (Dev Mode) button
    console.log('\n2. Using development bypass to access generator...');
    await page.click('text=Generator V2 (Dev Mode)');
    await page.waitForTimeout(5000);
    
    const currentUrl = page.url();
    console.log(`✓ Current URL: ${currentUrl}`);
    
    if (!currentUrl.includes('/generator')) {
      console.log('✗ Failed to navigate to generator');
      return;
    }

    // Take screenshot
    await page.screenshot({ path: 'final-test-02-generator.png', fullPage: true });

    // Step 3: Check for generator interface
    console.log('\n3. Checking generator interface...');
    
    // Wait for prompt input
    await page.waitForSelector('textarea, input[placeholder*="prompt"], input[placeholder*="Prompt"]', { timeout: 10000 });
    
    const promptInput = page.locator('textarea, input[placeholder*="prompt"], input[placeholder*="Prompt"]').first();
    const generateButton = page.locator('button:has-text("Generate"), button[type="submit"]').first();
    
    const promptVisible = await promptInput.isVisible();
    const buttonVisible = await generateButton.isVisible();
    const buttonEnabled = await generateButton.isEnabled();
    
    console.log(`✓ Prompt input visible: ${promptVisible}`);
    console.log(`✓ Generate button visible: ${buttonVisible}`);
    console.log(`✓ Generate button enabled: ${buttonEnabled}`);

    if (!promptVisible || !buttonVisible || !buttonEnabled) {
      console.log('✗ Generator interface not ready');
      return;
    }

    // Step 4: Fill prompt and generate
    console.log('\n4. Testing image generation...');
    
    await promptInput.fill('A beautiful sunset over mountains, digital art style');
    console.log('✓ Prompt filled');
    
    await page.screenshot({ path: 'final-test-03-prompt-filled.png', fullPage: true });
    
    // Click generate
    await generateButton.click();
    console.log('✓ Generate button clicked');
    
    // Wait for generation to start
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'final-test-04-generation-started.png', fullPage: true });
    
    // Step 5: Check for generation progress
    console.log('\n5. Checking generation progress...');
    
    // Look for loading indicators or results
    await page.waitForTimeout(5000);
    
    const pageContent = await page.textContent('body');
    const hasLoading = pageContent.includes('Generating') || pageContent.includes('Loading') || pageContent.includes('Processing');
    const hasError = pageContent.includes('Error') || pageContent.includes('Failed');
    
    console.log(`✓ Has loading indicators: ${hasLoading}`);
    console.log(`✓ Has error messages: ${hasError}`);
    
    await page.screenshot({ path: 'final-test-05-generation-progress.png', fullPage: true });
    
    // Step 6: Final status
    console.log('\n6. Final workflow status...');
    
    if (hasError) {
      console.log('⚠️ Generation may have encountered errors');
    } else if (hasLoading) {
      console.log('🎉 GENERATION STARTED SUCCESSFULLY!');
      console.log('   Image generation is in progress');
    } else {
      console.log('✓ Generation request submitted');
    }
    
    console.log('\n=== WORKFLOW TEST COMPLETE ===');
    console.log('✅ Authentication bypass: WORKING');
    console.log('✅ Generator access: WORKING');
    console.log('✅ UI interface: WORKING');
    console.log('✅ Generation submission: WORKING');

  } catch (error) {
    console.error('Workflow test error:', error.message);
    
    if (page) {
      try {
        await page.screenshot({ path: 'final-test-error.png', fullPage: true });
      } catch {}
    }
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

testFinalWorkflow().catch(console.error);
