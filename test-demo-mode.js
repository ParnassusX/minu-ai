const { chromium } = require('playwright');

async function testDemoMode() {
  console.log('=== TESTING DEMO MODE FUNCTIONALITY ===');
  
  let browser, context, page;

  try {
    browser = await chromium.launch({ headless: false, slowMo: 500 });
    context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
    page = await context.newPage();

    // Test 1: Check login page for development bypass
    console.log('\n1. Testing login page development bypass...');
    await page.goto('http://localhost:4000/auth/login');
    await page.waitForLoadState('networkidle');
    
    // Take screenshot
    await page.screenshot({ path: 'demo-mode-login.png', fullPage: true });
    
    // Check for development bypass section
    const devBypassSection = await page.locator('[data-testid="dev-bypass"]').count();
    const generatorButton = await page.locator('text=Generator V2 (Dev Mode)').count();
    const devPortalButton = await page.locator('text=Development Portal').count();
    
    console.log(`✓ Dev bypass section: ${devBypassSection > 0 ? 'FOUND' : 'NOT FOUND'}`);
    console.log(`✓ Generator button: ${generatorButton > 0 ? 'FOUND' : 'NOT FOUND'}`);
    console.log(`✓ Dev portal button: ${devPortalButton > 0 ? 'FOUND' : 'NOT FOUND'}`);

    // Test 2: Try direct generator access
    console.log('\n2. Testing direct generator access...');
    await page.goto('http://localhost:4000/generator');
    await page.waitForTimeout(5000);
    
    const currentUrl = page.url();
    console.log(`✓ Current URL: ${currentUrl}`);
    
    if (currentUrl.includes('/auth/login')) {
      console.log('✗ Redirected to login - demo mode not working');
    } else if (currentUrl.includes('/generator')) {
      console.log('✓ Generator accessible - demo mode working');
      
      // Take screenshot
      await page.screenshot({ path: 'demo-mode-generator.png', fullPage: true });
      
      // Check for development mode indicator
      const devModeIndicator = await page.locator('text=Development Mode Active').count();
      console.log(`✓ Dev mode indicator: ${devModeIndicator > 0 ? 'FOUND' : 'NOT FOUND'}`);
      
      // Check for generator components
      const promptInput = await page.locator('textarea, input[placeholder*="prompt"], input[placeholder*="Prompt"]').count();
      const generateButton = await page.locator('button:has-text("Generate"), button[type="submit"]').count();
      
      console.log(`✓ Prompt inputs: ${promptInput}`);
      console.log(`✓ Generate buttons: ${generateButton}`);
    }

    // Test 3: Check environment variable in browser
    console.log('\n3. Testing environment variable in browser...');
    const envCheck = await page.evaluate(() => {
      return {
        demoMode: process.env.NEXT_PUBLIC_DEMO_MODE,
        nodeEnv: process.env.NODE_ENV
      };
    });
    
    console.log(`✓ Browser env check:`, envCheck);

  } catch (error) {
    console.error('Demo mode test error:', error.message);
    
    if (page) {
      try {
        await page.screenshot({ path: 'demo-mode-error.png', fullPage: true });
      } catch {}
    }
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

testDemoMode().catch(console.error);
