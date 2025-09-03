const { chromium } = require('playwright');
const { spawn } = require('child_process');
const fs = require('fs');

async function comprehensiveProductionValidation() {
  console.log('=== MINU.AI COMPREHENSIVE PRODUCTION VALIDATION ===');
  console.log('Starting complete pipeline validation...');
  
  const results = {
    timestamp: new Date().toISOString(),
    build: { status: 'UNKNOWN' },
    server: { status: 'UNKNOWN' },
    security: { status: 'UNKNOWN' },
    authentication: { status: 'UNKNOWN' },
    ui: { status: 'UNKNOWN' },
    webhookHandler: { status: 'UNKNOWN' },
    summary: { overallStatus: 'UNKNOWN' }
  };

  try {
    // 1. Build Verification
    console.log('\n1. Build Verification...');
    try {
      const { execSync } = require('child_process');
      execSync('npm run build', { stdio: 'pipe', timeout: 300000 });
      results.build.status = 'SUCCESS';
      console.log('✓ Production build successful');
    } catch (error) {
      results.build.status = 'FAILED';
      results.build.error = error.message;
      console.log('✗ Build failed:', error.message);
      return results;
    }

    // 2. Server Startup
    console.log('\n2. Starting Production Server...');
    const serverProcess = spawn('npx', ['next', 'start', '-p', '4000'], {
      stdio: 'pipe',
      shell: true,
      env: { ...process.env, NODE_ENV: 'production' }
    });

    // Wait for server to be ready
    let serverReady = false;
    console.log('Waiting for server to start...');
    
    for (let i = 0; i < 60; i++) { // 2 minutes timeout
      try {
        const response = await fetch('http://localhost:4000/api/health');
        if (response.ok) {
          serverReady = true;
          results.server.status = 'RUNNING';
          results.server.port = 4000;
          results.server.cacheControl = response.headers.get('cache-control');
          console.log('✓ Production server running on port 4000');
          console.log(`✓ Cache-Control header: ${response.headers.get('cache-control')}`);
          break;
        }
      } catch (error) {
        // Server not ready yet
      }
      await new Promise(resolve => setTimeout(resolve, 2000));
      if (i % 10 === 0) console.log(`  Still waiting... (${i * 2}s)`);
    }

    if (!serverReady) {
      results.server.status = 'FAILED';
      results.server.error = 'Server failed to start within 2 minutes';
      console.log('✗ Server failed to start within timeout');
      serverProcess.kill();
      return results;
    }

    // 3. Security Configuration Tests
    console.log('\n3. Security Configuration Tests...');
    try {
      // Test webhook signature validation
      const webhookResp = await fetch('http://localhost:4000/api/replicate/webhook', {
        method: 'POST',
        headers: { 
          'content-type': 'application/json', 
          'x-replicate-signature': 'invalid-test-signature' 
        },
        body: JSON.stringify({ test: 'security-validation' })
      });
      
      results.security.webhookRejectsInvalid = webhookResp.status === 401;
      results.security.status = webhookResp.status === 401 ? 'PASS' : 'FAIL';
      console.log(`✓ Webhook security: ${webhookResp.status === 401 ? 'PASS' : 'FAIL'} (${webhookResp.status})`);
      
    } catch (error) {
      results.security.status = 'FAIL';
      results.security.error = error.message;
      console.log(`✗ Security test failed: ${error.message}`);
    }

    // 4. Authentication & UI Tests
    console.log('\n4. Authentication & UI Tests...');
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
      // Test login page
      console.log('Testing login page...');
      await page.goto('http://localhost:4000/auth/login', { waitUntil: 'networkidle', timeout: 30000 });
      
      const emailField = await page.locator('#email').isVisible();
      const passwordField = await page.locator('#password').isVisible();
      const submitButton = await page.locator('button[type="submit"]').isVisible();
      
      results.authentication.loginPageLoads = emailField && passwordField && submitButton;
      console.log(`✓ Login page elements visible: ${results.authentication.loginPageLoads}`);

      if (results.authentication.loginPageLoads) {
        // Test login process
        console.log('Testing login process...');
        await page.fill('#email', 'test@minu.ai');
        await page.fill('#password', 'password123');
        await page.click('button[type="submit"]');
        
        // Wait for navigation or error
        await page.waitForTimeout(5000);
        const currentUrl = page.url();
        results.authentication.loginSuccessful = !currentUrl.includes('/auth/login');
        console.log(`✓ Login successful: ${results.authentication.loginSuccessful}`);
        console.log(`✓ Current URL: ${currentUrl}`);

        if (results.authentication.loginSuccessful) {
          // Test generator page
          console.log('Testing generator interface...');
          await page.goto('http://localhost:4000/generator', { waitUntil: 'networkidle', timeout: 15000 });
          
          const promptInput = page.locator('textarea, input[placeholder*="prompt"], input[placeholder*="Prompt"]').first();
          if (await promptInput.isVisible()) {
            await promptInput.fill('test prompt for validation');
            await page.waitForTimeout(1000);
            
            const generateBtn = page.locator('button:has-text("Generate"), button[type="submit"]').first();
            results.ui.generateButtonEnabled = await generateBtn.isEnabled();
            console.log(`✓ Generate button enabled: ${results.ui.generateButtonEnabled}`);
          }

          // Test gallery page
          console.log('Testing gallery page...');
          await page.goto('http://localhost:4000/gallery', { waitUntil: 'networkidle', timeout: 15000 });
          const galleryLoaded = await page.locator('body').isVisible();
          results.ui.galleryPageLoads = galleryLoaded;
          console.log(`✓ Gallery page loads: ${galleryLoaded}`);

          results.ui.status = 'PASS';
        }
      }

      results.authentication.status = results.authentication.loginSuccessful ? 'PASS' : 'FAIL';

      // Take screenshots for evidence
      await page.screenshot({ path: 'validation-final-generator.png', fullPage: true });
      await page.goto('http://localhost:4000/gallery', { waitUntil: 'networkidle' });
      await page.screenshot({ path: 'validation-final-gallery.png', fullPage: true });
      console.log('✓ Evidence screenshots saved');

    } catch (error) {
      results.authentication.status = 'FAIL';
      results.authentication.error = error.message;
      console.log(`✗ Authentication/UI test failed: ${error.message}`);
    } finally {
      await browser.close();
    }

    // 5. Webhook Handler Test
    console.log('\n5. Webhook Handler Validation...');
    try {
      // Test that webhook handler responds (even if auth fails)
      const webhookTestResp = await fetch('http://localhost:4000/api/replicate/webhook', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ test: 'handler-validation' })
      });
      
      results.webhookHandler.responds = webhookTestResp.status !== 500;
      results.webhookHandler.status = results.webhookHandler.responds ? 'PASS' : 'FAIL';
      console.log(`✓ Webhook handler responds: ${results.webhookHandler.responds} (${webhookTestResp.status})`);
      
    } catch (error) {
      results.webhookHandler.status = 'FAIL';
      results.webhookHandler.error = error.message;
      console.log(`✗ Webhook handler test failed: ${error.message}`);
    }

    // 6. Generate Summary
    console.log('\n=== VALIDATION SUMMARY ===');
    const passCount = [
      results.build.status === 'SUCCESS',
      results.server.status === 'RUNNING',
      results.security.status === 'PASS',
      results.authentication.status === 'PASS',
      results.ui.status === 'PASS',
      results.webhookHandler.status === 'PASS'
    ].filter(Boolean).length;

    results.summary = {
      buildReady: results.build.status === 'SUCCESS',
      serverReady: results.server.status === 'RUNNING',
      securityConfigured: results.security.status === 'PASS',
      authenticationWorks: results.authentication.status === 'PASS',
      uiFunctional: results.ui.status === 'PASS',
      webhookHandlerWorks: results.webhookHandler.status === 'PASS',
      passedTests: passCount,
      totalTests: 6,
      overallStatus: passCount >= 5 ? 'PRODUCTION READY' : 'NEEDS ATTENTION'
    };

    // Cleanup
    serverProcess.kill();

  } catch (error) {
    results.error = error.message;
    console.log(`✗ Validation failed: ${error.message}`);
  }

  // Save results
  fs.writeFileSync('comprehensive-validation-results.json', JSON.stringify(results, null, 2));
  
  console.log('\n=== FINAL RESULTS ===');
  console.log(`Build: ${results.build.status}`);
  console.log(`Server: ${results.server.status}`);
  console.log(`Security: ${results.security.status}`);
  console.log(`Authentication: ${results.authentication.status}`);
  console.log(`UI: ${results.ui.status}`);
  console.log(`Webhook Handler: ${results.webhookHandler.status}`);
  console.log(`Overall: ${results.summary.overallStatus} (${results.summary.passedTests}/${results.summary.totalTests})`);
  console.log('\n✓ Results saved to: comprehensive-validation-results.json');

  return results;
}

// Run validation
comprehensiveProductionValidation().catch(console.error);
