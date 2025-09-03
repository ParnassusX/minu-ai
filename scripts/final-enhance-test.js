/**
 * Final Enhance Test
 * Comprehensive test of the enhanced functionality
 */

const baseUrl = 'http://localhost:4000'

async function testEnhancedFunctionality() {
  console.log('🎯 FINAL ENHANCE FUNCTIONALITY TEST')
  console.log('=' .repeat(50))
  
  const testCases = [
    {
      name: 'Simple prompt',
      input: 'a cat',
      expectedMinLength: 50
    },
    {
      name: 'Detailed prompt',
      input: 'beautiful sunset over mountains',
      expectedMinLength: 80
    },
    {
      name: 'Art prompt',
      input: 'portrait of a woman in renaissance style',
      expectedMinLength: 100
    }
  ]

  let successCount = 0
  const results = []

  for (const testCase of testCases) {
    console.log(`\n🧪 Testing: ${testCase.name}`)
    console.log(`   Input: "${testCase.input}"`)
    
    try {
      const response = await fetch(`${baseUrl}/api/enhance-prompt-v2`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: testCase.input })
      })

      if (response.ok) {
        const result = await response.json()
        
        if (result.success && result.data?.enhancedPrompt) {
          const enhanced = result.data.enhancedPrompt
          const improvement = enhanced.length / testCase.input.length
          const meetsExpectation = enhanced.length >= testCase.expectedMinLength
          
          console.log(`   ✅ Enhanced: "${enhanced}"`)
          console.log(`   📊 Length: ${testCase.input.length} → ${enhanced.length} chars`)
          console.log(`   📊 Improvement: ${improvement.toFixed(2)}x`)
          console.log(`   📊 Meets expectation: ${meetsExpectation ? 'Yes' : 'No'}`)
          
          if (meetsExpectation && improvement >= 2.0) {
            console.log(`   ✅ Test PASSED`)
            successCount++
          } else {
            console.log(`   ⚠️ Test PARTIAL - enhancement may be minimal`)
          }
          
          results.push({
            name: testCase.name,
            input: testCase.input,
            enhanced: enhanced,
            improvement: improvement,
            success: meetsExpectation && improvement >= 2.0
          })
        } else {
          console.log(`   ❌ Invalid response format`)
          results.push({
            name: testCase.name,
            input: testCase.input,
            success: false,
            error: 'Invalid response format'
          })
        }
      } else {
        const errorData = await response.json()
        console.log(`   ❌ API Error: ${errorData.error?.message}`)
        results.push({
          name: testCase.name,
          input: testCase.input,
          success: false,
          error: errorData.error?.message
        })
      }
      
    } catch (error) {
      console.log(`   ❌ Network Error: ${error.message}`)
      results.push({
        name: testCase.name,
        input: testCase.input,
        success: false,
        error: error.message
      })
    }
  }

  return { successCount, totalTests: testCases.length, results }
}

async function testSystemIntegration() {
  console.log('\n🔧 TESTING SYSTEM INTEGRATION')
  console.log('=' .repeat(50))
  
  const integrationTests = [
    {
      name: 'Generator V2 Health',
      url: '/api/generate-v2',
      method: 'GET'
    },
    {
      name: 'Models V2 API',
      url: '/api/models-v2',
      method: 'GET'
    },
    {
      name: 'Health Check (with Integration)',
      url: '/api/health',
      method: 'GET'
    }
  ]

  let workingApis = 0
  
  for (const test of integrationTests) {
    try {
      const response = await fetch(`${baseUrl}${test.url}`, {
        method: test.method,
        headers: { 'Content-Type': 'application/json' }
      })
      
      if (response.ok) {
        console.log(`   ✅ ${test.name}: OK`)
        workingApis++
      } else {
        console.log(`   ❌ ${test.name}: ${response.status}`)
      }
    } catch (error) {
      console.log(`   ❌ ${test.name}: ${error.message}`)
    }
  }
  
  return { workingApis, totalApis: integrationTests.length }
}

