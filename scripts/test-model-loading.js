/**
 * Test Model Loading
 * Verify that models are loading correctly via API
 */

const baseUrl = 'http://localhost:4000'

async function testModelLoading() {
  console.log('🎨 TESTING MODEL LOADING')
  console.log('=' .repeat(50))
  
  try {
    console.log('📡 Fetching models from API...')
    const response = await fetch(`${baseUrl}/api/models-v2`)
    
    console.log(`Response status: ${response.status}`)
    
    if (response.ok) {
      const data = await response.json()
      
      console.log('✅ Models API Response:')
      console.log(`   Success: ${data.success}`)
      console.log(`   Total models: ${data.data?.models?.length || 0}`)

      if (data.data?.models && data.data.models.length > 0) {
        const models = data.data.models
        console.log('\n📋 Available Models:')
        models.forEach((model, index) => {
          console.log(`   ${index + 1}. ${model.name} (${model.id})`)
          console.log(`      Modes: ${model.supportedModes?.join(', ') || 'Unknown'}`)
          console.log(`      Active: ${model.isActive ? 'Yes' : 'No'}`)
          console.log(`      Provider: ${model.provider || 'Unknown'}`)
        })

        // Test priority models specifically
        const priorityModels = models.filter(m => m.isPriority)
        console.log(`\n⭐ Priority Models: ${priorityModels.length}`)
        priorityModels.forEach(model => {
          console.log(`   • ${model.name} (${model.id})`)
        })

        // Test image mode models
        const imageModels = models.filter(m =>
          m.supportedModes && m.supportedModes.includes('images')
        )
        console.log(`\n🖼️ Image Models: ${imageModels.length}`)
        imageModels.slice(0, 3).forEach(model => {
          console.log(`   • ${model.name} (${model.id})`)
        })

        return {
          success: true,
          totalModels: models.length,
          priorityModels: priorityModels.length,
          imageModels: imageModels.length,
          firstModel: models[0]
        }
      } else {
        console.log('⚠️ No models found in response')
        return {
          success: false,
          error: 'No models in response'
        }
      }
    } else {
      const errorData = await response.json()
      console.log('❌ Models API Error:', errorData)
      return {
        success: false,
        error: errorData.error?.message || 'API error'
      }
    }
  } catch (error) {
    console.log('❌ Network Error:', error.message)
    return {
      success: false,
      error: error.message
    }
  }
}

async function testModelSelection() {
  console.log('\n🎯 TESTING MODEL SELECTION LOGIC')
  console.log('=' .repeat(50))
  
  try {
    // Test with search parameter
    const searchResponse = await fetch(`${baseUrl}/api/models-v2?search=flux`)
    
    if (searchResponse.ok) {
      const searchData = await searchResponse.json()
      console.log(`🔍 FLUX models found: ${searchData.models?.length || 0}`)
      
      if (searchData.models && searchData.models.length > 0) {
        console.log('   FLUX Models:')
        searchData.models.forEach(model => {
          console.log(`   • ${model.name} (${model.id})`)
          console.log(`     Parameters: ${model.parameters?.length || 0}`)
          console.log(`     Default params: ${JSON.stringify(model.defaultParameters || {})}`)
        })
        
        return {
          success: true,
          fluxModels: searchData.models.length,
          firstFluxModel: searchData.models[0]
        }
      }
    }
    
    return { success: false, error: 'No FLUX models found' }
  } catch (error) {
    console.log('❌ Model selection test error:', error.message)
    return { success: false, error: error.message }
  }
}

async function testModelParameters() {
  console.log('\n⚙️ TESTING MODEL PARAMETERS')
  console.log('=' .repeat(50))
  
  try {
    const response = await fetch(`${baseUrl}/api/models-v2`)
    
    if (response.ok) {
      const data = await response.json()
      
      if (data.models && data.models.length > 0) {
        const firstModel = data.models[0]
        console.log(`📊 Testing parameters for: ${firstModel.name}`)
        console.log(`   Parameters count: ${firstModel.parameters?.length || 0}`)
        
        if (firstModel.parameters && firstModel.parameters.length > 0) {
          console.log('   Parameter details:')
          firstModel.parameters.slice(0, 5).forEach(param => {
            console.log(`   • ${param.name}: ${param.type} (required: ${param.required})`)
            if (param.defaultValue !== undefined) {
              console.log(`     Default: ${param.defaultValue}`)
            }
          })
        }
        
        console.log(`   Default parameters: ${JSON.stringify(firstModel.defaultParameters || {}, null, 2)}`)
        
        return {
          success: true,
          modelName: firstModel.name,
          parameterCount: firstModel.parameters?.length || 0,
          hasDefaults: !!firstModel.defaultParameters
        }
      }
    }
    
    return { success: false, error: 'No models to test parameters' }
  } catch (error) {
    console.log('❌ Parameter test error:', error.message)
    return { success: false, error: error.message }
  }
}

async function runModelTests() {
  console.log('🚀 COMPREHENSIVE MODEL TESTING')
  console.log('=' .repeat(60))
  
  // Test model loading
  const loadingResult = await testModelLoading()
  
  // Test model selection
  const selectionResult = await testModelSelection()
  
  // Test model parameters
  const parameterResult = await testModelParameters()
  
  console.log('\n🎉 MODEL TEST SUMMARY')
  console.log('=' .repeat(60))
  
  console.log(`✅ Model Loading: ${loadingResult.success ? 'PASS' : 'FAIL'}`)
  if (loadingResult.success) {
    console.log(`   Total Models: ${loadingResult.totalModels}`)
    console.log(`   Priority Models: ${loadingResult.priorityModels}`)
    console.log(`   Image Models: ${loadingResult.imageModels}`)
    console.log(`   First Model: ${loadingResult.firstModel?.name}`)
  } else {
    console.log(`   Error: ${loadingResult.error}`)
  }
  
  console.log(`✅ Model Selection: ${selectionResult.success ? 'PASS' : 'FAIL'}`)
  if (selectionResult.success) {
    console.log(`   FLUX Models: ${selectionResult.fluxModels}`)
    console.log(`   First FLUX: ${selectionResult.firstFluxModel?.name}`)
  } else {
    console.log(`   Error: ${selectionResult.error}`)
  }
  
  console.log(`✅ Model Parameters: ${parameterResult.success ? 'PASS' : 'FAIL'}`)
  if (parameterResult.success) {
    console.log(`   Test Model: ${parameterResult.modelName}`)
    console.log(`   Parameters: ${parameterResult.parameterCount}`)
    console.log(`   Has Defaults: ${parameterResult.hasDefaults}`)
  } else {
    console.log(`   Error: ${parameterResult.error}`)
  }
  
  const overallSuccess = loadingResult.success && selectionResult.success && parameterResult.success
  
  if (overallSuccess) {
    console.log('\n🎉 ALL MODEL TESTS PASSED!')
    console.log('✅ Models are loading correctly')
    console.log('✅ Model selection is working')
    console.log('✅ Model parameters are available')
    console.log('\n🔍 If Generate button still disabled, the issue is likely:')
    console.log('   • Frontend state management')
    console.log('   • Validation logic conflicts')
    console.log('   • React component rendering')
  } else {
    console.log('\n❌ MODEL SYSTEM ISSUES DETECTED')
    console.log('Fix these model issues first before debugging frontend')
  }
  
  return {
    loadingResult,
    selectionResult,
    parameterResult,
    overallSuccess
  }
}

// Run the model tests
runModelTests().catch(console.error)
