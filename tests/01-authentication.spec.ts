/**
 * Authentication End-to-End Tests
 * Minu.AI Generator V2 - Production-like Authentication Testing
 */

import { test, expect } from '@playwright/test'
import { TestHelpers } from './utils/test-helpers'

test.describe('Authentication Flow', () => {
  let helpers: TestHelpers

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page)
  })

  test('should load login page without infinite loading', async ({ page }) => {
    await helpers.logStep('Testing login page load performance')
    
    const startTime = Date.now()
    
    // Navigate to login page
    await page.goto('/auth/login', { waitUntil: 'networkidle' })
    
    const loadTime = Date.now() - startTime
    
    // Verify page loads quickly (under 5 seconds)
    expect(loadTime).toBeLessThan(5000)
    
    // Verify login form is present
    await expect(page.locator('form')).toBeVisible()
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
    
    await helpers.takeScreenshot('login-page-loaded')
    
    console.log(`✅ Login page loaded in ${loadTime}ms`)
  })

  test('should show development bypass options in dev mode', async ({ page }) => {
    await helpers.logStep('Testing development bypass options')
    
    await page.goto('/auth/login')
    
    // Check for development mode indicators
    const devBypassSection = page.locator('[data-testid="dev-bypass"]')
    
    if (await devBypassSection.isVisible()) {
      await helpers.logStep('Development bypass section found')
      
      // Verify bypass buttons are present
      const generatorButton = page.locator('text=Generator V2 (Dev Mode)')
      const devPortalButton = page.locator('text=Development Portal')
      
      await expect(generatorButton).toBeVisible()
      await expect(devPortalButton).toBeVisible()
      
      await helpers.takeScreenshot('dev-bypass-options')
    } else {
      await helpers.logStep('Development bypass not visible (production mode)')
    }
  })

  test('should access generator with dev bypass', async ({ page }) => {
    await helpers.logStep('Testing generator access with dev bypass')
    
    // Navigate directly with dev parameter
    await page.goto('/generator?dev=true', { waitUntil: 'networkidle' })
    
    // Wait for generator to load
    await page.waitForSelector('[data-testid="generator-v2"]', { timeout: 30000 })
    
    // Verify dev mode indicator is shown
    const devIndicator = page.locator('text=Development Mode Active')
    if (await devIndicator.isVisible()) {
      await helpers.logStep('Dev mode indicator visible')
      await expect(devIndicator).toBeVisible()
    }
    
    // Verify generator components are loaded
    await expect(page.locator('[data-testid="model-selector"]')).toBeVisible()
    await expect(page.locator('[data-testid="prompt-input"]')).toBeVisible()
    await expect(page.locator('[data-testid="generate-button"]')).toBeVisible()
    
    await helpers.takeScreenshot('generator-dev-bypass-success')
    
    console.log('✅ Generator accessible with dev bypass')
  })

  test('should handle authentication timeout gracefully', async ({ page }) => {
    await helpers.logStep('Testing authentication timeout handling')
    
    // Navigate to generator without bypass
    await page.goto('/generator', { waitUntil: 'networkidle' })
    
    // Wait for either redirect to login or dev timeout
    try {
      await page.waitForURL('**/auth/login**', { timeout: 5000 })
      await helpers.logStep('Redirected to login as expected')
      
      // Verify login page loads
      await expect(page.locator('form')).toBeVisible()
      
    } catch (error) {
      // Check if dev timeout kicked in
      const devIndicator = page.locator('text=Development Mode Active')
      if (await devIndicator.isVisible()) {
        await helpers.logStep('Dev timeout activated - generator accessible')
        await expect(page.locator('[data-testid="generator-v2"]')).toBeVisible()
      } else {
        throw new Error('Neither login redirect nor dev timeout worked')
      }
    }
    
    await helpers.takeScreenshot('auth-timeout-handling')
  })

  test('should verify authentication configuration', async ({ page }) => {
    await helpers.logStep('Testing authentication configuration')
    
    // Check auth configuration API
    const response = await page.request.get('/api/auth-check')
    expect(response.ok()).toBeTruthy()
    
    const authData = await response.json()
    expect(authData.success).toBeTruthy()
    
    const config = authData.data.authConfig
    
    // Verify configuration
    expect(config.environment).toBe('development')
    expect(config.isDevelopment).toBeTruthy()
    expect(config.supabaseConfigured).toBeTruthy()
    
    await helpers.logStep('Authentication configuration verified', config)
    
    console.log('✅ Authentication properly configured')
  })

  test('should test complete user journey from login to generator', async ({ page }) => {
    await helpers.logStep('Testing complete user journey')
    
    // Start at login page
    await page.goto('/auth/login')
    await helpers.takeScreenshot('journey-01-login-page')
    
    // Use dev bypass to simulate successful login
    const devBypassButton = page.locator('text=Generator V2 (Dev Mode)')
    
    if (await devBypassButton.isVisible()) {
      await helpers.logStep('Using dev bypass for journey test')
      await devBypassButton.click()
    } else {
      await helpers.logStep('Using direct navigation for journey test')
      await page.goto('/generator?dev=true')
    }
    
    // Wait for generator to load
    await page.waitForSelector('[data-testid="generator-v2"]', { timeout: 30000 })
    await helpers.takeScreenshot('journey-02-generator-loaded')
    
    // Verify all main components are present
    const components = [
      '[data-testid="model-selector"]',
      '[data-testid="prompt-input"]',
      '[data-testid="generate-button"]',
      '[data-testid="parameter-controls"]'
    ]
    
    for (const component of components) {
      await expect(page.locator(component)).toBeVisible()
    }
    
    await helpers.takeScreenshot('journey-03-components-verified')
    
    // Test basic interaction
    await page.locator('[data-testid="prompt-input"]').fill('Test prompt for journey')
    await helpers.takeScreenshot('journey-04-prompt-filled')
    
    console.log('✅ Complete user journey successful')
  })

  test('should verify responsive authentication on mobile', async ({ page }) => {
    await helpers.logStep('Testing responsive authentication')
    
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Test login page on mobile
    await page.goto('/auth/login')
    await page.waitForLoadState('networkidle')
    
    // Verify form is still usable on mobile
    await expect(page.locator('form')).toBeVisible()
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
    
    await helpers.takeScreenshot('mobile-login-page')
    
    // Test generator access on mobile
    await page.goto('/generator?dev=true')
    await page.waitForSelector('[data-testid="generator-v2"]', { timeout: 30000 })
    
    // Verify generator is responsive
    await expect(page.locator('[data-testid="generator-v2"]')).toBeVisible()
    
    await helpers.takeScreenshot('mobile-generator-access')
    
    console.log('✅ Responsive authentication working')
  })

  test('should measure authentication performance', async ({ page }) => {
    await helpers.logStep('Measuring authentication performance')
    
    const startTime = Date.now()
    
    // Navigate to generator with bypass
    await page.goto('/generator?dev=true', { waitUntil: 'networkidle' })
    
    // Wait for generator to be fully loaded
    await page.waitForSelector('[data-testid="generator-v2"]')
    await page.waitForSelector('[data-testid="model-selector"]')
    await page.waitForSelector('[data-testid="prompt-input"]')
    
    const totalTime = Date.now() - startTime
    
    // Get detailed performance metrics
    const performanceMetrics = await helpers.checkPagePerformance()
    
    // Verify performance is acceptable
    expect(totalTime).toBeLessThan(10000) // Under 10 seconds
    
    await helpers.logStep('Performance metrics', {
      totalLoadTime: totalTime,
      ...performanceMetrics
    })
    
    console.log(`✅ Authentication performance: ${totalTime}ms`)
  })
})
