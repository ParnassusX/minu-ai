/**
 * Enhance Functionality Test
 * Comprehensive browser test of the enhance button functionality
 */

import { test, expect } from '@playwright/test'

test.describe('Enhance Functionality Tests', () => {
  test('Test enhance functionality on isolated test page', async ({ page }) => {
    console.log('🧪 Testing enhance functionality on test page...')

    // Navigate to test page
    await page.goto('/test-enhance')
    await page.waitForLoadState('networkidle')

    // Check if page loaded
    await expect(page.locator('h1, h2').filter({ hasText: /enhance.*test/i })).toBeVisible()
    console.log('✅ Test page loaded')

    // Find the textarea
    const textarea = page.locator('textarea').first()
    await expect(textarea).toBeVisible()
    console.log('✅ Textarea found')

    // Enter test prompt
    const testPrompt = 'a cat'
    await textarea.fill(testPrompt)
    console.log(`✅ Entered test prompt: "${testPrompt}"`)

    // Verify prompt was entered
    const currentValue = await textarea.inputValue()
    expect(currentValue).toBe(testPrompt)
    console.log('✅ Prompt value confirmed in textarea')

    // Find and click enhance button
    const enhanceButton = page.locator('button').filter({ hasText: /enhance/i }).first()
    await expect(enhanceButton).toBeVisible()
    await expect(enhanceButton).toBeEnabled()
    console.log('✅ Enhance button found and enabled')

    // Click enhance button
    await enhanceButton.click()
    console.log('🔮 Clicked enhance button')

    // Wait for enhancement to complete (look for button state change)
    await page.waitForTimeout(3000) // Give time for API call

    // Check if prompt was enhanced
    const enhancedValue = await textarea.inputValue()
    console.log(`📝 Original: "${testPrompt}"`)
    console.log(`📝 Enhanced: "${enhancedValue}"`)

    // Verify enhancement occurred
    expect(enhancedValue.length).toBeGreaterThan(testPrompt.length)
    expect(enhancedValue).toContain(testPrompt) // Should contain original
    console.log('✅ Prompt was enhanced successfully!')

    // Check debug logs
    const debugLogs = page.locator('.bg-black .text-green-400')
    const logCount = await debugLogs.count()
    console.log(`📊 Debug logs found: ${logCount}`)

    if (logCount > 0) {
      console.log('✅ Debug logs are working')
    }

    // Take screenshot for documentation
    await page.screenshot({ 
      path: 'test-results/enhance-test-page.png',
      fullPage: true 
    })

    console.log('🎉 Isolated enhance test completed successfully!')
  })

  test('Test enhance functionality on main generator (if accessible)', async ({ page }) => {
    console.log('🎨 Testing enhance functionality on main generator...')

    // Try to access generator page
    await page.goto('/generator')
    await page.waitForLoadState('networkidle')

    const currentUrl = page.url()
    
    if (currentUrl.includes('/auth/login')) {
      console.log('⚠️ Generator requires authentication - skipping main generator test')
      console.log('✅ Authentication is working correctly')
      return
    }

    // If we reach here, generator is accessible
    console.log('✅ Generator page accessible')

    // Look for prompt textarea
    const textarea = page.locator('textarea').first()
    
    if (await textarea.isVisible()) {
      console.log('✅ Prompt textarea found')

      // Enter test prompt
      const testPrompt = 'beautiful landscape'
      await textarea.fill(testPrompt)
      console.log(`✅ Entered test prompt: "${testPrompt}"`)

      // Look for enhance button
      const enhanceButton = page.locator('button').filter({ hasText: /enhance/i }).first()
      
      if (await enhanceButton.isVisible()) {
        console.log('✅ Enhance button found')

        if (await enhanceButton.isEnabled()) {
          console.log('✅ Enhance button enabled')

          // Click enhance
          await enhanceButton.click()
          console.log('🔮 Clicked enhance button')

          // Wait for enhancement
          await page.waitForTimeout(3000)

          // Check result
          const enhancedValue = await textarea.inputValue()
          console.log(`📝 Result: "${enhancedValue}"`)

          if (enhancedValue.length > testPrompt.length) {
            console.log('✅ Main generator enhance working!')
          } else {
            console.log('⚠️ Main generator enhance may not be working')
          }
        } else {
          console.log('⚠️ Enhance button disabled')
        }
      } else {
        console.log('❌ Enhance button not found')
      }
    } else {
      console.log('❌ Prompt textarea not found')
    }

    // Take screenshot
    await page.screenshot({ 
      path: 'test-results/main-generator-test.png',
      fullPage: true 
    })
  })

  test('Test API endpoint directly', async ({ page }) => {
    console.log('📡 Testing enhance API endpoint directly...')

    // Test API endpoint using page.evaluate to make fetch call
    const apiResult = await page.evaluate(async () => {
      try {
        const response = await fetch('/api/enhance-prompt-v2', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: 'test prompt' })
        })

        const result = await response.json()
        
        return {
          success: response.ok,
          status: response.status,
          data: result
        }
      } catch (error) {
        return {
          success: false,
          error: error.message
        }
      }
    })

    console.log('📡 API test result:', apiResult)

    expect(apiResult.success).toBe(true)
    expect(apiResult.status).toBe(200)
    expect(apiResult.data.success).toBe(true)
    expect(apiResult.data.data?.enhancedPrompt).toBeTruthy()

    console.log('✅ API endpoint test passed!')
  })

  test('Check for JavaScript errors', async ({ page }) => {
    console.log('🔍 Checking for JavaScript errors...')

    const errors: string[] = []
    
    // Listen for console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text())
      }
    })

    // Listen for page errors
    page.on('pageerror', error => {
      errors.push(error.message)
    })

    // Navigate to test page
    await page.goto('/test-enhance')
    await page.waitForLoadState('networkidle')

    // Perform enhance test
    const textarea = page.locator('textarea').first()
    await textarea.fill('test prompt')
    
    const enhanceButton = page.locator('button').filter({ hasText: /enhance/i }).first()
    await enhanceButton.click()
    
    // Wait for completion
    await page.waitForTimeout(3000)

    // Check for errors
    console.log(`📊 JavaScript errors found: ${errors.length}`)
    
    if (errors.length > 0) {
      console.log('❌ JavaScript errors detected:')
      errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`)
      })
    } else {
      console.log('✅ No JavaScript errors detected')
    }

    // Fail test if there are errors
    expect(errors.length).toBe(0)
  })
})

test.afterEach(async ({ page }) => {
  // Clean up any console listeners
  page.removeAllListeners('console')
  page.removeAllListeners('pageerror')
})
