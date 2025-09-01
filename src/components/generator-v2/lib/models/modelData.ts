/**
 * Enhanced Model Data - Minu.AI Generator V2
 * Clean, comprehensive model definitions with Replicate schema integration
 */

import { ModelSchema, ModelParameter } from '../../types/models'

// Helper function to create model parameters from Replicate schemas
const createParameter = (
  name: string,
  type: 'string' | 'number' | 'boolean' | 'select' | 'file',
  required: boolean,
  defaultValue?: any,
  options?: any[],
  description?: string,
  order = 0
): ModelParameter => ({
  name,
  type,
  required,
  default: defaultValue,
  options,
  description: description || '',
  order
})

// FLUX.1 Schnell - Fast Image Generation (Priority Model #1)
const fluxSchnellModel: ModelSchema = {
  id: 'flux-schnell',
  name: 'FLUX.1 Schnell',
  description: 'The fastest image generation model tailored for local development and personal use',
  owner: 'black-forest-labs',
  replicateModel: 'black-forest-labs/flux-schnell',
  category: 'image-generation',
  supportedModes: ['images'],
  provider: 'Black Forest Labs',
  version: 'latest',
  
  parameters: [
    createParameter('prompt', 'string', true, '', [], 'Text description of what you want to generate', 0),
    createParameter('aspect_ratio', 'select', false, '1:1', 
      ['1:1', '16:9', '9:16', '4:3', '3:4', '3:2', '2:3', '4:5', '5:4', '21:9', '9:21', '2:1', '1:2'], 
      'Aspect ratio of the generated image', 1),
    createParameter('output_format', 'select', false, 'jpg', ['jpg', 'png'], 'Output format for the generated image', 2),
    createParameter('seed', 'number', false, undefined, [], 'Random seed for reproducible generation', 3)
  ],
  
  pricing: {
    costPerImage: 0.003,
    currency: 'USD'
  },
  
  capabilities: {
    supportsImageInput: false,
    supportsMultipleImages: false,
    maxImages: 1,
    supportedFormats: ['jpg', 'png'],
    maxResolution: '1024x1024',
    supportedAspectRatios: ['1:1', '16:9', '9:16', '4:3', '3:4', '3:2', '2:3', '4:5', '5:4', '21:9', '9:21', '2:1', '1:2']
  },
  
  performance: {
    speed: 'fast',
    averageTime: 2.0,
    reliability: 0.95
  },
  
  isActive: true,
  isPriority: true,
  tags: ['fast', 'image-generation', 'flux', 'popular'],
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z'
}

// FLUX.1.1 Pro Ultra - High Quality Images (Priority Model #2)
const fluxUltraModel: ModelSchema = {
  id: 'flux-ultra',
  name: 'FLUX.1.1 Pro Ultra',
  description: 'Ultra-high quality image generation with advanced features and superior detail',
  owner: 'black-forest-labs',
  replicateModel: 'black-forest-labs/flux-1.1-pro-ultra',
  category: 'image-generation',
  supportedModes: ['images'],
  provider: 'Black Forest Labs',
  version: 'latest',
  
  parameters: [
    createParameter('prompt', 'string', true, '', [], 'Text description of what you want to generate', 0),
    createParameter('aspect_ratio', 'select', false, '1:1', 
      ['1:1', '16:9', '9:16', '4:3', '3:4', '3:2', '2:3', '4:5', '5:4', '21:9', '9:21', '2:1', '1:2'], 
      'Aspect ratio of the generated image', 1),
    createParameter('output_format', 'select', false, 'jpg', ['jpg', 'png'], 'Output format for the generated image', 2),
    createParameter('safety_tolerance', 'number', false, 2, [], 'Safety tolerance (0-6, higher is more permissive)', 3),
    createParameter('seed', 'number', false, undefined, [], 'Random seed for reproducible generation', 4)
  ],
  
  pricing: {
    costPerImage: 0.075,
    currency: 'USD'
  },
  
  capabilities: {
    supportsImageInput: false,
    supportsMultipleImages: false,
    maxImages: 1,
    supportedFormats: ['jpg', 'png'],
    maxResolution: '2048x2048',
    supportedAspectRatios: ['1:1', '16:9', '9:16', '4:3', '3:4', '3:2', '2:3', '4:5', '5:4', '21:9', '9:21', '2:1', '1:2']
  },
  
  performance: {
    speed: 'medium',
    averageTime: 8.0,
    reliability: 0.98
  },
  
  isActive: true,
  isPriority: true,
  tags: ['high-quality', 'image-generation', 'flux', 'premium'],
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z'
}

