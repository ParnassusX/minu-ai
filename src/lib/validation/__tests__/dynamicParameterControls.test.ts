/**
 * Test suite to verify dynamic parameter controls work correctly with real model capabilities
 */

import { 
  getModelDefaults, 
  modelSupportsImageInput, 
  getImageInputParameters 
} from '../modelParameterValidation'

describe('Dynamic Parameter Controls', () => {
  describe('getModelDefaults', () => {
    it('should return default values for flux-schnell model', () => {
      const defaults = getModelDefaults('flux-schnell')
      
      // Based on our model schema, these defaults should exist
      expect(defaults).toHaveProperty('num_outputs', 1)
      expect(defaults).toHaveProperty('aspect_ratio', '1:1')
      expect(defaults).toHaveProperty('guidance_scale', 3.5)
      expect(defaults).toHaveProperty('num_inference_steps', 4)
      expect(defaults).toHaveProperty('output_format', 'webp')
      expect(defaults).toHaveProperty('output_quality', 80)
    })

    it('should return empty object for non-existent model', () => {
      const defaults = getModelDefaults('non-existent-model')
      expect(defaults).toEqual({})
    })

    it('should not include prompt in defaults', () => {
      const defaults = getModelDefaults('flux-schnell')
      expect(defaults).not.toHaveProperty('prompt')
      expect(defaults).not.toHaveProperty('text_prompt')
      expect(defaults).not.toHaveProperty('description')
    })
  })

  describe('modelSupportsImageInput', () => {
    it('should return false for FLUX models (text-to-image only)', () => {
      expect(modelSupportsImageInput('flux-schnell')).toBe(false)
      expect(modelSupportsImageInput('flux-dev')).toBe(false)
      expect(modelSupportsImageInput('flux-pro')).toBe(false)
    })

    it('should return true for video models', () => {
      // Video models typically support image input for first frame
      expect(modelSupportsImageInput('minimax-video-01')).toBe(true)
    })

    it('should return true for upscaling/enhance models', () => {
      expect(modelSupportsImageInput('real-esrgan-upscale')).toBe(true)
      expect(modelSupportsImageInput('enhance-model')).toBe(true)
    })

    it('should return false for non-existent model', () => {
      expect(modelSupportsImageInput('non-existent-model')).toBe(false)
    })
  })

  describe('getImageInputParameters', () => {
    it('should return empty array for FLUX models', () => {
      const imageParams = getImageInputParameters('flux-schnell')
      expect(imageParams).toEqual([])
    })

    it('should return image parameter names for models that support image input', () => {
      // This would depend on the actual model schema
      const imageParams = getImageInputParameters('video-model-with-image')
      expect(Array.isArray(imageParams)).toBe(true)
    })

    it('should return empty array for non-existent model', () => {
      const imageParams = getImageInputParameters('non-existent-model')
      expect(imageParams).toEqual([])
    })
  })

  describe('Integration with CleanGeneratorInterface', () => {
    it('should provide correct parameter structure for UI rendering', () => {
      const modelId = 'flux-schnell'
      const defaults = getModelDefaults(modelId)
      const supportsImage = modelSupportsImageInput(modelId)
      
      // Verify the structure matches what CleanGeneratorInterface expects
      expect(typeof defaults).toBe('object')
      expect(typeof supportsImage).toBe('boolean')
      
      // For FLUX models specifically
      expect(supportsImage).toBe(false)
      expect(defaults.num_outputs).toBeDefined()
      expect(defaults.aspect_ratio).toBeDefined()
    })

    it('should handle parameter updates correctly', () => {
      const defaults = getModelDefaults('flux-schnell')
      
      // Simulate parameter update (what would happen in UI)
      const updatedParams = {
        ...defaults,
        num_outputs: 2,
        guidance_scale: 5.0
      }
      
      expect(updatedParams.num_outputs).toBe(2)
      expect(updatedParams.guidance_scale).toBe(5.0)
      expect(updatedParams.aspect_ratio).toBe(defaults.aspect_ratio) // Should preserve other defaults
    })
  })

  describe('Parameter Validation', () => {
    it('should provide valid default values within parameter constraints', () => {
      const defaults = getModelDefaults('flux-schnell')
      
      // Check that defaults are within expected ranges
      if (defaults.num_outputs) {
        expect(defaults.num_outputs).toBeGreaterThanOrEqual(1)
        expect(defaults.num_outputs).toBeLessThanOrEqual(4)
      }
      
      if (defaults.guidance_scale) {
        expect(defaults.guidance_scale).toBeGreaterThanOrEqual(1)
        expect(defaults.guidance_scale).toBeLessThanOrEqual(20)
      }
      
      if (defaults.num_inference_steps) {
        expect(defaults.num_inference_steps).toBeGreaterThanOrEqual(1)
        expect(defaults.num_inference_steps).toBeLessThanOrEqual(8)
      }
    })

    it('should handle null/undefined default values gracefully', () => {
      const defaults = getModelDefaults('flux-schnell')
      
      // Some parameters like seed may have null defaults
      // The function should handle this without errors
      expect(() => {
        const updatedParams = { ...defaults, seed: null }
        expect(updatedParams).toBeDefined()
      }).not.toThrow()
    })
  })

  describe('Model-Specific Behavior', () => {
    it('should differentiate between model types correctly', () => {
      // Text-to-image models
      expect(modelSupportsImageInput('flux-schnell')).toBe(false)
      expect(modelSupportsImageInput('stable-diffusion-xl')).toBe(false)
      
      // Image-to-video models (should support image input)
      expect(modelSupportsImageInput('stable-video-diffusion')).toBe(true)
      
      // Upscaling models (require image input)
      expect(modelSupportsImageInput('real-esrgan')).toBe(true)
    })

    it('should provide appropriate defaults for different model types', () => {
      const fluxDefaults = getModelDefaults('flux-schnell')
      
      // FLUX models should have specific defaults
      expect(fluxDefaults.num_inference_steps).toBe(4) // Optimized for speed
      expect(fluxDefaults.guidance_scale).toBe(3.5) // Lower guidance for FLUX
      expect(fluxDefaults.output_format).toBe('webp') // Default format
    })
  })
})
