/**
 * Script to verify model configurations and generate report
 */

import { generateVerificationReport, verifyAllModels, getModelsWithIssues } from '../lib/validation/modelVerification'

function runModelVerification() {
  console.log('🔍 Running Model Configuration Verification...\n')
  
  // Generate comprehensive report
  const report = generateVerificationReport()
  console.log(report.summary)
  console.log('\n' + '='.repeat(50) + '\n')
  
  // Show critical issues
  if (report.criticalIssues.length > 0) {
    console.log('🚨 CRITICAL ISSUES:')
    report.criticalIssues.forEach((issue, index) => {
      console.log(`${index + 1}. ${issue.message} (${issue.type})`)
    })
    console.log('\n' + '='.repeat(50) + '\n')
  }
  
  // Show models with specific issues
  const nonExistentModels = getModelsWithIssues('non_existent_model')
  if (nonExistentModels.length > 0) {
    console.log('❌ NON-EXISTENT MODELS:')
    nonExistentModels.forEach(model => {
      console.log(`- ${model.modelId}: ${model.issues[0]?.message}`)
    })
    console.log('\n' + '='.repeat(50) + '\n')
  }
  
  const incorrectCapabilities = getModelsWithIssues('incorrect_capability')
  if (incorrectCapabilities.length > 0) {
    console.log('⚠️  INCORRECT CAPABILITIES:')
    incorrectCapabilities.forEach(model => {
      console.log(`- ${model.modelName} (${model.modelId}):`)
      model.issues.forEach(issue => {
        if (issue.type === 'incorrect_capability') {
          console.log(`  • ${issue.message}`)
        }
      })
    })
    console.log('\n' + '='.repeat(50) + '\n')
  }
  
  const missingParameters = getModelsWithIssues('missing_parameter')
  if (missingParameters.length > 0) {
    console.log('📋 MISSING PARAMETERS:')
    missingParameters.forEach(model => {
      console.log(`- ${model.modelName} (${model.modelId}):`)
      model.issues.forEach(issue => {
        if (issue.type === 'missing_parameter') {
          console.log(`  • ${issue.message}`)
        }
      })
    })
    console.log('\n' + '='.repeat(50) + '\n')
  }
  
  // Show detailed verification for key models
  console.log('📊 DETAILED VERIFICATION FOR KEY MODELS:\n')
  
  const keyModels = ['flux-schnell', 'flux-dev', 'flux-pro', 'seedance-lite', 'minimax-video-01']
  const allResults = verifyAllModels()
  
  keyModels.forEach(modelId => {
    const result = allResults.find(r => r.modelId === modelId)
    if (result) {
      console.log(`🔸 ${result.modelName} (${result.modelId}):`)
      console.log(`   Status: ${result.isValid ? '✅ Valid' : '❌ Invalid'}`)
      console.log(`   Image Input: ${result.capabilities.imageInputCorrect ? '✅' : '❌'}`)
      console.log(`   Parameter Exposure: ${result.capabilities.parameterExposureCorrect ? '✅' : '❌'}`)
      console.log(`   Multiple Images: ${result.capabilities.multipleImageSupport ? '✅' : '❌'}`)
      console.log(`   Required Parameters: ${result.capabilities.requiredParametersPresent ? '✅' : '❌'}`)
      
      if (result.issues.length > 0) {
        console.log(`   Issues: ${result.issues.length}`)
        result.issues.forEach(issue => {
          console.log(`     • ${issue.message}`)
        })
      }
      
      if (result.warnings.length > 0) {
        console.log(`   Warnings: ${result.warnings.length}`)
        result.warnings.forEach(warning => {
          console.log(`     • ${warning.message}`)
        })
      }
      
      console.log('')
    } else {
      console.log(`🔸 ${modelId}: ❌ Model not found in verification results`)
      console.log('')
    }
  })
  
  // Summary recommendations
  console.log('💡 RECOMMENDATIONS:\n')
  
  if (nonExistentModels.length > 0) {
    console.log('1. Remove references to non-existent models from the application')
  }
  
  if (incorrectCapabilities.length > 0) {
    console.log('2. Fix model capability configurations to match actual Replicate schemas')
  }
  
  if (missingParameters.length > 0) {
    console.log('3. Ensure all required parameters are properly exposed in the UI')
  }
  
  if (report.criticalIssues.length === 0) {
    console.log('🎉 All critical issues have been resolved!')
  }
  
  console.log('\n' + '='.repeat(50))
  console.log('✅ Model verification complete!')
}

// Run if called directly
if (require.main === module) {
  runModelVerification()
}

export { runModelVerification }
