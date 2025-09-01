/**
 * Manual Verification Script
 * Simple script to verify enhance functionality step by step
 */

console.log('🔍 MANUAL ENHANCE VERIFICATION SCRIPT')
console.log('=' .repeat(50))

// Instructions for manual testing
console.log(`
📋 MANUAL TESTING INSTRUCTIONS:

1. Open your browser and navigate to: http://localhost:4000/generator
2. If redirected to login, authenticate first
3. Once on the generator page, look for:
   - A textarea with placeholder text
   - An "Enhance" button with a wand icon
   - A "Suggestions" button with a lightbulb icon

4. Test the enhance functionality:
   a) Enter a simple prompt like "a cat"
   b) Click the "Enhance" button
   c) Watch for the button to show "Enhancing..." briefly
   d) Check if the textarea updates with enhanced text

5. Open browser console (F12) and look for debug messages:
   - Messages starting with "🔮" (from PromptInput)
   - Messages starting with "🎯" (from useGenerator)

6. If enhance doesn't work, check for:
   - JavaScript errors in console
   - Network errors in Network tab
   - Button disabled state
   - Authentication issues

Expected behavior:
- "a cat" should become "a cat, high quality, detailed, professional photography, sharp focus, vibrant colors"
- The textarea should visibly update
- No JavaScript errors should appear
`)

// Test the API directly from Node.js
async function testAPIFromNode() {
  console.log('\n🧪 TESTING API FROM NODE.JS')
  console.log('=' .repeat(30))
  
  const baseUrl = 'http://localhost:4000'
  
  try {
    const response = await fetch(`${baseUrl}/api/enhance-prompt-v2`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: 'a cat' })
    })
    
    console.log(`API Status: ${response.status}`)
    
    if (response.ok) {
      const result = await response.json()
      console.log('✅ API Response:')
      console.log(`   Original: "${result.data.originalPrompt}"`)
      console.log(`   Enhanced: "${result.data.enhancedPrompt}"`)
      console.log(`   Success: ${result.success}`)
      console.log(`   Model: ${result.data.metadata.model}`)
      
      if (result.data.metadata.fallback) {
        console.log(`   ⚠️ Using fallback: ${result.data.metadata.fallbackReason}`)
      }
      
      return true
    } else {
      console.log('❌ API Error:', await response.text())
      return false
    }
  } catch (error) {
    console.log('❌ Network Error:', error.message)
    return false
  }
}

// Check server status
async function checkServerStatus() {
  console.log('\n🔧 CHECKING SERVER STATUS')
  console.log('=' .repeat(30))
  
  const baseUrl = 'http://localhost:4000'
  
  try {
    // Check if server is running
    const healthResponse = await fetch(`${baseUrl}/api/generate-v2`)
    console.log(`Server Health: ${healthResponse.status} ${healthResponse.ok ? 'OK' : 'ERROR'}`)
    
    // Check if generator page is accessible
    const generatorResponse = await fetch(`${baseUrl}/generator`)
    console.log(`Generator Page: ${generatorResponse.status} ${generatorResponse.ok ? 'OK' : 'REDIRECT'}`)
    
    // Check test page
    const testResponse = await fetch(`${baseUrl}/test-enhance`)
    console.log(`Test Page: ${testResponse.status} ${testResponse.ok ? 'OK' : 'ERROR'}`)
    
    return healthResponse.ok
  } catch (error) {
    console.log('❌ Server not accessible:', error.message)
    return false
  }
}

// Browser testing instructions
function showBrowserTestingSteps() {
  console.log('\n🌐 BROWSER TESTING CHECKLIST')
  console.log('=' .repeat(30))
  
  console.log(`
✅ Step 1: Open http://localhost:4000/test-enhance
   - Should see "Enhance Functionality Test" page
   - Should have textarea and enhance button
   - Should have debug logs panel

✅ Step 2: Test on isolated page
   - Enter "a cat" in textarea
   - Click "Enhance Prompt" button
   - Watch debug logs for API calls
   - Verify textarea updates with enhanced text

✅ Step 3: Open http://localhost:4000/generator
   - May require authentication
   - Look for main generator interface
   - Find textarea in "Prompt" section
   - Find "Enhance" button with wand icon

✅ Step 4: Test on main generator
   - Enter test prompt
   - Click enhance button
   - Check browser console for debug messages
   - Verify prompt updates in textarea

✅ Step 5: Debug if not working
   - Open browser DevTools (F12)
   - Check Console tab for errors
   - Check Network tab for API calls
   - Look for 🔮 and 🎯 debug messages
`)
}

// Main execution
async function runManualVerification() {
  console.log('🚀 RUNNING AUTOMATED CHECKS...')
  
  const serverOk = await checkServerStatus()
  const apiOk = await testAPIFromNode()
  
  console.log('\n📊 AUTOMATED CHECK RESULTS:')
  console.log(`✅ Server Status: ${serverOk ? 'OK' : 'ERROR'}`)
  console.log(`✅ API Functionality: ${apiOk ? 'OK' : 'ERROR'}`)
  
  if (serverOk && apiOk) {
    console.log('\n🎉 AUTOMATED CHECKS PASSED!')
    console.log('✅ Server is running correctly')
    console.log('✅ API is responding with enhanced prompts')
    console.log('✅ Backend functionality is working')
    console.log('\n🔍 If enhance button still not working in browser:')
    console.log('   • Issue is likely in frontend/React state management')
    console.log('   • Check browser console for JavaScript errors')
    console.log('   • Verify React component state updates')
    console.log('   • Check authentication/session issues')
  } else {
    console.log('\n❌ AUTOMATED CHECKS FAILED!')
    console.log('Backend issues detected - fix these first')
  }
  
  showBrowserTestingSteps()
  
  console.log('\n🎯 SUMMARY:')
  console.log('1. Run this script to verify backend is working')
  console.log('2. Follow browser testing checklist above')
  console.log('3. Check browser console for debug messages')
  console.log('4. Report specific errors found')
  
  return { serverOk, apiOk }
}

// Run the verification
runManualVerification().catch(console.error)
