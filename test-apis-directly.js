async function testAPIsDirectly() {
  console.log('=== TESTING APIs DIRECTLY ===');
  
  try {
    // Test Models API
    console.log('\n1. Testing Models API...');
    const modelsResp = await fetch('http://localhost:4000/api/models-v2');
    
    if (modelsResp.ok) {
      const modelsData = await modelsResp.json();
      console.log(`✓ Models API Status: ${modelsResp.status}`);
      console.log(`✓ Total models: ${modelsData.data?.models?.length || 0}`);
      
      if (modelsData.data?.models?.length > 0) {
        const priorityModels = modelsData.data.models.filter(m => m.isPriority);
        console.log(`✓ Priority models: ${priorityModels.length}`);
        
        priorityModels.forEach(model => {
          console.log(`  - ${model.id}: ${model.name} (${model.replicateModel})`);
        });
        
        // Check for our corrected models
        const correctedModels = ['seedream-3', 'nano-banana', 'qwen-image-edit'];
        correctedModels.forEach(modelId => {
          const model = modelsData.data.models.find(m => m.id === modelId);
          if (model) {
            console.log(`✓ ${modelId}: Found with path ${model.replicateModel}`);
          } else {
            console.log(`✗ ${modelId}: Not found in models list`);
          }
        });
      }
    } else {
      console.log(`✗ Models API failed: ${modelsResp.status}`);
    }

    // Test Generate API (should require auth)
    console.log('\n2. Testing Generate API (should require auth)...');
    const generateResp = await fetch('http://localhost:4000/api/generate-v2', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'flux-schnell',
        mode: 'images',
        input: {
          prompt: 'Test prompt',
          aspect_ratio: '1:1'
        }
      })
    });
    
    console.log(`✓ Generate API Status: ${generateResp.status}`);
    if (generateResp.status === 401) {
      console.log('✓ Generate API properly requires authentication');
    } else {
      const generateData = await generateResp.json();
      console.log('Generate API response:', generateData);
    }

    // Test Gallery API (should require auth)
    console.log('\n3. Testing Gallery API (should require auth)...');
    const galleryResp = await fetch('http://localhost:4000/api/gallery');
    
    console.log(`✓ Gallery API Status: ${galleryResp.status}`);
    if (galleryResp.status === 401) {
      console.log('✓ Gallery API properly requires authentication');
    } else {
      const galleryData = await galleryResp.json();
      console.log(`✓ Gallery records: ${galleryData.data?.length || 0}`);
    }

    // Test Auth Check API
    console.log('\n4. Testing Auth Check API...');
    const authResp = await fetch('http://localhost:4000/api/auth-check');
    
    if (authResp.ok) {
      const authData = await authResp.json();
      console.log(`✓ Auth Check Status: ${authResp.status}`);
      console.log(`✓ Environment: ${authData.environment}`);
      console.log(`✓ Configured: ${authData.configured}`);
      console.log(`✓ Authenticated: ${authData.authenticated}`);
    } else {
      console.log(`✗ Auth Check failed: ${authResp.status}`);
    }

    // Test Health Check
    console.log('\n5. Testing Health Check...');
    const healthResp = await fetch('http://localhost:4000/api/generate-v2');
    
    if (healthResp.ok) {
      const healthData = await healthResp.json();
      console.log(`✓ Health Check Status: ${healthResp.status}`);
      console.log(`✓ Has Replicate Token: ${healthData.hasReplicateToken}`);
      console.log(`✓ Has Gemini Key: ${healthData.hasGeminiKey}`);
    } else {
      console.log(`✗ Health Check failed: ${healthResp.status}`);
    }

  } catch (error) {
    console.error('API Test Error:', error.message);
  }
}

testAPIsDirectly().catch(console.error);
