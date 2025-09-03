/**
 * Test Model Imports
 * Direct test of model imports to identify the issue
 */

console.log('🔍 TESTING MODEL IMPORTS DIRECTLY')
console.log('=' .repeat(50))

// Test if we can import the models in a Node.js context
async function testModelImports() {
  try {
    console.log('📦 Testing model imports...')
    
    // This won't work in Node.js directly due to TypeScript and module resolution
    // But we can test the API endpoint and see what's happening
    
    const baseUrl = 'http://localhost:4000'
    
    // Make a direct request and log the full response
    console.log('📡 Making direct API request...')
    const response = await fetch(`${baseUrl}/api/models-v2`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    })
    
    console.log(`Response status: ${response.status}`)
    console.log(`Response headers:`, Object.fromEntries(response.headers.entries()))
    
    const responseText = await response.text()
    console.log(`Response body (raw):`, responseText)
    
    try {
      const responseJson = JSON.parse(responseText)
      console.log(`Response body (parsed):`, JSON.stringify(responseJson, null, 2))
      
      return responseJson
    } catch (parseError) {
      console.log('❌ Failed to parse JSON response:', parseError.message)
      return null
    }
    
  } catch (error) {
    console.log('❌ Import test error:', error.message)
    return null
  }
}

async function testAPIEndpointDirectly() {
  console.log('\n🎯 TESTING API ENDPOINT DIRECTLY')
  console.log('=' .repeat(50))
  
  const baseUrl = 'http://localhost:4000'
  
  try {
    // Test with different parameters
    const testCases = [
      { url: '/api/models-v2', description: 'All models' },
      { url: '/api/models-v2?priority=true', description: 'Priority models only' },
      { url: '/api/models-v2?mode=images', description: 'Image models only' },
      { url: '/api/models-v2?active=true', description: 'Active models only' }
    ]
    
    for (const testCase of testCases) {
      console.log(`\n🧪 Testing: ${testCase.description}`)
      console.log(`   URL: ${testCase.url}`)
      
      try {
        const response = await fetch(`${baseUrl}${testCase.url}`)
        const data = await response.json()
        
        console.log(`   Status: ${response.status}`)
        console.log(`   Success: ${data.success}`)
        console.log(`   Models count: ${data.models?.length || 0}`)
        
        if (data.models && data.models.length > 0) {
          console.log(`   First model: ${data.models[0].name}`)
        }
        
        if (data.error) {
          console.log(`   Error: ${data.error}`)
        }
        
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`)
      }
    }
    
  } catch (error) {
    console.log('❌ API endpoint test error:', error.message)
  }
}

async function checkServerLogs() {
  console.log('\n📋 SERVER LOG ANALYSIS')
  console.log('=' .repeat(50))
  
  console.log(`
🔍 To check server logs for model loading issues:

1. Look at the terminal where the Next.js server is running
2. After making API requests, you should see:
   📋 Models API request: {...}
   📊 ALL_MODELS length: X
   📊 PRIORITY_MODELS length: Y
   
3. If you see:
   ❌ ALL_MODELS is empty! Check model imports.
   
   Then there's an import issue in the models module.

4. If you don't see any debug logs at all:
   - The API endpoint might not be reached
   - There might be a routing issue
   - Check for compilation errors

5. Expected logs for working system:
   📋 Models API request: {mode: null, provider: null, ...}
   📊 ALL_MODELS length: 7
   📊 PRIORITY_MODELS length: 5
   ✅ Models loaded: FLUX.1 Schnell, FLUX.1.1 Pro Ultra, ...
`)
}

async function runImportTests() {
  console.log('🚀 RUNNING MODEL IMPORT TESTS')
  console.log('=' .repeat(60))
  
  // Test model imports
  const importResult = await testModelImports()
  
  // Test API endpoint directly
  await testAPIEndpointDirectly()
  
  // Show server log analysis
  await checkServerLogs()
  
  console.log('\n🎉 IMPORT TEST SUMMARY')
  console.log('=' .repeat(60))
  
  if (importResult && importResult.success && importResult.models && importResult.models.length > 0) {
    console.log('✅ MODEL IMPORTS WORKING!')
    console.log(`   Found ${importResult.models.length} models`)
    console.log('   The issue is not with model imports')
    console.log('   Check frontend state management instead')
  } else {
    console.log('❌ MODEL IMPORT ISSUES DETECTED')
    console.log('   Models are not being loaded correctly')
    console.log('   Check:')
    console.log('   • TypeScript compilation errors')
    console.log('   • Module import paths')
    console.log('   • Model data file structure')
    console.log('   • Server logs for import errors')
  }
  
  console.log('\n📋 NEXT STEPS:')
  console.log('1. Check server terminal for debug logs')
  console.log('2. Look for TypeScript compilation errors')
  console.log('3. Verify model file imports are working')
  console.log('4. If models load correctly, debug frontend state')
  
  return importResult
}

// Run the import tests
runImportTests().catch(console.error)
