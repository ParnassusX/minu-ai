/**
 * Debug Generator Test
 * Simple test to debug what's happening with the generator page
 */

import { test, expect } from '@playwright/test'

test('debug generator page', async ({ page }) => {
  console.log('🔍 Debugging generator page...')
  
  // Navigate to generator with dev bypass
  await page.goto('/generator?dev=true', { waitUntil: 'networkidle' })
  
  // Take screenshot
  await page.screenshot({ path: 'test-results/debug-generator.png', fullPage: true })
  
  // Log page title
  const title = await page.title()
  console.log('Page title:', title)
  
  // Log page URL
  console.log('Page URL:', page.url())
  
  // Check if there are any error messages
  const errorElements = await page.locator('text=error, text=Error, .text-red').count()
  console.log('Error elements found:', errorElements)
  
  // Check what's actually on the page
  const bodyText = await page.locator('body').textContent()
  console.log('Body text (first 500 chars):', bodyText?.substring(0, 500))
  
  // Look for any generator-related elements
  const generatorElements = await page.locator('[data-testid*="generator"], .generator, main').count()
  console.log('Generator elements found:', generatorElements)
  
  // Check if we're redirected
  if (page.url().includes('/auth/login')) {
    console.log('❌ Redirected to login page')
  } else {
    console.log('✅ On generator page')
  }
  
  // Wait a bit and check again
  await page.waitForTimeout(5000)
  
  const finalElements = await page.locator('[data-testid="generator-v2"]').count()
  console.log('Final generator-v2 elements:', finalElements)
  
  // Take final screenshot
  await page.screenshot({ path: 'test-results/debug-generator-final.png', fullPage: true })
})
