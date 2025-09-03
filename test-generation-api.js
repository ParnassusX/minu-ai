async function testGenerationAPI() {
  console.log('=== TESTING GENERATION API DIRECTLY ===');
  
  try {
    // Test 1: Check if generate API is accessible
    console.log('\n1. Testing generate API endpoint...');
    
    const generateResponse = await fetch('http://localhost:4000/api/generate-v2', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'flux-schnell',
        mode: 'images',
        input: {
          prompt: 'A beautiful sunset over mountains, digital art',
          aspect_ratio: '1:1',
          output_format: 'jpg'
        },
        options: {}
      })
    });

    console.log(`✓ Generate API Status: ${generateResponse.status}`);
    
    if (generateResponse.ok) {
      const generateData = await generateResponse.json();
      console.log('✓ Generate API Response:', generateData);
      
      if (generateData.id) {
        console.log(`✓ Prediction ID: ${generateData.id}`);
        console.log('🎉 GENERATION API WORKING - Image generation started!');
      }
    } else {
      const errorData = await generateResponse.json().catch(() => null);
      console.log('✗ Generate API Error:', errorData || 'Unknown error');
      
      if (generateResponse.status === 401) {
        console.log('  → Authentication required - demo mode may not be working for API calls');
      }
    }

    // Test 2: Check models API
    console.log('\n2. Testing models API...');
    
    const modelsResponse = await fetch('http://localhost:4000/api/models-v2');
    
    if (modelsResponse.ok) {
      const modelsData = await modelsResponse.json();
      console.log(`✓ Models API: ${modelsData.data?.models?.length || 0} models available`);
      
      // Check for priority models
      const priorityModels = modelsData.data?.models?.filter(m => m.isPriority) || [];
      console.log(`✓ Priority models: ${priorityModels.length}`);
      
      priorityModels.forEach(model => {
        console.log(`  - ${model.id}: ${model.name}`);
      });
    } else {
      console.log(`✗ Models API failed: ${modelsResponse.status}`);
    }

    // Test 3: Check auth status
    console.log('\n3. Testing auth status...');
    
    const authResponse = await fetch('http://localhost:4000/api/auth-check');
    
    if (authResponse.ok) {
      const authData = await authResponse.json();
      console.log(`✓ Auth Status: ${authData.authenticated ? 'Authenticated' : 'Not Authenticated'}`);
      console.log(`✓ Environment: ${authData.environment}`);
      console.log(`✓ Demo Mode: ${authData.demoMode || 'Not specified'}`);
    } else {
      console.log(`✗ Auth check failed: ${authResponse.status}`);
    }

  } catch (error) {
    console.error('API test error:', error.message);
  }
}

testGenerationAPI().catch(console.error);