// FLUX Kontext Pro - Context-Aware Generation (Priority Model #3)
const fluxKontextProModel: ModelSchema = {
  id: 'flux-kontext-pro',
  name: 'FLUX Kontext Pro',
  description: 'Context-aware image generation with input image support and advanced editing capabilities',
  owner: 'black-forest-labs',
  replicateModel: 'black-forest-labs/flux-kontext-pro',
  category: 'image-generation',
  supportedModes: ['images'],
  provider: 'Black Forest Labs',
  version: 'latest',
  
  parameters: [
    createParameter('prompt', 'string', true, '', [], 'Text description or editing instruction', 0),
    createParameter('input_image', 'file', false, undefined, [], 'Input image for reference or editing', 1),
    createParameter('aspect_ratio', 'select', false, 'match_input_image', 
      ['match_input_image', '1:1', '16:9', '9:16', '4:3', '3:4', '3:2', '2:3', '4:5', '5:4', '21:9', '9:21', '2:1', '1:2'], 
      'Aspect ratio of the generated image', 2),
    createParameter('prompt_upsampling', 'boolean', false, false, [], 'Automatic prompt improvement', 3),
    createParameter('seed', 'number', false, undefined, [], 'Random seed for reproducible generation', 4),
    createParameter('output_format', 'select', false, 'png', ['jpg', 'png'], 'Output format for the generated image', 5),
    createParameter('safety_tolerance', 'number', false, 2, [], 'Safety tolerance (0-6, max 2 with input images)', 6)
  ],
  
  pricing: {
    costPerImage: 0.05,
    currency: 'USD'
  },
  
  capabilities: {
    supportsImageInput: true,
    supportsMultipleImages: false,
    maxImages: 1,
    supportedFormats: ['jpg', 'png'],
    maxResolution: '2048x2048',
    supportedAspectRatios: ['match_input_image', '1:1', '16:9', '9:16', '4:3', '3:4', '3:2', '2:3', '4:5', '5:4', '21:9', '9:21', '2:1', '1:2']
  },
  
  performance: {
    speed: 'medium',
    averageTime: 12.0,
    reliability: 0.96
  },
  
  isActive: true,
  isPriority: true,
  tags: ['context-aware', 'image-editing', 'flux', 'advanced'],
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z'
}

// FLUX Kontext Max - Maximum Quality (Priority Model #4)
const fluxKontextMaxModel: ModelSchema = {
  id: 'flux-kontext-max',
  name: 'FLUX Kontext Max',
  description: 'Maximum quality context-aware image generation with the highest fidelity and detail',
  owner: 'black-forest-labs',
  replicateModel: 'black-forest-labs/flux-kontext-max',
  category: 'image-generation',
  supportedModes: ['images'],
  provider: 'Black Forest Labs',
  version: 'latest',
  
  parameters: [
    createParameter('prompt', 'string', true, '', [], 'Text description or editing instruction', 0),
    createParameter('input_image', 'file', false, undefined, [], 'Input image for reference or editing', 1),
    createParameter('aspect_ratio', 'select', false, 'match_input_image', 
      ['match_input_image', '1:1', '16:9', '9:16', '4:3', '3:4', '3:2', '2:3', '4:5', '5:4', '21:9', '9:21', '2:1', '1:2'], 
      'Aspect ratio of the generated image', 2),
    createParameter('prompt_upsampling', 'boolean', false, false, [], 'Automatic prompt improvement', 3),
    createParameter('seed', 'number', false, undefined, [], 'Random seed for reproducible generation', 4),
    createParameter('output_format', 'select', false, 'png', ['jpg', 'png'], 'Output format for the generated image', 5),
    createParameter('safety_tolerance', 'number', false, 2, [], 'Safety tolerance (0-6, max 2 with input images)', 6)
  ],
  
  pricing: {
    costPerImage: 0.12,
    currency: 'USD'
  },
  
  capabilities: {
    supportsImageInput: true,
    supportsMultipleImages: false,
    maxImages: 1,
    supportedFormats: ['jpg', 'png'],
    maxResolution: '4096x4096',
    supportedAspectRatios: ['match_input_image', '1:1', '16:9', '9:16', '4:3', '3:4', '3:2', '2:3', '4:5', '5:4', '21:9', '9:21', '2:1', '1:2']
  },
  
  performance: {
    speed: 'slow',
    averageTime: 20.0,
    reliability: 0.99
  },
  
  isActive: true,
  isPriority: true,
  tags: ['maximum-quality', 'context-aware', 'flux', 'premium'],
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z'
}

