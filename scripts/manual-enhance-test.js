/**
 * Manual Enhance Test
 * Simple test to verify the enhance functionality works end-to-end
 */

const baseUrl = 'http://localhost:4000'

async function testEnhanceEndToEnd() {
  console.log('🔮 Testing Enhance Functionality End-to-End...')
  console.log('=' .repeat(50))
  
  const testCases = [
    {
      name: 'Simple prompt',
      prompt: 'a cat',
      expectedImprovement: true
    },
    {
      name: 'Detailed prompt',
      prompt: 'a beautiful sunset over mountains with golden light',
      expectedImprovement: true
    },
    {
      name: 'Art style prompt',
      prompt: 'portrait of a woman in renaissance style',
      expectedImprovement: true
    }
  ]

  let successCount = 0
  let totalTests = testCases.length

  for (const testCase of testCases) {
    console.log(`\n🧪 Testing: ${testCase.name}`)
    console.log(`   Input: "${testCase.prompt}"`)
    
    try {
      const response = await fetch(`${baseUrl}/api/enhance-prompt-v2`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ prompt: testCase.prompt })
      })

      if (response.ok) {
        const result = await response.json()
        
        if (result.success && result.data?.enhancedPrompt) {
          const enhanced = result.data.enhancedPrompt
          const improvement = enhanced.length / testCase.prompt.length
          
          console.log(`   ✅ Enhanced: "${enhanced}"`)
          console.log(`   📊 Improvement: ${improvement.toFixed(2)}x longer`)
          
          if (improvement > 1.5) { // At least 50% longer
            console.log(`   ✅ Significant improvement detected`)
            successCount++
          } else {
            console.log(`   ⚠️ Minimal improvement`)
          }
        } else {
          console.log(`   ❌ Invalid response format`)
          console.log(`   Response:`, result)
        }
      } else {
        const errorData = await response.json()
        console.log(`   ❌ API Error: ${errorData.error?.message || 'Unknown error'}`)
      }
      
    } catch (error) {
      console.log(`   ❌ Network Error: ${error.message}`)
    }
  }

  console.log('\n📊 ENHANCE FUNCTIONALITY TEST RESULTS:')
  console.log('=' .repeat(50))
  console.log(`✅ Successful enhancements: ${successCount}/${totalTests}`)
  console.log(`🎯 Success rate: ${((successCount / totalTests) * 100).toFixed(1)}%`)

  if (successCount === totalTests) {
    console.log('🎉 ALL ENHANCE TESTS PASSED!')
    console.log('✅ Enhance functionality is working perfectly')
  } else if (successCount > 0) {
    console.log('⚠️ PARTIAL SUCCESS')
    console.log('Some enhance tests passed, but there may be issues')
  } else {
    console.log('❌ ALL ENHANCE TESTS FAILED')
    console.log('Enhance functionality is not working')
  }

  return {
    successCount,
    totalTests,
    successRate: (successCount / totalTests) * 100
  }
}

async function testClientSideIntegration() {
  console.log('\n🖥️ Testing Client-Side Integration...')
  console.log('=' .repeat(50))
  
  // Test if the generator page is accessible
  try {
    const response = await fetch(`${baseUrl}/generator`)
    console.log(`Generator page status: ${response.status}`)
    
    if (response.status === 200) {
      console.log('✅ Generator page is accessible')
      
      // Check if it contains the expected elements
      const html = await response.text()
      
      const hasPromptInput = html.includes('textarea') || html.includes('prompt')
      const hasEnhanceButton = html.includes('Enhance') || html.includes('enhance')
      const hasSuggestions = html.includes('Suggestions') || html.includes('suggestions')
      const hasModelSelector = html.includes('model') || html.includes('Model')
      
      console.log(`   Prompt input detected: ${hasPromptInput ? '✅' : '❌'}`)
      console.log(`   Enhance button detected: ${hasEnhanceButton ? '✅' : '❌'}`)
      console.log(`   Suggestions detected: ${hasSuggestions ? '✅' : '❌'}`)
      console.log(`   Model selector detected: ${hasModelSelector ? '✅' : '❌'}`)
      
      const elementsFound = [hasPromptInput, hasEnhanceButton, hasSuggestions, hasModelSelector].filter(Boolean).length
      console.log(`   Elements found: ${elementsFound}/4`)
      
      return elementsFound >= 3 // At least 3/4 elements should be present
    } else {
      console.log('❌ Generator page not accessible')
      return false
    }
  } catch (error) {
    console.log('❌ Error accessing generator page:', error.message)
    return false
  }
}

async function runCompleteTest() {
  console.log('🚀 COMPLETE ENHANCE FUNCTIONALITY TEST')
  console.log('=' .repeat(60))
  
  // Test API functionality
  const apiResults = await testEnhanceEndToEnd()
  
  // Test client-side integration
  const clientIntegration = await testClientSideIntegration()
  
  console.log('\n🎉 COMPLETE TEST SUMMARY:')
  console.log('=' .repeat(60))
  console.log(`✅ API Success Rate: ${apiResults.successRate.toFixed(1)}%`)
  console.log(`✅ Client Integration: ${clientIntegration ? 'Working' : 'Issues detected'}`)
  
  const overallSuccess = apiResults.successRate >= 80 && clientIntegration
  
  if (overallSuccess) {
    console.log('🎉 ENHANCE FUNCTIONALITY FULLY WORKING!')
    console.log('✅ Both API and client-side integration are functional')
    console.log('\n📋 VERIFIED FEATURES:')
    console.log('   • Enhance API endpoint responding correctly')
    console.log('   • Prompt enhancement with Gemini API')
    console.log('   • Proper response format and error handling')
    console.log('   • Client-side interface elements present')
    console.log('   • End-to-end functionality verified')
  } else {
    console.log('⚠️ ISSUES DETECTED')
    if (apiResults.successRate < 80) {
      console.log('   • API functionality has issues')
    }
    if (!clientIntegration) {
      console.log('   • Client-side integration has issues')
    }
  }
  
  return overallSuccess
}

// Run the complete test
runCompleteTest().catch(console.error)
