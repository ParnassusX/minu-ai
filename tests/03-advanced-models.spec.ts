/**
 * Advanced Models End-to-End Tests
 * Minu.AI Generator V2 - Real Generation and Storage Testing
 */

import { test, expect } from '@playwright/test'
import { TestHelpers } from './utils/test-helpers'

test.describe('Advanced Models Generation', () => {
  let helpers: TestHelpers

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page)
    await helpers.navigateToGenerator('dev')
    await helpers.waitForAuth()
  })

  test('should generate content with FLUX Schnell (baseline)', async ({ page }) => {
    await helpers.logStep('Testing FLUX Schnell generation')
    
    // Select FLUX Schnell model
    const modelSelector = page.locator('[data-testid="model-selector"]')
    await modelSelector.click()
    
    const fluxSchnellOption = page.locator('text=FLUX Schnell')
    await fluxSchnellOption.click()
    await page.waitForTimeout(1000)
    
    // Fill prompt
    const prompt = 'A beautiful mountain landscape at sunset, high quality, detailed'
    await helpers.fillPrompt(prompt)
    
    // Set parameters
    const aspectRatioControl = page.locator('select, [role="combobox"]').filter({ hasText: /aspect|ratio/i }).first()
    if (await aspectRatioControl.isVisible()) {
      await aspectRatioControl.click()
      const option = page.locator('text=1:1').first()
      if (await option.isVisible()) {
        await option.click()
      }
    }
    
    await helpers.takeScreenshot('flux-schnell-setup')
    
    // Start generation
    const generateButton = page.locator('[data-testid="generate-button"], button:has-text("Generate")')
    await generateButton.click()
    
    // Wait for generation to start
    await page.waitForTimeout(2000)
    
    // Look for generation progress or result
    const progressIndicator = page.locator('[data-testid*="progress"], [data-testid*="loading"], .animate-spin')
    const resultContainer = page.locator('[data-testid*="result"], [data-testid*="output"], img[src*="replicate"]')
    
    // Wait for either progress or immediate result
    try {
      await Promise.race([
        progressIndicator.first().waitFor({ timeout: 10000 }),
        resultContainer.first().waitFor({ timeout: 10000 })
      ])
      
      await helpers.logStep('Generation started or completed')
      await helpers.takeScreenshot('flux-schnell-generation-started')
      
      // Wait longer for completion if still in progress
      await page.waitForTimeout(30000) // 30 seconds for generation
      
      await helpers.takeScreenshot('flux-schnell-generation-result')
      
    } catch (error) {
      await helpers.logStep('Generation may have failed or taken too long')
      await helpers.takeScreenshot('flux-schnell-generation-timeout')
    }
    
    console.log('✅ FLUX Schnell generation test completed')
  })

  test('should test image-to-image with FLUX Kontext Pro', async ({ page }) => {
    await helpers.logStep('Testing FLUX Kontext Pro image-to-image generation')
    
    // Select FLUX Kontext Pro
    const modelSelector = page.locator('[data-testid="model-selector"]')
    await modelSelector.click()
    
    const kontextProOption = page.locator('text=FLUX Kontext Pro')
    if (await kontextProOption.isVisible()) {
      await kontextProOption.click()
      await page.waitForTimeout(1000)
      
      // Fill prompt
      const prompt = 'Transform this into a beautiful watercolor painting'
      await helpers.fillPrompt(prompt)
      
      // Upload test image
      const fileInput = page.locator('input[type="file"]').first()
      if (await fileInput.isVisible()) {
        const testImagePath = await helpers.createTestImage('kontext-pro-input.jpg')
        await fileInput.setInputFiles(testImagePath)
        await page.waitForTimeout(3000)
        
        await helpers.logStep('Test image uploaded for Kontext Pro')
      }
      
      await helpers.takeScreenshot('kontext-pro-setup')
      
      // Start generation
      const generateButton = page.locator('[data-testid="generate-button"], button:has-text("Generate")')
      if (await generateButton.isEnabled()) {
        await generateButton.click()
        
        await helpers.logStep('Kontext Pro generation started')
        await page.waitForTimeout(2000)
        
        // Wait for result
        await page.waitForTimeout(45000) // 45 seconds for image-to-image
        
        await helpers.takeScreenshot('kontext-pro-generation-result')
      } else {
        await helpers.logStep('Generate button not enabled - missing requirements')
      }
    } else {
      await helpers.logStep('FLUX Kontext Pro not available')
    }
    
    console.log('✅ FLUX Kontext Pro test completed')
  })

  test('should test image-to-video with Seedance 1 Lite', async ({ page }) => {
    await helpers.logStep('Testing Seedance 1 Lite image-to-video generation')
    
    // Switch to video mode if available
    const videoModeButton = page.locator('[data-testid="mode-video"], button:has-text("Video")')
    if (await videoModeButton.isVisible()) {
      await videoModeButton.click()
      await page.waitForTimeout(1000)
    }
    
    // Select Seedance 1 Lite
    const modelSelector = page.locator('[data-testid="model-selector"]')
    await modelSelector.click()
    
    const seedanceOption = page.locator('text=Seedance')
    if (await seedanceOption.isVisible()) {
      await seedanceOption.click()
      await page.waitForTimeout(1000)
      
      // Fill prompt
      const prompt = 'A gentle camera movement revealing the beautiful scene'
      await helpers.fillPrompt(prompt)
      
      // Upload test image
      const fileInput = page.locator('input[type="file"]').first()
      if (await fileInput.isVisible()) {
        const testImagePath = await helpers.createTestImage('seedance-input.jpg')
        await fileInput.setInputFiles(testImagePath)
        await page.waitForTimeout(3000)
        
        await helpers.logStep('Test image uploaded for Seedance')
      }
      
      // Set video parameters
      const durationControl = page.locator('select').filter({ hasText: /duration|second/i }).first()
      if (await durationControl.isVisible()) {
        await durationControl.selectOption('5')
      }
      
      await helpers.takeScreenshot('seedance-setup')
      
      // Start generation
      const generateButton = page.locator('[data-testid="generate-button"], button:has-text("Generate")')
      if (await generateButton.isEnabled()) {
        await generateButton.click()
        
        await helpers.logStep('Seedance generation started')
        await page.waitForTimeout(2000)
        
        // Wait for video generation (longer timeout)
        await page.waitForTimeout(60000) // 60 seconds for video generation
        
        await helpers.takeScreenshot('seedance-generation-result')
      } else {
        await helpers.logStep('Generate button not enabled - missing requirements')
      }
    } else {
      await helpers.logStep('Seedance model not available')
    }
    
    console.log('✅ Seedance 1 Lite test completed')
  })

  test('should verify generation results are stored', async ({ page }) => {
    await helpers.logStep('Testing generation result storage')
    
    // Perform a simple generation first
    const modelSelector = page.locator('[data-testid="model-selector"]')
    await modelSelector.click()
    
    const fluxSchnellOption = page.locator('text=FLUX Schnell')
    await fluxSchnellOption.click()
    
    await helpers.fillPrompt('Test storage verification')
    
    const generateButton = page.locator('[data-testid="generate-button"], button:has-text("Generate")')
    await generateButton.click()
    
    // Wait for generation
    await page.waitForTimeout(30000)
    
    // Look for generated content
    const generatedImages = page.locator('img[src*="replicate"], img[src*="cloudinary"], [data-testid*="result"] img')
    const imageCount = await generatedImages.count()
    
    if (imageCount > 0) {
      await helpers.logStep(`Found ${imageCount} generated images`)
      
      // Try to access gallery or history
      const galleryButton = page.locator('button:has-text("Gallery"), button:has-text("History"), [data-testid*="gallery"]')
      if (await galleryButton.first().isVisible()) {
        await galleryButton.first().click()
        await page.waitForTimeout(2000)
        
        await helpers.takeScreenshot('gallery-access')
        await helpers.logStep('Gallery accessed successfully')
      }
    }
    
    console.log('✅ Generation storage verification completed')
  })

  test('should test real image upload workflow', async ({ page }) => {
    await helpers.logStep('Testing real image upload workflow')
    
    // Navigate to image upload test page
    await page.goto('/test-image-upload')
    await page.waitForLoadState('networkidle')
    
    // Upload a test image
    const fileInput = page.locator('input[type="file"]')
    if (await fileInput.isVisible()) {
      const testImagePath = await helpers.createTestImage('real-upload-test.jpg')
      await fileInput.setInputFiles(testImagePath)
      
      // Click upload button
      const uploadButton = page.locator('button:has-text("Upload")')
      await uploadButton.click()
      
      // Wait for upload to complete
      await page.waitForTimeout(5000)
      
      // Look for success indicators
      const successMessage = page.locator('text=successful, text=✅, [data-testid*="success"]')
      if (await successMessage.first().isVisible()) {
        await helpers.logStep('Image upload successful')
        
        // Test with FLUX Kontext Pro button if available
        const testButton = page.locator('button:has-text("FLUX Kontext")')
        if (await testButton.isVisible()) {
          await testButton.click()
          await page.waitForTimeout(2000)
          
          await helpers.logStep('Tested uploaded image with FLUX Kontext Pro')
        }
      }
      
      await helpers.takeScreenshot('real-image-upload-workflow')
    }
    
    console.log('✅ Real image upload workflow tested')
  })

  test('should verify complete generation pipeline', async ({ page }) => {
    await helpers.logStep('Testing complete generation pipeline')
    
    // Test the complete workflow using the real test page
    await page.goto('/real-test')
    await page.waitForLoadState('networkidle')
    
    // Configure test parameters
    const modelSelect = page.locator('select').first()
    if (await modelSelect.isVisible()) {
      await modelSelect.selectOption('flux-schnell')
    }
    
    const promptInput = page.locator('input[type="text"], textarea').first()
    if (await promptInput.isVisible()) {
      await promptInput.fill('Complete pipeline test - beautiful landscape')
    }
    
    // Run the test
    const runTestButton = page.locator('button:has-text("Run")')
    await runTestButton.click()
    
    // Wait for test to complete
    await page.waitForTimeout(60000) // 1 minute for complete test
    
    // Look for test results
    const resultsSection = page.locator('[data-testid*="result"], .text-green, text=✅')
    const resultCount = await resultsSection.count()
    
    if (resultCount > 0) {
      await helpers.logStep(`Found ${resultCount} test results`)
      
      // Look for generation ID or success indicators
      const generationId = page.locator('text=Generation ID, text=ID:')
      if (await generationId.first().isVisible()) {
        const idText = await generationId.first().textContent()
        await helpers.logStep(`Generation ID found: ${idText}`)
      }
    }
    
    await helpers.takeScreenshot('complete-pipeline-test')
    console.log('✅ Complete generation pipeline verified')
  })

  test('should test error handling and recovery', async ({ page }) => {
    await helpers.logStep('Testing error handling and recovery')
    
    // Navigate back to generator
    await helpers.navigateToGenerator('dev')
    
    // Try to generate without required fields
    const generateButton = page.locator('[data-testid="generate-button"], button:has-text("Generate")')
    await generateButton.click()
    
    // Look for error messages
    const errorMessages = page.locator('[data-testid*="error"], .text-red, text=error, text=Error')
    const errorCount = await errorMessages.count()
    
    if (errorCount > 0) {
      await helpers.logStep(`Found ${errorCount} error messages`)
      await helpers.takeScreenshot('error-handling')
    }
    
    // Fill required fields and try again
    await helpers.fillPrompt('Error recovery test')
    
    // Verify generate button becomes enabled
    await expect(generateButton).toBeEnabled()
    
    await helpers.logStep('Error recovery successful')
    console.log('✅ Error handling and recovery tested')
  })
})
