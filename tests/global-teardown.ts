/**
 * Global Teardown for Playwright Tests
 * Minu.AI Generator V2 End-to-End Testing
 */

import { FullConfig } from '@playwright/test'

async function globalTeardown(config: FullConfig) {
  console.log('🏁 Minu.AI Generator V2 E2E Test Suite Completed')
  console.log('=' .repeat(60))
  console.log('📊 Test artifacts saved to: test-results/')
  console.log('📋 HTML Report: test-results/html-report/index.html')
  console.log('📄 JSON Results: test-results/results.json')
  console.log('🎬 Videos and screenshots available in test-results/')
  console.log('=' .repeat(60))
}

export default globalTeardown
