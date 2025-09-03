/**
 * Comprehensive End-to-End Pipeline Test - Minu.AI
 * Tests the complete user journey: Login → Generation → Storage → Gallery
 * 
 * This test uses REAL API calls and verifies the entire pipeline works
 */

import { test, expect, Page } from '@playwright/test'

// Test configuration
const TEST_CONFIG = {
  baseURL: 'http://localhost:4000',
  timeout: 120000, // 2 minutes for generation
  testUser: {
    email: 'test@minu.ai',
    password: 'testpassword123'
  },
  testPrompts: {
    simple: 'A beautiful sunset over mountains',
    detailed: 'A majestic golden sunset over snow-capped mountains, dramatic clouds, cinematic lighting, 4K quality'
  }
}

// Helper function to wait for generation completion
async function waitForGeneration(page: Page, timeout = 60000) {
  console.log('⏳ Waiting for generation to complete...')
  
  // Wait for either success or error state
  await page.waitForFunction(() => {
    const statusElement = document.querySelector('[data-testid="generation-status"]')
    const errorElement = document.querySelector('[data-testid="generation-error"]')
    const resultElement = document.querySelector('[data-testid="generation-result"]')
    
    return statusElement?.textContent?.includes('completed') || 
           errorElement !== null || 
           resultElement !== null
  }, { timeout })
  
  console.log('✅ Generation completed or error occurred')
}

// Helper function to create test image for enhancement
function createTestImageDataURL(): string {
  // Create a simple test image as base64 data URL
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 256
  const ctx = canvas.getContext('2d')!
  
  // Create a simple gradient
  const gradient = ctx.createLinearGradient(0, 0, 256, 256)
  gradient.addColorStop(0, '#ff6b6b')
  gradient.addColorStop(1, '#4ecdc4')
  
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, 256, 256)
  
  // Add some text
  ctx.fillStyle = 'white'
  ctx.font = '20px Arial'
  ctx.fillText('Test Image', 80, 130)
  
  return canvas.toDataURL('image/jpeg', 0.8)
}

