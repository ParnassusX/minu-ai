/**
 * Test Instant Navigation System
 * Verify that navigation optimizations are working correctly
 */

const baseUrl = 'http://127.0.0.1:4000'

async function testInstantNavigation() {
  console.log('🚀 TESTING INSTANT NAVIGATION SYSTEM')
  console.log('=' .repeat(60))

  const results = {
    initialLoad: {},
    rapidNavigation: {},
    caching: {},
    preloading: {},
    overall: {}
  }

  // Test 1: Initial Load Performance
  console.log('\n⚡ 1. INITIAL LOAD PERFORMANCE')
  console.log('-' .repeat(40))

  const routes = [
    { name: 'Landing', url: '/' },
    { name: 'Generator', url: '/generator' },
    { name: 'Gallery', url: '/gallery' },
    { name: 'Dashboard', url: '/dashboard' }
  ]

  for (const route of routes) {
    try {
      const startTime = performance.now()
      const response = await fetch(`${baseUrl}${route.url}`)
      const endTime = performance.now()
      const loadTime = Math.round(endTime - startTime)

      results.initialLoad[route.name] = {
        loadTime,
        status: response.status,
        success: response.ok
      }

      const status = loadTime < 500 ? '✅' : loadTime < 1000 ? '⚠️' : '❌'
      console.log(`   ${status} ${route.name}: ${loadTime}ms (${response.status})`)

    } catch (error) {
      console.log(`   ❌ ${route.name}: ERROR - ${error.message}`)
      results.initialLoad[route.name] = { error: error.message }
    }
  }

  // Test 2: Rapid Navigation Simulation
  console.log('\n🔄 2. RAPID NAVIGATION SIMULATION')
  console.log('-' .repeat(40))

  const navigationSequence = [
    '/generator',
    '/gallery', 
    '/dashboard',
    '/generator',
    '/gallery'
  ]

  const navigationTimes = []

  for (let i = 0; i < navigationSequence.length; i++) {
    const route = navigationSequence[i]
    
    try {
      const startTime = performance.now()
      const response = await fetch(`${baseUrl}${route}`)
      const endTime = performance.now()
      const navTime = Math.round(endTime - startTime)

      navigationTimes.push(navTime)

      const status = navTime < 200 ? '✅' : navTime < 500 ? '⚠️' : '❌'
      console.log(`   ${status} Navigation ${i + 1} to ${route}: ${navTime}ms`)

    } catch (error) {
      console.log(`   ❌ Navigation ${i + 1} to ${route}: ERROR`)
      navigationTimes.push(Infinity)
    }
  }

  const avgNavTime = navigationTimes.filter(t => t !== Infinity).reduce((a, b) => a + b, 0) / navigationTimes.filter(t => t !== Infinity).length
  results.rapidNavigation = {
    times: navigationTimes,
    average: Math.round(avgNavTime),
    fastest: Math.min(...navigationTimes.filter(t => t !== Infinity)),
    slowest: Math.max(...navigationTimes.filter(t => t !== Infinity))
  }

  console.log(`   📊 Average navigation time: ${Math.round(avgNavTime)}ms`)
  console.log(`   📊 Fastest navigation: ${Math.min(...navigationTimes.filter(t => t !== Infinity))}ms`)
  console.log(`   📊 Slowest navigation: ${Math.max(...navigationTimes.filter(t => t !== Infinity))}ms`)

  // Test 3: API Caching Performance
  console.log('\n💾 3. API CACHING PERFORMANCE')
  console.log('-' .repeat(40))

  const apiEndpoints = [
    { name: 'Auth Check', url: '/api/auth-check' },
    { name: 'Models V2', url: '/api/models-v2' },
    { name: 'Generate V2', url: '/api/generate-v2' }
  ]

  for (const endpoint of apiEndpoints) {
    try {
      // First call (cold)
      const coldStart = performance.now()
      await fetch(`${baseUrl}${endpoint.url}`)
      const coldEnd = performance.now()
      const coldTime = Math.round(coldEnd - coldStart)

      // Second call (potentially cached)
      const warmStart = performance.now()
      await fetch(`${baseUrl}${endpoint.url}`)
      const warmEnd = performance.now()
      const warmTime = Math.round(warmEnd - warmStart)

      // Third call (should be cached)
      const cachedStart = performance.now()
      await fetch(`${baseUrl}${endpoint.url}`)
      const cachedEnd = performance.now()
      const cachedTime = Math.round(cachedEnd - cachedStart)

      results.caching[endpoint.name] = {
        cold: coldTime,
        warm: warmTime,
        cached: cachedTime,
        improvement: Math.round(((coldTime - cachedTime) / coldTime) * 100)
      }

      const improvement = Math.round(((coldTime - cachedTime) / coldTime) * 100)
      const status = improvement > 50 ? '✅' : improvement > 20 ? '⚠️' : '❌'
      
      console.log(`   ${status} ${endpoint.name}:`)
      console.log(`      Cold: ${coldTime}ms, Warm: ${warmTime}ms, Cached: ${cachedTime}ms`)
      console.log(`      Improvement: ${improvement}%`)

    } catch (error) {
      console.log(`   ❌ ${endpoint.name}: ERROR - ${error.message}`)
      results.caching[endpoint.name] = { error: error.message }
    }
  }

  // Test 4: Route Preloading Verification
  console.log('\n🔮 4. ROUTE PRELOADING VERIFICATION')
  console.log('-' .repeat(40))

  // Test if routes are being preloaded by checking response times
  const preloadRoutes = ['/generator', '/gallery', '/dashboard']
  const preloadResults = {}

  for (const route of preloadRoutes) {
    try {
      // Multiple rapid requests to the same route
      const times = []
      
      for (let i = 0; i < 3; i++) {
        const start = performance.now()
        await fetch(`${baseUrl}${route}`)
        const end = performance.now()
        times.push(Math.round(end - start))
        
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 100))
      }

      const avgTime = Math.round(times.reduce((a, b) => a + b, 0) / times.length)
      const consistency = Math.max(...times) - Math.min(...times)
      
      preloadResults[route] = {
        times,
        average: avgTime,
        consistency,
        isConsistent: consistency < 200
      }

      const status = avgTime < 300 && consistency < 200 ? '✅' : '⚠️'
      console.log(`   ${status} ${route}: ${avgTime}ms avg (consistency: ${consistency}ms)`)

    } catch (error) {
      console.log(`   ❌ ${route}: ERROR - ${error.message}`)
      preloadResults[route] = { error: error.message }
    }
  }

  results.preloading = preloadResults

  // Overall Assessment
  console.log('\n🎯 INSTANT NAVIGATION ASSESSMENT')
  console.log('-' .repeat(40))

  const assessments = []

  // Check rapid navigation performance
  if (results.rapidNavigation.average < 300) {
    assessments.push('✅ Rapid navigation is optimized (<300ms avg)')
  } else if (results.rapidNavigation.average < 500) {
    assessments.push('⚠️ Rapid navigation is acceptable (300-500ms avg)')
  } else {
    assessments.push('❌ Rapid navigation needs optimization (>500ms avg)')
  }

  // Check caching effectiveness
  const cachingImprovements = Object.values(results.caching)
    .filter(result => result.improvement !== undefined)
    .map(result => result.improvement)

  const avgCachingImprovement = cachingImprovements.length > 0 
    ? Math.round(cachingImprovements.reduce((a, b) => a + b, 0) / cachingImprovements.length)
    : 0

  if (avgCachingImprovement > 50) {
    assessments.push('✅ API caching is highly effective (>50% improvement)')
  } else if (avgCachingImprovement > 20) {
    assessments.push('⚠️ API caching is moderately effective (20-50% improvement)')
  } else {
    assessments.push('❌ API caching needs improvement (<20% improvement)')
  }

  // Check preloading consistency
  const preloadingConsistency = Object.values(results.preloading)
    .filter(result => result.isConsistent !== undefined)
    .every(result => result.isConsistent)

  if (preloadingConsistency) {
    assessments.push('✅ Route preloading is working consistently')
  } else {
    assessments.push('⚠️ Route preloading has inconsistent performance')
  }

  assessments.forEach(assessment => console.log(`   ${assessment}`))

  // Final verdict
  console.log('\n🏆 FINAL VERDICT')
  console.log('-' .repeat(40))

  const passedChecks = assessments.filter(a => a.startsWith('✅')).length
  const totalChecks = assessments.length

  if (passedChecks === totalChecks) {
    console.log('🎉 INSTANT NAVIGATION SYSTEM IS OPTIMIZED!')
    console.log('   Navigation should feel instant and responsive')
    console.log('   Similar to modern AI platforms like Krea.ai and Recraft.ai')
  } else if (passedChecks >= totalChecks * 0.7) {
    console.log('⚠️ INSTANT NAVIGATION SYSTEM IS MOSTLY OPTIMIZED')
    console.log('   Some improvements needed for optimal performance')
  } else {
    console.log('❌ INSTANT NAVIGATION SYSTEM NEEDS OPTIMIZATION')
    console.log('   Significant improvements required for instant navigation')
  }

  console.log(`\n📊 Performance Score: ${passedChecks}/${totalChecks} (${Math.round((passedChecks/totalChecks)*100)}%)`)

  results.overall = {
    score: passedChecks,
    maxScore: totalChecks,
    percentage: Math.round((passedChecks/totalChecks)*100),
    verdict: passedChecks === totalChecks ? 'optimized' : 
             passedChecks >= totalChecks * 0.7 ? 'mostly-optimized' : 'needs-optimization'
  }

  return results
}

// Run the test
testInstantNavigation().catch(console.error)
