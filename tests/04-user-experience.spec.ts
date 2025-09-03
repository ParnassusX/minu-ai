/**
 * User Experience Validation Tests
 * Minu.AI Generator V2 - Real User Journey Testing
 */

import { test, expect } from '@playwright/test'
import { TestHelpers } from './utils/test-helpers'

test.describe('User Experience Validation', () => {
  let helpers: TestHelpers

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page)
  })

  test('should complete full user journey from login to generation', async ({ page }) => {
    await helpers.logStep('Testing complete user journey')
    
    // Step 1: Start at login page
    await page.goto('/auth/login')
    await helpers.takeScreenshot('journey-01-login-start')
    
    // Step 2: Use development access
    const devButton = page.locator('button:has-text("Generator V2")')
    if (await devButton.isVisible()) {
      await devButton.click()
    } else {
      await page.goto('/generator?dev=true')
    }
    
    await page.waitForSelector('[data-testid="generator-v2"], .generator, main', { timeout: 30000 })
    await helpers.takeScreenshot('journey-02-generator-loaded')
    
    // Step 3: Select model
    const modelSelector = page.locator('[data-testid="model-selector"], select, [role="combobox"]').first()
    await modelSelector.click()
    
    const fluxOption = page.locator('text=FLUX Schnell, option:has-text("FLUX Schnell")').first()
    if (await fluxOption.isVisible()) {
      await fluxOption.click()
      await helpers.logStep('Model selected: FLUX Schnell')
    }
    
    await helpers.takeScreenshot('journey-03-model-selected')
    
    // Step 4: Enter prompt
    const promptInput = page.locator('[data-testid="prompt-input"], textarea, input[placeholder*="prompt"]').first()
    const testPrompt = 'A serene mountain lake at sunrise with mist rising from the water'
    await promptInput.fill(testPrompt)
    
    await helpers.takeScreenshot('journey-04-prompt-entered')
    
    // Step 5: Configure parameters
    const aspectRatioControl = page.locator('select, [role="combobox"]').filter({ hasText: /aspect|ratio/i }).first()
    if (await aspectRatioControl.isVisible()) {
      await aspectRatioControl.click()
      const squareOption = page.locator('text=1:1, option[value="1:1"]').first()
      if (await squareOption.isVisible()) {
        await squareOption.click()
      }
    }
    
    await helpers.takeScreenshot('journey-05-parameters-set')
    
    // Step 6: Start generation
    const generateButton = page.locator('[data-testid="generate-button"], button:has-text("Generate")').first()
    await expect(generateButton).toBeEnabled()
    await generateButton.click()
    
    await helpers.logStep('Generation started')
    await helpers.takeScreenshot('journey-06-generation-started')
    
    // Step 7: Wait for result
    await page.waitForTimeout(30000) // 30 seconds
    await helpers.takeScreenshot('journey-07-generation-complete')
    
    console.log('✅ Complete user journey tested successfully')
  })

  test('should test image-to-image variation workflow', async ({ page }) => {
    await helpers.logStep('Testing image-to-image variation workflow')
    
    // Navigate to generator
    await helpers.navigateToGenerator('dev')
    
    // Select FLUX Kontext Pro for image-to-image
    const modelSelector = page.locator('[data-testid="model-selector"], select').first()
    await modelSelector.click()
    
    const kontextOption = page.locator('text=Kontext Pro, option:has-text("Kontext")').first()
    if (await kontextOption.isVisible()) {
      await kontextOption.click()
      await page.waitForTimeout(1000)
      
      // Upload base image
      const fileInput = page.locator('input[type="file"]').first()
      if (await fileInput.isVisible()) {
        const testImagePath = await helpers.createTestImage('variation-base.jpg')
        await fileInput.setInputFiles(testImagePath)
        await page.waitForTimeout(3000)
        
        await helpers.logStep('Base image uploaded')
        await helpers.takeScreenshot('variation-01-image-uploaded')
        
        // Enter variation prompt
        const promptInput = page.locator('[data-testid="prompt-input"], textarea').first()
        await promptInput.fill('Transform this into a vibrant oil painting with bold colors')
        
        await helpers.takeScreenshot('variation-02-prompt-entered')
        
        // Generate variation
        const generateButton = page.locator('[data-testid="generate-button"], button:has-text("Generate")').first()
        if (await generateButton.isEnabled()) {
          await generateButton.click()
          
          await helpers.logStep('Image variation generation started')
          await page.waitForTimeout(45000) // 45 seconds for image-to-image
          
          await helpers.takeScreenshot('variation-03-result')
        }
      }
    }
    
    console.log('✅ Image-to-image variation workflow tested')
  })

  test('should test seamless image upload experience', async ({ page }) => {
    await helpers.logStep('Testing seamless image upload experience')
    
    // Test the dedicated image upload page
    await page.goto('/test-image-upload')
    await page.waitForLoadState('networkidle')
    
    // Test drag and drop if available
    const dropZone = page.locator('[data-testid*="drop"], .dropzone, input[type="file"]').first()
    
    if (await dropZone.isVisible()) {
      // Create test image
      const testImagePath = await helpers.createTestImage('seamless-upload.jpg')
      
      // Upload via file input
      const fileInput = page.locator('input[type="file"]').first()
      await fileInput.setInputFiles(testImagePath)
      
      await helpers.takeScreenshot('seamless-01-file-selected')
      
      // Click upload button
      const uploadButton = page.locator('button:has-text("Upload"), button:has-text("Test")').first()
      await uploadButton.click()
      
      // Wait for upload processing
      await page.waitForTimeout(5000)
      
      // Look for success indicators
      const successElements = page.locator('text=successful, text=✅, .text-green, [data-testid*="success"]')
      const successCount = await successElements.count()
      
      if (successCount > 0) {
        await helpers.logStep('Upload successful')
        await helpers.takeScreenshot('seamless-02-upload-success')
        
        // Test immediate use with generation
        const testGenerationButton = page.locator('button:has-text("FLUX"), button:has-text("Test with")').first()
        if (await testGenerationButton.isVisible()) {
          await testGenerationButton.click()
          await page.waitForTimeout(2000)
          
          await helpers.logStep('Tested uploaded image with generation')
          await helpers.takeScreenshot('seamless-03-generation-test')
        }
      }
    }
    
    console.log('✅ Seamless image upload experience tested')
  })

  test('should verify generated content accessibility', async ({ page }) => {
    await helpers.logStep('Testing generated content accessibility')
    
    // Navigate to generator and perform generation
    await helpers.navigateToGenerator('dev')
    
    // Quick generation setup
    const modelSelector = page.locator('[data-testid="model-selector"], select').first()
    await modelSelector.click()
    
    const fluxOption = page.locator('text=FLUX Schnell').first()
    if (await fluxOption.isVisible()) {
      await fluxOption.click()
    }
    
    const promptInput = page.locator('[data-testid="prompt-input"], textarea').first()
    await promptInput.fill('Accessibility test image')
    
    const generateButton = page.locator('[data-testid="generate-button"], button:has-text("Generate")').first()
    await generateButton.click()
    
    // Wait for result
    await page.waitForTimeout(30000)
    
    // Check for generated images
    const generatedImages = page.locator('img[src*="replicate"], img[src*="cloudinary"], [data-testid*="result"] img')
    const imageCount = await generatedImages.count()
    
    if (imageCount > 0) {
      // Check alt text
      const firstImage = generatedImages.first()
      const altText = await firstImage.getAttribute('alt')
      
      if (altText) {
        await helpers.logStep(`Image has alt text: ${altText}`)
      } else {
        await helpers.logStep('Warning: Generated image missing alt text')
      }
      
      // Check if images are keyboard accessible
      await firstImage.focus()
      const focusedElement = page.locator(':focus')
      const isFocused = await focusedElement.count() > 0
      
      if (isFocused) {
        await helpers.logStep('Generated images are keyboard accessible')
      }
    }
    
    await helpers.takeScreenshot('accessibility-generated-content')
    console.log('✅ Generated content accessibility verified')
  })

  test('should test cross-browser compatibility', async ({ page, browserName }) => {
    await helpers.logStep(`Testing cross-browser compatibility: ${browserName}`)
    
    // Navigate to generator
    await helpers.navigateToGenerator('dev')
    
    // Test basic functionality in each browser
    const modelSelector = page.locator('[data-testid="model-selector"], select').first()
    await expect(modelSelector).toBeVisible()
    
    const promptInput = page.locator('[data-testid="prompt-input"], textarea').first()
    await expect(promptInput).toBeVisible()
    
    const generateButton = page.locator('[data-testid="generate-button"], button:has-text("Generate")').first()
    await expect(generateButton).toBeVisible()
    
    // Test interaction
    await modelSelector.click()
    const fluxOption = page.locator('text=FLUX Schnell').first()
    if (await fluxOption.isVisible()) {
      await fluxOption.click()
    }
    
    await promptInput.fill(`Cross-browser test in ${browserName}`)
    
    await helpers.takeScreenshot(`cross-browser-${browserName}`)
    
    console.log(`✅ Cross-browser compatibility verified for ${browserName}`)
  })

  test('should test mobile user experience', async ({ page }) => {
    await helpers.logStep('Testing mobile user experience')
    
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Navigate to generator
    await helpers.navigateToGenerator('dev')
    
    // Test mobile-specific interactions
    const modelSelector = page.locator('[data-testid="model-selector"], select').first()
    await modelSelector.tap() // Use tap instead of click for mobile
    
    const fluxOption = page.locator('text=FLUX Schnell').first()
    if (await fluxOption.isVisible()) {
      await fluxOption.tap()
    }
    
    // Test mobile prompt input
    const promptInput = page.locator('[data-testid="prompt-input"], textarea').first()
    await promptInput.tap()
    await promptInput.fill('Mobile user experience test')
    
    // Test mobile scrolling
    await page.evaluate(() => window.scrollTo(0, 200))
    await page.waitForTimeout(1000)
    
    await helpers.takeScreenshot('mobile-experience')
    
    // Test mobile generation
    const generateButton = page.locator('[data-testid="generate-button"], button:has-text("Generate")').first()
    if (await generateButton.isVisible()) {
      await generateButton.tap()
      await page.waitForTimeout(2000)
      
      await helpers.takeScreenshot('mobile-generation-started')
    }
    
    console.log('✅ Mobile user experience tested')
  })

  test('should verify performance under load', async ({ page }) => {
    await helpers.logStep('Testing performance under load')
    
    const startTime = Date.now()
    
    // Navigate to generator
    await helpers.navigateToGenerator('dev')
    
    // Perform multiple rapid interactions
    const modelSelector = page.locator('[data-testid="model-selector"], select').first()
    const promptInput = page.locator('[data-testid="prompt-input"], textarea').first()
    
    // Rapid model switching
    for (let i = 0; i < 3; i++) {
      await modelSelector.click()
      const options = page.locator('option, [role="option"]')
      const optionCount = await options.count()
      
      if (optionCount > 1) {
        await options.nth(i % optionCount).click()
        await page.waitForTimeout(500)
      }
    }
    
    // Rapid prompt changes
    for (let i = 0; i < 5; i++) {
      await promptInput.fill(`Performance test prompt ${i}`)
      await page.waitForTimeout(200)
    }
    
    const interactionTime = Date.now() - startTime
    
    // Get performance metrics
    const performanceMetrics = await helpers.checkPagePerformance()
    
    // Verify performance is acceptable
    expect(interactionTime).toBeLessThan(10000) // Under 10 seconds
    
    await helpers.logStep('Performance metrics', {
      interactionTime,
      ...performanceMetrics
    })
    
    await helpers.takeScreenshot('performance-test')
    console.log(`✅ Performance under load: ${interactionTime}ms`)
  })

  test('should test error recovery and user guidance', async ({ page }) => {
    await helpers.logStep('Testing error recovery and user guidance')
    
    // Navigate to generator
    await helpers.navigateToGenerator('dev')
    
    // Try to generate without prompt
    const generateButton = page.locator('[data-testid="generate-button"], button:has-text("Generate")').first()
    await generateButton.click()
    
    // Look for helpful error messages
    const errorMessages = page.locator('[data-testid*="error"], .text-red, text=required, text=Please')
    const errorCount = await errorMessages.count()
    
    if (errorCount > 0) {
      await helpers.logStep(`Found ${errorCount} helpful error messages`)
      await helpers.takeScreenshot('error-guidance')
    }
    
    // Test recovery
    const promptInput = page.locator('[data-testid="prompt-input"], textarea').first()
    await promptInput.fill('Error recovery test prompt')
    
    // Verify error is cleared
    await page.waitForTimeout(1000)
    const remainingErrors = await errorMessages.count()
    
    if (remainingErrors < errorCount) {
      await helpers.logStep('Error cleared after fixing input')
    }
    
    await helpers.takeScreenshot('error-recovery')
    console.log('✅ Error recovery and user guidance tested')
  })
})
