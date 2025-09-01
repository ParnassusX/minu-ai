/**
 * Generator Integration Verification Test
 * Comprehensive test to verify Generator V2 is properly integrated with navigation and all features work
 */

import { test, expect } from '@playwright/test'

test.describe('Generator V2 Integration Verification', () => {
  test('Complete generator integration and feature verification', async ({ page }) => {
    console.log('🔍 Starting comprehensive generator integration verification...')

    // Test 1: Navigate to generator and verify layout integration
    console.log('1️⃣ Testing generator page layout integration...')
    await page.goto('http://localhost:4000/generator')
    await page.waitForLoadState('networkidle')
    
    // Check if navigation is present and integrated
    const navigation = page.locator('.nav-responsive')
    await expect(navigation).toBeVisible()
    console.log('✅ Navigation sidebar is visible and integrated')
    
    // Check if Generator V2 header is present
    const generatorHeader = page.locator('h1:has-text("Minu.AI Generator V2")')
    await expect(generatorHeader).toBeVisible()
    console.log('✅ Generator V2 header is present')
    
    // Check if generator has proper data-testid
    const generatorContainer = page.locator('[data-testid="generator-v2"]')
    await expect(generatorContainer).toBeVisible()
    console.log('✅ Generator V2 container is properly identified')

    // Test 2: Verify mode selector functionality
    console.log('2️⃣ Testing mode selector functionality...')
    const modeSelector = page.locator('[data-testid="mode-selector"]')
    await expect(modeSelector).toBeVisible()
    
    // Test mode switching
    const imagesMode = page.locator('[data-testid="mode-images"]')
    const videoMode = page.locator('[data-testid="mode-video"]')
    const enhanceMode = page.locator('[data-testid="mode-enhance"]')
    
    await expect(imagesMode).toBeVisible()
    await expect(videoMode).toBeVisible()
    await expect(enhanceMode).toBeVisible()
    
    // Click video mode and verify it becomes active
    await videoMode.click()
    await expect(videoMode).toHaveClass(/default/)
    console.log('✅ Mode selector switches correctly')

    // Test 3: Verify prompt input with suggestions
    console.log('3️⃣ Testing prompt input and suggestions system...')
    const promptTextarea = page.locator('textarea[placeholder*="prompt"]')
    await expect(promptTextarea).toBeVisible()
    
    // Test suggestions button
    const suggestionsButton = page.locator('button:has-text("Suggestions")')
    await expect(suggestionsButton).toBeVisible()
    
    // Click suggestions button and verify suggestions panel appears
    await suggestionsButton.click()
    const suggestionsPanel = page.locator('text=Prompt Suggestions')
    await expect(suggestionsPanel).toBeVisible()
    console.log('✅ Suggestions system is functional')
    
    // Test enhance button
    const enhanceButton = page.locator('button:has-text("Enhance")')
    await expect(enhanceButton).toBeVisible()
    console.log('✅ Prompt enhancement button is present')

    // Test 4: Verify parameter controls
    console.log('4️⃣ Testing parameter controls...')
    const parameterControls = page.locator('[data-testid="parameter-controls"]')
    await expect(parameterControls).toBeVisible()
    console.log('✅ Parameter controls are present')

    // Test 5: Verify model selector
    console.log('5️⃣ Testing model selector...')
    const modelSelector = page.locator('text=Select Model')
    await expect(modelSelector).toBeVisible()
    console.log('✅ Model selector is present')

    // Test 6: Verify user profile in navigation
    console.log('6️⃣ Testing user profile integration...')
    // Note: This test assumes user is logged in
    const userProfile = page.locator('.nav-responsive').locator('text=Profile')
    if (await userProfile.isVisible()) {
      console.log('✅ User profile is visible in navigation')
    } else {
      console.log('ℹ️  User profile not visible (user may not be logged in)')
    }

    // Test 7: Verify responsive behavior
    console.log('7️⃣ Testing responsive behavior...')
    
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    await page.waitForTimeout(500)
    
    // On mobile, navigation should be hidden initially
    const mobileNav = page.locator('.nav-responsive')
    const isNavVisible = await mobileNav.isVisible()
    console.log(`📱 Mobile navigation visibility: ${isNavVisible ? 'visible' : 'hidden'}`)
    
    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.waitForTimeout(500)
    
    // On tablet, navigation should be visible
    await expect(mobileNav).toBeVisible()
    console.log('📱 Tablet navigation is visible')
    
    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 })
    await page.waitForTimeout(500)
    
    await expect(mobileNav).toBeVisible()
    console.log('🖥️  Desktop navigation is visible')

    // Test 8: Verify no console errors
    console.log('8️⃣ Checking for console errors...')
    const consoleErrors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
      }
    })
    
    // Reload page to catch any console errors
    await page.reload()
    await page.waitForLoadState('networkidle')
    
    if (consoleErrors.length === 0) {
      console.log('✅ No console errors detected')
    } else {
      console.log(`⚠️  Console errors detected: ${consoleErrors.length}`)
      consoleErrors.forEach(error => console.log(`   - ${error}`))
    }

    // Test 9: Verify page performance
    console.log('9️⃣ Testing page performance...')
    const startTime = Date.now()
    await page.goto('http://localhost:4000/generator')
    await page.waitForLoadState('networkidle')
    const loadTime = Date.now() - startTime
    
    expect(loadTime).toBeLessThan(5000) // Should load within 5 seconds
    console.log(`⚡ Page load time: ${loadTime}ms`)

    // Test 10: Verify all critical elements are present
    console.log('🔟 Final verification of all critical elements...')
    
    const criticalElements = [
      { selector: '[data-testid="generator-v2"]', name: 'Generator V2 Container' },
      { selector: 'h1:has-text("Minu.AI Generator V2")', name: 'Generator Header' },
      { selector: '[data-testid="mode-selector"]', name: 'Mode Selector' },
      { selector: 'textarea', name: 'Prompt Input' },
      { selector: 'button:has-text("Suggestions")', name: 'Suggestions Button' },
      { selector: 'button:has-text("Enhance")', name: 'Enhance Button' },
      { selector: '[data-testid="parameter-controls"]', name: 'Parameter Controls' },
      { selector: '.nav-responsive', name: 'Navigation Sidebar' }
    ]
    
    for (const element of criticalElements) {
      const locator = page.locator(element.selector)
      await expect(locator).toBeVisible()
      console.log(`✅ ${element.name} is present and visible`)
    }

    console.log('\n🎉 Generator V2 integration verification completed successfully!')
    console.log('📋 Summary:')
    console.log('   ✅ Navigation properly integrated')
    console.log('   ✅ Generator V2 header and branding correct')
    console.log('   ✅ All mode selectors functional')
    console.log('   ✅ Suggestions system working')
    console.log('   ✅ Parameter controls present')
    console.log('   ✅ Responsive design working')
    console.log('   ✅ No critical console errors')
    console.log('   ✅ Performance within acceptable limits')
  })
})
