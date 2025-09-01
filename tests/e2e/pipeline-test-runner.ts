/**
 * Pipeline Test Runner - Simplified E2E Test
 * Tests the complete pipeline with real API calls
 */

import { chromium, Browser, Page } from 'playwright'

interface TestResult {
  phase: string
  success: boolean
  error?: string
  duration?: number
}

class PipelineTestRunner {
  private browser: Browser | null = null
  private page: Page | null = null
  private results: TestResult[] = []
  private baseURL = 'http://localhost:4000'

  async setup() {
    console.log('🚀 Setting up browser for pipeline test...')
    this.browser = await chromium.launch({ 
      headless: false, // Show browser for debugging
      slowMo: 1000 // Slow down for visibility
    })
    this.page = await this.browser.newPage()
    
    // Set viewport
    await this.page.setViewportSize({ width: 1920, height: 1080 })
    
    // Enable console logging
    this.page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('❌ Browser Error:', msg.text())
      }
    })
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close()
    }
  }

  private async recordResult(phase: string, success: boolean, error?: string, duration?: number) {
    this.results.push({ phase, success, error, duration })
    const status = success ? '✅' : '❌'
    const durationText = duration ? ` (${duration}ms)` : ''
    console.log(`${status} ${phase}${durationText}`)
    if (error) console.log(`   Error: ${error}`)
  }

  async testServerHealth() {
    const startTime = Date.now()
    try {
      if (!this.page) throw new Error('Page not initialized')
      
      console.log('\n🏥 Testing Server Health...')
      
      // Test main page loads
      const response = await this.page.goto(this.baseURL)
      if (!response || !response.ok()) {
        throw new Error(`Server not responding: ${response?.status()}`)
      }
      
      // Test API health endpoint
      const apiResponse = await this.page.request.get(`${this.baseURL}/api/health`)
      if (!apiResponse.ok()) {
        throw new Error(`API health check failed: ${apiResponse.status()}`)
      }
      
      // Test enhancement API
      const enhanceResponse = await this.page.request.get(`${this.baseURL}/api/enhance`)
      if (!enhanceResponse.ok()) {
        throw new Error(`Enhancement API not responding: ${enhanceResponse.status()}`)
      }
      
      await this.recordResult('Server Health Check', true, undefined, Date.now() - startTime)
      return true
    } catch (error) {
      await this.recordResult('Server Health Check', false, error instanceof Error ? error.message : String(error))
      return false
    }
  }

  async testGeneratorUI() {
    const startTime = Date.now()
    try {
      if (!this.page) throw new Error('Page not initialized')
      
      console.log('\n🎨 Testing Generator UI...')
      
      // Navigate to generator
      await this.page.goto(`${this.baseURL}/generator`)
      
      // Wait for generator to load
      await this.page.waitForSelector('[data-testid="generator-interface"], .generator-container, main', { timeout: 10000 })
      
      // Check for prompt input
      const promptInput = this.page.locator('textarea, [data-testid="prompt-input"], [placeholder*="prompt"], [placeholder*="describe"]')
      await promptInput.waitFor({ timeout: 5000 })
      
      // Verify prompt input is larger (our improvement)
      const inputElement = await promptInput.first().elementHandle()
      if (inputElement) {
        const box = await inputElement.boundingBox()
        if (box && box.height < 100) {
          throw new Error(`Prompt input too small: ${box.height}px height`)
        }
      }
      
      // Check for mode selector
      const modeSelector = this.page.locator('select, [data-testid="mode-selector"], button:has-text("images"), button:has-text("enhance")')
      await modeSelector.first().waitFor({ timeout: 5000 })
      
      // Check for model selector
      const modelSelector = this.page.locator('select:has(option), [data-testid="model-selector"], .model-select')
      await modelSelector.first().waitFor({ timeout: 5000 })
      
      // Check for generate button
      const generateButton = this.page.locator('button:has-text("Generate"), [data-testid="generate-button"], .generate-btn')
      await generateButton.first().waitFor({ timeout: 5000 })
      
      await this.recordResult('Generator UI Load', true, undefined, Date.now() - startTime)
      return true
    } catch (error) {
      await this.recordResult('Generator UI Load', false, error instanceof Error ? error.message : String(error))
      return false
    }
  }

  async testImageGeneration() {
    const startTime = Date.now()
    try {
      if (!this.page) throw new Error('Page not initialized')
      
      console.log('\n🖼️ Testing Image Generation...')
      
      // Fill prompt
      const promptInput = this.page.locator('textarea, [data-testid="prompt-input"], [placeholder*="prompt"]')
      await promptInput.first().fill('A simple red circle on white background')
      
      // Select fast model if available
      const modelSelector = this.page.locator('select:has(option), [data-testid="model-selector"]')
      if (await modelSelector.first().isVisible()) {
        const options = await modelSelector.first().locator('option').allTextContents()
        const fastModel = options.find(opt => 
          opt.toLowerCase().includes('schnell') || 
          opt.toLowerCase().includes('fast') ||
          opt.toLowerCase().includes('flux')
        )
        if (fastModel) {
          await modelSelector.first().selectOption({ label: fastModel })
        }
      }
      
      // Click generate
      const generateButton = this.page.locator('button:has-text("Generate"), [data-testid="generate-button"]')
      await generateButton.first().click()
      
      // Wait for generation to start
      await this.page.waitForTimeout(2000)
      
      // Look for loading state
      const loadingIndicator = this.page.locator('.loading, [data-testid="loading"], .spinner, .generating')
      if (await loadingIndicator.first().isVisible({ timeout: 5000 })) {
        console.log('   ⏳ Generation started, waiting for completion...')
        
        // Wait for loading to disappear (generation complete)
        await loadingIndicator.first().waitFor({ state: 'hidden', timeout: 60000 })
      }
      
      // Look for generated image or result
      const resultSelectors = [
        'img[src*="replicate"], img[src*="cloudinary"]',
        '[data-testid="generated-image"], [data-testid="generation-result"]',
        '.generated-image, .result-image',
        'img[alt*="generated"], img[alt*="result"]'
      ]
      
      let imageFound = false
      for (const selector of resultSelectors) {
        if (await this.page.locator(selector).first().isVisible({ timeout: 5000 })) {
          imageFound = true
          break
        }
      }
      
      if (!imageFound) {
        // Check for error messages
        const errorSelectors = [
          '.error, [data-testid="error"]',
          '.alert-error, .error-message',
          'text="Error", text="Failed"'
        ]
        
        for (const selector of errorSelectors) {
          if (await this.page.locator(selector).first().isVisible({ timeout: 2000 })) {
            const errorText = await this.page.locator(selector).first().textContent()
            throw new Error(`Generation failed: ${errorText}`)
          }
        }
        
        throw new Error('No generated image found and no error message')
      }
      
      await this.recordResult('Image Generation', true, undefined, Date.now() - startTime)
      return true
    } catch (error) {
      await this.recordResult('Image Generation', false, error instanceof Error ? error.message : String(error))
      return false
    }
  }

  async testEnhancementMode() {
    const startTime = Date.now()
    try {
      if (!this.page) throw new Error('Page not initialized')
      
      console.log('\n🔧 Testing Enhancement Mode...')
      
      // Look for mode selector and switch to enhance
      const modeButtons = this.page.locator('button:has-text("Enhance"), [data-value="enhance"]')
      if (await modeButtons.first().isVisible({ timeout: 5000 })) {
        await modeButtons.first().click()
      } else {
        // Try select dropdown
        const modeSelect = this.page.locator('select:has(option[value="enhance"])')
        if (await modeSelect.first().isVisible({ timeout: 5000 })) {
          await modeSelect.first().selectOption('enhance')
        } else {
          throw new Error('Enhancement mode not found')
        }
      }
      
      // Wait for enhancement UI to load
      await this.page.waitForTimeout(1000)
      
      // Check for enhancement models
      const modelSelector = this.page.locator('select:has(option), [data-testid="model-selector"]')
      if (await modelSelector.first().isVisible()) {
        const options = await modelSelector.first().locator('option').allTextContents()
        const hasEnhancementModels = options.some(opt => 
          opt.toLowerCase().includes('esrgan') || 
          opt.toLowerCase().includes('swinir') ||
          opt.toLowerCase().includes('upscale')
        )
        
        if (!hasEnhancementModels) {
          throw new Error('Enhancement models not found in selector')
        }
        
        // Select Real-ESRGAN if available (fastest)
        const realESRGAN = options.find(opt => opt.toLowerCase().includes('esrgan'))
        if (realESRGAN) {
          await modelSelector.first().selectOption({ label: realESRGAN })
        }
      }
      
      // Look for file upload
      const fileInput = this.page.locator('input[type="file"], [data-testid="image-upload"]')
      if (await fileInput.first().isVisible({ timeout: 5000 })) {
        console.log('   📁 File upload found - enhancement mode UI loaded')
      }
      
      await this.recordResult('Enhancement Mode UI', true, undefined, Date.now() - startTime)
      return true
    } catch (error) {
      await this.recordResult('Enhancement Mode UI', false, error instanceof Error ? error.message : String(error))
      return false
    }
  }

  async runFullTest() {
    console.log('🧪 STARTING COMPREHENSIVE PIPELINE TEST')
    console.log('==========================================')
    
    await this.setup()
    
    try {
      // Run tests in sequence
      const serverOK = await this.testServerHealth()
      if (!serverOK) return this.printResults()
      
      const uiOK = await this.testGeneratorUI()
      if (!uiOK) return this.printResults()
      
      await this.testImageGeneration() // Continue even if this fails
      await this.testEnhancementMode() // Continue even if this fails
      
    } finally {
      await this.cleanup()
      this.printResults()
    }
  }

  private printResults() {
    console.log('\n📊 TEST RESULTS SUMMARY')
    console.log('========================')
    
    let passed = 0
    let failed = 0
    
    this.results.forEach(result => {
      const status = result.success ? '✅ PASS' : '❌ FAIL'
      const duration = result.duration ? ` (${result.duration}ms)` : ''
      console.log(`${status} ${result.phase}${duration}`)
      
      if (result.error) {
        console.log(`    Error: ${result.error}`)
      }
      
      if (result.success) passed++
      else failed++
    })
    
    console.log(`\n📈 FINAL SCORE: ${passed}/${passed + failed} tests passed`)
    
    if (failed === 0) {
      console.log('🎉 ALL TESTS PASSED - Pipeline is working!')
    } else {
      console.log('⚠️ Some tests failed - Check errors above')
    }
  }
}

// Run the test
if (require.main === module) {
  const runner = new PipelineTestRunner()
  runner.runFullTest().catch(console.error)
}

export { PipelineTestRunner }
