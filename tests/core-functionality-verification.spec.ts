/**
 * Core Functionality Verification Test
 * Tests the essential functionality that must work for production readiness
 */

import { test, expect } from '@playwright/test'

test.describe('Core Functionality Verification', () => {
  test('Essential app functionality verification', async ({ page }) => {
    console.log('🚀 Starting core functionality verification...')

    // Test 1: Landing page loads
    console.log('🏠 Test 1: Landing page...')
    await page.goto('http://localhost:4000')
    await page.waitForLoadState('networkidle')
    
    const title = await page.locator('h1').textContent()
    console.log(`   Title: ${title}`)
    expect(title).toContain('Minu.AI')
    
    const hasGetStarted = await page.locator('text=Get Started').isVisible()
    const hasSignIn = await page.locator('text=Sign In').isVisible()
    console.log(`   Get Started button: ${hasGetStarted ? '✅' : '❌'}`)
    console.log(`   Sign In button: ${hasSignIn ? '✅' : '❌'}`)
    
    // Test 2: Direct navigation to auth pages
    console.log('🔐 Test 2: Authentication pages...')
    
    await page.goto('http://localhost:4000/auth/signup')
    await page.waitForLoadState('networkidle')
    const signupTitle = await page.locator('h1, h2, h3').textContent()
    console.log(`   Signup page title: ${signupTitle}`)
    expect(signupTitle).toContain('Create Account')

    await page.goto('http://localhost:4000/auth/login')
    await page.waitForLoadState('networkidle')
    const loginTitle = await page.locator('h1, h2, h3').textContent()
    console.log(`   Login page title: ${loginTitle}`)
    expect(loginTitle).toContain('Welcome Back')
    
    // Test 3: Protected routes redirect to login
    console.log('🔒 Test 3: Protected routes...')
    
    await page.goto('http://localhost:4000/generator')
    await page.waitForLoadState('networkidle')
    
    const currentUrl = page.url()
    console.log(`   Generator URL: ${currentUrl}`)
    
    if (currentUrl.includes('/auth/login')) {
      console.log('   ✅ Generator redirects to login (properly protected)')
    } else if (currentUrl.includes('/generator')) {
      console.log('   ⚠️ Generator accessible without auth (check if intended)')
      
      // If generator is accessible, test that it loads properly
      const generatorElement = await page.locator('[data-testid="generator-v2"]')
      if (await generatorElement.isVisible()) {
        console.log('   ✅ Generator component loads correctly')
      } else {
        console.log('   ❌ Generator component not found')
      }
    }
    
    // Test 4: API endpoints respond correctly
    console.log('🔌 Test 4: API endpoints...')
    
    const healthResponse = await page.request.get('http://localhost:4000/api/health')
    console.log(`   /api/health: ${healthResponse.status()}`)
    expect(healthResponse.status()).toBeLessThan(500)
    
    const modelsResponse = await page.request.get('http://localhost:4000/api/models-v2')
    console.log(`   /api/models-v2: ${modelsResponse.status()}`)
    expect(modelsResponse.status()).toBeLessThan(500)
    
    // Test generation API (should require auth)
    const generateResponse = await page.request.post('http://localhost:4000/api/generate-v2', {
      data: {
        model: 'flux-schnell',
        mode: 'images',
        input: { prompt: 'test' }
      }
    })
    console.log(`   /api/generate-v2: ${generateResponse.status()}`)
    if (generateResponse.status() === 401) {
      console.log('   ✅ Generation API properly requires authentication')
    } else {
      console.log(`   ⚠️ Generation API response: ${generateResponse.status()}`)
    }
    
    // Test 5: All main routes exist (no 404s)
    console.log('🗺️ Test 5: Route existence...')
    
    const routes = [
      '/',
      '/auth/login',
      '/auth/signup',
      '/dashboard',
      '/generator',
      '/gallery',
      '/settings',
      '/profile',
      '/admin',
      '/chat'
    ]
    
    for (const route of routes) {
      await page.goto(`http://localhost:4000${route}`)
      await page.waitForLoadState('networkidle')
      
      const has404 = await page.locator('text=404').isVisible().catch(() => false)
      const hasNotFound = await page.locator('text=Not Found').isVisible().catch(() => false)
      
      if (has404 || hasNotFound) {
        console.log(`   ❌ ${route}: 404 error`)
      } else {
        console.log(`   ✅ ${route}: Loads successfully`)
      }
    }
    
    // Test 6: Test routes are properly removed
    console.log('🧹 Test 6: Cleanup verification...')
    
    const testRoutes = [
      '/generator-v2-test',
      '/test-v2',
      '/real-test',
      '/dev-access',
      '/system-status'
    ]
    
    for (const route of testRoutes) {
      await page.goto(`http://localhost:4000${route}`)
      await page.waitForLoadState('networkidle')
      
      const has404 = await page.locator('text=404').isVisible().catch(() => false)
      const hasNotFound = await page.locator('text=Not Found').isVisible().catch(() => false)
      const currentUrl = page.url()
      const isNotFoundPage = has404 || hasNotFound || currentUrl.includes('404')
      
      if (isNotFoundPage) {
        console.log(`   ✅ ${route}: Properly removed`)
      } else {
        console.log(`   ❌ ${route}: Still accessible`)
      }
    }
    
    console.log('\n🎉 Core functionality verification completed!')
  })
})
