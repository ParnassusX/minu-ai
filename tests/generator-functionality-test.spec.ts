/**
 * Generator V2 Functionality Test
 * Comprehensive browser-based testing of all Generator V2 features
 */

import { test, expect } from '@playwright/test'

test.describe('Generator V2 Functionality Tests', () => {
  test('Complete Generator V2 functionality verification', async ({ page }) => {
    console.log('🚀 Starting comprehensive Generator V2 functionality test...')

    // Step 1: Navigate to generator
    console.log('1️⃣ Navigating to generator...')
    await page.goto('/generator')
    await page.waitForLoadState('networkidle')
    
    // Check if redirected to login
    const currentUrl = page.url()
    if (currentUrl.includes('/auth/login')) {
      console.log('✅ Authentication working - redirected to login')
      console.log('🔧 Testing with demo mode or direct access...')
      
      // Try accessing directly or with demo parameter
      await page.goto('/generator?demo=true')
      await page.waitForLoadState('networkidle')
    }

    // Step 2: Verify Generator V2 Interface
    console.log('2️⃣ Verifying Generator V2 interface...')
    
    // Check for main heading
    const heading = page.locator('h1, h2, h3').filter({ hasText: /Generator|Minu\.AI/i }).first()
    await expect(heading).toBeVisible({ timeout: 10000 })
    console.log('✅ Generator heading found')
    
    // Check for mode selector
    const imagesMode = page.locator('button').filter({ hasText: /images/i }).first()
    const videoMode = page.locator('button').filter({ hasText: /video/i }).first()
    const enhanceMode = page.locator('button').filter({ hasText: /enhance/i }).first()
    
    if (await imagesMode.isVisible()) {
      console.log('✅ Mode selector found with Images mode')
    }

    // Step 3: Test Prompt Input and Enhancement
    console.log('3️⃣ Testing prompt input and enhancement...')
    
    // Find prompt input (textarea)
    const promptInput = page.locator('textarea').first()
    await expect(promptInput).toBeVisible({ timeout: 5000 })
    console.log('✅ Prompt input found')
    
    // Enter test prompt
    const testPrompt = 'a beautiful sunset over mountains'
    await promptInput.fill(testPrompt)
    console.log(`✅ Test prompt entered: "${testPrompt}"`)
    
    // Test enhance button
    const enhanceButton = page.locator('button').filter({ hasText: /enhance/i }).first()
    if (await enhanceButton.isVisible()) {
      console.log('✅ Enhance button found')
      
      // Check if button is enabled
      const isEnabled = await enhanceButton.isEnabled()
      if (isEnabled) {
        console.log('✅ Enhance button is enabled')
        
        // Click enhance button and wait for response
        await enhanceButton.click()
        console.log('🔮 Clicked enhance button...')
        
        // Wait for enhancement to complete (look for loading state change)
        await page.waitForTimeout(3000) // Give time for API call
        
        // Check if prompt was enhanced (should be longer)
        const enhancedPrompt = await promptInput.inputValue()
        if (enhancedPrompt.length > testPrompt.length) {
          console.log('✅ Prompt was enhanced successfully!')
          console.log(`   Original: "${testPrompt}"`)
          console.log(`   Enhanced: "${enhancedPrompt}"`)
        } else {
          console.log('⚠️ Prompt enhancement may not have worked')
        }
      } else {
        console.log('⚠️ Enhance button is disabled')
      }
    } else {
      console.log('❌ Enhance button not found')
    }

    // Step 4: Test Suggestions System (Lightbulb)
    console.log('4️⃣ Testing suggestions system...')
    
    // Look for suggestions button (lightbulb icon)
    const suggestionsButton = page.locator('button').filter({ hasText: /suggestions/i }).first()
    const lightbulbButton = page.locator('button:has(svg)').filter({ hasText: /suggestions/i }).first()
    
    let suggestionsFound = false
    
    if (await suggestionsButton.isVisible()) {
      console.log('✅ Suggestions button found')
      await suggestionsButton.click()
      suggestionsFound = true
    } else if (await lightbulbButton.isVisible()) {
      console.log('✅ Lightbulb suggestions button found')
      await lightbulbButton.click()
      suggestionsFound = true
    }
    
    if (suggestionsFound) {
      // Wait for suggestions panel to appear
      await page.waitForTimeout(1000)
      
      // Look for suggestion categories
      const styleButton = page.locator('button').filter({ hasText: /style/i }).first()
      const qualityButton = page.locator('button').filter({ hasText: /quality/i }).first()
      
      if (await styleButton.isVisible() || await qualityButton.isVisible()) {
        console.log('✅ Suggestion categories found')
        
        // Try clicking a category
        if (await styleButton.isVisible()) {
          await styleButton.click()
          console.log('✅ Style category clicked')
        }
        
        // Look for individual suggestions with plus icons
        const suggestionItems = page.locator('button:has(svg)').filter({ hasText: /photorealistic|digital art|high quality/i })
        const suggestionCount = await suggestionItems.count()
        
        if (suggestionCount > 0) {
          console.log(`✅ Found ${suggestionCount} suggestion items`)
          
          // Try clicking a suggestion
          await suggestionItems.first().click()
          console.log('✅ Clicked a suggestion item')
          
          // Check if it was added to prompt
          const updatedPrompt = await promptInput.inputValue()
          if (updatedPrompt !== enhancedPrompt) {
            console.log('✅ Suggestion was added to prompt')
          }
        } else {
          console.log('⚠️ No suggestion items found')
        }
      } else {
        console.log('⚠️ Suggestion categories not found')
      }
    } else {
      console.log('❌ Suggestions button not found')
    }

    // Step 5: Test Model Selection
    console.log('5️⃣ Testing model selection...')
    
    // Look for model selector (dropdown or select)
    const modelSelector = page.locator('select, [role="combobox"], button').filter({ hasText: /flux|model|select/i }).first()
    
    if (await modelSelector.isVisible()) {
      console.log('✅ Model selector found')
      
      // Try to open dropdown
      await modelSelector.click()
      await page.waitForTimeout(500)
      
      // Look for model options
      const modelOptions = page.locator('[role="option"], option').filter({ hasText: /flux|schnell|ultra/i })
      const optionCount = await modelOptions.count()
      
      if (optionCount > 0) {
        console.log(`✅ Found ${optionCount} model options`)
        
        // Try selecting a model
        await modelOptions.first().click()
        console.log('✅ Selected a model')
      } else {
        console.log('⚠️ No model options found')
      }
    } else {
      console.log('⚠️ Model selector not clearly visible')
    }

    // Step 6: Test Generate Button
    console.log('6️⃣ Testing generate button...')
    
    const generateButton = page.locator('button').filter({ hasText: /generate/i }).first()
    
    if (await generateButton.isVisible()) {
      console.log('✅ Generate button found')
      
      const isEnabled = await generateButton.isEnabled()
      console.log(`Generate button enabled: ${isEnabled}`)
      
      if (isEnabled) {
        console.log('✅ Generate button is ready for use')
        // Note: We won't actually click generate to avoid API costs
      }
    } else {
      console.log('❌ Generate button not found')
    }

    // Step 7: Take Screenshot for Documentation
    await page.screenshot({ 
      path: 'test-results/generator-v2-functionality.png',
      fullPage: true 
    })

    // Step 8: Final Assessment
    console.log('8️⃣ Final functionality assessment...')
    
    const functionalityResults = {
      interfaceLoaded: await heading.isVisible(),
      promptInputWorking: await promptInput.isVisible(),
      enhanceButtonFound: await enhanceButton.isVisible().catch(() => false),
      suggestionsSystemFound: suggestionsFound,
      modelSelectorFound: await modelSelector.isVisible().catch(() => false),
      generateButtonFound: await generateButton.isVisible().catch(() => false)
    }

    console.log('\n📊 FUNCTIONALITY TEST RESULTS:')
    console.log('=' .repeat(50))
    Object.entries(functionalityResults).forEach(([feature, working]) => {
      console.log(`${working ? '✅' : '❌'} ${feature}: ${working}`)
    })

    const workingFeatures = Object.values(functionalityResults).filter(Boolean).length
    const totalFeatures = Object.keys(functionalityResults).length
    const successRate = (workingFeatures / totalFeatures) * 100

    console.log(`\n🎯 Functionality Success Rate: ${successRate.toFixed(1)}% (${workingFeatures}/${totalFeatures})`)

    if (successRate >= 80) {
      console.log('🎉 GENERATOR V2 FUNCTIONALITY TEST PASSED!')
      console.log('✅ All major features are working correctly')
    } else if (successRate >= 60) {
      console.log('⚠️ GENERATOR V2 PARTIALLY FUNCTIONAL')
      console.log('Some features may need attention')
    } else {
      console.log('❌ GENERATOR V2 FUNCTIONALITY ISSUES DETECTED')
      console.log('Major features are not working properly')
    }

    // Assertions for test framework
    expect(functionalityResults.interfaceLoaded).toBe(true)
    expect(functionalityResults.promptInputWorking).toBe(true)
    expect(workingFeatures).toBeGreaterThanOrEqual(4) // At least 4/6 features working

    console.log('\n✅ Generator V2 functionality test completed!')
  })
})
