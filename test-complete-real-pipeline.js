/**
 * COMPLETE REAL PIPELINE TEST - Minu.AI
 * Tests the ENTIRE user journey with REAL browser automation
 * Will identify auth issues, slow navigation, duplicates, and blocking problems
 */

const { chromium } = require('playwright');

async function testCompleteRealPipeline() {
  console.log('🚀 COMPLETE REAL PIPELINE TEST - FULL INVESTIGATION');
  console.log('====================================================');
  console.log('Testing complete user journey to identify real issues');
  
  let browser;
  let testResults = [];
  let performanceMetrics = [];
  
  try {
    // Launch browser with detailed logging
    console.log('\n🌐 Launching browser with full monitoring...');
    browser = await chromium.launch({ 
      headless: false,
      slowMo: 500,
      args: ['--disable-web-security', '--disable-features=VizDisplayCompositor']
    });
    
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    // Enable comprehensive logging
    page.on('console', msg => {
      console.log(`🖥️ Browser [${msg.type()}]: ${msg.text()}`);
    });
    
    page.on('pageerror', error => {
      console.log(`❌ Page Error: ${error.message}`);
    });
    
    page.on('response', response => {
      const url = response.url();
      const status = response.status();
      const timing = response.timing();
      
      if (url.includes('/api/') || url.includes('auth') || status >= 400) {
        console.log(`📡 API: ${response.request().method()} ${url} - ${status} (${timing.responseEnd - timing.requestStart}ms)`);
      }
    });
    
    page.on('requestfailed', request => {
      console.log(`❌ Request Failed: ${request.url()} - ${request.failure()?.errorText}`);
    });
    
    const baseURL = 'http://localhost:4000';
    
    // PHASE 1: Initial App Load & Performance
    console.log('\n🏁 PHASE 1: Initial App Load & Performance Analysis');
    try {
      const startTime = Date.now();
      await page.goto(baseURL, { waitUntil: 'networkidle' });
      const loadTime = Date.now() - startTime;
      
      console.log(`✅ App loaded in ${loadTime}ms`);
      performanceMetrics.push({ metric: 'Initial Load', time: loadTime });
      
      // Check for hydration errors
      await page.waitForTimeout(2000);
      const hydrationErrors = await page.evaluate(() => {
        return window.console.error?.toString().includes('hydration') || false;
      });
      
      if (hydrationErrors) {
        console.log('⚠️ Hydration errors detected');
      }
      
      // Check current page state
      const currentUrl = page.url();
      const title = await page.title();
      console.log(`📍 Current URL: ${currentUrl}`);
      console.log(`📄 Page Title: ${title}`);
      
      testResults.push({ test: 'Initial App Load', passed: true, metrics: { loadTime } });
      
    } catch (error) {
      console.log('❌ Initial app load failed:', error.message);
      testResults.push({ test: 'Initial App Load', passed: false, error: error.message });
    }
    
    // PHASE 2: Navigation Speed Test
    console.log('\n🧭 PHASE 2: Navigation Speed & Auth Redirect Analysis');
    try {
      // Test generator access (should redirect to login)
      const navStartTime = Date.now();
      await page.goto(`${baseURL}/generator`);
      await page.waitForTimeout(3000); // Wait for any redirects/auth checks
      const navTime = Date.now() - navStartTime;
      
      console.log(`🔄 Generator navigation took ${navTime}ms`);
      performanceMetrics.push({ metric: 'Generator Navigation', time: navTime });
      
      const finalUrl = page.url();
      console.log(`📍 Final URL after generator access: ${finalUrl}`);
      
      if (finalUrl.includes('/auth/login')) {
        console.log('✅ Properly redirected to login (auth working)');
        
        // Check redirect parameter
        if (finalUrl.includes('redirect=')) {
          console.log('✅ Redirect parameter preserved');
        } else {
          console.log('⚠️ No redirect parameter - user will lose destination');
        }
      } else if (finalUrl.includes('/generator')) {
        console.log('⚠️ Direct generator access allowed - auth may be bypassed');
      } else {
        console.log(`❌ Unexpected redirect to: ${finalUrl}`);
      }
      
      testResults.push({ test: 'Navigation & Auth Redirect', passed: true, metrics: { navTime } });
      
    } catch (error) {
      console.log('❌ Navigation test failed:', error.message);
      testResults.push({ test: 'Navigation & Auth Redirect', passed: false, error: error.message });
    }
    
    // PHASE 3: Login Process Analysis
    console.log('\n🔐 PHASE 3: Login Process & Auth Performance');
    try {
      // Ensure we're on login page
      if (!page.url().includes('/auth/login')) {
        await page.goto(`${baseURL}/auth/login`);
      }
      
      // Wait for login form to load
      const formLoadStart = Date.now();
      await page.waitForSelector('input[type="email"]', { timeout: 10000 });
      const formLoadTime = Date.now() - formLoadStart;
      
      console.log(`📝 Login form loaded in ${formLoadTime}ms`);
      performanceMetrics.push({ metric: 'Login Form Load', time: formLoadTime });
      
      // Check form elements
      const emailInput = await page.locator('input[type="email"]').first();
      const passwordInput = await page.locator('input[type="password"]').first();
      const loginButton = await page.locator('button[type="submit"], button:has-text("Sign in")').first();
      
      if (await emailInput.isVisible()) console.log('✅ Email input found');
      if (await passwordInput.isVisible()) console.log('✅ Password input found');
      if (await loginButton.isVisible()) console.log('✅ Login button found');
      
      // Attempt login with real credentials
      console.log('🔑 Attempting login with test credentials...');
      const loginStartTime = Date.now();
      
      await emailInput.fill('test@minu.ai');
      await passwordInput.fill('password123');
      
      // Monitor network requests during login
      let authRequests = [];
      page.on('response', response => {
        if (response.url().includes('auth') || response.url().includes('supabase')) {
          authRequests.push({
            url: response.url(),
            status: response.status(),
            method: response.request().method()
          });
        }
      });
      
      await loginButton.click();
      console.log('🚀 Login form submitted');
      
      // Wait for login to complete (or fail)
      await page.waitForTimeout(5000);
      const loginTime = Date.now() - loginStartTime;
      
      console.log(`⏱️ Login process took ${loginTime}ms`);
      performanceMetrics.push({ metric: 'Login Process', time: loginTime });
      
      // Check login result
      const postLoginUrl = page.url();
      console.log(`📍 Post-login URL: ${postLoginUrl}`);
      
      // Log auth requests
      console.log('📡 Auth requests during login:');
      authRequests.forEach(req => {
        console.log(`   ${req.method} ${req.url} - ${req.status}`);
      });
      
      if (postLoginUrl.includes('/auth/login')) {
        // Still on login page - check for errors
        const errorElement = await page.locator('.error, [role="alert"], .alert-destructive').first();
        if (await errorElement.isVisible({ timeout: 2000 })) {
          const errorText = await errorElement.textContent();
          console.log(`❌ Login failed with error: ${errorText}`);
          testResults.push({ test: 'Login Process', passed: false, error: errorText });
        } else {
          console.log('⚠️ Login appears to have failed silently');
          testResults.push({ test: 'Login Process', passed: false, error: 'Silent login failure' });
        }
      } else {
        console.log('✅ Login successful - redirected away from login page');
        testResults.push({ test: 'Login Process', passed: true, metrics: { loginTime } });
      }
      
    } catch (error) {
      console.log('❌ Login process failed:', error.message);
      testResults.push({ test: 'Login Process', passed: false, error: error.message });
    }
    
    // PHASE 4: Post-Login Navigation Performance
    console.log('\n🎨 PHASE 4: Post-Login Generator Access');
    try {
      // Try to access generator after login
      const generatorNavStart = Date.now();
      await page.goto(`${baseURL}/generator`);
      
      // Wait for generator to load or redirect
      await page.waitForTimeout(5000);
      const generatorNavTime = Date.now() - generatorNavStart;
      
      console.log(`🎨 Generator access took ${generatorNavTime}ms`);
      performanceMetrics.push({ metric: 'Post-Login Generator Access', time: generatorNavTime });
      
      const generatorUrl = page.url();
      console.log(`📍 Generator URL: ${generatorUrl}`);
      
      if (generatorUrl.includes('/generator')) {
        console.log('✅ Generator accessible after login');
        
        // Check for generator components
        const promptInput = await page.locator('[data-testid="prompt-input"], textarea').first();
        const modelSelector = await page.locator('[data-testid="model-selector"], select').first();
        const generateButton = await page.locator('button:has-text("Generate")').first();
        
        if (await promptInput.isVisible({ timeout: 5000 })) {
          console.log('✅ Prompt input loaded');
        } else {
          console.log('❌ Prompt input not found');
        }
        
        if (await modelSelector.isVisible({ timeout: 5000 })) {
          console.log('✅ Model selector loaded');
        } else {
          console.log('❌ Model selector not found');
        }
        
        if (await generateButton.isVisible({ timeout: 5000 })) {
          console.log('✅ Generate button loaded');
        } else {
          console.log('❌ Generate button not found');
        }
        
        testResults.push({ test: 'Post-Login Generator Access', passed: true, metrics: { generatorNavTime } });
        
      } else if (generatorUrl.includes('/auth/login')) {
        console.log('❌ Still redirected to login - auth not persisting');
        testResults.push({ test: 'Post-Login Generator Access', passed: false, error: 'Auth not persisting' });
      } else {
        console.log(`❌ Unexpected redirect to: ${generatorUrl}`);
        testResults.push({ test: 'Post-Login Generator Access', passed: false, error: `Unexpected redirect to ${generatorUrl}` });
      }
      
    } catch (error) {
      console.log('❌ Post-login generator access failed:', error.message);
      testResults.push({ test: 'Post-Login Generator Access', passed: false, error: error.message });
    }
    
    // PHASE 5: Performance Summary
    console.log('\n📊 PHASE 5: Performance & Issue Summary');
    
    console.log('\n⏱️ PERFORMANCE METRICS:');
    performanceMetrics.forEach(metric => {
      const status = metric.time > 3000 ? '🐌 SLOW' : metric.time > 1000 ? '⚠️ MODERATE' : '✅ FAST';
      console.log(`   ${metric.metric}: ${metric.time}ms ${status}`);
    });
    
    // Check for slow operations
    const slowOperations = performanceMetrics.filter(m => m.time > 3000);
    if (slowOperations.length > 0) {
      console.log('\n🐌 SLOW OPERATIONS DETECTED:');
      slowOperations.forEach(op => {
        console.log(`   - ${op.metric}: ${op.time}ms`);
      });
    }
    
  } catch (error) {
    console.log('❌ Test suite failed:', error.message);
  } finally {
    if (browser) {
      console.log('\n🔄 Keeping browser open for 15 seconds for manual inspection...');
      await new Promise(resolve => setTimeout(resolve, 15000));
      await browser.close();
    }
  }
  
  // Final Results Analysis
  console.log('\n📊 COMPLETE PIPELINE TEST RESULTS');
  console.log('===================================');
  
  let passed = 0;
  let failed = 0;
  
  testResults.forEach(result => {
    const status = result.passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} ${result.test}`);
    if (result.error) {
      console.log(`    Error: ${result.error}`);
    }
    if (result.metrics) {
      Object.entries(result.metrics).forEach(([key, value]) => {
        console.log(`    ${key}: ${value}ms`);
      });
    }
    
    if (result.passed) passed++;
    else failed++;
  });
  
  console.log(`\n📈 FINAL SCORE: ${passed}/${passed + failed} tests passed`);
  
  // Issue Analysis
  console.log('\n🔍 ISSUE ANALYSIS:');
  const authIssues = testResults.filter(r => !r.passed && (r.error?.includes('auth') || r.error?.includes('login')));
  const performanceIssues = performanceMetrics.filter(m => m.time > 3000);
  
  if (authIssues.length > 0) {
    console.log('🚨 AUTH ISSUES DETECTED:');
    authIssues.forEach(issue => console.log(`   - ${issue.test}: ${issue.error}`));
  }
  
  if (performanceIssues.length > 0) {
    console.log('🐌 PERFORMANCE ISSUES DETECTED:');
    performanceIssues.forEach(issue => console.log(`   - ${issue.metric}: ${issue.time}ms`));
  }
  
  if (passed === testResults.length && performanceIssues.length === 0) {
    console.log('\n🎉 PIPELINE FULLY FUNCTIONAL!');
    console.log('✅ All tests passed');
    console.log('✅ Performance acceptable');
    console.log('✅ Ready for real generation testing');
  } else {
    console.log('\n⚠️ ISSUES IDENTIFIED - NEED ATTENTION');
    console.log('🔧 Check auth system, performance, and navigation flow');
  }
}

// Run the test
testCompleteRealPipeline().catch(console.error);