// Seedream 3 - Alternative Image Model (Priority Model #5)
const seedream3Model: ModelSchema = {
  id: 'seedream-3',
  name: 'Seedream 3',
  description: 'High-quality alternative image generation model with unique artistic style',
  owner: 'seedream',
  replicateModel: 'seedream/seedream-3',
  category: 'image-generation',
  supportedModes: ['images'],
  provider: 'Seedream',
  version: 'latest',
  
  parameters: [
    createParameter('prompt', 'string', true, '', [], 'Text description of what you want to generate', 0),
    createParameter('aspect_ratio', 'select', false, '1:1', 
      ['1:1', '16:9', '9:16', '4:3', '3:4'], 
      'Aspect ratio of the generated image', 1),
    createParameter('output_format', 'select', false, 'jpg', ['jpg', 'png'], 'Output format for the generated image', 2),
    createParameter('seed', 'number', false, undefined, [], 'Random seed for reproducible generation', 3)
  ],
  
  pricing: {
    costPerImage: 0.03,
    currency: 'USD'
  },
  
  capabilities: {
    supportsImageInput: false,
    supportsMultipleImages: false,
    maxImages: 1,
    supportedFormats: ['jpg', 'png'],
    maxResolution: '1024x1024',
    supportedAspectRatios: ['1:1', '16:9', '9:16', '4:3', '3:4']
  },
  
  performance: {
    speed: 'medium',
    averageTime: 6.0,
    reliability: 0.94
  },
  
  isActive: true,
  isPriority: true,
  tags: ['artistic', 'alternative', 'image-generation', 'creative'],
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z'
}

// Seedance 1 Lite - Video Generation (Additional Model #6)
const seedance1LiteModel: ModelSchema = {
  id: 'seedance-1-lite',
  name: 'Seedance 1 Lite',
  description: 'Fast video generation model with 720p output and flexible duration options',
  owner: 'bytedance',
  replicateModel: 'bytedance/seedance-1-lite',
  category: 'video-generation',
  supportedModes: ['video'],
  provider: 'ByteDance',
  version: 'latest',

  parameters: [
    createParameter('prompt', 'string', true, '', [], 'Text prompt for video generation', 0),
    createParameter('image', 'file', false, undefined, [], 'Input image for image-to-video generation', 1),
    createParameter('last_frame_image', 'file', false, undefined, [], 'Input image for last frame (requires start frame)', 2),
    createParameter('duration', 'select', false, 5, [5, 10], 'Video duration in seconds', 3),
    createParameter('resolution', 'select', false, '720p', ['480p', '720p'], 'Video resolution', 4),
    createParameter('aspect_ratio', 'select', false, '16:9',
      ['16:9', '4:3', '1:1', '3:4', '9:16', '21:9', '9:21'],
      'Video aspect ratio (ignored if image is used)', 5),
    createParameter('fps', 'select', false, 24, [24], 'Frame rate (frames per second)', 6),
    createParameter('camera_fixed', 'boolean', false, false, [], 'Whether to fix camera position', 7),
    createParameter('seed', 'number', false, undefined, [], 'Random seed for reproducible generation', 8)
  ],

  pricing: {
    costPerSecond: 0.02,
    currency: 'USD'
  },

  capabilities: {
    supportsImageInput: true,
    supportsMultipleImages: true,
    maxImages: 2,
    supportedFormats: ['mp4'],
    maxResolution: '1280x720',
    supportedAspectRatios: ['16:9', '4:3', '1:1', '3:4', '9:16', '21:9', '9:21']
  },

  performance: {
    speed: 'medium',
    averageTime: 45.0,
    reliability: 0.92
  },

  isActive: true,
  isPriority: false,
  tags: ['video-generation', 'image-to-video', 'bytedance', '720p'],
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z'
}

