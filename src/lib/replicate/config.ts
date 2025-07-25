/**
 * Replicate Configuration
 * Central configuration for Replicate API integration
 */

export const REPLICATE_CONFIG = {
  apiToken: process.env.NEXT_PUBLIC_REPLICATE_API_TOKEN || '',
  webhookUrl: process.env.REPLICATE_WEBHOOK_URL || '',
  baseUrl: 'https://api.replicate.com/v1',
  timeout: 60000, // 60 seconds
  retryAttempts: 3,
  retryDelay: 1000, // 1 second
}

export const MODEL_REGISTRY = {
  imageGeneration: {
    'flux-dev': {
      available: true,
      replicateModel: 'black-forest-labs/flux-dev',
      category: 'image-generation',
      pricing: { costPerImage: 0.055 },
      capabilities: {
        maxResolution: '1024x1024',
        features: ['text-to-image', 'high-quality']
      },
      performance: {
        averageTime: 15,
        quality: 'high'
      }
    },
    'flux-schnell': {
      available: true,
      replicateModel: 'black-forest-labs/flux-schnell',
      category: 'image-generation',
      pricing: { costPerImage: 0.003 },
      capabilities: {
        maxResolution: '1024x1024',
        features: ['text-to-image', 'fast-generation']
      },
      performance: {
        averageTime: 5,
        quality: 'medium'
      }
    },
    'flux-pro': {
      available: true,
      replicateModel: 'black-forest-labs/flux-1.1-pro',
      category: 'image-generation',
      pricing: { costPerImage: 0.055 },
      capabilities: {
        maxResolution: '2048x2048',
        features: ['text-to-image', 'professional-quality']
      },
      performance: {
        averageTime: 20,
        quality: 'very-high'
      }
    },
    'flux-ultra': {
      available: true,
      replicateModel: 'black-forest-labs/flux-1.1-ultra',
      category: 'image-generation',
      pricing: { costPerImage: 0.075 },
      capabilities: {
        maxResolution: '2048x2048',
        features: ['text-to-image', 'ultra-quality']
      },
      performance: {
        averageTime: 25,
        quality: 'ultra'
      }
    },
    'flux-kontext-pro': {
      available: true,
      replicateModel: 'fofr/flux-kontext-pro',
      category: 'image-generation',
      pricing: { costPerImage: 0.055 },
      capabilities: {
        maxResolution: '1024x1024',
        features: ['text-to-image', 'context-aware', 'multi-image']
      },
      performance: {
        averageTime: 18,
        quality: 'high'
      }
    },
    'flux-kontext-max': {
      available: true,
      replicateModel: 'fofr/flux-kontext-max',
      category: 'image-generation',
      pricing: { costPerImage: 0.055 },
      capabilities: {
        maxResolution: '1024x1024',
        features: ['text-to-image', 'context-aware', 'multi-image', 'enhanced']
      },
      performance: {
        averageTime: 25,
        quality: 'very-high'
      }
    },
    'seedream-3': {
      available: true,
      replicateModel: 'bytedance/seedream-3',
      category: 'image-generation',
      pricing: { costPerImage: 0.035 },
      capabilities: {
        maxResolution: '1024x1024',
        features: ['text-to-image', 'artistic-style']
      },
      performance: {
        averageTime: 12,
        quality: 'high'
      }
    }
  },
  videoGeneration: {
    'seedance-1-lite': {
      available: true,
      replicateModel: 'bytedance/seedance-1-lite',
      category: 'video-generation',
      pricing: { costPerSecond: 0.1 },
      capabilities: {
        maxResolution: '720p',
        features: ['image-to-video', 'multi-frame-input']
      },
      performance: {
        averageTime: 30,
        quality: 'medium'
      }
    },
    'seedance-1-pro': {
      available: true,
      replicateModel: 'bytedance/seedance-1-pro',
      category: 'video-generation',
      pricing: { costPerSecond: 0.2 },
      capabilities: {
        maxResolution: '1080p',
        features: ['image-to-video', 'single-frame-input', 'high-quality']
      },
      performance: {
        averageTime: 45,
        quality: 'high'
      }
    },
    'minimax-video-01': {
      available: true,
      replicateModel: 'minimax/video-01',
      category: 'video-generation',
      pricing: { costPerSecond: 0.15 },
      capabilities: {
        maxResolution: '1080p',
        features: ['text-to-video', 'long-duration']
      },
      performance: {
        averageTime: 60,
        quality: 'high'
      }
    }
  },
  upscaling: {
    'real-esrgan': {
      available: true,
      replicateModel: 'nightmareai/real-esrgan',
      category: 'upscaling',
      pricing: { costPerUpscale: 0.01 },
      capabilities: {
        maxResolution: '4096x4096',
        features: ['image-upscaling', '4x-enhancement']
      },
      performance: {
        averageTime: 10,
        quality: 'high'
      }
    },
    'esrgan': {
      available: true,
      replicateModel: 'xinntao/realesrgan',
      category: 'upscaling',
      pricing: { costPerUpscale: 0.01 },
      capabilities: {
        maxResolution: '4096x4096',
        features: ['image-upscaling', '2x-4x-enhancement']
      },
      performance: {
        averageTime: 8,
        quality: 'high'
      }
    }
  }
}