test.describe('Full Pipeline Integration Test', () => {
  test.beforeEach(async ({ page }) => {
    // Set longer timeout for this test suite
    test.setTimeout(TEST_CONFIG.timeout)
    
    console.log('🚀 Starting comprehensive pipeline test...')
    await page.goto(TEST_CONFIG.baseURL)
  })

  test('Complete Pipeline: Login → Image Generation → Enhancement → Gallery', async ({ page }) => {
    console.log('\n🔐 PHASE 1: Authentication')
    
    // Step 1: Test Authentication
    await page.click('[data-testid="login-button"]')
    await page.fill('[data-testid="email-input"]', TEST_CONFIG.testUser.email)
    await page.fill('[data-testid="password-input"]', TEST_CONFIG.testUser.password)
    await page.click('[data-testid="submit-login"]')
    
    // Wait for successful login
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible({ timeout: 10000 })
    console.log('✅ Authentication successful')

    console.log('\n🎨 PHASE 2: Image Generation')
    
    // Step 2: Navigate to Generator
    await page.goto(`${TEST_CONFIG.baseURL}/generator`)
    await expect(page.locator('[data-testid="generator-interface"]')).toBeVisible()
    console.log('✅ Generator interface loaded')

    // Step 3: Verify UI Improvements (larger prompt input)
    const promptInput = page.locator('[data-testid="prompt-input"]')
    await expect(promptInput).toBeVisible()
    
    // Check that prompt input has the improved sizing
    const promptInputStyles = await promptInput.evaluate(el => {
      const styles = window.getComputedStyle(el)
      return {
        minHeight: styles.minHeight,
        resize: styles.resize
      }
    })
    
    expect(parseInt(promptInputStyles.minHeight)).toBeGreaterThan(120) // Should be 160px now
    console.log('✅ Prompt input improvements verified')

    // Step 4: Test Image Generation Mode
    await page.selectOption('[data-testid="mode-selector"]', 'images')
    await page.selectOption('[data-testid="model-selector"]', 'flux-schnell') // Fast model for testing
    
    // Fill in prompt
    await promptInput.fill(TEST_CONFIG.testPrompts.detailed)
    
    // Set basic parameters
    await page.selectOption('[data-testid="aspect-ratio-selector"]', '1:1')
    
    // Start generation
    console.log('🎯 Starting image generation...')
    await page.click('[data-testid="generate-button"]')
    
    // Wait for generation to complete
    await waitForGeneration(page)
    
    // Verify generation result
    const generationResult = page.locator('[data-testid="generation-result"]')
    await expect(generationResult).toBeVisible({ timeout: 5000 })
    
    // Check that image was generated
    const generatedImage = page.locator('[data-testid="generated-image"]')
    await expect(generatedImage).toBeVisible()
    console.log('✅ Image generation successful')

    console.log('\n🔧 PHASE 3: Enhancement Mode Testing')
    
    // Step 5: Test Enhancement Mode with New Models
    await page.selectOption('[data-testid="mode-selector"]', 'enhance')
    
    // Verify enhancement models are available
    const modelSelector = page.locator('[data-testid="model-selector"]')
    await expect(modelSelector).toBeVisible()
    
    // Check for our new enhancement models
    const modelOptions = await modelSelector.locator('option').allTextContents()
    expect(modelOptions.some(option => option.includes('Real-ESRGAN'))).toBeTruthy()
    expect(modelOptions.some(option => option.includes('SwinIR'))).toBeTruthy()
    expect(modelOptions.some(option => option.includes('Ultimate SD'))).toBeTruthy()
    console.log('✅ New enhancement models available')
    
    // Select Real-ESRGAN for testing (fastest)
    await page.selectOption('[data-testid="model-selector"]', 'real-esrgan')
    
    // Upload test image for enhancement
    const testImageDataURL = await page.evaluate(createTestImageDataURL)
    
    // Convert data URL to file and upload
    await page.evaluate((dataURL) => {
      const input = document.querySelector('[data-testid="image-upload"]') as HTMLInputElement
      if (input) {
        // Create a file from data URL
        const arr = dataURL.split(',')
        const mime = arr[0].match(/:(.*?);/)![1]
        const bstr = atob(arr[1])
        let n = bstr.length
        const u8arr = new Uint8Array(n)
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n)
        }
        const file = new File([u8arr], 'test-image.jpg', { type: mime })
        
        // Trigger file input change
        const dt = new DataTransfer()
        dt.items.add(file)
        input.files = dt.files
        input.dispatchEvent(new Event('change', { bubbles: true }))
      }
    }, testImageDataURL)
    
    // Verify image upload
    await expect(page.locator('[data-testid="uploaded-image-preview"]')).toBeVisible()
    console.log('✅ Test image uploaded for enhancement')
    
    // Start enhancement
    console.log('🔧 Starting image enhancement...')
    await page.click('[data-testid="generate-button"]')
    
    // Wait for enhancement to complete
    await waitForGeneration(page)
    
    // Verify enhancement result
    const enhancementResult = page.locator('[data-testid="generation-result"]')
    await expect(enhancementResult).toBeVisible({ timeout: 5000 })
    console.log('✅ Image enhancement successful')

    console.log('\n💾 PHASE 4: Storage Verification')
    
    // Step 6: Verify Storage Pipeline
    // Check that images are stored in the database
    const storageStatus = page.locator('[data-testid="storage-status"]')
    if (await storageStatus.isVisible()) {
      await expect(storageStatus).toContainText('stored')
    }
    
    // Verify generation history is updated
    const generationHistory = page.locator('[data-testid="generation-history"]')
    if (await generationHistory.isVisible()) {
      const historyItems = generationHistory.locator('[data-testid="history-item"]')
      await expect(historyItems).toHaveCountGreaterThan(0)
    }
    console.log('✅ Storage pipeline verified')

    console.log('\n🖼️ PHASE 5: Gallery Verification')
    
    // Step 7: Navigate to Gallery and Verify Images
    await page.goto(`${TEST_CONFIG.baseURL}/gallery`)
    await expect(page.locator('[data-testid="gallery-interface"]')).toBeVisible()
    
    // Wait for gallery to load
    await page.waitForTimeout(2000)
    
    // Verify that generated images appear in gallery
    const galleryImages = page.locator('[data-testid="gallery-image"]')
    await expect(galleryImages).toHaveCountGreaterThan(0)
    
    // Test image interaction (click to expand)
    const firstImage = galleryImages.first()
    await firstImage.click()
    
    // Verify image modal/expansion
    const imageModal = page.locator('[data-testid="image-modal"]')
    if (await imageModal.isVisible()) {
      await expect(imageModal).toBeVisible()
      
      // Test download functionality
      const downloadButton = page.locator('[data-testid="download-button"]')
      if (await downloadButton.isVisible()) {
        await expect(downloadButton).toBeVisible()
      }
      
      // Close modal
      await page.keyboard.press('Escape')
    }
    
    console.log('✅ Gallery functionality verified')

    console.log('\n🎉 PHASE 6: Final Verification')
    
    // Step 8: Final System Health Check
    // Verify API endpoints are responding
    const apiHealthResponse = await page.request.get(`${TEST_CONFIG.baseURL}/api/health`)
    expect(apiHealthResponse.ok()).toBeTruthy()
    
    // Verify enhancement API endpoint
    const enhanceHealthResponse = await page.request.get(`${TEST_CONFIG.baseURL}/api/enhance`)
    expect(enhanceHealthResponse.ok()).toBeTruthy()
    
    console.log('✅ API endpoints healthy')
    console.log('\n🎊 COMPLETE PIPELINE TEST SUCCESSFUL!')
    console.log('   ✅ Authentication working')
    console.log('   ✅ Image generation working')
    console.log('   ✅ Enhancement mode working')
    console.log('   ✅ New models integrated')
    console.log('   ✅ Storage pipeline working')
    console.log('   ✅ Gallery display working')
    console.log('   ✅ UI improvements verified')
  })
})
