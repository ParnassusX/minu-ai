/**
 * Test Suite for FLUX Kontext Models Integration
 * 
 * Tests the new FLUX Kontext models:
 * - Multi-Image Kontext Pro (dual image input)
 * - Portrait Series (single image input, multiple outputs)
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import { FLUX_MODELS, MODEL_CATEGORIES } from '@/lib/replicate/config'
import { FluxModel } from '@/lib/replicate/models/flux'
import { FluxGenerationParams } from '@/lib/replicate/types'

describe('FLUX Kontext Models Configuration', () => {
  describe('Multi-Image Kontext Pro', () => {
    const modelConfig = FLUX_MODELS['flux-multi-image-kontext-pro']

    it('should be properly configured', () => {
      expect(modelConfig).toBeDefined()
      expect(modelConfig.name).toBe('FLUX Multi-Image Kontext Pro')
      expect(modelConfig.replicateModel).toBe('flux-kontext-apps/multi-image-kontext-pro')
      expect(modelConfig.requiresTwoImages).toBe(true)
      expect(modelConfig.experimental).toBe(true)
    })

    it('should have correct pricing', () => {
      expect(modelConfig.pricing.costPerImage).toBe(0.045)
      expect(modelConfig.pricing.currency).toBe('USD')
    })

    it('should have aspect ratio options', () => {
      expect(modelConfig.specialParams?.aspectRatio).toContain('match_input_image')
      expect(modelConfig.specialParams?.aspectRatio).toContain('1:1')
      expect(modelConfig.specialParams?.aspectRatio).toContain('16:9')
      expect(modelConfig.specialParams?.aspectRatio).toContain('9:16')
    })

    it('should have safety tolerance parameter limits', () => {
      expect(modelConfig.parameterLimits.safetyTolerance).toEqual({
        min: 0,
        max: 2,
        default: 2
      })
    })
  })

  describe('Portrait Series', () => {
    const modelConfig = FLUX_MODELS['flux-portrait-series']

    it('should be properly configured', () => {
      expect(modelConfig).toBeDefined()
      expect(modelConfig.name).toBe('FLUX Portrait Series')
      expect(modelConfig.replicateModel).toBe('flux-kontext-apps/portrait-series')
      expect(modelConfig.requiresInputImage).toBe(true)
      expect(modelConfig.requiresSingleImage).toBe(true)
      expect(modelConfig.experimental).toBe(true)
    })

    it('should have correct pricing', () => {
      expect(modelConfig.pricing.costPerImage).toBe(0.045)
      expect(modelConfig.pricing.currency).toBe('USD')
    })

    it('should have number of images parameter limits', () => {
      expect(modelConfig.parameterLimits.numImages).toEqual({
        min: 1,
        max: 13,
        default: 4
      })
    })

    it('should have background options', () => {
      expect(modelConfig.specialParams?.background).toContain('white')
      expect(modelConfig.specialParams?.background).toContain('black')
      expect(modelConfig.specialParams?.background).toContain('gray')
      expect(modelConfig.specialParams?.background).toContain('green screen')
      expect(modelConfig.specialParams?.background).toContain('neutral')
      expect(modelConfig.specialParams?.background).toContain('original')
    })
  })

  describe('Model Categories', () => {
    it('should include new models in appropriate categories', () => {
      expect(MODEL_CATEGORIES['Image Editing']).toContain('flux-multi-image-kontext-pro')
      expect(MODEL_CATEGORIES['Image Editing']).toContain('flux-portrait-series')
      expect(MODEL_CATEGORIES['Experimental']).toContain('flux-multi-image-kontext-pro')
      expect(MODEL_CATEGORIES['Experimental']).toContain('flux-portrait-series')
      expect(MODEL_CATEGORIES['Multi-Image']).toContain('flux-multi-image-kontext-pro')
      expect(MODEL_CATEGORIES['Portrait']).toContain('flux-portrait-series')
    })
  })
})

describe('FLUX Model Implementation', () => {
  let fluxModel: FluxModel

  beforeEach(() => {
    fluxModel = new FluxModel('flux-multi-image-kontext-pro')
  })

  describe('Multi-Image Kontext Pro Parameters', () => {
    it('should handle dual image input parameters', async () => {
      const params: FluxGenerationParams = {
        prompt: 'Combine these two images creatively',
        inputImage1: 'https://example.com/image1.jpg',
        inputImage2: 'https://example.com/image2.jpg',
        aspectRatio: '16:9',
        safetyTolerance: 1
      }

      // Mock the Replicate client
      const mockRun = jest.fn().mockResolvedValue(['https://example.com/result.jpg'])
      fluxModel['client'] = { run: mockRun } as any

      await fluxModel.generate(params)

      expect(mockRun).toHaveBeenCalledWith(
        'flux-kontext-apps/multi-image-kontext-pro',
        expect.objectContaining({
          input: expect.objectContaining({
            prompt: 'Combine these two images creatively',
            input_image_1: 'https://example.com/image1.jpg',
            input_image_2: 'https://example.com/image2.jpg',
            aspect_ratio: '16:9',
            safety_tolerance: 1
          })
        })
      )
    })

    it('should validate required dual images', async () => {
      const params: FluxGenerationParams = {
        prompt: 'Test prompt',
        inputImage1: 'https://example.com/image1.jpg'
        // Missing inputImage2
      }

      await expect(fluxModel.generate(params)).rejects.toThrow()
    })
  })

  describe('Portrait Series Parameters', () => {
    beforeEach(() => {
      fluxModel = new FluxModel('flux-portrait-series')
    })

    it('should handle portrait series parameters', async () => {
      const params: FluxGenerationParams = {
        prompt: 'Generate portrait variations',
        inputImage: 'https://example.com/portrait.jpg',
        numImages: 6,
        background: 'white',
        randomizeImages: true,
        safetyTolerance: 2
      }

      // Mock the Replicate client
      const mockRun = jest.fn().mockResolvedValue([
        'https://example.com/result1.jpg',
        'https://example.com/result2.jpg',
        'https://example.com/result3.jpg',
        'https://example.com/result4.jpg',
        'https://example.com/result5.jpg',
        'https://example.com/result6.jpg'
      ])
      fluxModel['client'] = { run: mockRun } as any

      await fluxModel.generate(params)

      expect(mockRun).toHaveBeenCalledWith(
        'flux-kontext-apps/portrait-series',
        expect.objectContaining({
          input: expect.objectContaining({
            prompt: 'Generate portrait variations',
            input_image: 'https://example.com/portrait.jpg',
            num_images: 6,
            background: 'white',
            randomize_images: true,
            safety_tolerance: 2
          })
        })
      )
    })

    it('should validate required single image', async () => {
      const params: FluxGenerationParams = {
        prompt: 'Test prompt'
        // Missing inputImage
      }

      await expect(fluxModel.generate(params)).rejects.toThrow()
    })

    it('should validate number of images range', async () => {
      const params: FluxGenerationParams = {
        prompt: 'Test prompt',
        inputImage: 'https://example.com/portrait.jpg',
        numImages: 15 // Exceeds maximum of 13
      }

      await expect(fluxModel.generate(params)).rejects.toThrow()
    })
  })
})

describe('Parameter Validation', () => {
  it('should validate aspect ratio options for Multi-Image Kontext Pro', () => {
    const validAspectRatios = [
      'match_input_image', '1:1', '16:9', '9:16', '4:3', '3:4',
      '3:2', '2:3', '4:5', '5:4', '21:9', '9:21', '2:1', '1:2'
    ]

    const modelConfig = FLUX_MODELS['flux-multi-image-kontext-pro']
    expect(modelConfig.specialParams?.aspectRatio).toEqual(validAspectRatios)
  })

  it('should validate background options for Portrait Series', () => {
    const validBackgrounds = ['white', 'black', 'gray', 'green screen', 'neutral', 'original']

    const modelConfig = FLUX_MODELS['flux-portrait-series']
    expect(modelConfig.specialParams?.background).toEqual(validBackgrounds)
  })

  it('should validate safety tolerance range', () => {
    const multiImageConfig = FLUX_MODELS['flux-multi-image-kontext-pro']
    const portraitConfig = FLUX_MODELS['flux-portrait-series']

    expect(multiImageConfig.parameterLimits.safetyTolerance).toEqual({
      min: 0,
      max: 2,
      default: 2
    })

    expect(portraitConfig.parameterLimits.safetyTolerance).toEqual({
      min: 0,
      max: 2,
      default: 2
    })
  })
})

describe('Integration Tests', () => {
  it('should have all required models available', () => {
    expect(FLUX_MODELS['flux-multi-image-kontext-pro']).toBeDefined()
    expect(FLUX_MODELS['flux-portrait-series']).toBeDefined()
  })

  it('should maintain backward compatibility', () => {
    // Ensure existing models are still available
    expect(FLUX_MODELS['flux-schnell']).toBeDefined()
    expect(FLUX_MODELS['flux-dev']).toBeDefined()
    expect(FLUX_MODELS['flux-pro']).toBeDefined()
  })

  it('should have consistent pricing structure', () => {
    const multiImageModel = FLUX_MODELS['flux-multi-image-kontext-pro']
    const portraitModel = FLUX_MODELS['flux-portrait-series']

    expect(multiImageModel.pricing).toHaveProperty('costPerImage')
    expect(multiImageModel.pricing).toHaveProperty('currency')
    expect(portraitModel.pricing).toHaveProperty('costPerImage')
    expect(portraitModel.pricing).toHaveProperty('currency')
  })
})
