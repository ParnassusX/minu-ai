/**
 * Simple API Test
 * Basic test to check if the server is running and responding
 */

const baseUrl = 'http://localhost:4000'

async function simpleTest() {
  console.log('🔍 Simple API Test Starting...')
  
  try {
    // Test 1: Basic server health
    console.log('1️⃣ Testing basic server health...')
    const healthResponse = await fetch(`${baseUrl}/api/health`)
    console.log(`Health API Status: ${healthResponse.status}`)
    
    if (healthResponse.ok) {
      const healthData = await healthResponse.json()
      console.log('✅ Server is running')
      console.log('Health data:', healthData)
    } else {
      console.log('❌ Health API not responding')
    }
    
    // Test 2: Check if server is actually running
    console.log('\n2️⃣ Testing server connectivity...')
    try {
      const response = await fetch(`${baseUrl}`)
      console.log(`Root page status: ${response.status}`)
      if (response.status < 500) {
        console.log('✅ Server is accessible')
      } else {
        console.log('❌ Server has errors')
      }
    } catch (error) {
      console.log('❌ Server not reachable:', error.message)
    }
    
    // Test 3: Check specific API endpoints
    console.log('\n3️⃣ Testing specific endpoints...')
    const endpoints = [
      '/api/generate-v2',
      '/api/models-v2', 
      '/api/enhance-prompt-v2'
    ]
    
    for (const endpoint of endpoints) {
      try {
        const response = await fetch(`${baseUrl}${endpoint}`)
        console.log(`${endpoint}: ${response.status}`)
        
        if (response.status < 500) {
          console.log(`✅ ${endpoint} responding`)
        } else {
          console.log(`❌ ${endpoint} server error`)
          
          // Try to get error details
          try {
            const errorText = await response.text()
            console.log(`Error details: ${errorText.substring(0, 200)}...`)
          } catch (e) {
            console.log('Could not read error details')
          }
        }
      } catch (error) {
        console.log(`❌ ${endpoint} failed:`, error.message)
      }
    }
    
  } catch (error) {
    console.error('Test failed:', error)
  }
}

simpleTest()
