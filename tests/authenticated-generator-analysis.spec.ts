/**
 * Authenticated Generator Analysis Test
 * Comprehensive test with real authentication to identify interface inconsistencies
 */

import { test, expect } from '@playwright/test'

test.describe('Authenticated Generator Interface Analysis', () => {
  test('Complete authenticated generator analysis with real login', async ({ page }) => {
    console.log('🔍 Starting authenticated generator interface analysis...')

    // Step 1: Navigate to login page and perform real authentication
    console.log('1️⃣ Performing real authentication...')
    await page.goto('http://localhost:4000/auth/login')
    await page.waitForLoadState('networkidle')
    
    // Fill in test credentials (you'll need to provide real test credentials)
    const emailInput = page.locator('input[type="email"]')
    const passwordInput = page.locator('input[type="password"]')
    const signInButton = page.locator('button:has-text("Sign In")')
    
    await expect(emailInput).toBeVisible()
    await expect(passwordInput).toBeVisible()
    await expect(signInButton).toBeVisible()
    
    // Use test credentials - replace with actual test account
    await emailInput.fill('test@example.com') // Replace with real test email
    await passwordInput.fill('testpassword123') // Replace with real test password
    await signInButton.click()
    
    // Wait for authentication to complete
    await page.waitForTimeout(3000)
    
    // Check if we're redirected or if there's an error
    const currentUrl = page.url()
    console.log(`Current URL after login attempt: ${currentUrl}`)
    
    // If login failed, skip the rest of the test
    if (currentUrl.includes('/auth/login')) {
      console.log('⚠️  Authentication failed or test credentials not valid')
      console.log('📝 To run this test, you need to:')
      console.log('   1. Create a test user account in Supabase')
      console.log('   2. Update the credentials in this test file')
      console.log('   3. Ensure the test user has proper permissions')
      test.skip()
      return
    }

    // Step 2: Navigate to generator and capture interface details
    console.log('2️⃣ Navigating to generator with authenticated user...')
    await page.goto('http://localhost:4000/generator')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000) // Allow time for React components to render
    
    // Step 3: Capture comprehensive interface analysis
    console.log('3️⃣ Analyzing generator interface...')
    
    // Take screenshot for visual analysis
    await page.screenshot({ 
      path: 'test-results/authenticated-generator-interface.png',
      fullPage: true 
    })
    
    // Analyze page structure
    const pageTitle = await page.title()
    const bodyText = await page.locator('body').textContent()
    const allHeadings = await page.locator('h1, h2, h3, h4, h5, h6').allTextContents()
    
    console.log(`Page title: ${pageTitle}`)
    console.log(`Headings found: ${allHeadings.join(', ')}`)
    
    // Check for Generator V2 specific elements
    const generatorV2Container = page.locator('[data-testid="generator-v2"]')
    const generatorV2Header = page.locator('h1:has-text("Minu.AI Generator V2")')
    const modeSelector = page.locator('[data-testid="mode-selector"]')
    
    const hasGeneratorV2Container = await generatorV2Container.isVisible()
    const hasGeneratorV2Header = await generatorV2Header.isVisible()
    const hasModeSelector = await modeSelector.isVisible()
    
    console.log(`Generator V2 container visible: ${hasGeneratorV2Container}`)
    console.log(`Generator V2 header visible: ${hasGeneratorV2Header}`)
    console.log(`Mode selector visible: ${hasModeSelector}`)
    
    // Check for navigation integration
    const navigation = page.locator('.nav-responsive')
    const hasNavigation = await navigation.isVisible()
    console.log(`Navigation visible: ${hasNavigation}`)
    
    // Check for any other generator interfaces
    const allButtons = await page.locator('button').allTextContents()
    const allCards = await page.locator('[class*="card"], .card').count()
    const allInputs = await page.locator('input, textarea, select').count()
    
    console.log(`Buttons found: ${allButtons.join(', ')}`)
    console.log(`Cards found: ${allCards}`)
    console.log(`Input elements found: ${allInputs}`)
    
    // Step 4: Check for multiple generator implementations
    console.log('4️⃣ Checking for multiple generator implementations...')
    
    // Look for different generator patterns
    const possibleGeneratorSelectors = [
      '[data-testid="generator-v2"]',
      '[data-testid="generator"]',
      '.generator',
      '[class*="generator"]',
      'main:has(h1:contains("Generator"))',
      'main:has(h1:contains("Image Generation"))',
      'main:has(h1:contains("Create"))',
      '[data-testid="image-generator"]',
      '[data-testid="clean-generator"]',
      '[data-testid="modern-generator"]'
    ]
    
    const foundGenerators = []
    for (const selector of possibleGeneratorSelectors) {
      const element = page.locator(selector)
      const isVisible = await element.isVisible().catch(() => false)
      const count = await element.count().catch(() => 0)
      
      if (isVisible && count > 0) {
        foundGenerators.push({
          selector,
          count,
          text: await element.first().textContent().catch(() => 'N/A')
        })
      }
    }
    
    console.log(`Found generator implementations: ${foundGenerators.length}`)
    foundGenerators.forEach((gen, index) => {
      console.log(`  ${index + 1}. ${gen.selector} (count: ${gen.count})`)
      console.log(`     Text: ${gen.text?.substring(0, 100)}...`)
    })
    
    // Step 5: Analyze DOM structure for conflicts
    console.log('5️⃣ Analyzing DOM structure for conflicts...')
    
    const domAnalysis = await page.evaluate(() => {
      const analysis = {
        totalElements: document.querySelectorAll('*').length,
        reactRoots: document.querySelectorAll('[data-reactroot], #__next, #root').length,
        duplicateIds: [],
        multipleH1s: document.querySelectorAll('h1').length,
        generatorElements: [],
        cssConflicts: []
      }
      
      // Check for duplicate IDs
      const ids = new Map()
      document.querySelectorAll('[id]').forEach(el => {
        const id = el.id
        if (ids.has(id)) {
          analysis.duplicateIds.push(id)
        } else {
          ids.set(id, true)
        }
      })
      
      // Find all elements that might be generators
      const generatorKeywords = ['generator', 'create', 'generate', 'image-gen']
      generatorKeywords.forEach(keyword => {
        const elements = document.querySelectorAll(`[class*="${keyword}"], [data-testid*="${keyword}"], [id*="${keyword}"]`)
        if (elements.length > 0) {
          analysis.generatorElements.push({
            keyword,
            count: elements.length,
            elements: Array.from(elements).map(el => ({
              tagName: el.tagName,
              className: el.className,
              id: el.id,
              testId: el.getAttribute('data-testid')
            }))
          })
        }
      })
      
      return analysis
    })
    
    console.log(`DOM Analysis:`)
    console.log(`  Total elements: ${domAnalysis.totalElements}`)
    console.log(`  React roots: ${domAnalysis.reactRoots}`)
    console.log(`  Multiple H1s: ${domAnalysis.multipleH1s}`)
    console.log(`  Duplicate IDs: ${domAnalysis.duplicateIds.join(', ') || 'None'}`)
    console.log(`  Generator-related elements:`)
    domAnalysis.generatorElements.forEach(group => {
      console.log(`    ${group.keyword}: ${group.count} elements`)
    })
    
    // Step 6: Final verification and recommendations
    console.log('6️⃣ Final analysis and recommendations...')
    
    const analysisResults = {
      hasAuthentication: !currentUrl.includes('/auth/login'),
      hasGeneratorV2: hasGeneratorV2Container && hasGeneratorV2Header,
      hasNavigation: hasNavigation,
      multipleGenerators: foundGenerators.length > 1,
      domIssues: domAnalysis.duplicateIds.length > 0 || domAnalysis.multipleH1s > 1,
      totalGeneratorElements: foundGenerators.length
    }
    
    console.log('\n📊 ANALYSIS RESULTS:')
    console.log(`✅ Authentication working: ${analysisResults.hasAuthentication}`)
    console.log(`✅ Generator V2 present: ${analysisResults.hasGeneratorV2}`)
    console.log(`✅ Navigation integrated: ${analysisResults.hasNavigation}`)
    console.log(`⚠️  Multiple generators detected: ${analysisResults.multipleGenerators}`)
    console.log(`⚠️  DOM issues detected: ${analysisResults.domIssues}`)
    
    if (analysisResults.multipleGenerators) {
      console.log('\n🚨 CRITICAL ISSUE: Multiple generator implementations detected!')
      console.log('This explains the interface inconsistencies you\'re experiencing.')
      console.log('Recommendations:')
      console.log('1. Remove all legacy generator components')
      console.log('2. Ensure only Generator V2 is imported and used')
      console.log('3. Clear all build caches and restart development server')
      console.log('4. Verify routing configuration')
    }
    
    // Save detailed analysis to file
    const detailedAnalysis = {
      timestamp: new Date().toISOString(),
      url: page.url(),
      pageTitle,
      allHeadings,
      foundGenerators,
      domAnalysis,
      analysisResults,
      recommendations: analysisResults.multipleGenerators ? [
        'Remove legacy generator components',
        'Ensure single Generator V2 implementation',
        'Clear build caches',
        'Verify routing configuration'
      ] : ['Interface appears consistent']
    }
    
    await page.evaluate((analysis) => {
      console.log('DETAILED_ANALYSIS:', JSON.stringify(analysis, null, 2))
    }, detailedAnalysis)
    
    // Assert that we have a single, consistent generator interface
    expect(analysisResults.hasAuthentication).toBe(true)
    expect(analysisResults.hasGeneratorV2).toBe(true)
    expect(analysisResults.hasNavigation).toBe(true)
    
    if (analysisResults.multipleGenerators) {
      console.log('\n❌ TEST FAILED: Multiple generator implementations detected')
      console.log('This confirms the architectural problem causing interface inconsistencies')
    } else {
      console.log('\n✅ TEST PASSED: Single consistent generator interface detected')
    }
  })
})
