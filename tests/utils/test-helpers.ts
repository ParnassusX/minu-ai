/**
 * Test Helpers and Utilities
 * Minu.AI Generator V2 End-to-End Testing
 */

import { Page, expect } from '@playwright/test'
import path from 'path'
import fs from 'fs'

export class TestHelpers {
  constructor(private page: Page) {}

  /**
   * Navigate to generator with dev bypass
   */
  async navigateToGenerator(mode: 'dev' | 'skipauth' | 'normal' = 'dev') {
    const url = mode === 'normal' ? '/generator' : `/generator?${mode}=true`
    await this.page.goto(url, { waitUntil: 'networkidle' })
    
    // Wait for generator to load
    await this.page.waitForSelector('[data-testid="generator-v2"]', { timeout: 30000 })
  }

  /**
   * Wait for authentication to complete or bypass
   */
  async waitForAuth(timeout = 10000) {
    try {
      // Wait for either authenticated state or dev bypass
      await this.page.waitForFunction(
        () => {
          const devIndicator = document.querySelector('[data-testid="dev-mode-indicator"]')
          const generator = document.querySelector('[data-testid="generator-v2"]')
          return devIndicator || generator
        },
        { timeout }
      )
    } catch (error) {
      console.log('Auth timeout - proceeding with test')
    }
  }

  /**
   * Upload a test image file
   */
  async uploadTestImage(inputSelector: string, imageName = 'test-image.jpg') {
    const testImagePath = await this.createTestImage(imageName)
    
    const fileInput = this.page.locator(inputSelector)
    await fileInput.setInputFiles(testImagePath)
    
    // Wait for upload to complete
    await this.page.waitForTimeout(2000)
    
    return testImagePath
  }

  /**
   * Create a test image file
   */
  async createTestImage(filename: string): Promise<string> {
    const testDir = path.join(process.cwd(), 'test-results', 'test-images')
    
    // Ensure directory exists
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true })
    }
    
    const imagePath = path.join(testDir, filename)
    
    // Create a simple test image using canvas (if not exists)
    if (!fs.existsSync(imagePath)) {
      // For now, we'll use a placeholder. In a real scenario, you'd generate or copy a test image
      const testImageData = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
        'base64'
      )
      fs.writeFileSync(imagePath, testImageData)
    }
    
    return imagePath
  }

  /**
   * Wait for generation to complete
   */
  async waitForGeneration(timeout = 120000) {
    // Wait for generation to start
    await this.page.waitForSelector('[data-testid="generation-progress"]', { timeout: 10000 })
    
    // Wait for generation to complete
    await this.page.waitForSelector('[data-testid="generation-result"]', { timeout })
  }

  /**
   * Verify generation result
   */
  async verifyGenerationResult() {
    const result = this.page.locator('[data-testid="generation-result"]')
    await expect(result).toBeVisible()
    
    // Check for generated image or video
    const generatedContent = this.page.locator('[data-testid="generated-content"]')
    await expect(generatedContent).toBeVisible()
    
    return {
      hasResult: await result.isVisible(),
      hasContent: await generatedContent.isVisible()
    }
  }

  /**
   * Take screenshot with timestamp
   */
  async takeScreenshot(name: string) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const screenshotPath = `test-results/screenshots/${name}-${timestamp}.png`
    
    await this.page.screenshot({ 
      path: screenshotPath,
      fullPage: true 
    })
    
    return screenshotPath
  }

  /**
   * Check if element is visible and enabled
   */
  async isElementReady(selector: string) {
    const element = this.page.locator(selector)
    return await element.isVisible() && await element.isEnabled()
  }

  /**
   * Wait for API response
   */
  async waitForAPIResponse(urlPattern: string, timeout = 30000) {
    return await this.page.waitForResponse(
      response => response.url().includes(urlPattern) && response.status() === 200,
      { timeout }
    )
  }

  /**
   * Verify model selection
   */
  async selectModel(modelId: string) {
    const modelSelector = this.page.locator('[data-testid="model-selector"]')
    await modelSelector.click()
    
    const modelOption = this.page.locator(`[data-testid="model-option-${modelId}"]`)
    await modelOption.click()
    
    // Verify selection
    await expect(modelSelector).toContainText(modelId)
  }

  /**
   * Fill prompt input
   */
  async fillPrompt(prompt: string) {
    const promptInput = this.page.locator('[data-testid="prompt-input"]')
    await promptInput.fill(prompt)
    await expect(promptInput).toHaveValue(prompt)
  }

  /**
   * Start generation
   */
  async startGeneration() {
    const generateButton = this.page.locator('[data-testid="generate-button"]')
    await expect(generateButton).toBeEnabled()
    await generateButton.click()
  }

  /**
   * Check responsive design
   */
  async testResponsiveBreakpoints() {
    const breakpoints = [
      { name: 'Mobile', width: 375, height: 667 },
      { name: 'Tablet', width: 768, height: 1024 },
      { name: 'Desktop', width: 1920, height: 1080 }
    ]
    
    const results = []
    
    for (const breakpoint of breakpoints) {
      await this.page.setViewportSize({ 
        width: breakpoint.width, 
        height: breakpoint.height 
      })
      
      await this.page.waitForTimeout(1000) // Allow layout to settle
      
      const screenshot = await this.takeScreenshot(`responsive-${breakpoint.name.toLowerCase()}`)
      
      results.push({
        breakpoint: breakpoint.name,
        width: breakpoint.width,
        height: breakpoint.height,
        screenshot
      })
    }
    
    return results
  }

  /**
   * Verify database storage (mock check)
   */
  async verifyDatabaseStorage(generationId: string) {
    // In a real implementation, this would check Supabase
    // For now, we'll verify through API calls
    
    try {
      const response = await this.page.request.get(`/api/generations/${generationId}`)
      return response.ok()
    } catch (error) {
      console.log('Database verification not available:', error)
      return false
    }
  }

  /**
   * Verify gallery integration
   */
  async verifyGalleryIntegration() {
    // Navigate to gallery (if exists)
    try {
      await this.page.goto('/gallery', { waitUntil: 'networkidle' })
      
      const galleryItems = this.page.locator('[data-testid="gallery-item"]')
      const count = await galleryItems.count()
      
      return {
        hasGallery: true,
        itemCount: count
      }
    } catch (error) {
      return {
        hasGallery: false,
        itemCount: 0
      }
    }
  }

  /**
   * Log test step
   */
  async logStep(step: string, details?: any) {
    console.log(`🧪 ${step}`)
    if (details) {
      console.log(`   Details:`, details)
    }
  }

  /**
   * Verify page performance
   */
  async checkPagePerformance() {
    const performanceMetrics = await this.page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      return {
        loadTime: navigation.loadEventEnd - navigation.loadEventStart,
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
        firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0
      }
    })
    
    return performanceMetrics
  }
}
