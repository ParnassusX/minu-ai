/**
 * Test suite to verify duplicate prompt interface issues are resolved
 */

import { filterPromptParameters, getUIParameters } from '../modelParameterValidation'
import { ModelParameter } from '@/lib/replicate/realModelData'

describe('Duplicate Prompt Interface Fix', () => {
  const mockParameters: ModelParameter[] = [
    {
      name: 'prompt',
      type: 'string',
      default: '',
      description: 'Text description for generation',
      required: true
    },
    {
      name: 'text_prompt',
      type: 'string',
      default: '',
      description: 'Alternative text prompt',
      required: false
    },
    {
      name: 'description',
      type: 'string',
      default: '',
      description: 'Description field',
      required: false
    },
    {
      name: 'num_outputs',
      type: 'number',
      default: 1,
      min: 1,
      max: 4,
      description: 'Number of outputs to generate',
      required: false
    },
    {
      name: 'guidance_scale',
      type: 'number',
      default: 7.5,
      min: 1,
      max: 20,
      description: 'Guidance scale for generation',
      required: false
    }
  ]

  describe('filterPromptParameters', () => {
    it('should filter out prompt parameter', () => {
      const filtered = filterPromptParameters(mockParameters)
      expect(filtered.find(p => p.name === 'prompt')).toBeUndefined()
    })

    it('should filter out text_prompt parameter', () => {
      const filtered = filterPromptParameters(mockParameters)
      expect(filtered.find(p => p.name === 'text_prompt')).toBeUndefined()
    })

    it('should filter out description parameter', () => {
      const filtered = filterPromptParameters(mockParameters)
      expect(filtered.find(p => p.name === 'description')).toBeUndefined()
    })

    it('should keep non-prompt parameters', () => {
      const filtered = filterPromptParameters(mockParameters)
      expect(filtered.find(p => p.name === 'num_outputs')).toBeDefined()
      expect(filtered.find(p => p.name === 'guidance_scale')).toBeDefined()
    })

    it('should return correct number of filtered parameters', () => {
      const filtered = filterPromptParameters(mockParameters)
      expect(filtered).toHaveLength(2) // Only num_outputs and guidance_scale should remain
    })
  })

  describe('getUIParameters', () => {
    it('should return filtered parameters for flux-schnell model', () => {
      const uiParams = getUIParameters('flux-schnell')
      
      // Check that prompt parameters are filtered out from all levels
      const allParams = [...uiParams.basic, ...uiParams.intermediate, ...uiParams.advanced]
      expect(allParams.find(p => p.name === 'prompt')).toBeUndefined()
      expect(allParams.find(p => p.name === 'text_prompt')).toBeUndefined()
      expect(allParams.find(p => p.name === 'description')).toBeUndefined()
    })

    it('should return empty arrays for non-existent model', () => {
      const uiParams = getUIParameters('non-existent-model')
      expect(uiParams.basic).toEqual([])
      expect(uiParams.intermediate).toEqual([])
      expect(uiParams.advanced).toEqual([])
    })

    it('should maintain parameter structure', () => {
      const uiParams = getUIParameters('flux-schnell')
      expect(uiParams).toHaveProperty('basic')
      expect(uiParams).toHaveProperty('intermediate')
      expect(uiParams).toHaveProperty('advanced')
      expect(Array.isArray(uiParams.basic)).toBe(true)
      expect(Array.isArray(uiParams.intermediate)).toBe(true)
      expect(Array.isArray(uiParams.advanced)).toBe(true)
    })
  })

  describe('Integration Test - CleanGeneratorInterface Usage', () => {
    it('should prevent duplicate prompt interfaces in UI', () => {
      // Test that the utility functions work as expected for the CleanGeneratorInterface
      const modelId = 'flux-schnell'
      const uiParams = getUIParameters(modelId)
      
      // Simulate what CleanGeneratorInterface does
      const basicParams = uiParams.basic
      const intermediateParams = uiParams.intermediate
      
      // Verify no prompt parameters exist in either level
      const allUIParams = [...basicParams, ...intermediateParams]
      const promptParams = allUIParams.filter(p => 
        p.name === 'prompt' || 
        p.name === 'text_prompt' || 
        p.name === 'description'
      )
      
      expect(promptParams).toHaveLength(0)
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty parameter arrays', () => {
      const filtered = filterPromptParameters([])
      expect(filtered).toEqual([])
    })

    it('should handle parameters with similar names but not exact matches', () => {
      const params: ModelParameter[] = [
        {
          name: 'prompt_strength',
          type: 'number',
          default: 0.8,
          description: 'Strength of prompt influence',
          required: false
        },
        {
          name: 'negative_prompt',
          type: 'string',
          default: '',
          description: 'Negative prompt for generation',
          required: false
        }
      ]
      
      const filtered = filterPromptParameters(params)
      // These should NOT be filtered out as they're not exact matches
      expect(filtered).toHaveLength(2)
      expect(filtered.find(p => p.name === 'prompt_strength')).toBeDefined()
      expect(filtered.find(p => p.name === 'negative_prompt')).toBeDefined()
    })
  })
})
