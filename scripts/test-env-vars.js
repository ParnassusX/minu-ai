/**
 * Test Environment Variables
 * Check if environment variables are properly accessible
 */

const baseUrl = 'http://localhost:4000'

async function testEnvironmentAccess() {
  console.log('🔧 Testing Environment Variable Access...')
  console.log('=' .repeat(50))
  
  try {
    const response = await fetch(`${baseUrl}/api/integration-check`)
    
    if (response.ok) {
      const data = await response.json()
      
      console.log('Environment Check Results:')
      console.log(JSON.stringify(data, null, 2))
      
      // Look for specific environment info
      const envCheck = data.checks.find(check => check.component === 'Environment Configuration')
      if (envCheck) {
        console.log('\n🔑 Environment Configuration:')
        console.log(`   Status: ${envCheck.status}`)
        console.log(`   Message: ${envCheck.message}`)
        
        if (envCheck.details) {
          console.log('   Details:', JSON.stringify(envCheck.details, null, 2))
        }
      }
      
      // Check if Gemini key is detected
      const hasGeminiKey = data.checks.some(check => 
        check.message && check.message.toLowerCase().includes('gemini')
      )
      
      console.log(`\n🔍 Gemini API Key Detected: ${hasGeminiKey ? 'Yes' : 'No'}`)
      
      return data
    } else {
      console.log('❌ Environment check failed')
      return null
    }
  } catch (error) {
    console.log('❌ Error checking environment:', error.message)
    return null
  }
}

async function testGeminiDirectly() {
  console.log('\n🤖 Testing Gemini API Directly...')
  console.log('=' .repeat(50))
  
  // Test with a simple prompt that should work
  const testPrompt = 'cat'
  
  try {
    const response = await fetch(`${baseUrl}/api/enhance-prompt-v2`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ prompt: testPrompt })
    })
    
    if (response.ok) {
      const result = await response.json()
      
      console.log('Response metadata:', JSON.stringify(result.data.metadata, null, 2))
      
      if (result.data.metadata.fallback) {
        console.log('⚠️ Using fallback enhancement')
        console.log(`   Reason: ${result.data.metadata.fallbackReason}`)
        console.log(`   Model: ${result.data.metadata.model}`)
        
        return {
          usingGemini: false,
          fallbackReason: result.data.metadata.fallbackReason,
          working: true
        }
      } else {
        console.log('✅ Using Gemini API')
        console.log(`   Model: ${result.data.metadata.model}`)
        
        return {
          usingGemini: true,
          working: true
        }
      }
    } else {
      const errorData = await response.json()
      console.log('❌ API Error:', errorData.error?.message)
      
      return {
        usingGemini: false,
        working: false,
        error: errorData.error?.message
      }
    }
  } catch (error) {
    console.log('❌ Network Error:', error.message)
    
    return {
      usingGemini: false,
      working: false,
      error: error.message
    }
  }
}

async function runEnvironmentTest() {
  console.log('🔍 ENVIRONMENT AND GEMINI API TEST')
  console.log('=' .repeat(60))
  
  // Test environment access
  const envData = await testEnvironmentAccess()
  
  // Test Gemini specifically
  const geminiTest = await testGeminiDirectly()
  
  console.log('\n🎉 ENVIRONMENT TEST SUMMARY:')
  console.log('=' .repeat(60))
  
  if (envData) {
    console.log('✅ Environment check accessible')
    console.log(`   Overall status: ${envData.summary?.overallStatus || 'unknown'}`)
  } else {
    console.log('❌ Environment check failed')
  }
  
  console.log(`✅ Enhancement API working: ${geminiTest.working}`)
  console.log(`🤖 Using Gemini API: ${geminiTest.usingGemini}`)
  
  if (!geminiTest.usingGemini && geminiTest.fallbackReason) {
    console.log(`⚠️ Fallback reason: ${geminiTest.fallbackReason}`)
  }
  
  if (geminiTest.error) {
    console.log(`❌ Error: ${geminiTest.error}`)
  }
  
  // Overall assessment
  if (geminiTest.working) {
    if (geminiTest.usingGemini) {
      console.log('\n🎉 PERFECT! Gemini API is working correctly')
    } else {
      console.log('\n⚠️ FUNCTIONAL WITH FALLBACK')
      console.log('   Enhancement is working but using fallback instead of Gemini')
      console.log('   This is still acceptable - the feature works for users')
    }
  } else {
    console.log('\n❌ ENHANCEMENT NOT WORKING')
    console.log('   There are issues with the enhancement functionality')
  }
  
  console.log('\n📋 KEY FINDINGS:')
  console.log(`   • Environment variables: ${envData ? 'Accessible' : 'Issues'}`)
  console.log(`   • Enhancement API: ${geminiTest.working ? 'Working' : 'Broken'}`)
  console.log(`   • Gemini integration: ${geminiTest.usingGemini ? 'Active' : 'Fallback'}`)
  console.log(`   • User experience: ${geminiTest.working ? 'Functional' : 'Broken'}`)
  
  return {
    environmentOk: !!envData,
    enhancementWorking: geminiTest.working,
    geminiActive: geminiTest.usingGemini,
    userExperienceOk: geminiTest.working
  }
}

// Run the environment test
runEnvironmentTest().catch(console.error)
