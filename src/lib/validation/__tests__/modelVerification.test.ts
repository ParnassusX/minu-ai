/**
 * Test suite for model verification system
 */

import { 
  verifyModelConfiguration, 
  verifyAllModels, 
  generateVerificationReport,
  getModelsWithIssues 
} from '../modelVerification'

describe('Model Verification System', () => {
  describe('verifyModelConfiguration', () => {
    it('should verify FLUX models correctly', () => {
      const result = verifyModelConfiguration('flux-schnell')
      
      expect(result.isValid).toBe(true)
      expect(result.capabilities.imageInputCorrect).toBe(true)
      expect(result.capabilities.parameterExposureCorrect).toBe(true)
      
      // FLUX models should not support image input
      expect(result.capabilities.multipleImageSupport).toBe(false)
    })

    it('should identify non-existent models', () => {
      const result = verifyModelConfiguration('non-existent-model')
      
      expect(result.isValid).toBe(false)
      expect(result.issues).toHaveLength(1)
      expect(result.issues[0].type).toBe('non_existent_model')
    })

    it('should verify video models support image input', () => {
      const result = verifyModelConfiguration('seedance-lite')
      
      // Video models should support image input
      expect(result.capabilities.imageInputCorrect).toBe(true)
      
      // Should support multiple images for video generation
      if (result.isValid) {
        expect(result.capabilities.multipleImageSupport).toBe(true)
      }
    })

    it('should detect duplicate prompt parameters', () => {
      // This would catch if our filtering isn't working correctly
      const result = verifyModelConfiguration('flux-schnell')
      
      const duplicatePromptIssues = result.issues.filter(
        issue => issue.type === 'invalid_configuration' && 
                issue.message.includes('duplicate prompt')
      )
      
      expect(duplicatePromptIssues).toHaveLength(0)
    })
  })

  describe('verifyAllModels', () => {
    it('should verify all models without throwing errors', () => {
      expect(() => verifyAllModels()).not.toThrow()
    })

    it('should return results for all models', () => {
      const results = verifyAllModels()
      expect(results.length).toBeGreaterThan(0)
      
      // Each result should have required properties
      results.forEach(result => {
        expect(result).toHaveProperty('modelId')
        expect(result).toHaveProperty('modelName')
        expect(result).toHaveProperty('isValid')
        expect(result).toHaveProperty('capabilities')
        expect(result).toHaveProperty('issues')
        expect(result).toHaveProperty('warnings')
      })
    })
  })

  describe('getModelsWithIssues', () => {
    it('should filter models by issue type', () => {
      const modelsWithMissingParams = getModelsWithIssues('missing_parameter')
      const modelsWithIncorrectCapabilities = getModelsWithIssues('incorrect_capability')
      
      expect(Array.isArray(modelsWithMissingParams)).toBe(true)
      expect(Array.isArray(modelsWithIncorrectCapabilities)).toBe(true)
    })

    it('should return all models with issues when no type specified', () => {
      const modelsWithIssues = getModelsWithIssues()
      
      modelsWithIssues.forEach(model => {
        expect(model.isValid).toBe(false)
      })
    })
  })

  describe('generateVerificationReport', () => {
    it('should generate comprehensive report', () => {
      const report = generateVerificationReport()
      
      expect(report).toHaveProperty('totalModels')
      expect(report).toHaveProperty('validModels')
      expect(report).toHaveProperty('modelsWithErrors')
      expect(report).toHaveProperty('modelsWithWarnings')
      expect(report).toHaveProperty('criticalIssues')
      expect(report).toHaveProperty('summary')
      
      expect(report.totalModels).toBeGreaterThan(0)
      expect(report.validModels).toBeGreaterThanOrEqual(0)
      expect(report.modelsWithErrors).toBeGreaterThanOrEqual(0)
      expect(typeof report.summary).toBe('string')
    })

    it('should have valid counts', () => {
      const report = generateVerificationReport()
      
      // Valid + Error models should not exceed total
      expect(report.validModels + report.modelsWithErrors).toBeLessThanOrEqual(report.totalModels)
      
      // Critical issues should be array
      expect(Array.isArray(report.criticalIssues)).toBe(true)
    })
  })

  describe('Model-Specific Verification', () => {
    it('should verify FLUX Schnell has optimized settings', () => {
      const result = verifyModelConfiguration('flux-schnell')
      
      // Should not have warnings about inference steps if properly configured
      const inferenceWarnings = result.warnings.filter(w => 
        w.message.includes('inference steps')
      )
      
      expect(inferenceWarnings.length).toBeLessThanOrEqual(1)
    })

    it('should verify video models have proper image support', () => {
      const videoModels = ['seedance-lite', 'seedance-1-pro']
      
      videoModels.forEach(modelId => {
        const result = verifyModelConfiguration(modelId)
        
        if (result.isValid) {
          // Video models should support image input
          expect(result.capabilities.imageInputCorrect).toBe(true)
        }
      })
    })

    it('should verify upscaling models require image input', () => {
      // Test with any upscaling models in the system
      const allResults = verifyAllModels()
      const upscalingModels = allResults.filter(r => 
        r.modelId.includes('upscale') || r.modelId.includes('enhance')
      )
      
      upscalingModels.forEach(result => {
        if (result.isValid) {
          expect(result.capabilities.imageInputCorrect).toBe(true)
        }
      })
    })
  })

  describe('Parameter Exposure Verification', () => {
    it('should verify required parameters are exposed', () => {
      const result = verifyModelConfiguration('flux-schnell')
      
      expect(result.capabilities.requiredParametersPresent).toBe(true)
    })

    it('should verify no duplicate prompt interfaces', () => {
      const allResults = verifyAllModels()
      
      const duplicatePromptIssues = allResults.flatMap(r => r.issues).filter(
        issue => issue.type === 'invalid_configuration' && 
                issue.message.includes('duplicate prompt')
      )
      
      expect(duplicatePromptIssues).toHaveLength(0)
    })

    it('should verify image parameters are properly exposed', () => {
      const videoResult = verifyModelConfiguration('seedance-lite')
      
      if (videoResult.isValid) {
        // Video models should expose image-related parameters
        expect(videoResult.capabilities.imageInputCorrect).toBe(true)
      }
    })
  })

  describe('Edge Cases', () => {
    it('should handle models with no parameters gracefully', () => {
      // This tests robustness of the verification system
      expect(() => {
        verifyModelConfiguration('minimal-model')
      }).not.toThrow()
    })

    it('should handle models with complex parameter structures', () => {
      const allResults = verifyAllModels()
      
      // Should not throw errors for any model
      allResults.forEach(result => {
        expect(result).toHaveProperty('capabilities')
        expect(typeof result.isValid).toBe('boolean')
      })
    })
  })
})