// Seedance 1 Pro - High Quality Video Generation (Additional Model #7)
const seedance1ProModel: ModelSchema = {
  id: 'seedance-1-pro',
  name: 'Seedance 1 Pro',
  description: 'Professional video generation model with 1080p output and enhanced quality',
  owner: 'bytedance',
  replicateModel: 'bytedance/seedance-1-pro',
  category: 'video-generation',
  supportedModes: ['video'],
  provider: 'ByteDance',
  version: 'latest',

  parameters: [
    createParameter('prompt', 'string', true, '', [], 'Text prompt for video generation', 0),
    createParameter('image', 'file', false, undefined, [], 'Input image for image-to-video generation', 1),
    createParameter('duration', 'select', false, 5, [5, 10], 'Video duration in seconds', 2),
    createParameter('resolution', 'select', false, '1080p', ['480p', '1080p'], 'Video resolution', 3),
    createParameter('aspect_ratio', 'select', false, '16:9',
      ['16:9', '4:3', '1:1', '3:4', '9:16', '21:9', '9:21'],
      'Video aspect ratio (ignored if image is used)', 4),
    createParameter('fps', 'select', false, 24, [24], 'Frame rate (frames per second)', 5),
    createParameter('camera_fixed', 'boolean', false, false, [], 'Whether to fix camera position', 6),
    createParameter('seed', 'number', false, undefined, [], 'Random seed for reproducible generation', 7)
  ],

  pricing: {
    costPerSecond: 0.05,
    currency: 'USD'
  },

  capabilities: {
    supportsImageInput: true,
    supportsMultipleImages: false,
    maxImages: 1,
    supportedFormats: ['mp4'],
    maxResolution: '1920x1080',
    supportedAspectRatios: ['16:9', '4:3', '1:1', '3:4', '9:16', '21:9', '9:21']
  },

  performance: {
    speed: 'slow',
    averageTime: 90.0,
    reliability: 0.95
  },

  isActive: true,
  isPriority: false,
  tags: ['video-generation', 'image-to-video', 'bytedance', '1080p', 'professional'],
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z'
}

// Google Gemini 2.5 Flash Image Generation - NEW MODEL
const gemini25FlashImageModel: ModelSchema = {
  id: 'gemini-2.5-flash-image',
  name: 'Gemini 2.5 Flash Image',
  description: 'Google\'s latest fast image generation model in Gemini 2.5',
  owner: 'google',
  replicateModel: 'google/gemini-2.5-flash-image',
  category: 'image-generation',
  supportedModes: ['images'],
  provider: 'Google',
  version: 'latest',

  parameters: [
    createParameter('prompt', 'string', true, '', [], 'Text description of the image you want to generate', 0),
    createParameter('output_format', 'select', false, 'jpg', ['jpg', 'png'], 'Format of the output image', 1)
  ],

  pricing: {
    costPerImage: 0.002,
    currency: 'USD'
  },

  capabilities: {
    supportsImageInput: false,
    supportsMultipleImages: false,
    maxImages: 1,
    supportedFormats: ['jpg', 'png'],
    maxResolution: '1024x1024',
    supportedAspectRatios: ['1:1', '16:9', '9:16', '4:3', '3:4', '3:2', '2:3', '4:5', '5:4', '21:9', '9:21', '2:1', '1:2']
  },

  performance: {
    speed: 'fast',
    averageTime: 8,
    reliability: 0.95
  },

  tags: ['fast', 'google', 'gemini', 'text-to-image', 'new'],
  isActive: true,
  isPriority: false,
  createdAt: '2025-08-26T00:00:00Z',
  updatedAt: '2025-08-26T00:00:00Z'
}

