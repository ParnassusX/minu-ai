/**
 * Clean Architecture Verification Test
 * Tests the unified upload and mode system architecture
 */

import { describe, it, expect, beforeEach } from '@jest/globals'
import { MODE_CONFIGS, GeneratorMode } from '@/lib/types/modes'
import { DEFAULT_UPLOAD_CONFIGS } from '@/lib/types/upload'

describe('Clean Architecture Verification', () => {
  describe('Mode System Consistency', () => {
    it('should have consistent mode definitions', () => {
      const modes: GeneratorMode[] = ['images', 'video', 'enhance']
      
      modes.forEach(mode => {
        expect(MODE_CONFIGS[mode]).toBeDefined()
        expect(MODE_CONFIGS[mode].id).toBe(mode)
        expect(MODE_CONFIGS[mode].name).toBe(mode)
        expect(MODE_CONFIGS[mode].displayName).toBeTruthy()
        expect(MODE_CONFIGS[mode].description).toBeTruthy()
        expect(MODE_CONFIGS[mode].supportedModels).toBeInstanceOf(Array)
        expect(MODE_CONFIGS[mode].supportedModels.length).toBeGreaterThan(0)
      })
    })

    it('should have correct upload requirements per mode', () => {
      // Images mode: no upload required
      expect(MODE_CONFIGS.images.requiresUpload).toBe(false)
      expect(MODE_CONFIGS.images.uploadConfig).toBeUndefined()

      // Video mode: optional upload
      expect(MODE_CONFIGS.video.requiresUpload).toBe(false)
      expect(MODE_CONFIGS.video.uploadConfig).toBeDefined()
      expect(MODE_CONFIGS.video.uploadConfig?.required).toBe(false)
      expect(MODE_CONFIGS.video.uploadConfig?.maxFiles).toBe(1)

      // Enhance mode: required upload
      expect(MODE_CONFIGS.enhance.requiresUpload).toBe(true)
      expect(MODE_CONFIGS.enhance.uploadConfig).toBeDefined()
      expect(MODE_CONFIGS.enhance.uploadConfig?.required).toBe(true)
      expect(MODE_CONFIGS.enhance.uploadConfig?.maxFiles).toBe(1)
    })

    it('should have valid supported models for each mode', () => {
      // Images mode models
      expect(MODE_CONFIGS.images.supportedModels).toContain('flux-dev')
      expect(MODE_CONFIGS.images.supportedModels).toContain('flux-schnell')
      expect(MODE_CONFIGS.images.supportedModels).toContain('flux-pro')

      // Video mode models
      expect(MODE_CONFIGS.video.supportedModels).toContain('minimax-video-01')
      expect(MODE_CONFIGS.video.supportedModels).toContain('runway-gen3-alpha')

      // Enhance mode models
      expect(MODE_CONFIGS.enhance.supportedModels).toContain('real-esrgan')
      expect(MODE_CONFIGS.enhance.supportedModels).toContain('esrgan')
    })
  })

  describe('Upload Configuration Consistency', () => {
    it('should have upload configs for modes that support uploads', () => {
      // Video mode should have upload config in DEFAULT_UPLOAD_CONFIGS
      expect(DEFAULT_UPLOAD_CONFIGS.video).toBeDefined()
      expect(DEFAULT_UPLOAD_CONFIGS.video.maxFiles).toBe(1)
      expect(DEFAULT_UPLOAD_CONFIGS.video.acceptedTypes).toContain('image/jpeg')
      expect(DEFAULT_UPLOAD_CONFIGS.video.acceptedTypes).toContain('image/png')
      expect(DEFAULT_UPLOAD_CONFIGS.video.acceptedTypes).toContain('image/webp')

      // Enhance mode should have upload config in DEFAULT_UPLOAD_CONFIGS
      expect(DEFAULT_UPLOAD_CONFIGS.enhance).toBeDefined()
      expect(DEFAULT_UPLOAD_CONFIGS.enhance.maxFiles).toBe(1)
      expect(DEFAULT_UPLOAD_CONFIGS.enhance.acceptedTypes).toContain('image/jpeg')
    })

    it('should have consistent file type support', () => {
      const supportedTypes = ['image/jpeg', 'image/png', 'image/webp']
      
      // Check video mode
      if (MODE_CONFIGS.video.uploadConfig) {
        supportedTypes.forEach(type => {
          expect(MODE_CONFIGS.video.uploadConfig?.acceptedTypes).toContain(type)
        })
      }

      // Check enhance mode
      if (MODE_CONFIGS.enhance.uploadConfig) {
        supportedTypes.forEach(type => {
          expect(MODE_CONFIGS.enhance.uploadConfig?.acceptedTypes).toContain(type)
        })
      }
    })
  })

  describe('Architecture Integrity', () => {
    it('should not have any references to old "edit" mode', () => {
      const modeKeys = Object.keys(MODE_CONFIGS)
      expect(modeKeys).not.toContain('edit')
      
      // Verify only the correct three modes exist
      expect(modeKeys).toEqual(['images', 'video', 'enhance'])
    })

    it('should have proper default parameters for each mode', () => {
      // Images mode
      expect(MODE_CONFIGS.images.defaultParameters.numOutputs).toBe(1)
      expect(MODE_CONFIGS.images.defaultParameters.aspectRatio).toBe('1:1')

      // Video mode
      expect(MODE_CONFIGS.video.defaultParameters.aspectRatio).toBe('16:9')
      expect(MODE_CONFIGS.video.defaultParameters.duration).toBe(5)
      expect(MODE_CONFIGS.video.defaultParameters.fps).toBe(24)

      // Enhance mode
      expect(MODE_CONFIGS.enhance.defaultParameters.scale).toBe(4)
      expect(MODE_CONFIGS.enhance.defaultParameters.faceEnhance).toBe(true)
    })

    it('should have meaningful suggested prompts for each mode', () => {
      Object.values(MODE_CONFIGS).forEach(config => {
        expect(config.suggestedPrompts).toBeInstanceOf(Array)
        expect(config.suggestedPrompts.length).toBeGreaterThan(0)
        config.suggestedPrompts.forEach(prompt => {
          expect(typeof prompt).toBe('string')
          expect(prompt.length).toBeGreaterThan(0)
        })
      })
    })
  })

  describe('Single Source of Truth Verification', () => {
    it('should use MODE_CONFIGS as the authoritative source for upload requirements', () => {
      // This test verifies that the logic is consistent
      // In the actual implementation, useModeUploadRequirements should use MODE_CONFIGS
      
      const getUploadRequirement = (mode: GeneratorMode) => {
        const modeConfig = MODE_CONFIGS[mode]
        return {
          isRequired: modeConfig.requiresUpload || false,
          isOptional: modeConfig.uploadConfig ? !modeConfig.uploadConfig.required : false,
          maxFiles: modeConfig.uploadConfig?.maxFiles || 0
        }
      }

      // Test images mode
      const imagesReq = getUploadRequirement('images')
      expect(imagesReq.isRequired).toBe(false)
      expect(imagesReq.isOptional).toBe(false)
      expect(imagesReq.maxFiles).toBe(0)

      // Test video mode
      const videoReq = getUploadRequirement('video')
      expect(videoReq.isRequired).toBe(false)
      expect(videoReq.isOptional).toBe(true)
      expect(videoReq.maxFiles).toBe(1)

      // Test enhance mode
      const enhanceReq = getUploadRequirement('enhance')
      expect(enhanceReq.isRequired).toBe(true)
      expect(enhanceReq.isOptional).toBe(false)
      expect(enhanceReq.maxFiles).toBe(1)
    })
  })
})
