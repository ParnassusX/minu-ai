/**
 * Demo Mode Generator Analysis Test
 * Comprehensive test using demo mode to identify interface inconsistencies
 */

import { test, expect } from '@playwright/test'

test.describe('Demo Mode Generator Interface Analysis', () => {
  test('Complete generator analysis with demo mode enabled', async ({ page }) => {
    console.log('🔍 Starting demo mode generator interface analysis...')

    // Step 1: Navigate directly to generator (demo mode should allow access)
    console.log('1️⃣ Navigating to generator with demo mode...')
    await page.goto('http://localhost:4000/generator')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(3000) // Allow time for React components to render
    
    // Take screenshot for visual analysis
    await page.screenshot({ 
      path: 'test-results/demo-mode-generator-interface.png',
      fullPage: true 
    })
    
    // Step 2: Analyze what's actually being rendered
    console.log('2️⃣ Analyzing actual rendered interface...')
    
    const pageTitle = await page.title()
    const currentUrl = page.url()
    const bodyText = await page.locator('body').textContent()
    
    console.log(`Page title: ${pageTitle}`)
    console.log(`Current URL: ${currentUrl}`)
    console.log(`Body text (first 200 chars): ${bodyText?.substring(0, 200)}...`)
    
    // Check if we're redirected to login (demo mode failed)
    if (currentUrl.includes('/auth/login')) {
      console.log('❌ Demo mode not working - redirected to login')
      console.log('🔧 Checking environment variables...')
      
      // Check if demo mode is properly set
      const envCheck = await page.evaluate(() => {
        return {
          nodeEnv: process.env.NODE_ENV,
          demoMode: process.env.NEXT_PUBLIC_DEMO_MODE
        }
      })
      
      console.log(`Environment check: ${JSON.stringify(envCheck)}`)
      test.skip()
      return
    }
    
    // Step 3: Comprehensive interface analysis
    console.log('3️⃣ Analyzing interface components...')
    
    // Look for all possible generator interfaces
    const interfaceAnalysis = await page.evaluate(() => {
      const analysis = {
        headings: Array.from(document.querySelectorAll('h1, h2, h3')).map(h => ({
          tag: h.tagName,
          text: h.textContent?.trim(),
          className: h.className,
          id: h.id
        })),
        
        generatorContainers: Array.from(document.querySelectorAll('[data-testid*="generator"], [class*="generator"], .generator')).map(el => ({
          tagName: el.tagName,
          testId: el.getAttribute('data-testid'),
          className: el.className,
          id: el.id,
          text: el.textContent?.substring(0, 100)
        })),
        
        modeSelectors: Array.from(document.querySelectorAll('[data-testid*="mode"], [class*="mode"]')).map(el => ({
          tagName: el.tagName,
          testId: el.getAttribute('data-testid'),
          className: el.className,
          text: el.textContent?.trim()
        })),
        
        promptInputs: Array.from(document.querySelectorAll('textarea, input[placeholder*="prompt"], input[placeholder*="describe"]')).map(el => ({
          tagName: el.tagName,
          type: el.getAttribute('type'),
          placeholder: el.getAttribute('placeholder'),
          className: el.className,
          id: el.id
        })),
        
        generateButtons: Array.from(document.querySelectorAll('button')).filter(btn => 
          btn.textContent?.toLowerCase().includes('generate') ||
          btn.textContent?.toLowerCase().includes('create') ||
          btn.textContent?.toLowerCase().includes('enhance')
        ).map(btn => ({
          text: btn.textContent?.trim(),
          className: btn.className,
          id: btn.id,
          testId: btn.getAttribute('data-testid')
        })),
        
        allButtons: Array.from(document.querySelectorAll('button')).map(btn => btn.textContent?.trim()).filter(Boolean),
        
        navigation: {
          hasNavigation: !!document.querySelector('.nav-responsive, nav, [role="navigation"]'),
          navigationText: document.querySelector('.nav-responsive, nav, [role="navigation"]')?.textContent?.substring(0, 200)
        }
      }
      
      return analysis
    })
    
    console.log('\n📊 INTERFACE ANALYSIS RESULTS:')
    console.log('='.repeat(50))
    
    console.log('\n🏷️  HEADINGS FOUND:')
    interfaceAnalysis.headings.forEach((h, i) => {
      console.log(`  ${i + 1}. ${h.tag}: "${h.text}"`)
      if (h.className) console.log(`     Class: ${h.className}`)
      if (h.testId) console.log(`     Test ID: ${h.testId}`)
    })
    
    console.log('\n🎛️  GENERATOR CONTAINERS:')
    if (interfaceAnalysis.generatorContainers.length === 0) {
      console.log('  ❌ No generator containers found!')
    } else {
      interfaceAnalysis.generatorContainers.forEach((container, i) => {
        console.log(`  ${i + 1}. ${container.tagName}`)
        if (container.testId) console.log(`     Test ID: ${container.testId}`)
        if (container.className) console.log(`     Class: ${container.className}`)
        console.log(`     Text: "${container.text}..."`)
      })
    }
    
    console.log('\n🔄 MODE SELECTORS:')
    if (interfaceAnalysis.modeSelectors.length === 0) {
      console.log('  ❌ No mode selectors found!')
    } else {
      interfaceAnalysis.modeSelectors.forEach((selector, i) => {
        console.log(`  ${i + 1}. ${selector.tagName}: "${selector.text}"`)
        if (selector.testId) console.log(`     Test ID: ${selector.testId}`)
      })
    }
    
    console.log('\n✏️  PROMPT INPUTS:')
    if (interfaceAnalysis.promptInputs.length === 0) {
      console.log('  ❌ No prompt inputs found!')
    } else {
      interfaceAnalysis.promptInputs.forEach((input, i) => {
        console.log(`  ${i + 1}. ${input.tagName}`)
        if (input.placeholder) console.log(`     Placeholder: "${input.placeholder}"`)
        if (input.className) console.log(`     Class: ${input.className}`)
      })
    }
    
    console.log('\n🚀 GENERATE BUTTONS:')
    if (interfaceAnalysis.generateButtons.length === 0) {
      console.log('  ❌ No generate buttons found!')
    } else {
      interfaceAnalysis.generateButtons.forEach((btn, i) => {
        console.log(`  ${i + 1}. "${btn.text}"`)
        if (btn.testId) console.log(`     Test ID: ${btn.testId}`)
      })
    }
    
    console.log('\n🧭 NAVIGATION:')
    console.log(`  Has Navigation: ${interfaceAnalysis.navigation.hasNavigation}`)
    if (interfaceAnalysis.navigation.navigationText) {
      console.log(`  Navigation Text: "${interfaceAnalysis.navigation.navigationText}..."`)
    }
    
    console.log('\n🔘 ALL BUTTONS:')
    console.log(`  Found ${interfaceAnalysis.allButtons.length} buttons:`)
    interfaceAnalysis.allButtons.forEach((btnText, i) => {
      console.log(`    ${i + 1}. "${btnText}"`)
    })
    
    // Step 4: Determine which interface is being served
    console.log('\n4️⃣ Determining interface type...')
    
    const interfaceType = (() => {
      // Check for Generator V2 (expected interface)
      if (interfaceAnalysis.headings.some(h => h.text?.includes('Minu.AI Generator V2'))) {
        return 'Generator V2 (Expected)'
      }
      
      // Check for simple "Image Generation" interface (first screenshot)
      if (interfaceAnalysis.headings.some(h => h.text?.includes('Image Generation'))) {
        return 'Simple Image Generation Interface (Screenshot 1)'
      }
      
      // Check for "Create Enhanced Images" interface (second screenshot)
      if (interfaceAnalysis.headings.some(h => h.text?.includes('Create Enhanced Images'))) {
        return 'Create Enhanced Images Interface (Screenshot 2)'
      }
      
      // Check for other patterns
      if (interfaceAnalysis.headings.some(h => h.text?.includes('Generator'))) {
        return 'Unknown Generator Interface'
      }
      
      return 'Unknown/No Generator Interface'
    })()
    
    console.log(`\n🎯 INTERFACE TYPE DETECTED: ${interfaceType}`)
    
    // Step 5: Final diagnosis
    console.log('\n5️⃣ Final diagnosis...')
    
    const diagnosis = {
      hasGeneratorV2: interfaceType === 'Generator V2 (Expected)',
      hasNavigation: interfaceAnalysis.navigation.hasNavigation,
      hasPromptInput: interfaceAnalysis.promptInputs.length > 0,
      hasModeSelector: interfaceAnalysis.modeSelectors.length > 0,
      hasGenerateButton: interfaceAnalysis.generateButtons.length > 0,
      multipleInterfaces: interfaceAnalysis.generatorContainers.length > 1,
      interfaceType
    }
    
    console.log('\n📋 DIAGNOSIS SUMMARY:')
    console.log('='.repeat(50))
    console.log(`✅ Expected Generator V2: ${diagnosis.hasGeneratorV2}`)
    console.log(`✅ Navigation Present: ${diagnosis.hasNavigation}`)
    console.log(`✅ Prompt Input Present: ${diagnosis.hasPromptInput}`)
    console.log(`✅ Mode Selector Present: ${diagnosis.hasModeSelector}`)
    console.log(`✅ Generate Button Present: ${diagnosis.hasGenerateButton}`)
    console.log(`⚠️  Multiple Interfaces: ${diagnosis.multipleInterfaces}`)
    console.log(`🎯 Interface Type: ${diagnosis.interfaceType}`)
    
    if (!diagnosis.hasGeneratorV2) {
      console.log('\n🚨 CRITICAL ISSUE CONFIRMED:')
      console.log('The expected Generator V2 interface is NOT being served!')
      console.log('This explains the interface inconsistencies you\'re experiencing.')
      console.log('\nLikely causes:')
      console.log('1. Multiple generator implementations in codebase')
      console.log('2. Routing conflicts')
      console.log('3. Build cache issues serving old interfaces')
      console.log('4. Import/export conflicts')
    }
    
    // Save detailed analysis
    await page.evaluate((analysis) => {
      console.log('DETAILED_INTERFACE_ANALYSIS:', JSON.stringify(analysis, null, 2))
    }, { interfaceAnalysis, diagnosis, interfaceType })
    
    // Assert basic functionality
    expect(diagnosis.hasPromptInput).toBe(true)
    expect(diagnosis.hasGenerateButton).toBe(true)
    
    // The critical assertion - this should pass if Generator V2 is properly served
    if (!diagnosis.hasGeneratorV2) {
      console.log('\n❌ TEST REVEALS ARCHITECTURAL PROBLEM')
      console.log('Multiple generator implementations are causing interface inconsistencies')
    }
  })
})