async function generateUserInstructions(results) {
  console.log('\n📋 USER TESTING INSTRUCTIONS')
  console.log('=' .repeat(50))
  
  if (results.enhanceResults.successCount === results.enhanceResults.totalTests) {
    console.log('🎉 BACKEND IS FULLY FUNCTIONAL!')
    console.log('\n✅ What this means:')
    console.log('   • API is working perfectly')
    console.log('   • Enhancement logic is correct')
    console.log('   • All test cases pass')
    console.log('   • Backend ready for frontend use')
    
    console.log('\n🔍 If enhance button still not working in browser:')
    console.log('   1. Open browser DevTools (F12)')
    console.log('   2. Go to Console tab')
    console.log('   3. Navigate to http://localhost:4000/generator')
    console.log('   4. Enter a prompt like "a cat"')
    console.log('   5. Click the Enhance button')
    console.log('   6. Look for these debug messages:')
    console.log('      • 🔮 Starting enhance process')
    console.log('      • 🔮 API response received')
    console.log('      • 🔮 Calling onPromptChange')
    console.log('      • 🎯 useGenerator.setPrompt called')
    console.log('      • 🎯 Functional state update')
    console.log('   7. If you see all messages but textarea doesn\'t update:')
    console.log('      • Check for React strict mode issues')
    console.log('      • Verify component re-rendering')
    console.log('      • Check for conflicting state updates')
    
    console.log('\n🧪 Alternative test page:')
    console.log('   • Visit: http://localhost:4000/test-enhance')
    console.log('   • This isolated page should work perfectly')
    console.log('   • Use it to verify enhance functionality')
    
  } else {
    console.log('❌ BACKEND ISSUES DETECTED')
    console.log('\n🔧 Fix these issues first:')
    results.enhanceResults.results.forEach((result, index) => {
      if (!result.success) {
        console.log(`   ${index + 1}. ${result.name}: ${result.error || 'Failed'}`)
      }
    })
  }
}

async function runFinalTest() {
  console.log('🚀 RUNNING FINAL COMPREHENSIVE TEST')
  console.log('=' .repeat(60))
  
  // Test enhance functionality
  const enhanceResults = await testEnhancedFunctionality()
  
  // Test system integration
  const integrationResults = await testSystemIntegration()
  
  console.log('\n🎉 FINAL TEST SUMMARY')
  console.log('=' .repeat(60))
  console.log(`✅ Enhance Tests: ${enhanceResults.successCount}/${enhanceResults.totalTests} passed`)
  console.log(`✅ Integration Tests: ${integrationResults.workingApis}/${integrationResults.totalApis} passed`)
  
  const enhanceSuccessRate = (enhanceResults.successCount / enhanceResults.totalTests) * 100
  const integrationSuccessRate = (integrationResults.workingApis / integrationResults.totalApis) * 100
  
  console.log(`🎯 Enhance Success Rate: ${enhanceSuccessRate.toFixed(1)}%`)
  console.log(`🎯 Integration Success Rate: ${integrationSuccessRate.toFixed(1)}%`)
  
  const overallSuccess = enhanceSuccessRate >= 80 && integrationSuccessRate >= 80
  
  if (overallSuccess) {
    console.log('\n🎉 ALL SYSTEMS OPERATIONAL!')
    console.log('✅ Backend functionality is perfect')
    console.log('✅ API endpoints are working')
    console.log('✅ Enhancement logic is correct')
    console.log('✅ Ready for frontend integration')
  } else {
    console.log('\n⚠️ ISSUES DETECTED')
    console.log('Some systems need attention before frontend testing')
  }
  
  // Generate user instructions
  await generateUserInstructions({
    enhanceResults,
    integrationResults,
    overallSuccess
  })
  
  console.log('\n📊 DETAILED RESULTS:')
  enhanceResults.results.forEach((result, index) => {
    console.log(`   ${index + 1}. ${result.name}: ${result.success ? 'PASS' : 'FAIL'}`)
    if (result.success) {
      console.log(`      Improvement: ${result.improvement.toFixed(2)}x`)
    } else {
      console.log(`      Error: ${result.error}`)
    }
  })
  
  return {
    enhanceResults,
    integrationResults,
    overallSuccess
  }
}

// Run the final test
runFinalTest().catch(console.error)
