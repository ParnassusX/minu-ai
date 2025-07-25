/**
 * Test Suite for Image Storage Service
 * 
 * Tests the multi-provider image storage system:
 * - Cloudinary integration
 * - Supabase fallback
 * - Direct URL handling
 * - Error handling and fallbacks
 */

import { describe, it, expect, beforeEach, jest, afterEach } from '@jest/globals'
import { ImageStorageService, StorageConfig, StorageResult } from '@/lib/storage/imageStorage'

// Mock fetch globally
global.fetch = jest.fn()

describe('ImageStorageService', () => {
  let storageService: ImageStorageService
  let mockFetch: jest.MockedFunction<typeof fetch>

  beforeEach(() => {
    mockFetch = global.fetch as jest.MockedFunction<typeof fetch>
    mockFetch.mockClear()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('Cloudinary Storage', () => {
    beforeEach(() => {
      const config: StorageConfig = {
        provider: 'cloudinary',
        cloudinary: {
          cloudName: 'test-cloud',
          apiKey: 'test-key',
          apiSecret: 'test-secret'
        }
      }
      storageService = new ImageStorageService(config)
    })

    it('should store image with Cloudinary successfully', async () => {
      const mockCloudinaryResponse = {
        public_id: 'test-image-123',
        secure_url: 'https://res.cloudinary.com/test-cloud/image/upload/test-image-123.jpg',
        width: 1024,
        height: 1024,
        format: 'jpg',
        bytes: 150000
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCloudinaryResponse
      } as Response)

      const result = await storageService.storeImage('https://example.com/test.jpg', {
        filename: 'test-image',
        quality: 95,
        format: 'auto'
      })

      expect(result.success).toBe(true)
      expect(result.data).toEqual({
        id: 'test-image-123',
        originalUrl: 'https://example.com/test.jpg',
        storedUrl: 'https://res.cloudinary.com/test-cloud/image/upload/test-image-123.jpg',
        provider: 'cloudinary',
        metadata: {
          width: 1024,
          height: 1024,
          format: 'jpg',
          size: 150000,
          quality: 95
        },
        createdAt: expect.any(Date)
      })
    })

    it('should handle Cloudinary upload failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Bad Request'
      } as Response)

      const result = await storageService.storeImage('https://example.com/test.jpg')

      expect(result.success).toBe(false)
      expect(result.error).toContain('Cloudinary upload failed')
    })

    it('should generate optimized URLs with transformations', () => {
      const storedImage = {
        id: 'test-image-123',
        originalUrl: 'https://example.com/test.jpg',
        storedUrl: 'https://res.cloudinary.com/test-cloud/image/upload/test-image-123.jpg',
        provider: 'cloudinary' as const,
        metadata: {},
        createdAt: new Date()
      }

      const optimizedUrl = storageService.getOptimizedUrl(storedImage, {
        width: 800,
        height: 600,
        quality: 80,
        format: 'webp'
      })

      expect(optimizedUrl).toBe(
        'https://res.cloudinary.com/test-cloud/image/upload/w_800,h_600,q_80,f_webp/test-image-123'
      )
    })
  })

  describe('Supabase Storage', () => {
    beforeEach(() => {
      const config: StorageConfig = {
        provider: 'supabase',
        supabase: {
          url: 'https://test.supabase.co',
          anonKey: 'test-anon-key',
          bucket: 'test-bucket'
        }
      }
      storageService = new ImageStorageService(config)
    })

    it('should store image with Supabase successfully', async () => {
      // Mock image download
      const mockImageBuffer = new ArrayBuffer(100000)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        arrayBuffer: async () => mockImageBuffer
      } as Response)

      // Mock Supabase client methods
      const mockUpload = jest.fn().mockResolvedValue({
        data: { path: 'test-image.jpg' },
        error: null
      })
      const mockGetPublicUrl = jest.fn().mockReturnValue({
        data: { publicUrl: 'https://test.supabase.co/storage/v1/object/public/test-bucket/test-image.jpg' }
      })

      // Mock the Supabase client
      storageService['supabaseClient'] = {
        storage: {
          from: () => ({
            upload: mockUpload,
            getPublicUrl: mockGetPublicUrl
          })
        }
      }

      const result = await storageService.storeImage('https://example.com/test.jpg', {
        filename: 'test-image'
      })

      expect(result.success).toBe(true)
      expect(result.data?.provider).toBe('supabase')
      expect(result.data?.storedUrl).toContain('supabase.co')
    })

    it('should handle Supabase upload failure', async () => {
      // Mock image download
      mockFetch.mockResolvedValueOnce({
        ok: true,
        arrayBuffer: async () => new ArrayBuffer(100000)
      } as Response)

      // Mock Supabase upload failure
      const mockUpload = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Upload failed' }
      })

      storageService['supabaseClient'] = {
        storage: {
          from: () => ({
            upload: mockUpload
          })
        }
      }

      const result = await storageService.storeImage('https://example.com/test.jpg')

      expect(result.success).toBe(false)
      expect(result.error).toContain('Supabase upload failed')
    })
  })

  describe('Direct URL Storage', () => {
    beforeEach(() => {
      const config: StorageConfig = {
        provider: 'direct'
      }
      storageService = new ImageStorageService(config)
    })

    it('should handle direct URL storage', async () => {
      const result = await storageService.storeImage('https://example.com/test.jpg')

      expect(result.success).toBe(true)
      expect(result.data).toEqual({
        id: expect.stringMatching(/^direct-\d+$/),
        originalUrl: 'https://example.com/test.jpg',
        storedUrl: 'https://example.com/test.jpg',
        provider: 'direct',
        metadata: {},
        createdAt: expect.any(Date)
      })
    })

    it('should return original URL for optimized requests', () => {
      const storedImage = {
        id: 'direct-123',
        originalUrl: 'https://example.com/test.jpg',
        storedUrl: 'https://example.com/test.jpg',
        provider: 'direct' as const,
        metadata: {},
        createdAt: new Date()
      }

      const optimizedUrl = storageService.getOptimizedUrl(storedImage, {
        width: 800,
        height: 600
      })

      expect(optimizedUrl).toBe('https://example.com/test.jpg')
    })
  })

  describe('Fallback Mechanism', () => {
    it('should fallback from Cloudinary to Supabase on failure', async () => {
      const config: StorageConfig = {
        provider: 'cloudinary',
        cloudinary: {
          cloudName: 'test-cloud',
          apiKey: 'test-key',
          apiSecret: 'test-secret'
        },
        supabase: {
          url: 'https://test.supabase.co',
          anonKey: 'test-anon-key',
          bucket: 'test-bucket'
        }
      }
      storageService = new ImageStorageService(config)

      // Mock Cloudinary failure
      mockFetch.mockRejectedValueOnce(new Error('Cloudinary error'))

      // Mock successful image download for Supabase
      mockFetch.mockResolvedValueOnce({
        ok: true,
        arrayBuffer: async () => new ArrayBuffer(100000)
      } as Response)

      // Mock successful Supabase upload
      const mockUpload = jest.fn().mockResolvedValue({
        data: { path: 'fallback-image.jpg' },
        error: null
      })
      const mockGetPublicUrl = jest.fn().mockReturnValue({
        data: { publicUrl: 'https://test.supabase.co/storage/v1/object/public/test-bucket/fallback-image.jpg' }
      })

      storageService['supabaseClient'] = {
        storage: {
          from: () => ({
            upload: mockUpload,
            getPublicUrl: mockGetPublicUrl
          })
        }
      }

      const result = await storageService.storeImage('https://example.com/test.jpg')

      expect(result.success).toBe(true)
      expect(result.data?.provider).toBe('supabase')
    })
  })

  describe('Error Handling', () => {
    beforeEach(() => {
      const config: StorageConfig = {
        provider: 'cloudinary',
        cloudinary: {
          cloudName: 'test-cloud',
          apiKey: 'test-key',
          apiSecret: 'test-secret'
        }
      }
      storageService = new ImageStorageService(config)
    })

    it('should handle network errors gracefully', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'))

      const result = await storageService.storeImage('https://example.com/test.jpg')

      expect(result.success).toBe(false)
      expect(result.error).toContain('Network error')
    })

    it('should handle invalid URLs', async () => {
      const result = await storageService.storeImage('invalid-url')

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })
  })

  describe('Image Deletion', () => {
    beforeEach(() => {
      const config: StorageConfig = {
        provider: 'cloudinary',
        cloudinary: {
          cloudName: 'test-cloud',
          apiKey: 'test-key',
          apiSecret: 'test-secret'
        }
      }
      storageService = new ImageStorageService(config)
    })

    it('should delete Cloudinary images successfully', async () => {
      const storedImage = {
        id: 'test-image-123',
        originalUrl: 'https://example.com/test.jpg',
        storedUrl: 'https://res.cloudinary.com/test-cloud/image/upload/test-image-123.jpg',
        provider: 'cloudinary' as const,
        metadata: {},
        createdAt: new Date()
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ result: 'ok' })
      } as Response)

      const result = await storageService.deleteImage(storedImage)

      expect(result).toBe(true)
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.cloudinary.com/v1_1/test-cloud/image/destroy',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        })
      )
    })

    it('should handle direct URL deletion', async () => {
      const storedImage = {
        id: 'direct-123',
        originalUrl: 'https://example.com/test.jpg',
        storedUrl: 'https://example.com/test.jpg',
        provider: 'direct' as const,
        metadata: {},
        createdAt: new Date()
      }

      const result = await storageService.deleteImage(storedImage)

      expect(result).toBe(true) // Direct URLs don't need deletion
    })
  })
})