export const RECOMMENDED_MODELS = {
  images: ['flux-dev', 'flux-schnell', 'seedream-3'],
  video: ['seedance-1-pro', 'minimax-video-01'],
  enhance: ['real-esrgan', 'esrgan']
}

export const DEFAULT_GENERATION_PARAMS = {
  images: {
    num_outputs: 1,
    aspect_ratio: '1:1',
    guidance_scale: 3.5,
    num_inference_steps: 28,
    output_format: 'webp',
    output_quality: 80
  },
  video: {
    duration: 5,
    fps: 24,
    motion_strength: 0.8,
    camera_movement: 'auto'
  },
  enhance: {
    scale: 4,
    face_enhance: true,
    output_format: 'png'
  }
}

export const MODEL_LIMITS = {
  'flux-schnell': {
    num_inference_steps: { min: 1, max: 4, default: 4 },
    guidance_scale: null, // Not supported
  },
  'flux-dev': {
    num_inference_steps: { min: 1, max: 50, default: 28 },
    guidance_scale: { min: 0, max: 10, default: 3.5 },
  },
  'flux-pro': {
    num_inference_steps: { min: 10, max: 50, default: 30 },
    guidance_scale: { min: 1, max: 10, default: 3.5 },
  }
}

export const API_ENDPOINTS = {
  predictions: '/predictions',
  models: '/models',
  collections: '/collections',
  hardware: '/hardware'
}

export const WEBHOOK_EVENTS = {
  START: 'start',
  OUTPUT: 'output',
  LOGS: 'logs',
  COMPLETED: 'completed'
} as const

export const GENERATION_STATUSES = {
  STARTING: 'starting',
  PROCESSING: 'processing',
  SUCCEEDED: 'succeeded',
  FAILED: 'failed',
  CANCELED: 'canceled'
} as const

// Additional exports for compatibility
export const FLUX_MODELS = MODEL_REGISTRY.imageGeneration

export const MODEL_CATEGORIES = {
  Popular: ['flux-dev', 'flux-schnell', 'seedream-3', 'seedance-1-pro'],
  Fast: ['flux-schnell', 'seedance-1-lite'],
  HighQuality: ['flux-pro', 'flux-kontext-max', 'seedance-1-pro'],
  Affordable: ['flux-schnell', 'seedream-3', 'real-esrgan'],
  Professional: ['flux-pro', 'flux-kontext-pro', 'flux-kontext-max']
}

export const PRICING_TIERS = {
  basic: { costPerImage: 0.003 },
  standard: { costPerImage: 0.035 },
  premium: { costPerImage: 0.055 }
}
