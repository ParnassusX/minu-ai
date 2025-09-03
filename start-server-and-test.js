const { spawn } = require('child_process');
const { chromium } = require('playwright');
const http = require('http');

async function startServerAndTest() {
  console.log('🚀 STARTING SERVER AND TESTING APPLICATION');
  console.log('==========================================');
  
  // Start Next.js production server (since dev server has issues)
  console.log('🏗️ Starting Next.js production server...');
  
  const server = spawn('node_modules\\.bin\\next', ['start', '-p', '4000'], {
    stdio: ['pipe', 'pipe', 'pipe'],
    shell: true,
    cwd: process.cwd()
  });
  
  let serverOutput = '';
  let serverReady = false;
  
  server.stdout.on('data', (data) => {
    const output = data.toString();
    serverOutput += output;
    console.log('SERVER:', output.trim());
    
    if (output.includes('ready') || output.includes('Local:') || output.includes('localhost:4000') || output.includes('started server')) {
      serverReady = true;
      console.log('✅ Server appears to be ready!');
    }
  });
  
  server.stderr.on('data', (data) => {
    const error = data.toString();
    console.log('SERVER ERROR:', error.trim());
  });
  
  // Wait for server to start
  console.log('⏳ Waiting for server to start...');
  await new Promise(resolve => setTimeout(resolve, 10000));
  
  // Test server with simple HTTP request first
  console.log('🔍 Testing server with HTTP request...');
  try {
    await new Promise((resolve, reject) => {
      const req = http.get('http://localhost:4000/api/health', (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          console.log('✅ /api/health response:', res.statusCode, data.substring(0, 100));
          resolve();
        });
      });
      req.on('error', reject);
      req.setTimeout(5000, () => reject(new Error('Timeout')));
    });
  } catch (error) {
    console.log('❌ HTTP test failed:', error.message);
  }
  
  // Test with browser automation
  console.log('🌐 Testing with browser automation...');
  
  try {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    
    // Capture console logs
    const consoleLogs = [];
    page.on('console', msg => {
      consoleLogs.push(`${msg.type()}: ${msg.text()}`);
    });
    
    // Test login page
    console.log('🔐 Testing login page...');
    try {
      await page.goto('http://localhost:4000/auth/login', { timeout: 15000 });
      await page.screenshot({ path: 'test-login-page.png', fullPage: true });
      console.log('✅ Login page loaded - screenshot saved');
      
      // Test login form
      const emailInput = await page.locator('#email, input[type="email"]').first();
      const passwordInput = await page.locator('#password, input[type="password"]').first();
      const submitButton = await page.locator('button[type="submit"], button:has-text("Sign In")').first();
      
      console.log('📝 Testing login form...');
      await emailInput.fill('test@minu.ai');
      await passwordInput.fill('password123');
      
      console.log('🔐 Submitting login...');
      await submitButton.click();
      
      // Wait for response
      await page.waitForTimeout(8000);
      await page.screenshot({ path: 'test-after-login.png', fullPage: true });
      
      const currentUrl = page.url();
      console.log('📍 Current URL after login:', currentUrl);
      
      if (currentUrl.includes('/generator')) {
        console.log('✅ Login successful - redirected to generator');
        
        // Test generator functionality
        console.log('🎨 Testing generator functionality...');
        
        // Check if model is preselected
        const modelSelector = await page.locator('select, [role="combobox"]').first();
        const modelValue = await modelSelector.inputValue().catch(() => '');
        console.log('🤖 Model selector value:', modelValue);
        
        // Test prompt input and Generate button
        const promptInput = await page.locator('textarea, input[placeholder*="prompt"], input[placeholder*="Prompt"]').first();
        await promptInput.fill('test');
        
        await page.waitForTimeout(1000);
        
        const generateButton = await page.locator('button:has-text("Generate"), button[type="submit"]').first();
        const isEnabled = await generateButton.isEnabled();
        
        console.log('🎯 Generate button enabled after typing "test":', isEnabled);
        
        if (isEnabled) {
          console.log('✅ Generate button enablement working correctly');
          await page.screenshot({ path: 'test-generator-ready.png', fullPage: true });
          
          // Test actual generation (optional - costs money)
          console.log('💰 Skipping actual generation to avoid costs');
        } else {
          console.log('❌ Generate button not enabled - needs investigation');
        }
        
      } else {
        console.log('❌ Login failed - still on login page or error occurred');
        
        // Check for error messages
        const errorAlert = await page.locator('[role="alert"], .alert, .error').first();
        const errorText = await errorAlert.textContent().catch(() => '');
        if (errorText) {
          console.log('🚨 Error message:', errorText);
        }
      }
      
    } catch (error) {
      console.log('❌ Browser test failed:', error.message);
    }
    
    await browser.close();
    
    console.log('\n📊 CONSOLE LOGS:');
    consoleLogs.slice(0, 10).forEach(log => console.log('  ', log));
    
  } catch (browserError) {
    console.error('❌ Browser testing failed:', browserError);
  }
  
  // Clean up
  console.log('\n🧹 Cleaning up...');
  server.kill();
  
  console.log('\n📋 SUMMARY:');
  console.log('Server Ready:', serverReady);
  console.log('Server Output Length:', serverOutput.length);
  
  if (serverOutput) {
    console.log('\n📤 SERVER OUTPUT:');
    console.log(serverOutput.substring(0, 500));
  }
}

startServerAndTest().catch(console.error);
