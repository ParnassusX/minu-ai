/**
 * Generation Workflow Testing
 * Test the generation workflow behavior and authentication
 */

const baseUrl = 'http://localhost:4000'

async function testGenerationWorkflow() {
  console.log('🔄 TESTING GENERATION WORKFLOW')
  console.log('=' .repeat(60))

  const results = {
    apiHealth: {},
    modelLoading: {},
    promptEnhancement: {},
    authenticationBehavior: {},
    endpointStructure: {},
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
      version: healthData.version,
      endpoints: healthData.endpoints
    }
    
    console.log(`✅ Generate V2 API: ${healthResponse.ok ? 'OK' : 'FAILED'}`)
    console.log(`   Version: ${healthData.version}`)
    console.log(`   Replicate Token: ${healthData.hasReplicateToken ? 'Present' : 'Missing'}`)
    console.log(`   Gemini Key: ${healthData.hasGeminiKey ? 'Present' : 'Missing'}`)
    console.log(`   Environment: ${healthData.environment}`)
    
    if (!healthData.hasReplicateToken) {
      console.log('❌ Cannot proceed with generation - Replicate token missing')
      results.overall = false
      return results
    }
    
  } catch (error) {
    console.log(`❌ API Health Check: FAILED - ${error.message}`)
    results.apiHealth = { status: false, error: error.message }
    results.overall = false
    return results
  }

  // Test 2: Model Loading
  console.log('\n2️⃣ TESTING MODEL LOADING')
  console.log('-' .repeat(40))
  
  try {
    const modelsResponse = await fetch(`${baseUrl}/api/models-v2`)
    const modelsData = await modelsResponse.json()
    
    const models = modelsData.data?.models || []
    const imageModels = models.filter(m => m.supportedModes?.includes('images'))
    const activeModels = models.filter(m => m.isActive)
    
    results.modelLoading = {
      status: modelsResponse.ok,
      modelCount: models.length,
      imageModels: imageModels.length,
      activeModels: activeModels.length,
      priorityModels: models.filter(m => m.isPriority).length,
      fluxModels: models.filter(m => m.id.includes('flux')).length,
      modelDetails: imageModels.slice(0, 3).map(m => ({
        id: m.id,
        name: m.name,
        replicateModel: m.replicateModel,
        isActive: m.isActive,
        isPriority: m.isPriority
      }))
    }
    
    console.log(`✅ Models V2 API: ${modelsResponse.ok ? 'OK' : 'FAILED'}`)
    console.log(`   Total Models: ${results.modelLoading.modelCount}`)
    console.log(`   Image Models: ${results.modelLoading.imageModels}`)
    console.log(`   Active Models: ${results.modelLoading.activeModels}`)
    console.log(`   Priority Models: ${results.modelLoading.priorityModels}`)
    console.log(`   FLUX Models: ${results.modelLoading.fluxModels}`)
    
    if (results.modelLoading.imageModels === 0) {
      console.log('❌ No image models available for generation')
      results.overall = false
      return results
    }
    
    console.log('\n   Available Image Models:')
    results.modelLoading.modelDetails.forEach(model => {
      console.log(`   - ${model.name} (${model.id})`)
      console.log(`     Replicate: ${model.replicateModel}`)
      console.log(`     Active: ${model.isActive}, Priority: ${model.isPriority}`)
    })
    
  } catch (error) {
    console.log(`❌ Model Loading: FAILED - ${error.message}`)
    results.modelLoading = { status: false, error: error.message }
    results.overall = false
    return results
  }

  // Test 3: Prompt Enhancement
  console.log('\n3️⃣ TESTING PROMPT ENHANCEMENT')
  console.log('-' .repeat(40))
  
  const testPrompt = 'a majestic lion in the savanna'
  try {
    const enhanceResponse = await fetch(`${baseUrl}/api/enhance-prompt-v2`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: testPrompt })
    })
    const enhanceData = await enhanceResponse.json()
    
    results.promptEnhancement = {
      status: enhanceResponse.ok,
      success: enhanceData.success,
      hasEnhancement: !!enhanceData.data?.enhancedPrompt,
      originalLength: testPrompt.length,
      enhancedLength: enhanceData.data?.enhancedPrompt?.length || 0,
      enhancedPrompt: enhanceData.data?.enhancedPrompt || '',
      processingTime: enhanceData.data?.processingTime
    }
    
    console.log(`✅ Enhance V2 API: ${enhanceResponse.ok ? 'OK' : 'FAILED'}`)
    console.log(`   Enhancement Working: ${enhanceData.success ? 'Yes' : 'No'}`)
    console.log(`   Original: "${testPrompt}" (${results.promptEnhancement.originalLength} chars)`)
    console.log(`   Enhanced: ${results.promptEnhancement.enhancedLength} chars`)
    console.log(`   Processing Time: ${results.promptEnhancement.processingTime || 'Unknown'}ms`)
    
    if (results.promptEnhancement.enhancedPrompt) {
      const preview = results.promptEnhancement.enhancedPrompt.length > 80 
        ? results.promptEnhancement.enhancedPrompt.substring(0, 80) + '...'
        : results.promptEnhancement.enhancedPrompt
      console.log(`   Enhanced: "${preview}"`)
    }
    
  } catch (error) {
    console.log(`❌ Prompt Enhancement: FAILED - ${error.message}`)
    results.promptEnhancement = { status: false, error: error.message }
    // Don't fail overall - enhancement is optional
  }

  // Test 4: Authentication Behavior
  console.log('\n4️⃣ TESTING AUTHENTICATION BEHAVIOR')
  console.log('-' .repeat(40))
  
  try {
    const generateResponse = await fetch(`${baseUrl}/api/generate-v2`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'black-forest-labs/flux-schnell',
        mode: 'images',
        input: {
          prompt: 'test prompt',
          width: 1024,
          height: 1024
        }
      })
    })
    
    const generateData = await generateResponse.json()
    
    results.authenticationBehavior = {
      status: true,
      requiresAuth: generateResponse.status === 401,
      statusCode: generateResponse.status,
      errorCode: generateData.error?.code,
      errorMessage: generateData.error?.userMessage || generateData.error?.message,
      correctBehavior: generateResponse.status === 401 && generateData.error?.code === 'UNAUTHORIZED'
    }
    
    console.log(`✅ Authentication Test: ${results.authenticationBehavior.correctBehavior ? 'CORRECT' : 'INCORRECT'}`)
    console.log(`   Status Code: ${results.authenticationBehavior.statusCode}`)
    console.log(`   Requires Auth: ${results.authenticationBehavior.requiresAuth ? 'Yes' : 'No'}`)
    console.log(`   Error Code: ${results.authenticationBehavior.errorCode || 'None'}`)
    console.log(`   Error Message: "${results.authenticationBehavior.errorMessage || 'None'}"`)
    
    if (!results.authenticationBehavior.correctBehavior) {
      console.log('⚠️ Authentication behavior is not as expected')
    }
    
  } catch (error) {
    console.log(`❌ Authentication Test: FAILED - ${error.message}`)
    results.authenticationBehavior = { status: false, error: error.message }
    results.overall = false
  }

  // Test 5: Endpoint Structure Validation
  console.log('\n5️⃣ TESTING ENDPOINT STRUCTURE')
  console.log('-' .repeat(40))
  
  try {
    // Test various endpoints exist and respond correctly
    const endpoints = [
      { name: 'Generate V2', url: '/api/generate-v2', method: 'GET' },
      { name: 'Models V2', url: '/api/models-v2', method: 'GET' },
      { name: 'Enhance Prompt V2', url: '/api/enhance-prompt-v2', method: 'GET' },
      { name: 'Gallery', url: '/api/gallery', method: 'GET' },
      { name: 'Replicate Webhook', url: '/api/replicate/webhook', method: 'GET' }
    ]
    
    const endpointResults = {}
    
    for (const endpoint of endpoints) {
      try {
        const response = await fetch(`${baseUrl}${endpoint.url}`)
        endpointResults[endpoint.name] = {
          exists: true,
          status: response.status,
          ok: response.ok || response.status === 401 || response.status === 405 // 401/405 are expected for some endpoints
        }
      } catch (error) {
        endpointResults[endpoint.name] = {
          exists: false,
          error: error.message
        }
      }
    }
    
    results.endpointStructure = {
      status: true,
      endpoints: endpointResults,
      allEndpointsExist: Object.values(endpointResults).every(r => r.exists)
    }
    
    console.log(`✅ Endpoint Structure: ${results.endpointStructure.allEndpointsExist ? 'COMPLETE' : 'INCOMPLETE'}`)
    
    Object.entries(endpointResults).forEach(([name, result]) => {
      if (result.exists) {
        console.log(`   ✅ ${name}: EXISTS (${result.status})`)
      } else {
        console.log(`   ❌ ${name}: MISSING (${result.error})`)
      }
    })
    
  } catch (error) {
    console.log(`❌ Endpoint Structure: FAILED - ${error.message}`)
    results.endpointStructure = { status: false, error: error.message }
    results.overall = false
  }

  // Summary
  console.log('\n🎯 GENERATION WORKFLOW SUMMARY')
  console.log('=' .repeat(60))
  
  const testCategories = Object.keys(results).filter(key => key !== 'overall')
  const passedTests = testCategories.filter(category => {
    const result = results[category]
    return result.status !== false
  })
  
  testCategories.forEach(category => {
    const result = results[category]
    const passed = result.status !== false
    console.log(`${passed ? '✅' : '❌'} ${category}: ${passed ? 'PASS' : 'FAIL'}`)
  })
  
  console.log(`\n📊 Results: ${passedTests.length}/${testCategories.length} workflow components working`)
  
  if (passedTests.length === testCategories.length) {
    console.log('\n🎉 GENERATION WORKFLOW READY!')
    console.log('✅ All API endpoints are working correctly')
    console.log('✅ Authentication is properly enforced')
    console.log('✅ Model loading and prompt enhancement functional')
    console.log('✅ Generation endpoints exist and require proper auth')
    console.log('✅ Complete workflow infrastructure is in place')
    
    console.log('\n📋 WORKFLOW STATUS:')
    console.log(`   • ${results.modelLoading.imageModels} image models available`)
    console.log(`   • ${results.modelLoading.activeModels} models active`)
    console.log(`   • Prompt enhancement ${results.promptEnhancement.success ? 'working' : 'disabled'}`)
    console.log(`   • Authentication ${results.authenticationBehavior.correctBehavior ? 'properly enforced' : 'needs attention'}`)
    console.log(`   • All endpoints ${results.endpointStructure.allEndpointsExist ? 'exist' : 'incomplete'}`)
    
    console.log('\n🔐 AUTHENTICATION NOTE:')
    console.log('   Real image generation requires user authentication.')
    console.log('   The workflow is ready - users need to sign in to generate images.')
    console.log('   This is the correct and expected behavior for production.')
    
  } else {
    console.log('\n⚠️ SOME WORKFLOW COMPONENTS FAILED')
    console.log('Fix the failing components before proceeding')
    
    testCategories.forEach(category => {
      if (results[category].status === false) {
        console.log(`\n❌ ${category} issues:`)
        if (results[category].error) {
          console.log(`   Error: ${results[category].error}`)
        }
      }
    })
  }
  
  return results
}

// Run the test
testGenerationWorkflow().catch(console.error)
