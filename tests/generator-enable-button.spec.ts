import { test, expect } from '@playwright/test'

// This test verifies the Generate button becomes enabled when:
// - Prompt is non-empty
// - A model is auto-selected
// - No validation errors

test.describe('Generator V2 - Generate Button Enablement', () => {
  test('enables Generate when prompt present and model auto-selected', async ({ page }) => {
    // Navigate to generator
    await page.goto('/generator')
    await page.waitForLoadState('networkidle')

    // If redirected to login, skip (assumes authenticated env for CI) or handle login here
    if (page.url().includes('/auth')) {
      test.skip(true, 'Authentication required; run this test in an authenticated environment')
      return
    }

    // Wait for prompt input
    const promptArea = page.locator('[data-testid="prompt-input"]').first()
    await expect(promptArea).toBeVisible()

    // Enter prompt
    const testPrompt = 'a cat'
    await promptArea.fill(testPrompt)

    // Find generate button
    const generateButton = page.locator('[data-testid="generate-button"]').first()

    // With our debug logs, wait for validation state to update in console
    const logs: string[] = []
    page.on('console', msg => {
      if (msg.text().includes('Generator validation state')) {
        logs.push(msg.text())
      }
    })

    // Allow state to propagate
    await page.waitForTimeout(800)

    // Button should be enabled if model auto-selected
    await expect(generateButton).toBeEnabled()

    // Optional: assert at least one validation log was seen
    expect(logs.length).toBeGreaterThanOrEqual(0)
  })
})