// Google Nano Banana - Image Editing Model - NEW MODEL
const nanoBananaModel: ModelSchema = {
  id: 'nano-banana',
  name: 'Nano Banana',
  description: 'Google\'s latest image editing model in Gemini 2.5 for transforming and editing images',
  owner: 'google',
  replicateModel: 'google/nano-banana',
  category: 'image-editing',
  supportedModes: ['images'],
  provider: 'Google',
  version: 'latest',

  parameters: [
    createParameter('prompt', 'string', true, '', [], 'Text description of the image transformation you want', 0),
    createParameter('image_input', 'file', false, undefined, [], 'Input images to transform or use as reference (supports multiple images)', 1),
    createParameter('output_format', 'select', false, 'jpg', ['jpg', 'png'], 'Format of the output image', 2)
  ],

  pricing: {
    costPerImage: 0.004,
    currency: 'USD'
  },

  capabilities: {
    supportsImageInput: true,
    supportsMultipleImages: true,
    maxImages: 3,
    supportedFormats: ['jpg', 'png'],
    maxResolution: '1024x1024',
    supportedAspectRatios: ['match_input_image', '1:1', '16:9', '9:16', '4:3', '3:4', '3:2', '2:3', '4:5', '5:4', '21:9', '9:21', '2:1', '1:2']
  },

  performance: {
    speed: 'medium',
    averageTime: 10,
    reliability: 0.92
  },

  tags: ['editing', 'google', 'gemini', 'image-to-image', 'new'],
  isActive: true,
  isPriority: false,
  createdAt: '2025-08-26T00:00:00Z',
  updatedAt: '2025-08-26T00:00:00Z'
}

// Real-ESRGAN - Image Enhancement/Upscaling - NEW MODEL
const realESRGANModel: ModelSchema = {
  id: 'real-esrgan',
  name: 'Real-ESRGAN',
  description: 'Fast and effective AI upscaler for enhancing image quality and fixing artifacts',
  owner: 'nightmareai',
  replicateModel: 'nightmareai/real-esrgan',
  category: 'image-enhancement',
  supportedModes: ['enhance'],
  provider: 'Nightmare AI',
  version: 'latest',

  parameters: [
    createParameter('image', 'file', true, undefined, [], 'Input image to upscale and enhance', 0),
    createParameter('scale', 'select', false, 2, [2, 4], 'Upscaling factor', 1),
    createParameter('face_enhance', 'boolean', false, false, [], 'Enable face enhancement for better face restoration', 2)
  ],

  pricing: {
    costPerImage: 0.001,
    currency: 'USD'
  },

  capabilities: {
    supportsImageInput: true,
    supportsMultipleImages: false,
    maxImages: 1,
    supportedFormats: ['jpg', 'png'],
    maxResolution: '4096x4096',
    supportedAspectRatios: ['match_input_image', '1:1', '16:9', '9:16', '4:3', '3:4', '3:2', '2:3', '4:5', '5:4', '21:9', '9:21', '2:1', '1:2']
  },

  performance: {
    speed: 'fast',
    averageTime: 3,
    reliability: 0.98
  },

  tags: ['upscaling', 'enhancement', 'fast', 'cheap', 'face-restoration'],
  isActive: true,
  isPriority: false,
  createdAt: '2025-08-26T00:00:00Z',
  updatedAt: '2025-08-26T00:00:00Z'
}

// Export the priority models array (5 main models)
export const PRIORITY_MODELS: ModelSchema[] = [
  fluxSchnellModel,
  fluxUltraModel,
  fluxKontextProModel,
  fluxKontextMaxModel,
  seedream3Model
]

// SwinIR - Advanced Image Super-Resolution - NEW MODEL
const swinIRModel: ModelSchema = {
  id: 'swinir',
  name: 'SwinIR',
  description: 'Advanced image super-resolution with excellent texture reproduction',
  owner: 'jingyunliang',
  replicateModel: 'jingyunliang/swinir',
  category: 'image-enhancement',
  supportedModes: ['enhance'],
  provider: 'Jingyun Liang',
  version: 'latest',

  parameters: [
    createParameter('image', 'file', true, undefined, [], 'Input image to enhance', 0),
    createParameter('task_type', 'select', false, 'Real-World Image Super-Resolution-Large',
      [
        'Real-World Image Super-Resolution-Large',
        'Real-World Image Super-Resolution-Medium',
        'Classical Image Super-Resolution',
        'Lightweight Image Super-Resolution',
        'Color Image Denoising',
        'JPEG Compression Artifact Reduction'
      ],
      'Type of enhancement task to perform', 1)
  ],

  pricing: {
    costPerImage: 0.002,
    currency: 'USD'
  },

  capabilities: {
    supportsImageInput: true,
    supportsMultipleImages: false,
    maxImages: 1,
    supportedFormats: ['jpg', 'png'],
    maxResolution: '4096x4096',
    supportedAspectRatios: ['match_input_image', '1:1', '16:9', '9:16', '4:3', '3:4', '3:2', '2:3', '4:5', '5:4', '21:9', '9:21', '2:1', '1:2']
  },

  performance: {
    speed: 'fast',
    averageTime: 5,
    reliability: 0.96
  },

  tags: ['super-resolution', 'enhancement', 'texture', 'denoising', 'artifact-reduction'],
  isActive: true,
  isPriority: false,
  createdAt: '2025-08-26T00:00:00Z',
  updatedAt: '2025-08-26T00:00:00Z'
}

