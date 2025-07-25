/**
 * Integration Test Suite for FLUX Kontext Models
 * 
 * Tests end-to-end workflows for:
 * - Multi-Image Kontext Pro generation
 * - Portrait Series generation
 * - Image storage integration
 * - Gallery integration
 */

import { describe, it, expect, beforeEach, jest, afterEach } from '@jest/globals'
import { ReplicateClient } from '@/lib/replicate/client'
import { FluxGenerationParams } from '@/lib/replicate/types'
import { createImageStorageService } from '@/lib/storage/imageStorage'

// Mock environment variables
process.env.REPLICATE_API_TOKEN = 'test-token'
process.env.CLOUDINARY_CLOUD_NAME = 'test-cloud'
process.env.CLOUDINARY_API_KEY = 'test-key'
process.env.CLOUDINARY_API_SECRET = 'test-secret'

// Mock external dependencies
jest.mock('replicate')
jest.mock('@supabase/supabase-js')

global.fetch = jest.fn()

describe('FLUX Kontext Integration Tests', () => {
  let replicateClient: ReplicateClient
  let mockFetch: jest.MockedFunction<typeof fetch>

  beforeEach(() => {
    replicateClient = new ReplicateClient()
    mockFetch = global.fetch as jest.MockedFunction<typeof fetch>
    mockFetch.mockClear()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('Multi-Image Kontext Pro End-to-End', () => {
    it('should complete full generation workflow with dual images', async () => {
      // Mock Replicate API response
      const mockReplicateResponse = [
        'https://replicate.delivery/pbxt/result1.jpg',
        'https://replicate.delivery/pbxt/result2.jpg'
      ]

      // Mock Cloudinary storage response
      const mockCloudinaryResponse = {
        public_id: 'minu-ai-multi-image-123',
        secure_url: 'https://res.cloudinary.com/test-cloud/image/upload/minu-ai-multi-image-123.jpg',
        width: 1920,
        height: 1080,
        format: 'jpg',
        bytes: 250000
      }

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockCloudinaryResponse
      } as Response)

      // Mock Replicate client
      const mockRun = jest.fn().mockResolvedValue(mockReplicateResponse)
      replicateClient['client'] = { run: mockRun } as any

      const params: FluxGenerationParams = {
        prompt: 'Combine a sunset landscape with a portrait photo',
        inputImage1: 'https://example.com/landscape.jpg',
        inputImage2: 'https://example.com/portrait.jpg',
        aspectRatio: '16:9',
        safetyTolerance: 1
      }

      const results = await replicateClient.generateImage('flux-multi-image-kontext-pro', params)

      // Verify Replicate API call
      expect(mockRun).toHaveBeenCalledWith(
        'flux-kontext-apps/multi-image-kontext-pro',
        expect.objectContaining({
          input: expect.objectContaining({
            prompt: 'Combine a sunset landscape with a portrait photo',
            input_image_1: 'https://example.com/landscape.jpg',
            input_image_2: 'https://example.com/portrait.jpg',
            aspect_ratio: '16:9',
            safety_tolerance: 1
          })
        })
      )

      // Verify results structure
      expect(results).toHaveLength(2)
      expect(results[0]).toMatchObject({
        id: expect.any(String),
        url: expect.stringContaining('cloudinary.com'),
        prompt: 'Combine a sunset landscape with a portrait photo',
        model: 'flux-multi-image-kontext-pro',
        timestamp: expect.any(Date),
        metadata: expect.objectContaining({
          storageProvider: 'cloudinary',
          originalUrl: 'https://replicate.delivery/pbxt/result1.jpg',
          optimized: true
        })
      })
    })

    it('should validate dual image requirement', async () => {
      const params: FluxGenerationParams = {
        prompt: 'Test prompt',
        inputImage1: 'https://example.com/image1.jpg'
        // Missing inputImage2
      }

      await expect(
        replicateClient.generateImage('flux-multi-image-kontext-pro', params)
      ).rejects.toThrow('Multi-Image Kontext Pro requires both inputImage1 and inputImage2')
    })

    it('should handle aspect ratio validation', async () => {
      const params: FluxGenerationParams = {
        prompt: 'Test prompt',
        inputImage1: 'https://example.com/image1.jpg',
        inputImage2: 'https://example.com/image2.jpg',
        aspectRatio: 'invalid-ratio' as any
      }

      await expect(
        replicateClient.generateImage('flux-multi-image-kontext-pro', params)
      ).rejects.toThrow('Invalid aspect ratio')
    })
  })

  describe('Portrait Series End-to-End', () => {
    it('should complete full generation workflow with multiple outputs', async () => {
      // Mock Replicate API response with multiple images
      const mockReplicateResponse = [
        'https://replicate.delivery/pbxt/portrait1.jpg',
        'https://replicate.delivery/pbxt/portrait2.jpg',
        'https://replicate.delivery/pbxt/portrait3.jpg',
        'https://replicate.delivery/pbxt/portrait4.jpg'
      ]

      // Mock Cloudinary storage responses
      mockFetch.mockImplementation(async (url) => {
        if (typeof url === 'string' && url.includes('cloudinary.com')) {
          return {
            ok: true,
            json: async () => ({
              public_id: `minu-ai-portrait-${Math.random().toString(36).substr(2, 9)}`,
              secure_url: `https://res.cloudinary.com/test-cloud/image/upload/portrait-${Date.now()}.jpg`,
              width: 1024,
              height: 1024,
              format: 'jpg',
              bytes: 180000
            })
          } as Response
        }
        return { ok: false } as Response
      })

      // Mock Replicate client
      const mockRun = jest.fn().mockResolvedValue(mockReplicateResponse)
      replicateClient['client'] = { run: mockRun } as any

      const params: FluxGenerationParams = {
        prompt: 'Generate professional portrait variations',
        inputImage: 'https://example.com/original-portrait.jpg',
        numImages: 4,
        background: 'white',
        randomizeImages: true,
        safetyTolerance: 2
      }

      const results = await replicateClient.generateImage('flux-portrait-series', params)

      // Verify Replicate API call
      expect(mockRun).toHaveBeenCalledWith(
        'flux-kontext-apps/portrait-series',
        expect.objectContaining({
          input: expect.objectContaining({
            prompt: 'Generate professional portrait variations',
            input_image: 'https://example.com/original-portrait.jpg',
            num_images: 4,
            background: 'white',
            randomize_images: true,
            safety_tolerance: 2
          })
        })
      )

      // Verify results structure
      expect(results).toHaveLength(4)
      results.forEach((result, index) => {
        expect(result).toMatchObject({
          id: expect.any(String),
          url: expect.stringContaining('cloudinary.com'),
          prompt: 'Generate professional portrait variations',
          model: 'flux-portrait-series',
          timestamp: expect.any(Date),
          metadata: expect.objectContaining({
            storageProvider: 'cloudinary',
            originalUrl: `https://replicate.delivery/pbxt/portrait${index + 1}.jpg`,
            optimized: true
          })
        })
      })
    })

    it('should validate single image requirement', async () => {
      const params: FluxGenerationParams = {
        prompt: 'Test prompt',
        numImages: 4
        // Missing inputImage
      }

      await expect(
        replicateClient.generateImage('flux-portrait-series', params)
      ).rejects.toThrow('Portrait Series requires inputImage')
    })

    it('should validate number of images range', async () => {
      const params: FluxGenerationParams = {
        prompt: 'Test prompt',
        inputImage: 'https://example.com/portrait.jpg',
        numImages: 15 // Exceeds maximum of 13
      }

      await expect(
        replicateClient.generateImage('flux-portrait-series', params)
      ).rejects.toThrow('Number of images must be between 1 and 13')
    })

    it('should validate background options', async () => {
      const params: FluxGenerationParams = {
        prompt: 'Test prompt',
        inputImage: 'https://example.com/portrait.jpg',
        background: 'invalid-background' as any
      }

      await expect(
        replicateClient.generateImage('flux-portrait-series', params)
      ).rejects.toThrow('Invalid background option')
    })
  })

  describe('Storage Integration', () => {
    it('should fallback to Supabase when Cloudinary fails', async () => {
      // Mock Replicate response
      const mockReplicateResponse = ['https://replicate.delivery/pbxt/test.jpg']
      const mockRun = jest.fn().mockResolvedValue(mockReplicateResponse)
      replicateClient['client'] = { run: mockRun } as any

      // Mock Cloudinary failure, then Supabase success
      mockFetch
        .mockRejectedValueOnce(new Error('Cloudinary error'))
        .mockResolvedValueOnce({
          ok: true,
          arrayBuffer: async () => new ArrayBuffer(100000)
        } as Response)

      // Mock Supabase client
      const mockUpload = jest.fn().mockResolvedValue({
        data: { path: 'fallback-image.jpg' },
        error: null
      })
      const mockGetPublicUrl = jest.fn().mockReturnValue({
        data: { publicUrl: 'https://test.supabase.co/storage/v1/object/public/test-bucket/fallback-image.jpg' }
      })

      replicateClient['imageStorage']['supabaseClient'] = {
        storage: {
          from: () => ({
            upload: mockUpload,
            getPublicUrl: mockGetPublicUrl
          })
        }
      }

      const params: FluxGenerationParams = {
        prompt: 'Test prompt',
        inputImage: 'https://example.com/test.jpg'
      }

      const results = await replicateClient.generateImage('flux-portrait-series', params)

      expect(results[0].metadata.storageProvider).toBe('supabase')
      expect(results[0].url).toContain('supabase.co')
    })

    it('should use direct URLs when all storage providers fail', async () => {
      // Mock Replicate response
      const mockReplicateResponse = ['https://replicate.delivery/pbxt/test.jpg']
      const mockRun = jest.fn().mockResolvedValue(mockReplicateResponse)
      replicateClient['client'] = { run: mockRun } as any

      // Mock all storage failures
      mockFetch.mockRejectedValue(new Error('Storage error'))

      const params: FluxGenerationParams = {
        prompt: 'Test prompt',
        inputImage: 'https://example.com/test.jpg'
      }

      const results = await replicateClient.generateImage('flux-portrait-series', params)

      expect(results[0].metadata.storageProvider).toBe('direct')
      expect(results[0].url).toBe('https://replicate.delivery/pbxt/test.jpg')
    })
  })

  describe('Cost Calculation', () => {
    it('should calculate costs correctly for multi-image generation', async () => {
      const mockReplicateResponse = ['https://replicate.delivery/pbxt/result.jpg']
      const mockRun = jest.fn().mockResolvedValue(mockReplicateResponse)
      replicateClient['client'] = { run: mockRun } as any

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          public_id: 'test',
          secure_url: 'https://res.cloudinary.com/test-cloud/image/upload/test.jpg',
          width: 1024,
          height: 1024,
          format: 'jpg',
          bytes: 150000
        })
      } as Response)

      const params: FluxGenerationParams = {
        prompt: 'Test prompt',
        inputImage1: 'https://example.com/image1.jpg',
        inputImage2: 'https://example.com/image2.jpg'
      }

      const results = await replicateClient.generateImage('flux-multi-image-kontext-pro', params)

      expect(results[0].metadata.cost).toBe(0.045) // Cost per image for Multi-Image Kontext Pro
    })

    it('should calculate costs correctly for portrait series', async () => {
      const mockReplicateResponse = [
        'https://replicate.delivery/pbxt/portrait1.jpg',
        'https://replicate.delivery/pbxt/portrait2.jpg',
        'https://replicate.delivery/pbxt/portrait3.jpg'
      ]
      const mockRun = jest.fn().mockResolvedValue(mockReplicateResponse)
      replicateClient['client'] = { run: mockRun } as any

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          public_id: 'test',
          secure_url: 'https://res.cloudinary.com/test-cloud/image/upload/test.jpg',
          width: 1024,
          height: 1024,
          format: 'jpg',
          bytes: 150000
        })
      } as Response)

      const params: FluxGenerationParams = {
        prompt: 'Test prompt',
        inputImage: 'https://example.com/portrait.jpg',
        numImages: 3
      }

      const results = await replicateClient.generateImage('flux-portrait-series', params)

      // Total cost should be divided among all generated images
      const totalCost = results.reduce((sum, result) => sum + result.metadata.cost, 0)
      expect(totalCost).toBeCloseTo(0.045, 3) // Total cost for Portrait Series
    })
  })
})
