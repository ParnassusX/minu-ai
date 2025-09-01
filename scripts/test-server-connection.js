/**
 * Test Server Connection
 * Debug script to test if the server is running and accessible
 */

const baseUrl = 'http://localhost:4000'

async function testServerConnection() {
  console.log('🔍 TESTING SERVER CONNECTION')
  console.log('=' .repeat(50))

  // Test different ports and endpoints
  const testConfigs = [
    { url: 'http://localhost:3000', name: 'Default Next.js Port (3000)' },
    { url: 'http://localhost:4000', name: 'Configured Port (4000)' },
    { url: 'http://127.0.0.1:3000', name: 'Localhost IP (3000)' },
    { url: 'http://127.0.0.1:4000', name: 'Localhost IP (4000)' }
  ]

  for (const config of testConfigs) {
    console.log(`\n🌐 Testing ${config.name}: ${config.url}`)
    
    try {
      // Test basic connection
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout
      
      const response = await fetch(config.url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Minu.AI-Audit-Script/1.0'
        }
      })
      
      clearTimeout(timeoutId)
      
      console.log(`   Status: ${response.status}`)
      console.log(`   OK: ${response.ok}`)
      console.log(`   Content-Type: ${response.headers.get('content-type')}`)
      
      if (response.ok) {
        console.log(`   ✅ Server is accessible at ${config.url}`)
        
        // Test API endpoints if server is accessible
        console.log(`\n   🔍 Testing API endpoints:`)
        
        const apiEndpoints = [
          '/api/generate-v2',
          '/api/models-v2',
          '/api/enhance-prompt-v2'
        ]
        
        for (const endpoint of apiEndpoints) {
          try {
            const apiResponse = await fetch(`${config.url}${endpoint}`, {
              signal: controller.signal
            })
            console.log(`   ${endpoint}: ${apiResponse.status} ${apiResponse.ok ? '✅' : '❌'}`)
          } catch (apiError) {
            console.log(`   ${endpoint}: ERROR - ${apiError.message}`)
          }
        }
        
        // If this server works, use it for the audit
        console.log(`\n🎯 FOUND WORKING SERVER: ${config.url}`)
        return config.url
      } else {
        console.log(`   ❌ Server returned ${response.status}`)
      }
      
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log(`   ⏱️ Connection timeout (5s)`)
      } else if (error.code === 'ECONNREFUSED') {
        console.log(`   🚫 Connection refused - server not running`)
      } else {
        console.log(`   ❌ Error: ${error.message}`)
      }
    }
  }
  
  console.log(`\n❌ NO WORKING SERVER FOUND`)
  console.log(`\n🔧 TROUBLESHOOTING STEPS:`)
  console.log(`1. Check if Next.js dev server is running`)
  console.log(`2. Verify the correct port (3000 or 4000)`)
  console.log(`3. Check for port conflicts`)
  console.log(`4. Restart the development server`)
  
  return null
}

// Test network connectivity
async function testNetworkConnectivity() {
  console.log('\n🌍 TESTING NETWORK CONNECTIVITY')
  console.log('-' .repeat(30))
  
  try {
    const response = await fetch('https://httpbin.org/get', {
      signal: AbortSignal.timeout(5000)
    })
    console.log(`✅ External network: ${response.ok ? 'Working' : 'Issues'}`)
  } catch (error) {
    console.log(`❌ External network: ${error.message}`)
  }
  
  try {
    const response = await fetch('http://localhost', {
      signal: AbortSignal.timeout(2000)
    })
    console.log(`✅ Localhost connectivity: Working`)
  } catch (error) {
    console.log(`⚠️ Localhost connectivity: ${error.message}`)
  }
}

// Run tests
async function runDiagnostics() {
  await testNetworkConnectivity()
  const workingUrl = await testServerConnection()
  
  if (workingUrl) {
    console.log(`\n✅ SOLUTION: Update audit script to use ${workingUrl}`)
  } else {
    console.log(`\n❌ SOLUTION: Start the development server first`)
    console.log(`   Run: npm run dev`)
    console.log(`   Or: npx next dev -p 4000`)
  }
}

runDiagnostics().catch(console.error)
