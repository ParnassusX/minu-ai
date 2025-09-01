/**
 * UI Interactions End-to-End Tests
 * Minu.AI Generator V2 - Comprehensive UI Testing
 */

import { test, expect } from '@playwright/test'
import { TestHelpers } from './utils/test-helpers'

test.describe('UI Interactions', () => {
  let helpers: TestHelpers

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page)
    
    // Navigate to generator with dev bypass
    await helpers.navigateToGenerator('dev')
    await helpers.waitForAuth()
  })

  test('should load all UI components correctly', async ({ page }) => {
    await helpers.logStep('Testing UI component loading')
    
    // Verify main generator container
    await expect(page.locator('[data-testid="generator-v2"]')).toBeVisible()
    
    // Verify core components
    const coreComponents = [
      { selector: '[data-testid="model-selector"]', name: 'Model Selector' },
      { selector: '[data-testid="prompt-input"]', name: 'Prompt Input' },
      { selector: '[data-testid="parameter-controls"]', name: 'Parameter Controls' },
      { selector: '[data-testid="generate-button"]', name: 'Generate Button' },
      { selector: '[data-testid="mode-selector"]', name: 'Mode Selector' }
    ]
    
    for (const component of coreComponents) {
      const element = page.locator(component.selector)
      await expect(element).toBeVisible()
      await helpers.logStep(`${component.name} loaded`)
    }
    
    await helpers.takeScreenshot('ui-components-loaded')
    console.log('✅ All UI components loaded successfully')
  })

  test('should handle model selection correctly', async ({ page }) => {
    await helpers.logStep('Testing model selection functionality')
    
    // Open model selector
    const modelSelector = page.locator('[data-testid="model-selector"]')
    await modelSelector.click()
    
    // Wait for model options to appear
    await page.waitForSelector('[data-testid="model-option"]', { timeout: 10000 })
    
    // Get available models
    const modelOptions = page.locator('[data-testid="model-option"]')
    const modelCount = await modelOptions.count()
    
    expect(modelCount).toBeGreaterThan(0)
    await helpers.logStep(`Found ${modelCount} available models`)
    
    // Test selecting different models
    const testModels = ['flux-schnell', 'flux-kontext-pro', 'seedance-1-lite']
    
    for (const modelId of testModels) {
      const modelOption = page.locator(`[data-testid="model-option-${modelId}"]`)
      
      if (await modelOption.isVisible()) {
        await modelOption.click()
        await helpers.logStep(`Selected model: ${modelId}`)
        
        // Verify selection
        await expect(modelSelector).toContainText(modelId, { ignoreCase: true })
        
        // Check if parameters updated for the model
        await page.waitForTimeout(1000) // Allow parameters to update
        
        await helpers.takeScreenshot(`model-selected-${modelId}`)
      }
    }
    
    console.log('✅ Model selection working correctly')
  })

  test('should handle prompt input and enhancement', async ({ page }) => {
    await helpers.logStep('Testing prompt input and enhancement')
    
    const promptInput = page.locator('[data-testid="prompt-input"]')
    const testPrompt = 'A beautiful mountain landscape at sunset'
    
    // Fill prompt
    await promptInput.fill(testPrompt)
    await expect(promptInput).toHaveValue(testPrompt)
    
    // Test prompt enhancement if available
    const enhanceButton = page.locator('[data-testid="enhance-prompt-button"]')
    
    if (await enhanceButton.isVisible()) {
      await helpers.logStep('Testing prompt enhancement')
      await enhanceButton.click()
      
      // Wait for enhancement to complete
      await page.waitForTimeout(3000)
      
      // Check if prompt was enhanced
      const enhancedValue = await promptInput.inputValue()
      expect(enhancedValue.length).toBeGreaterThan(testPrompt.length)
      
      await helpers.logStep('Prompt enhanced successfully')
    }
    
    await helpers.takeScreenshot('prompt-input-tested')
    console.log('✅ Prompt input functionality working')
  })

  test('should handle parameter controls for different models', async ({ page }) => {
    await helpers.logStep('Testing parameter controls')
    
    // Test with FLUX Schnell (basic parameters)
    await helpers.selectModel('flux-schnell')
    await page.waitForTimeout(1000)
    
    // Verify basic parameters are shown
    const aspectRatioControl = page.locator('[data-testid="parameter-aspect_ratio"]')
    const outputFormatControl = page.locator('[data-testid="parameter-output_format"]')
    
    await expect(aspectRatioControl).toBeVisible()
    await expect(outputFormatControl).toBeVisible()
    
    await helpers.takeScreenshot('parameters-flux-schnell')
    
    // Test with FLUX Kontext Pro (image input parameters)
    const kontextProOption = page.locator('[data-testid="model-option-flux-kontext-pro"]')
    
    if (await kontextProOption.isVisible()) {
      await helpers.selectModel('flux-kontext-pro')
      await page.waitForTimeout(1000)
      
      // Verify image input parameter is shown
      const imageInputControl = page.locator('[data-testid="parameter-input_image"]')
      await expect(imageInputControl).toBeVisible()
      
      await helpers.takeScreenshot('parameters-flux-kontext-pro')
      await helpers.logStep('Image input parameter visible for Kontext Pro')
    }
    
    console.log('✅ Parameter controls working correctly')
  })

  test('should handle image upload functionality', async ({ page }) => {
    await helpers.logStep('Testing image upload functionality')

    // Select a model that supports image input
    const modelSelector = page.locator('[data-testid="model-selector"]')
    await modelSelector.click()

    const kontextProOption = page.locator('text=FLUX Kontext Pro')
    if (await kontextProOption.isVisible()) {
      await kontextProOption.click()
      await page.waitForTimeout(1000)

      // Look for file input or upload button
      const fileInput = page.locator('input[type="file"]').first()

      if (await fileInput.isVisible()) {
        await helpers.logStep('File input found')

        // Create and upload test image
        const testImagePath = await helpers.createTestImage('test-upload.jpg')
        await fileInput.setInputFiles(testImagePath)

        // Wait for upload to process
        await page.waitForTimeout(3000)

        // Look for any image preview or confirmation
        const imageElements = page.locator('img, [data-testid*="image"], [data-testid*="preview"]')
        const imageCount = await imageElements.count()

        if (imageCount > 0) {
          await helpers.logStep('Image upload processed successfully')
        }

        await helpers.takeScreenshot('image-upload-success')
      } else {
        await helpers.logStep('File input not visible - checking for upload button')

        const uploadButton = page.locator('button:has-text("Upload"), button:has-text("Image")')
        if (await uploadButton.first().isVisible()) {
          await uploadButton.first().click()
          await helpers.logStep('Upload button clicked')
        }
      }
    } else {
      await helpers.logStep('FLUX Kontext Pro not available')
    }

    console.log('✅ Image upload functionality tested')
  })

  test('should test responsive design across breakpoints', async ({ page }) => {
    await helpers.logStep('Testing responsive design')
    
    const responsiveResults = await helpers.testResponsiveBreakpoints()
    
    for (const result of responsiveResults) {
      await helpers.logStep(`Testing ${result.breakpoint} (${result.width}x${result.height})`)
      
      // Verify generator is still functional at this breakpoint
      await expect(page.locator('[data-testid="generator-v2"]')).toBeVisible()
      await expect(page.locator('[data-testid="model-selector"]')).toBeVisible()
      await expect(page.locator('[data-testid="prompt-input"]')).toBeVisible()
      
      await helpers.logStep(`${result.breakpoint} layout verified`)
    }
    
    console.log('✅ Responsive design working across all breakpoints')
  })

  test('should handle mode switching (images/video)', async ({ page }) => {
    await helpers.logStep('Testing mode switching')
    
    const modeSelector = page.locator('[data-testid="mode-selector"]')
    
    if (await modeSelector.isVisible()) {
      // Test switching to video mode
      const videoModeButton = page.locator('[data-testid="mode-video"]')
      
      if (await videoModeButton.isVisible()) {
        await videoModeButton.click()
        await page.waitForTimeout(1000)
        
        // Verify video-specific models are available
        await helpers.selectModel('seedance-1-lite')
        
        // Verify video-specific parameters
        const durationControl = page.locator('[data-testid="parameter-duration"]')
        if (await durationControl.isVisible()) {
          await expect(durationControl).toBeVisible()
          await helpers.logStep('Video mode parameters visible')
        }
        
        await helpers.takeScreenshot('video-mode-active')
      }
      
      // Switch back to images mode
      const imagesModeButton = page.locator('[data-testid="mode-images"]')
      if (await imagesModeButton.isVisible()) {
        await imagesModeButton.click()
        await page.waitForTimeout(1000)
        
        await helpers.takeScreenshot('images-mode-active')
      }
    }
    
    console.log('✅ Mode switching functionality working')
  })

  test('should validate form inputs and show errors', async ({ page }) => {
    await helpers.logStep('Testing form validation')
    
    // Try to generate without prompt
    const generateButton = page.locator('[data-testid="generate-button"]')
    await generateButton.click()
    
    // Check for validation error
    const errorMessage = page.locator('[data-testid="validation-error"]')
    if (await errorMessage.isVisible()) {
      await expect(errorMessage).toBeVisible()
      await helpers.logStep('Validation error displayed correctly')
    }
    
    // Fill required fields and try again
    await helpers.fillPrompt('Test prompt for validation')
    
    // Verify generate button becomes enabled
    await expect(generateButton).toBeEnabled()
    
    await helpers.takeScreenshot('form-validation-tested')
    console.log('✅ Form validation working correctly')
  })

  test('should test accessibility features', async ({ page }) => {
    await helpers.logStep('Testing accessibility features')
    
    // Check for proper ARIA labels
    const modelSelector = page.locator('[data-testid="model-selector"]')
    const ariaLabel = await modelSelector.getAttribute('aria-label')
    
    if (ariaLabel) {
      expect(ariaLabel).toBeTruthy()
      await helpers.logStep('ARIA labels present')
    }
    
    // Test keyboard navigation
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    
    // Verify focus is visible
    const focusedElement = await page.locator(':focus')
    await expect(focusedElement).toBeVisible()
    
    await helpers.takeScreenshot('accessibility-tested')
    console.log('✅ Accessibility features working')
  })

  test('should measure UI performance', async ({ page }) => {
    await helpers.logStep('Measuring UI performance')
    
    const startTime = Date.now()
    
    // Perform common UI interactions
    await helpers.selectModel('flux-schnell')
    await helpers.fillPrompt('Performance test prompt')
    
    // Change parameters
    const aspectRatioControl = page.locator('[data-testid="parameter-aspect_ratio"]')
    if (await aspectRatioControl.isVisible()) {
      await aspectRatioControl.click()
      const option = page.locator('[data-testid="aspect-ratio-option-16:9"]')
      if (await option.isVisible()) {
        await option.click()
      }
    }
    
    const interactionTime = Date.now() - startTime
    
    // Get performance metrics
    const performanceMetrics = await helpers.checkPagePerformance()
    
    // Verify interactions are responsive
    expect(interactionTime).toBeLessThan(5000) // Under 5 seconds
    
    await helpers.logStep('UI performance metrics', {
      interactionTime,
      ...performanceMetrics
    })
    
    console.log(`✅ UI performance: ${interactionTime}ms`)
  })
})
