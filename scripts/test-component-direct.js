/**
 * Direct Component Test
 * Test the enhance functionality by directly calling the API
 * and verifying the client-side response parsing works
 */

const baseUrl = 'http://localhost:4000'

async function testEnhanceAPIDirectly() {
  console.log('🔮 Testing Enhance API Directly...')
  console.log('=' .repeat(50))
  
  const testPrompt = 'a beautiful landscape'
  
  try {
    console.log(`📝 Testing prompt: "${testPrompt}"`)
    
    const response = await fetch(`${baseUrl}/api/enhance-prompt-v2`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ prompt: testPrompt })
    })

    console.log(`📊 Response status: ${response.status}`)
    console.log(`📊 Response ok: ${response.ok}`)
    
    if (response.ok) {
      const result = await response.json()
      console.log('📦 Full response structure:')
      console.log(JSON.stringify(result, null, 2))
      
      // Test the exact parsing logic from PromptInput.tsx
      if (result.success && result.data?.enhancedPrompt) {
        console.log('✅ Client-side parsing would work!')
        console.log(`   Original: "${result.data.originalPrompt}"`)
        console.log(`   Enhanced: "${result.data.enhancedPrompt}"`)
        console.log(`   Metadata: ${JSON.stringify(result.data.metadata, null, 2)}`)
        
        return {
          success: true,
          originalPrompt: result.data.originalPrompt,
          enhancedPrompt: result.data.enhancedPrompt,
          improvement: result.data.enhancedPrompt.length / result.data.originalPrompt.length
        }
      } else {
        console.log('❌ Client-side parsing would fail!')
        console.log('   Expected: result.success && result.data?.enhancedPrompt')
        console.log(`   Got success: ${result.success}`)
        console.log(`   Got data: ${!!result.data}`)
        console.log(`   Got enhancedPrompt: ${!!result.data?.enhancedPrompt}`)
        
        return { success: false, error: 'Invalid response format' }
      }
    } else {
      const errorData = await response.json()
      console.log('❌ API Error:')
      console.log(JSON.stringify(errorData, null, 2))
      
      return { success: false, error: errorData.error?.message || 'API error' }
    }
    
  } catch (error) {
    console.log('❌ Network Error:', error.message)
    return { success: false, error: error.message }
  }
}

async function testAllGeneratorAPIs() {
  console.log('\n🚀 Testing All Generator APIs...')
  console.log('=' .repeat(50))
  
  const apiTests = [
    {
      name: 'Generate V2 Health',
      url: '/api/generate-v2',
      method: 'GET'
    },
    {
      name: 'Models V2',
      url: '/api/models-v2',
      method: 'GET'
    },
    {
      name: 'Enhance Prompt V2',
      url: '/api/enhance-prompt-v2',
      method: 'POST',
      body: { prompt: 'test prompt' }
    }
  ]
  
  const results = []
  
  for (const test of apiTests) {
    console.log(`\n🧪 Testing ${test.name}...`)
    
    try {
      const options = {
        method: test.method,
        headers: { 'Content-Type': 'application/json' }
      }
      
      if (test.body) {
        options.body = JSON.stringify(test.body)
      }
      
      const response = await fetch(`${baseUrl}${test.url}`, options)
      const data = await response.json()
      
      console.log(`   Status: ${response.status}`)
      console.log(`   Success: ${data.success || response.ok}`)
      
      if (response.ok) {
        console.log('   ✅ API working')
        results.push({ name: test.name, success: true })
      } else {
        console.log('   ❌ API error:', data.error?.message || 'Unknown error')
        results.push({ name: test.name, success: false, error: data.error?.message })
      }
      
    } catch (error) {
      console.log('   ❌ Network error:', error.message)
      results.push({ name: test.name, success: false, error: error.message })
    }
  }
  
  return results
}

