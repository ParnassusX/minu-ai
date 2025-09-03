/**
 * Debug Enhance Flow
 * Test the exact enhance flow that users experience
 */

const baseUrl = 'http://localhost:4000'

async function debugEnhanceFlow() {
  console.log('🔍 DEBUGGING ENHANCE BUTTON FLOW')
  console.log('=' .repeat(50))
  
  // Test the exact scenario from the screenshot
  const testPrompt = 'a cat'
  
  console.log(`📝 Testing with prompt: "${testPrompt}"`)
  console.log('🔄 Simulating user clicking enhance button...')
  
  try {
    // Step 1: Make the API call (exactly as PromptInput.tsx does)
    console.log('\n1️⃣ Making API call to /api/enhance-prompt-v2...')
    
    const response = await fetch(`${baseUrl}/api/enhance-prompt-v2`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: testPrompt.trim() })
    })
    
    console.log(`   Response status: ${response.status}`)
    console.log(`   Response ok: ${response.ok}`)
    
    if (response.ok) {
      // Step 2: Parse the response (exactly as PromptInput.tsx does)
      console.log('\n2️⃣ Parsing response...')
      
      const result = await response.json()
      console.log('   Full response structure:')
      console.log(JSON.stringify(result, null, 2))
      
      // Step 3: Check the parsing logic
      console.log('\n3️⃣ Testing parsing logic...')
      console.log(`   result.success: ${result.success}`)
      console.log(`   result.data exists: ${!!result.data}`)
      console.log(`   result.data.enhancedPrompt exists: ${!!result.data?.enhancedPrompt}`)
      
      if (result.success && result.data?.enhancedPrompt) {
        const enhancedPrompt = result.data.enhancedPrompt
        console.log('\n✅ PARSING SUCCESSFUL!')
        console.log(`   Original prompt: "${testPrompt}"`)
        console.log(`   Enhanced prompt: "${enhancedPrompt}"`)
        console.log(`   Length change: ${testPrompt.length} → ${enhancedPrompt.length} characters`)
        console.log(`   Improvement ratio: ${(enhancedPrompt.length / testPrompt.length).toFixed(2)}x`)
        
        // Step 4: Simulate what should happen in the UI
        console.log('\n4️⃣ UI Update Simulation:')
        console.log('   ✅ onPromptChange would be called with enhanced prompt')
        console.log('   ✅ Textarea should update to show enhanced prompt')
        console.log('   ✅ User should see the improvement')
        
        return {
          success: true,
          originalPrompt: testPrompt,
          enhancedPrompt: enhancedPrompt,
          apiWorking: true,
          parsingWorking: true,
          shouldUpdateUI: true
        }
      } else {
        console.log('\n❌ PARSING FAILED!')
        console.log('   The response format is not what PromptInput.tsx expects')
        console.log('   This would cause the UI not to update')
        
        return {
          success: false,
          error: 'Response parsing failed',
          apiWorking: true,
          parsingWorking: false,
          shouldUpdateUI: false
        }
      }
    } else {
      console.log('\n❌ API CALL FAILED!')
      const errorData = await response.json().catch(() => ({}))
      console.log('   Error response:', errorData)
      
      return {
        success: false,
        error: 'API call failed',
        apiWorking: false,
        parsingWorking: false,
        shouldUpdateUI: false
      }
    }
    
  } catch (error) {
    console.log('\n❌ NETWORK ERROR!')
    console.log(`   Error: ${error.message}`)
    
    return {
      success: false,
      error: error.message,
      apiWorking: false,
      parsingWorking: false,
      shouldUpdateUI: false
    }
  }
}

async function testMultiplePrompts() {
  console.log('\n🧪 TESTING MULTIPLE PROMPTS')
  console.log('=' .repeat(50))
  
  const testCases = [
    'a cat',
    'beautiful sunset',
    'portrait of a woman',
    'futuristic city'
  ]
  
  const results = []
  
  for (const prompt of testCases) {
    console.log(`\n📝 Testing: "${prompt}"`)
    
    try {
      const response = await fetch(`${baseUrl}/api/enhance-prompt-v2`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt.trim() })
      })
      
      if (response.ok) {
        const result = await response.json()
        
        if (result.success && result.data?.enhancedPrompt) {
          const enhanced = result.data.enhancedPrompt
          const improvement = enhanced.length / prompt.length
          
          console.log(`   ✅ Enhanced: "${enhanced.substring(0, 80)}${enhanced.length > 80 ? '...' : ''}"`)
          console.log(`   📊 Improvement: ${improvement.toFixed(2)}x longer`)
          
          results.push({
            original: prompt,
            enhanced: enhanced,
            improvement: improvement,
            success: true
          })
        } else {
          console.log('   ❌ Parsing failed')
          results.push({
            original: prompt,
            success: false,
            error: 'Parsing failed'
          })
        }
      } else {
        console.log('   ❌ API failed')
        results.push({
          original: prompt,
          success: false,
          error: 'API failed'
        })
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`)
      results.push({
        original: prompt,
        success: false,
        error: error.message
      })
    }
  }
  
  return results
}

async function runCompleteDebug() {
  console.log('🚀 COMPLETE ENHANCE FLOW DEBUG')
  console.log('=' .repeat(60))
  
  // Debug the main flow
  const mainResult = await debugEnhanceFlow()
  
  // Test multiple prompts
  const multipleResults = await testMultiplePrompts()
  
  console.log('\n🎉 COMPLETE DEBUG SUMMARY')
  console.log('=' .repeat(60))
  
  console.log(`✅ Main test success: ${mainResult.success}`)
  console.log(`✅ API working: ${mainResult.apiWorking}`)
  console.log(`✅ Parsing working: ${mainResult.parsingWorking}`)
  console.log(`✅ Should update UI: ${mainResult.shouldUpdateUI}`)
  
  const successfulTests = multipleResults.filter(r => r.success).length
  console.log(`✅ Multiple prompts: ${successfulTests}/${multipleResults.length} successful`)
  
  if (mainResult.success && successfulTests === multipleResults.length) {
    console.log('\n🎉 ENHANCE FLOW IS WORKING PERFECTLY!')
    console.log('✅ API calls are successful')
    console.log('✅ Response parsing is correct')
    console.log('✅ UI should update properly')
    console.log('\n🤔 If users are not seeing updates, the issue might be:')
    console.log('   • Browser caching')
    console.log('   • JavaScript errors in the browser console')
    console.log('   • React state update issues')
    console.log('   • Authentication/session issues')
  } else {
    console.log('\n⚠️ ISSUES DETECTED IN ENHANCE FLOW')
    if (!mainResult.apiWorking) {
      console.log('   • API is not responding correctly')
    }
    if (!mainResult.parsingWorking) {
      console.log('   • Response parsing is failing')
    }
    if (successfulTests < multipleResults.length) {
      console.log('   • Some prompts are failing to enhance')
    }
  }
  
  console.log('\n📋 NEXT STEPS:')
  if (mainResult.success) {
    console.log('   1. Check browser console for JavaScript errors')
    console.log('   2. Verify React state updates are working')
    console.log('   3. Test with browser developer tools')
    console.log('   4. Check if authentication is interfering')
  } else {
    console.log('   1. Fix API or parsing issues identified above')
    console.log('   2. Verify environment configuration')
    console.log('   3. Check server logs for errors')
  }
  
  return {
    mainResult,
    multipleResults,
    overallSuccess: mainResult.success && successfulTests === multipleResults.length
  }
}

// Run the complete debug
runCompleteDebug().catch(console.error)
