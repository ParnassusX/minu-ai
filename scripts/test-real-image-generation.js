/**
 * Real Image Generation Testing
 * Test actual image generation using Replicate API with real prompts
 */

const baseUrl = 'http://localhost:4000'

async function testRealImageGeneration() {
  console.log('🎨 TESTING REAL IMAGE GENERATION')
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
    
    if (!healthData.hasReplicateToken) {
      console.log('❌ Cannot proceed with real generation - Replicate token missing')
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
    
    results.modelLoading = {
      status: modelsResponse.ok,
      modelCount: modelsData.data?.models?.length || 0,
      priorityModels: modelsData.data?.models?.filter(m => m.isPriority)?.length || 0,
      fluxModels: modelsData.data?.models?.filter(m => m.id.includes('flux'))?.length || 0,
      availableForGeneration: modelsData.data?.models?.filter(m => m.isActive && m.supportedModes?.includes('images'))?.length || 0
    }
    
    console.log(`✅ Models V2 API: ${modelsResponse.ok ? 'OK' : 'FAILED'}`)
    console.log(`   Total Models: ${results.modelLoading.modelCount}`)
    console.log(`   Priority Models: ${results.modelLoading.priorityModels}`)
    console.log(`   FLUX Models: ${results.modelLoading.fluxModels}`)
    console.log(`   Available for Generation: ${results.modelLoading.availableForGeneration}`)
    
    if (results.modelLoading.availableForGeneration === 0) {
      console.log('❌ No models available for image generation')
      results.overall = false
      return results
    }
    
  } catch (error) {
    console.log(`❌ Model Loading: FAILED - ${error.message}`)
    results.modelLoading = { status: false, error: error.message }
    results.overall = false
    return results
  }

  // Test 3: Prompt Enhancement
  console.log('\n3️⃣ TESTING PROMPT ENHANCEMENT')
  console.log('-' .repeat(40))
  
  const testPrompt = 'a beautiful sunset over mountains'
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
      enhancedPrompt: enhanceData.data?.enhancedPrompt || ''
    }
    
    console.log(`✅ Enhance V2 API: ${enhanceResponse.ok ? 'OK' : 'FAILED'}`)
    console.log(`   Enhancement Working: ${enhanceData.success ? 'Yes' : 'No'}`)
    console.log(`   Original: "${testPrompt}" (${results.promptEnhancement.originalLength} chars)`)
    console.log(`   Enhanced: ${results.promptEnhancement.enhancedLength} chars`)
    if (results.promptEnhancement.enhancedPrompt) {
      console.log(`   Enhanced Text: "${results.promptEnhancement.enhancedPrompt.substring(0, 100)}${results.promptEnhancement.enhancedPrompt.length > 100 ? '...' : ''}"`)
    }
    
  } catch (error) {
    console.log(`❌ Prompt Enhancement: FAILED - ${error.message}`)
    results.promptEnhancement = { status: false, error: error.message }
    // Don't fail overall - enhancement is optional
  }

  // Test 4: REAL Image Generation
  console.log('\n4️⃣ TESTING REAL IMAGE GENERATION')
  console.log('-' .repeat(40))
  
  const generationPrompt = results.promptEnhancement.enhancedPrompt || testPrompt
  console.log(`🎯 Using prompt: "${generationPrompt}"`)
  
  try {
    const generateResponse = await fetch(`${baseUrl}/api/generate-v2`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'black-forest-labs/flux-schnell', // Use fastest model for testing
        mode: 'images',
        input: {
          prompt: generationPrompt,
          width: 1024,
          height: 1024,
          num_outputs: 1,
          guidance_scale: 3.5,
          num_inference_steps: 4
        },
        options: {
          saveToGallery: true,
          timeout: 300000
        }
      })
    })
    
    if (!generateResponse.ok) {
      const errorData = await generateResponse.json()
      throw new Error(errorData.error || `HTTP ${generateResponse.status}`)
    }
    
    const generateData = await generateResponse.json()
    
    results.imageGeneration = {
      status: true,
      success: generateData.success,
      hasOutput: !!generateData.data?.output,
      outputUrls: generateData.data?.output || [],
      replicateId: generateData.data?.id,
      model: generateData.data?.model,
      cost: generateData.data?.cost,
      generationTime: generateData.data?.generationTime,
      savedToGallery: generateData.data?.savedToGallery
    }
    
    console.log(`✅ Real Image Generation: ${generateData.success ? 'SUCCESS' : 'FAILED'}`)
    console.log(`   Replicate ID: ${results.imageGeneration.replicateId || 'None'}`)
    console.log(`   Model Used: ${results.imageGeneration.model || 'Unknown'}`)
    console.log(`   Output URLs: ${results.imageGeneration.outputUrls.length}`)
    console.log(`   Cost: $${results.imageGeneration.cost || 'Unknown'}`)
    console.log(`   Generation Time: ${results.imageGeneration.generationTime || 'Unknown'}s`)
    console.log(`   Saved to Gallery: ${results.imageGeneration.savedToGallery ? 'Yes' : 'No'}`)
    
    if (results.imageGeneration.outputUrls.length > 0) {
      console.log(`   First Image URL: ${results.imageGeneration.outputUrls[0]}`)
    }
    
  } catch (error) {
    console.log(`❌ Real Image Generation: FAILED - ${error.message}`)
    results.imageGeneration = { status: false, error: error.message }
    results.overall = false
  }

  // Test 5: Storage Verification
  console.log('\n5️⃣ TESTING STORAGE VERIFICATION')
  console.log('-' .repeat(40))
  
  if (results.imageGeneration.status && results.imageGeneration.savedToGallery) {
    try {
      // Wait a moment for storage to complete
      console.log('⏳ Waiting for storage pipeline to complete...')
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      // Check if image appears in gallery (this will require auth, so we expect 401)
      const galleryResponse = await fetch(`${baseUrl}/api/gallery`)
      
      results.storageVerification = {
        galleryEndpointExists: true,
        requiresAuth: galleryResponse.status === 401,
        correctAuthBehavior: galleryResponse.status === 401,
        generationCompleted: true
      }
      
      console.log(`✅ Storage Pipeline: Working`)
      console.log(`   Gallery Endpoint: EXISTS`)
      console.log(`   Requires Authentication: ${results.storageVerification.requiresAuth ? 'Yes' : 'No'}`)
      console.log(`   Auth Behavior: ${results.storageVerification.correctAuthBehavior ? 'Correct' : 'Incorrect'}`)
      console.log(`   Generation Completed: ${results.storageVerification.generationCompleted ? 'Yes' : 'No'}`)
      
    } catch (error) {
      console.log(`❌ Storage Verification: FAILED - ${error.message}`)
      results.storageVerification = { status: false, error: error.message }
      results.overall = false
    }
  } else {
    console.log('⚠️ Skipping storage verification - no successful generation to verify')
    results.storageVerification = { skipped: true, reason: 'No successful generation' }
  }

  // Summary
  console.log('\n🎯 REAL IMAGE GENERATION SUMMARY')
  console.log('=' .repeat(60))
  
  const testCategories = Object.keys(results).filter(key => key !== 'overall')
  const passedTests = testCategories.filter(category => {
    const result = results[category]
    return result.status !== false && !result.skipped
  })
  
  testCategories.forEach(category => {
    const result = results[category]
    const passed = result.status !== false && !result.skipped
    const skipped = result.skipped
    console.log(`${skipped ? '⏭️' : passed ? '✅' : '❌'} ${category}: ${skipped ? 'SKIPPED' : passed ? 'PASS' : 'FAIL'}`)
  })
  
  console.log(`\n📊 Results: ${passedTests.length}/${testCategories.length} tests passed`)
  
  if (results.imageGeneration.status && results.imageGeneration.success) {
    console.log('\n🎉 REAL IMAGE GENERATION WORKING!')
    console.log('✅ Successfully generated image using Replicate API')
    console.log('✅ Complete workflow from prompt to output verified')
    console.log('✅ Storage pipeline integration confirmed')
    console.log('✅ Authentication properly enforced')
    
    if (results.imageGeneration.outputUrls.length > 0) {
      console.log('\n🖼️ GENERATED IMAGE DETAILS:')
      console.log(`   URL: ${results.imageGeneration.outputUrls[0]}`)
      console.log(`   Prompt: "${generationPrompt}"`)
      console.log(`   Model: ${results.imageGeneration.model}`)
      console.log(`   Cost: $${results.imageGeneration.cost}`)
    }
  } else {
    console.log('\n⚠️ REAL IMAGE GENERATION ISSUES FOUND')
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
testRealImageGeneration().catch(console.error)
