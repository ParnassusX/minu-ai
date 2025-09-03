const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// Manual production validation without external dependencies
// Assumes Next.js server is running on localhost:4000

const PRIORITY_MODELS = [
  'flux-schnell',
  'flux-ultra', 
  'flux-kontext-pro',
  'flux-kontext-max',
  'seedream-3'
];

async function setupEnvironment() {
  // Read .env.local and set environment variables
  const envPath = path.join(__dirname, '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n');
    
    for (const line of lines) {
      if (line.trim() && !line.startsWith('#')) {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=').trim();
          process.env[key.trim()] = value;
        }
      }
    }
  }
  
  // Set production environment
  process.env.NODE_ENV = 'production';
  
  console.log('Environment configured for production validation');
}

async function startProductionServer() {
  const { spawn } = require('child_process');
  
  console.log('Starting Next.js production server...');
  
  // Build first
  const buildProcess = spawn('npm', ['run', 'build'], { 
    stdio: 'inherit',
    shell: true,
    cwd: __dirname
  });
  
  await new Promise((resolve, reject) => {
    buildProcess.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Build failed with code ${code}`));
    });
  });
  
  // Start production server
  const serverProcess = spawn('npx', ['next', 'start', '-p', '4000'], {
    stdio: 'pipe',
    shell: true,
    cwd: __dirname,
    detached: true
  });
  
  // Wait for server to be ready
  await new Promise((resolve) => {
    const checkServer = async () => {
      try {
        const response = await fetch('http://localhost:4000/api/health');
        if (response.ok) {
          console.log('Production server is ready');
          resolve();
        } else {
          setTimeout(checkServer, 1000);
        }
      } catch {
        setTimeout(checkServer, 1000);
      }
    };
    setTimeout(checkServer, 2000);
  });
  
  return serverProcess;
}

async function validateSecurity() {
  console.log('\n=== Security Validation ===');
  
  const results = {};
  
  try {
    // Test API headers
    const healthResponse = await fetch('http://localhost:4000/api/health');
    results.headers = {
      status: healthResponse.status,
      cacheControl: healthResponse.headers.get('cache-control')
    };
    
    // Test webhook signature validation (should return 401 for invalid signature)
    const webhookResponse = await fetch('http://localhost:4000/api/replicate/webhook', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-replicate-signature': 'invalid-signature'
      },
      body: JSON.stringify({ test: 'data' })
    });
    results.webhook = { invalidStatus: webhookResponse.status };
    
    console.log('Security validation results:', JSON.stringify(results, null, 2));
    return results;
    
  } catch (error) {
    console.error('Security validation error:', error.message);
    return { error: error.message };
  }
}

async function validateModelGeneration() {
  console.log('\n=== Model Generation Validation ===');
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  const results = [];
  
  try {
    // Login
    await page.goto('http://localhost:4000/auth/login', { waitUntil: 'networkidle' });
    await page.fill('#email', 'test@minu.ai');
    await page.fill('#password', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/generator', { timeout: 20000 });
    
    console.log('Successfully logged in and navigated to generator');
    
    // Test each priority model
    for (const modelId of PRIORITY_MODELS) {
      console.log(`\nTesting model: ${modelId}`);
      
      const prompt = `production-test-${modelId}-${Date.now()}`;
      const body = {
        model: modelId,
        mode: 'images',
        input: { prompt },
        options: {}
      };
      
      // Get session cookies
      const cookies = await context.cookies();
      const cookieHeader = cookies.map(c => `${c.name}=${c.value}`).join('; ');
      
      // Call generation API
      const response = await page.request.post('http://localhost:4000/api/generate-v2', {
        headers: {
          'content-type': 'application/json',
          'cookie': cookieHeader
        },
        data: body
      });
      
      const status = response.status();
      const responseData = await response.json().catch(() => ({}));
      
      console.log(`Model ${modelId} - Status: ${status}`);
      
      if (status === 200) {
        // Wait for completion and check gallery
        console.log(`Waiting for ${modelId} to complete...`);
        
        let found = null;
        const startTime = Date.now();
        const timeout = 8 * 60 * 1000; // 8 minutes
        
        while (Date.now() - startTime < timeout) {
          await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
          
          const galleryResponse = await page.request.get('http://localhost:4000/api/gallery');
          const galleryData = await galleryResponse.json().catch(() => ({}));
          
          if (Array.isArray(galleryData?.data)) {
            found = galleryData.data.find(item => 
              item?.original_prompt?.includes(prompt)
            );
            
            if (found) {
              console.log(`Found gallery item for ${modelId}:`, found.id);
              break;
            }
          }
        }
        
        results.push({
          model: modelId,
          status,
          success: !!found,
          galleryId: found?.id,
          imageUrl: found?.file_path,
          createdAt: found?.created_at
        });
        
      } else {
        results.push({
          model: modelId,
          status,
          success: false,
          error: responseData?.error || 'Unknown error'
        });
      }
    }
    
    // Take final gallery screenshot
    await page.goto('http://localhost:4000/gallery', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    await page.screenshot({ 
      path: 'production-gallery-validation.png', 
      fullPage: true 
    });
    
    console.log('Gallery screenshot saved: production-gallery-validation.png');
    
  } catch (error) {
    console.error('Model validation error:', error.message);
    results.push({ error: error.message });
  } finally {
    await browser.close();
  }
  
  return results;
}

async function main() {
  try {
    console.log('Starting Minu.AI Production Validation');
    console.log('=====================================');
    
    // Setup environment
    await setupEnvironment();
    
    // Start production server
    const serverProcess = await startProductionServer();
    
    // Run validations
    const securityResults = await validateSecurity();
    const modelResults = await validateModelGeneration();
    
    // Output final results
    console.log('\n=== FINAL VALIDATION RESULTS ===');
    console.log('Security:', JSON.stringify(securityResults, null, 2));
    console.log('Models:', JSON.stringify(modelResults, null, 2));
    
    // Save results to file
    const finalResults = {
      timestamp: new Date().toISOString(),
      security: securityResults,
      models: modelResults
    };
    
    fs.writeFileSync('production-validation-results.json', JSON.stringify(finalResults, null, 2));
    console.log('\nResults saved to: production-validation-results.json');
    
    // Cleanup
    if (serverProcess && !serverProcess.killed) {
      serverProcess.kill();
    }
    
  } catch (error) {
    console.error('Validation failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
