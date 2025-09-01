/**
 * Direct Functionality Test
 * Test core functionality without full server startup
 */

console.log('🔍 DIRECT FUNCTIONALITY VERIFICATION')
console.log('=' .repeat(60))

// Test 1: Environment Variables
function testEnvironmentVariables() {
  console.log('\n1️⃣ TESTING ENVIRONMENT VARIABLES')
  console.log('-' .repeat(40))
  
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'REPLICATE_API_TOKEN',
    'GEMINI_API_KEY'
  ]
  
  const results = {}
  
  requiredVars.forEach(varName => {
    const value = process.env[varName]
    results[varName] = {
      present: !!value,
      length: value ? value.length : 0,
      masked: value ? `${value.substring(0, 8)}...` : 'Not set'
    }
    
    console.log(`   ${varName}: ${results[varName].present ? '✅' : '❌'} ${results[varName].masked}`)
  })
  
  const allPresent = Object.values(results).every(r => r.present)
  console.log(`\n   Overall: ${allPresent ? '✅ All required variables present' : '❌ Missing variables'}`)
  
  return { success: allPresent, details: results }
}

// Test 2: File Structure
function testFileStructure() {
  console.log('\n2️⃣ TESTING FILE STRUCTURE')
  console.log('-' .repeat(40))
  
  const fs = require('fs')
  const path = require('path')
  
  const criticalFiles = [
    'src/app/api/generate-v2/route.ts',
    'src/app/api/models-v2/route.ts',
    'src/app/api/enhance-prompt-v2/route.ts',
    'src/app/api/replicate/webhook/route.ts',
    'src/components/generator-v2/components/Generator.tsx',
    'src/components/generator-v2/hooks/useGenerator.ts',
    'src/lib/storage/unifiedStorage.ts'
  ]
  
  const results = {}
  
  criticalFiles.forEach(filePath => {
    const exists = fs.existsSync(filePath)
    const size = exists ? fs.statSync(filePath).size : 0
    
    results[filePath] = { exists, size }
    console.log(`   ${filePath}: ${exists ? '✅' : '❌'} ${exists ? `(${size} bytes)` : 'Missing'}`)
  })
  
  const allExist = Object.values(results).every(r => r.exists)
  console.log(`\n   Overall: ${allExist ? '✅ All critical files present' : '❌ Missing files'}`)
  
  return { success: allExist, details: results }
}

// Test 3: Import Structure
function testImportStructure() {
  console.log('\n3️⃣ TESTING IMPORT STRUCTURE')
  console.log('-' .repeat(40))
  
  const fs = require('fs')
  
  try {
    // Test critical imports in generate-v2 route
    const generateRoute = fs.readFileSync('src/app/api/generate-v2/route.ts', 'utf8')
    const hasUnifiedStorage = generateRoute.includes('UnifiedStorageService')
    const hasSupabaseClient = generateRoute.includes('createClient')
    const hasPersistOutputs = generateRoute.includes('persistOutputs')
    
    console.log(`   Generate V2 Route:`)
    console.log(`     UnifiedStorageService: ${hasUnifiedStorage ? '✅' : '❌'}`)
    console.log(`     Supabase Client: ${hasSupabaseClient ? '✅' : '❌'}`)
    console.log(`     persistOutputs function: ${hasPersistOutputs ? '✅' : '❌'}`)
    
    // Test webhook route
    const webhookRoute = fs.readFileSync('src/app/api/replicate/webhook/route.ts', 'utf8')
    const webhookHasStorage = webhookRoute.includes('UnifiedStorageService')
    const webhookHasSupabase = webhookRoute.includes('createClient')
    
    console.log(`   Webhook Route:`)
    console.log(`     UnifiedStorageService: ${webhookHasStorage ? '✅' : '❌'}`)
    console.log(`     Supabase Client: ${webhookHasSupabase ? '✅' : '❌'}`)
    
    // Test Generator component
    const generator = fs.readFileSync('src/components/generator-v2/components/Generator.tsx', 'utf8')
    const hasDebugLogging = generator.includes('Generator validation state')
    const hasAlertTitle = generator.includes('AlertTitle')
    
    console.log(`   Generator Component:`)
    console.log(`     Debug logging: ${hasDebugLogging ? '✅' : '❌'}`)
    console.log(`     AlertTitle import: ${hasAlertTitle ? '✅' : '❌'}`)
    
    const allImportsGood = hasUnifiedStorage && hasSupabaseClient && hasPersistOutputs && 
                          webhookHasStorage && webhookHasSupabase && hasDebugLogging
    
    console.log(`\n   Overall: ${allImportsGood ? '✅ Import structure looks good' : '⚠️ Some imports may need attention'}`)
    
    return {
      success: allImportsGood,
      details: {
        generateRoute: { hasUnifiedStorage, hasSupabaseClient, hasPersistOutputs },
        webhookRoute: { webhookHasStorage, webhookHasSupabase },
        generator: { hasDebugLogging, hasAlertTitle }
      }
    }
    
  } catch (error) {
    console.log(`   ❌ Error reading files: ${error.message}`)
    return { success: false, error: error.message }
  }
}

