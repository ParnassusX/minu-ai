/**
 * Navigation Performance Analysis
 * Analyze navigation delays and identify bottlenecks
 */

const baseUrl = 'http://127.0.0.1:4000'

async function analyzeNavigationPerformance() {
  console.log('⚡ NAVIGATION PERFORMANCE ANALYSIS')
  console.log('=' .repeat(60))

  const results = {
    pageLoadTimes: {},
    apiResponseTimes: {},
    authenticationChecks: {},
    resourceLoading: {},
    overall: {}
  }

  // Test page load times for different routes
  const routes = [
    { name: 'Landing Page', url: '/' },
    { name: 'Generator Page', url: '/generator' },
    { name: 'Gallery Page', url: '/gallery' },
    { name: 'Auth Login', url: '/auth/login' },
    { name: 'Auth Signup', url: '/auth/signup' }
  ]

  console.log('\n📊 1. PAGE LOAD PERFORMANCE')
  console.log('-' .repeat(40))

  for (const route of routes) {
    try {
      const startTime = performance.now()
      
      const response = await fetch(`${baseUrl}${route.url}`, {
        headers: {
          'User-Agent': 'Minu.AI-Performance-Test/1.0'
        }
      })
      
      const endTime = performance.now()
      const loadTime = Math.round(endTime - startTime)
      
      results.pageLoadTimes[route.name] = {
        url: route.url,
        status: response.status,
        loadTime,
        contentLength: response.headers.get('content-length'),
        contentType: response.headers.get('content-type')
      }
      
      const status = loadTime < 500 ? '✅' : loadTime < 1000 ? '⚠️' : '❌'
      console.log(`   ${status} ${route.name}: ${loadTime}ms (${response.status})`)
      
    } catch (error) {
      console.log(`   ❌ ${route.name}: ERROR - ${error.message}`)
      results.pageLoadTimes[route.name] = { error: error.message }
    }
  }

  // Test API response times
  console.log('\n🔌 2. API RESPONSE PERFORMANCE')
  console.log('-' .repeat(40))

  const apiEndpoints = [
    { name: 'Generate V2 Health', url: '/api/generate-v2', method: 'GET' },
    { name: 'Models V2', url: '/api/models-v2', method: 'GET' },
    { name: 'Auth Check', url: '/api/auth-check', method: 'GET' },
    { name: 'Gallery (Unauth)', url: '/api/gallery', method: 'GET' },
    { name: 'Enhance Prompt', url: '/api/enhance-prompt-v2', method: 'POST', body: { prompt: 'test' } }
  ]

  for (const endpoint of apiEndpoints) {
    try {
      const startTime = performance.now()
      
      const options = {
        method: endpoint.method,
        headers: { 'Content-Type': 'application/json' }
      }
      
      if (endpoint.body) {
        options.body = JSON.stringify(endpoint.body)
      }
      
      const response = await fetch(`${baseUrl}${endpoint.url}`, options)
      const endTime = performance.now()
      const responseTime = Math.round(endTime - startTime)
      
      results.apiResponseTimes[endpoint.name] = {
        url: endpoint.url,
        method: endpoint.method,
        status: response.status,
        responseTime,
        contentLength: response.headers.get('content-length')
      }
      
      const status = responseTime < 200 ? '✅' : responseTime < 500 ? '⚠️' : '❌'
      console.log(`   ${status} ${endpoint.name}: ${responseTime}ms (${response.status})`)
      
    } catch (error) {
      console.log(`   ❌ ${endpoint.name}: ERROR - ${error.message}`)
      results.apiResponseTimes[endpoint.name] = { error: error.message }
    }
  }

  // Test authentication-related delays
  console.log('\n🔐 3. AUTHENTICATION PERFORMANCE')
  console.log('-' .repeat(40))

  try {
    // Test auth check endpoint performance
    const authStartTime = performance.now()
    const authResponse = await fetch(`${baseUrl}/api/auth-check`)
    const authEndTime = performance.now()
    const authTime = Math.round(authEndTime - authStartTime)
    
    results.authenticationChecks.authCheck = {
      responseTime: authTime,
      status: authResponse.status
    }
    
    console.log(`   ✅ Auth Check API: ${authTime}ms`)
    
    // Test multiple rapid auth checks (simulating navigation)
    const rapidChecks = []
    for (let i = 0; i < 5; i++) {
      const start = performance.now()
      await fetch(`${baseUrl}/api/auth-check`)
      const end = performance.now()
      rapidChecks.push(Math.round(end - start))
    }
    
    const avgRapidCheck = Math.round(rapidChecks.reduce((a, b) => a + b, 0) / rapidChecks.length)
    results.authenticationChecks.rapidChecks = {
      times: rapidChecks,
      average: avgRapidCheck
    }
    
    console.log(`   ✅ Rapid Auth Checks (5x): ${avgRapidCheck}ms avg`)
    console.log(`      Individual times: ${rapidChecks.join('ms, ')}ms`)
    
  } catch (error) {
    console.log(`   ❌ Authentication Tests: ERROR - ${error.message}`)
    results.authenticationChecks = { error: error.message }
  }

  // Test resource loading performance
  console.log('\n📦 4. RESOURCE LOADING PERFORMANCE')
  console.log('-' .repeat(40))

  try {
    // Test static resource loading
    const staticResources = [
      { name: 'Favicon', url: '/favicon.ico' },
      { name: 'Manifest', url: '/manifest.json' }
    ]
    
    for (const resource of staticResources) {
      try {
        const start = performance.now()
        const response = await fetch(`${baseUrl}${resource.url}`)
        const end = performance.now()
        const loadTime = Math.round(end - start)
        
        results.resourceLoading[resource.name] = {
          loadTime,
          status: response.status,
          size: response.headers.get('content-length')
        }
        
        const status = loadTime < 100 ? '✅' : loadTime < 300 ? '⚠️' : '❌'
        console.log(`   ${status} ${resource.name}: ${loadTime}ms (${response.status})`)
        
      } catch (error) {
        console.log(`   ⚠️ ${resource.name}: Not found or error`)
        results.resourceLoading[resource.name] = { error: error.message }
      }
    }
    
  } catch (error) {
    console.log(`   ❌ Resource Loading Tests: ERROR - ${error.message}`)
    results.resourceLoading = { error: error.message }
  }

  // Calculate overall performance metrics
  console.log('\n📈 5. PERFORMANCE SUMMARY')
  console.log('-' .repeat(40))

  const pageLoadTimes = Object.values(results.pageLoadTimes)
    .filter(result => result.loadTime)
    .map(result => result.loadTime)
  
  const apiResponseTimes = Object.values(results.apiResponseTimes)
    .filter(result => result.responseTime)
    .map(result => result.responseTime)

  results.overall = {
    avgPageLoadTime: pageLoadTimes.length > 0 ? Math.round(pageLoadTimes.reduce((a, b) => a + b, 0) / pageLoadTimes.length) : 0,
    maxPageLoadTime: pageLoadTimes.length > 0 ? Math.max(...pageLoadTimes) : 0,
    avgApiResponseTime: apiResponseTimes.length > 0 ? Math.round(apiResponseTimes.reduce((a, b) => a + b, 0) / apiResponseTimes.length) : 0,
    maxApiResponseTime: apiResponseTimes.length > 0 ? Math.max(...apiResponseTimes) : 0,
    authCheckTime: results.authenticationChecks.authCheck?.responseTime || 0,
    rapidAuthAvg: results.authenticationChecks.rapidChecks?.average || 0
  }

  console.log(`📊 Average Page Load Time: ${results.overall.avgPageLoadTime}ms`)
  console.log(`📊 Maximum Page Load Time: ${results.overall.maxPageLoadTime}ms`)
  console.log(`📊 Average API Response Time: ${results.overall.avgApiResponseTime}ms`)
  console.log(`📊 Maximum API Response Time: ${results.overall.maxApiResponseTime}ms`)
  console.log(`📊 Auth Check Time: ${results.overall.authCheckTime}ms`)
  console.log(`📊 Rapid Auth Average: ${results.overall.rapidAuthAvg}ms`)

  // Performance assessment
  console.log('\n🎯 PERFORMANCE ASSESSMENT')
  console.log('-' .repeat(40))

  const issues = []
  const recommendations = []

  if (results.overall.avgPageLoadTime > 1000) {
    issues.push('Slow page load times (>1s average)')
    recommendations.push('Optimize page rendering and reduce bundle size')
  }

  if (results.overall.maxPageLoadTime > 2000) {
    issues.push('Very slow maximum page load time (>2s)')
    recommendations.push('Implement code splitting and lazy loading')
  }

  if (results.overall.avgApiResponseTime > 500) {
    issues.push('Slow API response times (>500ms average)')
    recommendations.push('Optimize API endpoints and database queries')
  }

  if (results.overall.authCheckTime > 300) {
    issues.push('Slow authentication checks (>300ms)')
    recommendations.push('Implement auth caching and session optimization')
  }

  if (results.overall.rapidAuthAvg > 200) {
    issues.push('Slow rapid authentication checks (>200ms avg)')
    recommendations.push('Cache authentication state to avoid repeated API calls')
  }

  if (issues.length === 0) {
    console.log('✅ PERFORMANCE: EXCELLENT')
    console.log('   All metrics are within acceptable ranges')
    console.log('   Navigation should feel instant and responsive')
  } else {
    console.log('⚠️ PERFORMANCE ISSUES IDENTIFIED:')
    issues.forEach(issue => console.log(`   • ${issue}`))
    
    console.log('\n💡 RECOMMENDATIONS:')
    recommendations.forEach(rec => console.log(`   • ${rec}`))
  }

  // Navigation-specific analysis
  console.log('\n🧭 NAVIGATION-SPECIFIC ANALYSIS')
  console.log('-' .repeat(40))

  const navigationBottlenecks = []

  if (results.overall.authCheckTime > 200) {
    navigationBottlenecks.push('Authentication checks on every route change')
  }

  if (results.overall.avgApiResponseTime > 300) {
    navigationBottlenecks.push('Slow API responses blocking navigation')
  }

  if (results.overall.avgPageLoadTime > 800) {
    navigationBottlenecks.push('Heavy page rendering causing delays')
  }

  if (navigationBottlenecks.length > 0) {
    console.log('🐌 NAVIGATION BOTTLENECKS IDENTIFIED:')
    navigationBottlenecks.forEach(bottleneck => console.log(`   • ${bottleneck}`))
    
    console.log('\n🚀 NAVIGATION OPTIMIZATION PRIORITIES:')
    console.log('   1. Implement authentication state caching')
    console.log('   2. Reduce API calls during route changes')
    console.log('   3. Optimize component rendering and loading')
    console.log('   4. Implement route preloading for instant navigation')
    console.log('   5. Use client-side routing optimizations')
  } else {
    console.log('✅ Navigation performance appears to be optimized')
  }

  return results
}

// Run the analysis
analyzeNavigationPerformance().catch(console.error)
