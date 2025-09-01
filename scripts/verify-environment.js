/**
 * Environment Configuration Verification
 * Verify all required API keys and services are properly configured
 */

const baseUrl = 'http://localhost:4000'

async function verifyEnvironmentConfiguration() {
  console.log('🔧 VERIFYING ENVIRONMENT CONFIGURATION')
  console.log('=' .repeat(60))

  const results = {
    apis: {},
    services: {},
    overall: true
  }

  // Test API Health Endpoints
  console.log('\n📡 Testing API Health Endpoints...')
  
  try {
    // Test Generate V2 Health
    const generateHealth = await fetch(`${baseUrl}/api/generate-v2`)
    const generateData = await generateHealth.json()
    
    results.apis.generateV2 = {
      status: generateHealth.ok,
      hasReplicateToken: generateData.hasReplicateToken,
      hasGeminiKey: generateData.hasGeminiKey,
      version: generateData.version
    }
    
    console.log(`✅ Generate V2 API: ${generateHealth.ok ? 'OK' : 'FAILED'}`)
    console.log(`   Replicate Token: ${generateData.hasReplicateToken ? 'Present' : 'Missing'}`)
    console.log(`   Gemini Key: ${generateData.hasGeminiKey ? 'Present' : 'Missing'}`)
    
  } catch (error) {
    console.log(`❌ Generate V2 API: FAILED - ${error.message}`)
    results.apis.generateV2 = { status: false, error: error.message }
    results.overall = false
  }

  try {
    // Test Models V2 API
    const modelsResponse = await fetch(`${baseUrl}/api/models-v2`)
    const modelsData = await modelsResponse.json()
    
    results.apis.modelsV2 = {
      status: modelsResponse.ok,
      modelCount: modelsData.data?.models?.length || 0,
      priorityModels: modelsData.data?.models?.filter(m => m.isPriority)?.length || 0
    }
    
    console.log(`✅ Models V2 API: ${modelsResponse.ok ? 'OK' : 'FAILED'}`)
    console.log(`   Total Models: ${results.apis.modelsV2.modelCount}`)
    console.log(`   Priority Models: ${results.apis.modelsV2.priorityModels}`)
    
  } catch (error) {
    console.log(`❌ Models V2 API: FAILED - ${error.message}`)
    results.apis.modelsV2 = { status: false, error: error.message }
    results.overall = false
  }

  try {
    // Test Enhance Prompt API
    const enhanceResponse = await fetch(`${baseUrl}/api/enhance-prompt-v2`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: 'test prompt' })
    })
    const enhanceData = await enhanceResponse.json()
    
    results.apis.enhanceV2 = {
      status: enhanceResponse.ok,
      success: enhanceData.success,
      hasEnhancement: !!enhanceData.data?.enhancedPrompt
    }
    
    console.log(`✅ Enhance V2 API: ${enhanceResponse.ok ? 'OK' : 'FAILED'}`)
    console.log(`   Enhancement Working: ${enhanceData.success ? 'Yes' : 'No'}`)
    
  } catch (error) {
    console.log(`❌ Enhance V2 API: FAILED - ${error.message}`)
    results.apis.enhanceV2 = { status: false, error: error.message }
    results.overall = false
  }

  // Test Service Integrations
  console.log('\n🔗 Testing Service Integrations...')
  
  try {
    // Test Replicate Account
    const replicateResponse = await fetch(`${baseUrl}/api/replicate/usage`)
    const replicateData = await replicateResponse.json()
    
    results.services.replicate = {
      status: replicateResponse.ok,
      account: replicateData.account?.username || 'Unknown'
    }
    
    console.log(`✅ Replicate Integration: ${replicateResponse.ok ? 'OK' : 'FAILED'}`)
    console.log(`   Account: ${results.services.replicate.account}`)
    
  } catch (error) {
    console.log(`❌ Replicate Integration: FAILED - ${error.message}`)
    results.services.replicate = { status: false, error: error.message }
  }

  // Summary
  console.log('\n🎯 ENVIRONMENT VERIFICATION SUMMARY')
  console.log('=' .repeat(60))
  
  const apiCount = Object.keys(results.apis).length
  const workingApis = Object.values(results.apis).filter(api => api.status).length
  
  console.log(`📊 API Endpoints: ${workingApis}/${apiCount} working`)
  console.log(`📊 Required Models: ${results.apis.modelsV2?.modelCount || 0} available`)
  console.log(`📊 Enhancement: ${results.apis.enhanceV2?.success ? 'Working' : 'Failed'}`)
  console.log(`📊 Replicate: ${results.services.replicate?.status ? 'Connected' : 'Failed'}`)
  
  if (results.overall && workingApis === apiCount) {
    console.log('\n🎉 ENVIRONMENT FULLY CONFIGURED!')
    console.log('✅ All required APIs are working')
    console.log('✅ All services are connected')
    console.log('✅ Ready for end-to-end testing')
  } else {
    console.log('\n⚠️ ENVIRONMENT ISSUES DETECTED')
    console.log('Some APIs or services are not working correctly')
    console.log('Fix these issues before proceeding with workflow testing')
  }
  
  return results
}

// Run verification
verifyEnvironmentConfiguration().catch(console.error)
