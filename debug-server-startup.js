const { spawn } = require('child_process');
const { chromium } = require('playwright');

async function debugServerStartup() {
  console.log('🔍 DEBUGGING SERVER STARTUP');
  console.log('============================');
  
  // Start Next.js dev server with proper error capture
  console.log('🚀 Starting Next.js dev server...');
  
  const server = spawn('npx', ['next', 'dev', '-p', '4000'], {
    stdio: ['pipe', 'pipe', 'pipe'],
    shell: true,
    cwd: process.cwd()
  });
  
  let serverOutput = '';
  let serverError = '';
  let serverReady = false;
  
  server.stdout.on('data', (data) => {
    const output = data.toString();
    serverOutput += output;
    console.log('STDOUT:', output.trim());
    
    if (output.includes('ready') || output.includes('Local:') || output.includes('localhost:4000')) {
      serverReady = true;
      console.log('✅ Server appears to be ready!');
    }
  });
  
  server.stderr.on('data', (data) => {
    const error = data.toString();
    serverError += error;
    console.log('STDERR:', error.trim());
  });
  
  server.on('error', (error) => {
    console.error('❌ Server process error:', error);
  });
  
  // Wait for server to start or timeout
  console.log('⏳ Waiting for server to start...');
  await new Promise(resolve => setTimeout(resolve, 15000));
  
  // Test server accessibility
  console.log('\n🌐 Testing server accessibility...');
  
  try {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    
    // Capture console logs
    const consoleLogs = [];
    page.on('console', msg => {
      consoleLogs.push(`${msg.type()}: ${msg.text()}`);
    });
    
    // Test homepage
    console.log('📄 Testing homepage...');
    try {
      await page.goto('http://localhost:4000', { timeout: 10000 });
      await page.screenshot({ path: 'debug-homepage.png', fullPage: true });
      console.log('✅ Homepage accessible - screenshot saved');
    } catch (error) {
      console.log('❌ Homepage failed:', error.message);
    }
    
    // Test login page
    console.log('🔐 Testing login page...');
    try {
      await page.goto('http://localhost:4000/auth/login', { timeout: 10000 });
      await page.screenshot({ path: 'debug-login.png', fullPage: true });
      console.log('✅ Login page accessible - screenshot saved');
      
      // Check if login form is present
      const emailInput = await page.locator('#email, input[type="email"]').count();
      const passwordInput = await page.locator('#password, input[type="password"]').count();
      const submitButton = await page.locator('button[type="submit"], button:has-text("Sign In")').count();
      
      console.log(`📝 Login form elements: email=${emailInput}, password=${passwordInput}, submit=${submitButton}`);
      
    } catch (error) {
      console.log('❌ Login page failed:', error.message);
    }
    
    // Test API endpoints
    console.log('🔌 Testing API endpoints...');
    try {
      const healthResponse = await page.goto('http://localhost:4000/api/health', { timeout: 5000 });
      console.log('✅ /api/health status:', healthResponse?.status());
    } catch (error) {
      console.log('❌ /api/health failed:', error.message);
    }
    
    try {
      const authResponse = await page.goto('http://localhost:4000/api/auth-check', { timeout: 5000 });
      console.log('✅ /api/auth-check status:', authResponse?.status());
    } catch (error) {
      console.log('❌ /api/auth-check failed:', error.message);
    }
    
    await browser.close();
    
    console.log('\n📊 CONSOLE LOGS:');
    consoleLogs.forEach(log => console.log('  ', log));
    
  } catch (browserError) {
    console.error('❌ Browser testing failed:', browserError);
  }
  
  // Clean up
  console.log('\n🧹 Cleaning up...');
  server.kill();
  
  console.log('\n📋 SUMMARY:');
  console.log('Server Ready:', serverReady);
  console.log('Server Output Length:', serverOutput.length);
  console.log('Server Error Length:', serverError.length);
  
  if (serverOutput) {
    console.log('\n📤 SERVER OUTPUT:');
    console.log(serverOutput);
  }
  
  if (serverError) {
    console.log('\n❌ SERVER ERRORS:');
    console.log(serverError);
  }
}

debugServerStartup().catch(console.error);
