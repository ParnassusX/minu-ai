/**
 * Global Setup for Playwright Tests
 * Minu.AI Generator V2 End-to-End Testing
 */

import { chromium, FullConfig } from '@playwright/test'

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting Minu.AI Generator V2 E2E Test Suite')
  console.log('=' .repeat(60))
  
  // Wait for the server to be ready
  const browser = await chromium.launch()
  const page = await browser.newPage()
  
  try {
    console.log('⏳ Waiting for server to be ready...')
    
    // Check if the server is responding
    let retries = 0
    const maxRetries = 30 // 30 seconds
    
    while (retries < maxRetries) {
      try {
        await page.goto('http://localhost:4000/api/generate-v2', { 
          waitUntil: 'networkidle',
          timeout: 5000 
        })
        
        const response = await page.textContent('body')
        if (response && response.includes('success')) {
          console.log('✅ Server is ready and responding')
          break
        }
      } catch (error) {
        retries++
        if (retries >= maxRetries) {
          throw new Error('Server failed to start within timeout period')
        }
        console.log(`⏳ Waiting for server... (${retries}/${maxRetries})`)
        await page.waitForTimeout(1000)
      }
    }
    
    // Verify critical APIs are working
    console.log('🔍 Verifying critical APIs...')
    
    const apiChecks = [
      { name: 'Generate V2 API', url: '/api/generate-v2' },
      { name: 'Models V2 API', url: '/api/models-v2' },
      { name: 'Auth Check API', url: '/api/auth-check' }
    ]
    
    for (const check of apiChecks) {
      try {
        await page.goto(`http://localhost:4000${check.url}`, { 
          waitUntil: 'networkidle',
          timeout: 10000 
        })
        console.log(`✅ ${check.name} - OK`)
      } catch (error) {
        console.log(`❌ ${check.name} - FAILED`)
        throw new Error(`Critical API ${check.name} is not responding`)
      }
    }
    
    // Verify test pages are accessible
    console.log('🔍 Verifying test pages...')
    
    const testPages = [
      { name: 'Dev Access Portal', url: '/dev-access' },
      { name: 'Generator V2 Test', url: '/generator-v2-test' },
      { name: 'System Status', url: '/system-status' }
    ]
    
    for (const testPage of testPages) {
      try {
        await page.goto(`http://localhost:4000${testPage.url}`, { 
          waitUntil: 'networkidle',
          timeout: 10000 
        })
        console.log(`✅ ${testPage.name} - OK`)
      } catch (error) {
        console.log(`⚠️ ${testPage.name} - WARNING (may affect tests)`)
      }
    }
    
    console.log('✅ Global setup completed successfully')
    console.log('🧪 Ready to run end-to-end tests')
    console.log('=' .repeat(60))
    
  } catch (error) {
    console.error('❌ Global setup failed:', error)
    throw error
  } finally {
    await browser.close()
  }
}

export default globalSetup
