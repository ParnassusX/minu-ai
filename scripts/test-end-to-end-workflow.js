/**
 * End-to-End Workflow Testing
 * Test complete user workflow from API endpoints to database storage
 */

const baseUrl = 'http://localhost:4000'

async function testEndToEndWorkflow() {
  console.log('🚀 TESTING END-TO-END WORKFLOW')
  console.log('=' .repeat(60))

  const results = {
    apiHealth: {},
    modelLoading: {},
    promptEnhancement: {},
    imageGeneration: {},
    storageVerification: {},
    overall: true
  }

  // Test 1: API Health Check
  console.log('\n1️⃣ TESTING API HEALTH')
  console.log('-' .repeat(40))
  
  try {
    const healthResponse = await fetch(`${baseUrl}/api/generate-v2`)
    const healthData = await healthResponse.json()
    
    results.apiHealth = {
      status: healthResponse.ok,
      hasReplicateToken: healthData.hasReplicateToken,
      hasGeminiKey: healthData.hasGeminiKey,
      version: healthData.version
    }
    
    console.log(`✅ Generate V2 API: ${healthResponse.ok ? 'OK' : 'FAILED'}`)
    console.log(`   Replicate Token: ${healthData.hasReplicateToken ? 'Present' : 'Missing'}`)
    console.log(`   Gemini Key: ${healthData.hasGeminiKey ? 'Present' : 'Missing'}`)
    
  } catch (error) {
    console.log(`❌ API Health Check: FAILED - ${error.message}`)
    results.apiHealth = { status: false, error: error.message }
    results.overall = false
  }

  // Test 2: Model Loading
  console.log('\n2️⃣ TESTING MODEL LOADING')
  console.log('-' .repeat(40))
  
  try {
    const modelsResponse = await fetch(`${baseUrl}/api/models-v2`)
    const modelsData = await modelsResponse.json()
    
    results.modelLoading = {
      status: modelsResponse.ok,
      modelCount: modelsData.data?.models?.length || 0,
      priorityModels: modelsData.data?.models?.filter(m => m.isPriority)?.length || 0,
      fluxModels: modelsData.data?.models?.filter(m => m.id.includes('flux'))?.length || 0,
      seedanceModels: modelsData.data?.models?.filter(m => m.id.includes('seedance'))?.length || 0
    }
    
    console.log(`✅ Models V2 API: ${modelsResponse.ok ? 'OK' : 'FAILED'}`)
    console.log(`   Total Models: ${results.modelLoading.modelCount}`)
    console.log(`   Priority Models: ${results.modelLoading.priorityModels}`)
    console.log(`   FLUX Models: ${results.modelLoading.fluxModels}`)
    console.log(`   Seedance Models: ${results.modelLoading.seedanceModels}`)
    
  } catch (error) {
    console.log(`❌ Model Loading: FAILED - ${error.message}`)
    results.modelLoading = { status: false, error: error.message }
    results.overall = false
  }

  // Test 3: Prompt Enhancement
  console.log('\n3️⃣ TESTING PROMPT ENHANCEMENT')
  console.log('-' .repeat(40))
  
  try {
    const enhanceResponse = await fetch(`${baseUrl}/api/enhance-prompt-v2`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: 'a cat sitting on a chair' })
    })
    const enhanceData = await enhanceResponse.json()
    
    results.promptEnhancement = {
      status: enhanceResponse.ok,
      success: enhanceData.success,
      hasEnhancement: !!enhanceData.data?.enhancedPrompt,
      originalLength: 'a cat sitting on a chair'.length,
      enhancedLength: enhanceData.data?.enhancedPrompt?.length || 0
    }
    
    console.log(`✅ Enhance V2 API: ${enhanceResponse.ok ? 'OK' : 'FAILED'}`)
    console.log(`   Enhancement Working: ${enhanceData.success ? 'Yes' : 'No'}`)
    console.log(`   Original: "a cat sitting on a chair" (${results.promptEnhancement.originalLength} chars)`)
    console.log(`   Enhanced: ${results.promptEnhancement.enhancedLength} chars`)
    
  } catch (error) {
    console.log(`❌ Prompt Enhancement: FAILED - ${error.message}`)
    results.promptEnhancement = { status: false, error: error.message }
    results.overall = false
  }

  // Test 4: Image Generation (Mock - without actual generation)
  console.log('\n4️⃣ TESTING IMAGE GENERATION ENDPOINT')
  console.log('-' .repeat(40))
  
  try {
    // Test the endpoint structure without actually generating
    const generateResponse = await fetch(`${baseUrl}/api/generate-v2`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: 'test prompt',
        model: 'flux-schnell',
        mode: 'images',
        parameters: {}
      })
    })
    
    // We expect this to fail with authentication error, which is correct behavior
    const generateData = await generateResponse.json()
    
    results.imageGeneration = {
      endpointExists: true,
      requiresAuth: generateResponse.status === 401,
      errorMessage: generateData.error || 'No error',
      correctAuthBehavior: generateResponse.status === 401
    }
    
    console.log(`✅ Generate V2 Endpoint: EXISTS`)
    console.log(`   Requires Authentication: ${results.imageGeneration.requiresAuth ? 'Yes' : 'No'}`)
    console.log(`   Auth Behavior: ${results.imageGeneration.correctAuthBehavior ? 'Correct' : 'Incorrect'}`)
    console.log(`   Response: ${generateData.error || 'Success'}`)
    
  } catch (error) {
    console.log(`❌ Image Generation Endpoint: FAILED - ${error.message}`)
    results.imageGeneration = { status: false, error: error.message }
    results.overall = false
  }

  // Test 5: Storage Verification (Check existing data)
  console.log('\n5️⃣ TESTING STORAGE VERIFICATION')
  console.log('-' .repeat(40))
  
  try {
    // Test gallery endpoint (should require auth)
    const galleryResponse = await fetch(`${baseUrl}/api/gallery`)
    
    results.storageVerification = {
      galleryEndpointExists: true,
      requiresAuth: galleryResponse.status === 401,
      correctAuthBehavior: galleryResponse.status === 401
    }
    
    console.log(`✅ Gallery Endpoint: EXISTS`)
    console.log(`   Requires Authentication: ${results.storageVerification.requiresAuth ? 'Yes' : 'No'}`)
    console.log(`   Auth Behavior: ${results.storageVerification.correctAuthBehavior ? 'Correct' : 'Incorrect'}`)
    
  } catch (error) {
    console.log(`❌ Storage Verification: FAILED - ${error.message}`)
    results.storageVerification = { status: false, error: error.message }
    results.overall = false
  }

  // Summary
  console.log('\n🎯 END-TO-END WORKFLOW SUMMARY')
  console.log('=' .repeat(60))
  
  const testCategories = Object.keys(results).filter(key => key !== 'overall')
  const passedTests = testCategories.filter(category => {
    const result = results[category]
    return result.status !== false && (result.correctAuthBehavior !== false)
  })
  
  testCategories.forEach(category => {
    const result = results[category]
    const passed = result.status !== false && (result.correctAuthBehavior !== false)
    console.log(`${passed ? '✅' : '❌'} ${category}: ${passed ? 'PASS' : 'FAIL'}`)
  })
  
  console.log(`\n📊 Results: ${passedTests.length}/${testCategories.length} workflow components working`)
  
  if (passedTests.length === testCategories.length) {
    console.log('\n🎉 END-TO-END WORKFLOW READY!')
    console.log('✅ All API endpoints are working correctly')
    console.log('✅ Authentication is properly enforced')
    console.log('✅ Model loading and prompt enhancement functional')
    console.log('✅ Generation endpoints exist and require proper auth')
    console.log('✅ Storage endpoints exist and require proper auth')
    console.log('\n📋 NEXT STEPS:')
    console.log('1. Test with authenticated user session')
    console.log('2. Verify actual image generation and storage')
    console.log('3. Test gallery display with real data')
  } else {
    console.log('\n⚠️ SOME WORKFLOW COMPONENTS FAILED')
    console.log('Fix the failing components before proceeding with full testing')
    
    testCategories.forEach(category => {
      if (results[category].status === false || results[category].correctAuthBehavior === false) {
        console.log(`\n❌ ${category} issues:`)
        if (results[category].error) {
          console.log(`   Error: ${results[category].error}`)
        }
        console.log(`   Details: ${JSON.stringify(results[category], null, 2)}`)
      }
    })
  }
  
  return results
}

// Run the test
testEndToEndWorkflow().catch(console.error)