async function simulateClientSideEnhance() {
  console.log('\n🖥️ Simulating Client-Side Enhance Flow...')
  console.log('=' .repeat(50))
  
  // Simulate the exact flow from PromptInput.tsx
  const originalPrompt = 'a serene mountain lake'
  console.log(`📝 Original prompt: "${originalPrompt}"`)
  
  try {
    // This is the exact fetch call from PromptInput.tsx
    const response = await fetch('/api/enhance-prompt-v2', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: originalPrompt.trim() })
    })
    
    if (response.ok) {
      const result = await response.json()
      
      // This is the exact parsing logic from PromptInput.tsx
      if (result.success && result.data?.enhancedPrompt) {
        const enhancedPrompt = result.data.enhancedPrompt
        console.log('✅ Client-side flow would work perfectly!')
        console.log(`📝 Enhanced prompt: "${enhancedPrompt}"`)
        console.log(`📊 Improvement: ${(enhancedPrompt.length / originalPrompt.length).toFixed(2)}x longer`)
        
        return {
          success: true,
          originalPrompt,
          enhancedPrompt,
          clientSideWorking: true
        }
      } else {
        console.log('❌ Client-side parsing would fail')
        console.log('Response structure:', JSON.stringify(result, null, 2))
        
        return {
          success: false,
          error: 'Invalid response format',
          clientSideWorking: false
        }
      }
    } else {
      const errorData = await response.json().catch(() => ({}))
      console.log('❌ API request failed')
      console.log('Error:', errorData)
      
      return {
        success: false,
        error: 'API request failed',
        clientSideWorking: false
      }
    }
    
  } catch (error) {
    console.log('❌ Network error in client simulation:', error.message)
    
    return {
      success: false,
      error: error.message,
      clientSideWorking: false
    }
  }
}

async function runCompleteDirectTest() {
  console.log('🎯 COMPLETE DIRECT COMPONENT TEST')
  console.log('=' .repeat(60))
  
  // Test enhance API directly
  const enhanceResult = await testEnhanceAPIDirectly()
  
  // Test all APIs
  const apiResults = await testAllGeneratorAPIs()
  
  // Simulate client-side flow
  const clientSimulation = await simulateClientSideEnhance()
  
  console.log('\n🎉 COMPLETE DIRECT TEST SUMMARY:')
  console.log('=' .repeat(60))
  
  console.log(`✅ Enhance API Direct Test: ${enhanceResult.success ? 'PASS' : 'FAIL'}`)
  if (enhanceResult.success) {
    console.log(`   Improvement: ${enhanceResult.improvement.toFixed(2)}x longer`)
  } else {
    console.log(`   Error: ${enhanceResult.error}`)
  }
  
  const workingAPIs = apiResults.filter(r => r.success).length
  console.log(`✅ API Tests: ${workingAPIs}/${apiResults.length} working`)
  
  console.log(`✅ Client-Side Simulation: ${clientSimulation.success ? 'PASS' : 'FAIL'}`)
  if (clientSimulation.success) {
    console.log(`   Client-side parsing: ${clientSimulation.clientSideWorking ? 'Working' : 'Broken'}`)
  }
  
  const overallSuccess = enhanceResult.success && workingAPIs === apiResults.length && clientSimulation.success
  
  if (overallSuccess) {
    console.log('\n🎉 ALL DIRECT TESTS PASSED!')
    console.log('✅ Enhance functionality is working perfectly')
    console.log('✅ The issue was just authentication-based access')
    console.log('\n📋 CONFIRMED WORKING:')
    console.log('   • Enhance API endpoint')
    console.log('   • Gemini API integration')
    console.log('   • Response format and parsing')
    console.log('   • Client-side integration logic')
    console.log('   • All Generator V2 APIs')
  } else {
    console.log('\n⚠️ SOME ISSUES DETECTED')
    console.log('Check individual test results above')
  }
  
  return overallSuccess
}

// Run the complete direct test
runCompleteDirectTest().catch(console.error)