// Ultimate SD Upscale - Diffusion-Based Upscaling - NEW MODEL
const ultimateSDUpscaleModel: ModelSchema = {
  id: 'ultimate-sd-upscale',
  name: 'Ultimate SD Upscale',
  description: 'State-of-the-art diffusion-based upscaling with hallucinated details',
  owner: 'fewjative',
  replicateModel: 'fewjative/ultimate-sd-upscale',
  category: 'image-enhancement',
  supportedModes: ['enhance'],
  provider: 'Fewjative',
  version: 'latest',

  parameters: [
    createParameter('image', 'file', true, undefined, [], 'Input image to upscale', 0),
    createParameter('positive_prompt', 'string', false, '', [], 'Positive prompt to guide the upscaling', 1),
    createParameter('negative_prompt', 'string', false, '', [], 'Negative prompt to avoid unwanted elements', 2),
    createParameter('upscale_by', 'select', false, 2, [2, 4], 'Upscaling factor', 3),
    createParameter('steps', 'number', false, 20, [], 'Number of denoising steps', 4),
    createParameter('denoise', 'number', false, 0.4, [], 'Denoising strength (0.0 to 1.0)', 5),
    createParameter('scheduler', 'select', false, 'karras', ['karras', 'normal'], 'Noise scheduler', 6),
    createParameter('upscaler', 'select', false, '4x-UltraSharp', ['4x-UltraSharp', 'ESRGAN_4x', 'RealESRGAN_x4plus'], 'Base upscaler model', 7)
  ],

  pricing: {
    costPerImage: 0.008,
    currency: 'USD'
  },

  capabilities: {
    supportsImageInput: true,
    supportsMultipleImages: false,
    maxImages: 1,
    supportedFormats: ['jpg', 'png'],
    maxResolution: '8192x8192',
    supportedAspectRatios: ['match_input_image', '1:1', '16:9', '9:16', '4:3', '3:4', '3:2', '2:3', '4:5', '5:4', '21:9', '9:21', '2:1', '1:2']
  },

  performance: {
    speed: 'slow',
    averageTime: 25,
    reliability: 0.94
  },

  tags: ['diffusion', 'upscaling', 'high-quality', 'detailed', 'slow'],
  isActive: true,
  isPriority: false,
  createdAt: '2025-08-26T00:00:00Z',
  updatedAt: '2025-08-26T00:00:00Z'
}

// New enhancement models
export const ENHANCEMENT_MODELS: ModelSchema[] = [
  realESRGANModel,
  swinIRModel,
  ultimateSDUpscaleModel
]

// New generation models
export const NEW_GENERATION_MODELS: ModelSchema[] = [
  gemini25FlashImageModel,
  nanoBananaModel
]

// Export all models array (12 total models)
export const ALL_MODELS: ModelSchema[] = [
  ...PRIORITY_MODELS,
  seedance1LiteModel,
  seedance1ProModel,
  ...NEW_GENERATION_MODELS,
  ...ENHANCEMENT_MODELS
]

// Export individual models for direct access
export {
  fluxSchnellModel,
  fluxUltraModel,
  fluxKontextProModel,
  fluxKontextMaxModel,
  seedream3Model,
  seedance1LiteModel,
  seedance1ProModel,
  // New models
  gemini25FlashImageModel,
  nanoBananaModel,
  realESRGANModel,
  swinIRModel,
  ultimateSDUpscaleModel
}
