const fs = require('fs');

async function testCorrectedModels() {
  console.log('=== TESTING CORRECTED MODEL PATHS ===');
  
  const results = {
    timestamp: new Date().toISOString(),
    models: [],
    summary: {}
  };

  // Test the corrected models
  const modelsToTest = [
    { id: 'seedream-3', path: 'bytedance/seedream-3' },
    { id: 'seedance-1-lite', path: 'bytedance/seedance-1-lite' },
    { id: 'seedance-1-pro', path: 'bytedance/seedance-1-pro' },
    { id: 'nano-banana', path: 'google/nano-banana' },
    { id: 'qwen-image-edit', path: 'qwen/qwen-image-edit' }
  ];

  for (const model of modelsToTest) {
    console.log(`\nTesting ${model.id} (${model.path})...`);
    
    try {
      // Test API call to generate-v2
      const response = await fetch('http://localhost:4000/api/generate-v2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: model.id,
          mode: 'images',
          input: {
            prompt: `Test prompt for ${model.id} - ${Date.now()}`,
            aspect_ratio: '1:1',
            output_format: 'jpg'
          },
          options: {}
        })
      });

      const data = await response.json();
      
      const result = {
        model: model.id,
        path: model.path,
        status: response.status,
        success: response.ok,
        error: response.ok ? null : data.error || data.message || 'Unknown error'
      };

      results.models.push(result);
      
      if (response.ok) {
        console.log(`✓ ${model.id}: SUCCESS (${response.status})`);
      } else {
        console.log(`✗ ${model.id}: FAILED (${response.status}) - ${result.error}`);
      }

    } catch (error) {
      const result = {
        model: model.id,
        path: model.path,
        status: 'ERROR',
        success: false,
        error: error.message
      };
      
      results.models.push(result);
      console.log(`✗ ${model.id}: ERROR - ${error.message}`);
    }
  }

  // Generate summary
  const successful = results.models.filter(m => m.success).length;
  const failed = results.models.filter(m => !m.success).length;
  
  results.summary = {
    total: results.models.length,
    successful,
    failed,
    successRate: `${Math.round((successful / results.models.length) * 100)}%`
  };

  console.log('\n=== SUMMARY ===');
  console.log(`Total models tested: ${results.summary.total}`);
  console.log(`Successful: ${results.summary.successful}`);
  console.log(`Failed: ${results.summary.failed}`);
  console.log(`Success rate: ${results.summary.successRate}`);

  // Save results
  fs.writeFileSync('corrected-models-test-results.json', JSON.stringify(results, null, 2));
  console.log('\n✓ Results saved to: corrected-models-test-results.json');

  // Show specific failures
  const failures = results.models.filter(m => !m.success);
  if (failures.length > 0) {
    console.log('\n=== FAILURES TO INVESTIGATE ===');
    failures.forEach(f => {
      console.log(`${f.model} (${f.path}): ${f.error}`);
    });
  }

  return results;
}

testCorrectedModels().catch(console.error);