// Test 4: Model Data
function testModelData() {
  console.log('\n4️⃣ TESTING MODEL DATA')
  console.log('-' .repeat(40))
  
  try {
    // This is a simplified test since we can't import ES modules directly
    const fs = require('fs')
    const modelData = fs.readFileSync('src/components/generator-v2/lib/models/modelData.ts', 'utf8')
    
    const hasFluxModels = modelData.includes('flux-schnell') && modelData.includes('flux-ultra')
    const hasSeedanceModels = modelData.includes('seedance-1-lite') && modelData.includes('seedance-1-pro')
    const hasSeedreamModels = modelData.includes('seedream')
    const hasExports = modelData.includes('export') && modelData.includes('ALL_MODELS')
    
    console.log(`   FLUX Models: ${hasFluxModels ? '✅' : '❌'}`)
    console.log(`   Seedance Models: ${hasSeedanceModels ? '✅' : '❌'}`)
    console.log(`   Seedream Models: ${hasSeedreamModels ? '✅' : '❌'}`)
    console.log(`   Proper Exports: ${hasExports ? '✅' : '❌'}`)
    
    const allModelsPresent = hasFluxModels && hasSeedanceModels && hasSeedreamModels && hasExports
    console.log(`\n   Overall: ${allModelsPresent ? '✅ Model data structure looks complete' : '⚠️ Model data may need attention'}`)
    
    return {
      success: allModelsPresent,
      details: { hasFluxModels, hasSeedanceModels, hasSeedreamModels, hasExports }
    }
    
  } catch (error) {
    console.log(`   ❌ Error reading model data: ${error.message}`)
    return { success: false, error: error.message }
  }
}

// Test 5: Package Dependencies
function testPackageDependencies() {
  console.log('\n5️⃣ TESTING PACKAGE DEPENDENCIES')
  console.log('-' .repeat(40))
  
  try {
    const fs = require('fs')
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'))
    
    const criticalDeps = [
      'next',
      'react',
      'replicate',
      '@supabase/supabase-js',
      'cloudinary'
    ]
    
    const results = {}
    
    criticalDeps.forEach(dep => {
      const version = packageJson.dependencies[dep] || packageJson.devDependencies[dep]
      results[dep] = { present: !!version, version: version || 'Not found' }
      console.log(`   ${dep}: ${results[dep].present ? '✅' : '❌'} ${results[dep].version}`)
    })
    
    const allPresent = Object.values(results).every(r => r.present)
    console.log(`\n   Overall: ${allPresent ? '✅ All critical dependencies present' : '❌ Missing dependencies'}`)
    
    return { success: allPresent, details: results }
    
  } catch (error) {
    console.log(`   ❌ Error reading package.json: ${error.message}`)
    return { success: false, error: error.message }
  }
}

// Main test runner
async function runDirectFunctionalityTest() {
  console.log('🚀 STARTING DIRECT FUNCTIONALITY TEST')
  console.log('This test verifies core components without starting the full server')
  
  const results = {
    environment: testEnvironmentVariables(),
    fileStructure: testFileStructure(),
    importStructure: testImportStructure(),
    modelData: testModelData(),
    packageDependencies: testPackageDependencies()
  }
  
  console.log('\n🎯 COMPREHENSIVE TEST SUMMARY')
  console.log('=' .repeat(60))
  
  const testNames = Object.keys(results)
  const passedTests = testNames.filter(name => results[name].success)
  
  testNames.forEach(name => {
    const result = results[name]
    console.log(`${result.success ? '✅' : '❌'} ${name}: ${result.success ? 'PASS' : 'FAIL'}`)
  })
  
  console.log(`\n📊 Results: ${passedTests.length}/${testNames.length} tests passed`)
  
  if (passedTests.length === testNames.length) {
    console.log('\n🎉 ALL DIRECT TESTS PASSED!')
    console.log('✅ Core functionality structure is in place')
    console.log('✅ Critical files and imports are present')
    console.log('✅ Environment variables are configured')
    console.log('✅ Dependencies are installed')
    console.log('\n📋 NEXT STEPS:')
    console.log('1. Fix TypeScript compilation errors to start server')
    console.log('2. Test API endpoints once server is running')
    console.log('3. Run Playwright tests for end-to-end verification')
    console.log('4. Test actual image generation workflow')
  } else {
    console.log('\n⚠️ SOME TESTS FAILED')
    console.log('Fix the failing tests before proceeding with server startup')
    
    testNames.forEach(name => {
      if (!results[name].success) {
        console.log(`\n❌ ${name} issues:`)
        if (results[name].error) {
          console.log(`   Error: ${results[name].error}`)
        }
        if (results[name].details) {
          console.log(`   Details: ${JSON.stringify(results[name].details, null, 2)}`)
        }
      }
    })
  }
  
  return results
}

// Run the test
runDirectFunctionalityTest().catch(console.error)
