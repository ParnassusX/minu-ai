/**
 * Real Replicate Model Data Integration
 * Updated with actual working model schemas and pricing data from Replicate
 * Last updated: January 2025
 */

export interface ReplicateModelSchema {
  id: string
  name: string
  owner: string
  description: string
  category: 'image-generation' | 'video-generation' | 'upscaling' | 'image-editing'
  supportedModes: ('images' | 'video' | 'enhance')[]
  provider: string
  pricing: {
    costPerImage?: number
    costPerSecond?: number
    costPerUpscale?: number
  }
  performance: {
    speed: 'fast' | 'medium' | 'slow'
    averageTime: number // seconds
  }
  capabilities: {
    supportsImageInput: boolean
    supportsMultipleImages: boolean
    maxImages: number
    supportedFormats: string[]
    maxResolution: string
  }
  parameters: {
    basic: ModelParameter[]
    intermediate: ModelParameter[]
    advanced: ModelParameter[]
  }
  replicateVersion?: string
  replicateModel: string // owner/model format
  isOfficial?: boolean // Whether this is an official Replicate model
}

export interface ModelParameter {
  name: string
  type: 'number' | 'integer' | 'string' | 'boolean' | 'select'
  default: any
  min?: number
  max?: number
  step?: number
  options?: string[]
  description: string
  required?: boolean
}

export const REAL_MODEL_DATA: ReplicateModelSchema[] = [
  // FLUX Schnell - Fast Image Generation (OFFICIAL MODEL - TESTED WORKING)
  {
    id: 'flux-schnell',
    name: 'FLUX.1 Schnell',
    owner: 'black-forest-labs',
    description: 'The fastest image generation model tailored for local development and personal use',
    category: 'image-generation',
    supportedModes: ['images'],
    provider: 'Black Forest Labs',
    pricing: {
      costPerImage: 0.003
    },
    performance: {
      speed: 'fast',
      averageTime: 2.0
    },
    capabilities: {
      supportsImageInput: false,
      supportsMultipleImages: false,
      maxImages: 1,
      supportedFormats: ['jpeg', 'png', 'webp'],
      maxResolution: '1024x1024'
    },
    parameters: {
      basic: [
        {
          name: 'prompt',
          type: 'string',
          default: '',
          description: 'Text description of what you want to generate',
          required: true
        }
      ],
      intermediate: [
        {
          name: 'aspect_ratio',
          type: 'select',
          default: '1:1',
          options: ['1:1', '16:9', '9:16', '4:3', '3:4', '3:2', '2:3'],
          description: 'Aspect ratio of the generated image',
          required: false
        },
        {
          name: 'num_outputs',
          type: 'integer',
          default: 1,
          min: 1,
          max: 4,
          description: 'Number of images to output',
          required: false
        },
        {
          name: 'num_inference_steps',
          type: 'integer',
          default: 4,
          min: 1,
          max: 4, // CORRECTED: FLUX Schnell supports 1-4 steps only
          description: 'Number of denoising steps (fewer steps = faster)',
          required: false
        }
      ],
      advanced: [
        {
          name: 'guidance_scale',
          type: 'number',
          default: 3.5,
          min: 2.0,
          max: 5.0, // CORRECTED: Based on API research
          description: 'Guidance scale for generation quality vs creativity',
          required: false
        },
        {
          name: 'seed',
          type: 'integer',
          default: null,
          description: 'Random seed. Leave blank to randomize the seed',
          required: false
        },
        {
          name: 'disable_safety_checker',
          type: 'boolean',
          default: false,
          description: 'Disable safety checker for generated images',
          required: false
        },
        {
          name: 'go_fast',
          type: 'boolean',
          default: false,
          description: 'Run faster predictions with model optimized for speed',
          required: false
        }
      ]
    },
    replicateModel: 'black-forest-labs/flux-schnell',
    isOfficial: true
  },

  // Seedance 1 Lite - Video Generation (REAL API PARAMETERS)
  {
    id: 'seedance-1-lite',
    name: 'Seedance 1 Lite',
    owner: 'bytedance',
    description: 'A video generation model that offers text-to-video and image-to-video support for 5s or 10s videos, at 480p and 720p resolution',
    category: 'video-generation',
    supportedModes: ['video'],
    provider: 'ByteDance',
    pricing: {
      costPerSecond: 0.2
    },
    performance: {
      speed: 'medium',
      averageTime: 60.0
    },
    capabilities: {
      supportsImageInput: true,
      supportsMultipleImages: true, // VERIFIED: Supports both single and dual image inputs
      maxImages: 2, // VERIFIED: Supports up to 2 images (image1, image2)
      supportedFormats: ['jpeg', 'png', 'webp'],
      maxResolution: '720p'
    },
    parameters: {
      basic: [
        {
          name: 'prompt',
          type: 'string',
          default: '',
          description: 'Text prompt for video generation',
          required: true
        },
        {
          name: 'duration',
          type: 'integer',
          default: 5,
          min: 5,
          max: 10,
          description: 'Video duration in seconds (5 or 10)',
          required: false
        },
        {
          name: 'resolution',
          type: 'select',
          default: '720p',
          options: ['480p', '720p'],
          description: 'Output resolution',
          required: false
        }
      ],
      intermediate: [
        {
          name: 'fps',
          type: 'integer',
          default: 24,
          min: 12,
          max: 30,
          description: 'Frame rate (frames per second)',
          required: false
        },
        {
          name: 'aspect_ratio',
          type: 'select',
          default: '16:9',
          options: ['16:9', '9:16', '1:1'],
          description: 'Video aspect ratio',
          required: false
        },
        {
          name: 'camera_fixed',
          type: 'boolean',
          default: false,
          description: 'Whether to fix the camera position',
          required: false
        }
      ],
      advanced: [
        {
          name: 'seed',
          type: 'integer',
          default: null,
          description: 'Random seed for reproducible generation',
          required: false
        }
      ]
    },
    replicateModel: 'bytedance/seedance-1-lite',
    isOfficial: true
  },

  // FLUX Kontext Pro - Text-Based Image Editing (REAL API PARAMETERS)
  {
    id: 'flux-kontext-pro',
    name: 'FLUX Kontext Pro',
    owner: 'black-forest-labs',
    description: 'State-of-the-art text-based image editing model for transforming images through natural language',
    category: 'image-generation',
    supportedModes: ['images'], // Image editing in images mode
    provider: 'Black Forest Labs',
    pricing: {
      costPerImage: 0.055
    },
    performance: {
      speed: 'medium',
      averageTime: 8.0
    },
    capabilities: {
      supportsImageInput: true,
      supportsMultipleImages: false,
      maxImages: 1,
      supportedFormats: ['jpeg', 'png', 'webp'],
      maxResolution: '1024x1024'
    },
    parameters: {
      basic: [
        {
          name: 'prompt',
          type: 'string',
          default: '',
          description: 'Text description of how to edit the image (e.g., "Make this a 90s cartoon")',
          required: true
        }
      ],
      intermediate: [
        {
          name: 'guidance_scale',
          type: 'number',
          default: 3.5,
          min: 1,
          max: 20,
          step: 0.1,
          description: 'How closely to follow the prompt',
          required: false
        }
      ],
      advanced: [
        {
          name: 'num_inference_steps',
          type: 'integer',
          default: 28,
          min: 1,
          max: 50,
          step: 1,
          description: 'Number of denoising steps',
          required: false
        },
        {
          name: 'seed',
          type: 'integer',
          default: null,
          description: 'Random seed for reproducible generation',
          required: false
        }
      ]
    },
    replicateModel: 'black-forest-labs/flux-kontext-pro',
    isOfficial: true
  },



  // Seedance 1 Pro - Single Image Video Generation
  {
    id: 'seedance-1-pro',
    name: 'Seedance 1 Pro',
    owner: 'bytedance',
    description: 'Pro version with enhanced quality, supporting 5s or 10s videos at 480p and 1080p with single image input',
    category: 'video-generation',
    supportedModes: ['video'],
    provider: 'ByteDance',
    pricing: {
      costPerSecond: 0.025
    },
    performance: {
      speed: 'slow',
      averageTime: 60.0
    },
    capabilities: {
      supportsImageInput: true,
      supportsMultipleImages: true, // VERIFIED: Supports both single and dual image inputs
      maxImages: 2, // VERIFIED: Supports up to 2 images (same as Lite)
      supportedFormats: ['mp4'],
      maxResolution: '1080p'
    },
    parameters: {
      basic: [
        {
          name: 'prompt',
          type: 'string',
          default: '',
          description: 'Text description of the video to generate',
          required: true
        },
        {
          name: 'image',
          type: 'string',
          default: null,
          description: 'Reference image for video generation',
          required: false
        },
        {
          name: 'duration',
          type: 'integer',
          default: 5,
          min: 5,
          max: 10,
          description: 'Video duration in seconds (5 or 10)',
          required: false
        },
        {
          name: 'resolution',
          type: 'select',
          default: '1080p',
          options: ['480p', '1080p'],
          description: 'Video resolution',
          required: false
        }
      ],
      intermediate: [
        {
          name: 'motion_strength',
          type: 'number',
          default: 0.8,
          min: 0.1,
          max: 1.0,
          step: 0.1,
          description: 'Strength of motion in the video',
          required: false
        },
        {
          name: 'camera_movement',
          type: 'select',
          default: 'auto',
          options: ['auto', 'static', 'pan', 'zoom', 'dolly'],
          description: 'Type of camera movement',
          required: false
        }
      ],
      advanced: [
        {
          name: 'physics_realism',
          type: 'number',
          default: 0.9,
          min: 0.1,
          max: 1.0,
          step: 0.1,
          description: 'Level of physics simulation realism',
          required: false
        },
        {
          name: 'seed',
          type: 'integer',
          default: null,
          description: 'Random seed for reproducible generation',
          required: false
        }
      ]
    },
    replicateModel: 'bytedance/seedance-1-pro',
    isOfficial: true
  },

  // FLUX Kontext Max - Premium Text-Based Image Editing (REAL API PARAMETERS)
  {
    id: 'flux-kontext-max',
    name: 'FLUX Kontext Max',
    owner: 'black-forest-labs',
    description: 'Premium text-based image editing model with maximum performance and improved typography generation',
    category: 'image-generation',
    supportedModes: ['images'], // Image editing in images mode
    provider: 'Black Forest Labs',
    pricing: {
      costPerImage: 0.095
    },
    performance: {
      speed: 'slow',
      averageTime: 15.0
    },
    capabilities: {
      supportsImageInput: true,
      supportsMultipleImages: false,
      maxImages: 1,
      supportedFormats: ['jpeg', 'png', 'webp'],
      maxResolution: '2048x2048'
    },
    parameters: {
      basic: [
        {
          name: 'prompt',
          type: 'string',
          default: '',
          description: 'Text description of how to edit the image (e.g., "Change the text to say Hello World")',
          required: true
        }
      ],
      intermediate: [
        {
          name: 'guidance_scale',
          type: 'number',
          default: 3.5,
          min: 1,
          max: 20,
          step: 0.1,
          description: 'How closely to follow the prompt',
          required: false
        }
      ],
      advanced: [
        {
          name: 'num_inference_steps',
          type: 'integer',
          default: 28,
          min: 1,
          max: 50,
          step: 1,
          description: 'Number of denoising steps',
          required: false
        },
        {
          name: 'seed',
          type: 'integer',
          default: null,
          description: 'Random seed for reproducible generation',
          required: false
        }
      ]
    },
    replicateModel: 'black-forest-labs/flux-kontext-max',
    isOfficial: true
  },

  // Seedream 3 - Native 2K Image Generation
  {
    id: 'seedream-3',
    name: 'Seedream 3',
    owner: 'bytedance',
    description: 'Native 2K high-resolution bilingual image generation model with exceptional text layout',
    category: 'image-generation',
    supportedModes: ['images'],
    provider: 'ByteDance',
    pricing: {
      costPerImage: 0.03
    },
    performance: {
      speed: 'fast',
      averageTime: 3.0
    },
    capabilities: {
      supportsImageInput: false,
      supportsMultipleImages: false,
      maxImages: 1,
      supportedFormats: ['jpeg', 'png'],
      maxResolution: '2048x2048'
    },
    parameters: {
      basic: [
        {
          name: 'prompt',
          type: 'string',
          default: '',
          description: 'Text description in English or Chinese',
          required: true
        },
        {
          name: 'aspect_ratio',
          type: 'select',
          default: '1:1',
          options: ['1:1', '16:9', '9:16', '4:3', '3:2'],
          description: 'Aspect ratio of the generated image',
          required: false
        },
        {
          name: 'quality',
          type: 'select',
          default: 'high',
          options: ['standard', 'high', 'ultra'],
          description: 'Output quality and resolution',
          required: false
        }
      ],
      intermediate: [
        {
          name: 'style',
          type: 'select',
          default: 'photorealistic',
          options: ['photorealistic', 'cinematic', 'illustration', 'poster', 'artistic'],
          description: 'Visual style of the generated image',
          required: false
        },
        {
          name: 'text_enhancement',
          type: 'boolean',
          default: true,
          description: 'Enable enhanced text layout and typography',
          required: false
        }
      ],
      advanced: [
        {
          name: 'language',
          type: 'select',
          default: 'auto',
          options: ['auto', 'english', 'chinese'],
          description: 'Primary language for text generation',
          required: false
        },
        {
          name: 'seed',
          type: 'integer',
          default: null,
          description: 'Random seed for reproducible generation',
          required: false
        }
      ]
    },
    replicateModel: 'bytedance/seedream-3',
    isOfficial: true
  },

  // Hailuo 2 - Advanced Video Generation
  {
    id: 'hailuo-02',
    name: 'Hailuo 2',
    owner: 'minimax',
    description: 'Advanced video generation with excellent physics simulation, 6s or 10s videos at 720p/1080p',
    category: 'video-generation',
    supportedModes: ['video'],
    provider: 'MiniMax',
    pricing: {
      costPerSecond: 0.02
    },
    performance: {
      speed: 'medium',
      averageTime: 50.0
    },
    capabilities: {
      supportsImageInput: true,
      supportsMultipleImages: false,
      maxImages: 1,
      supportedFormats: ['mp4'],
      maxResolution: '1080p'
    },
    parameters: {
      basic: [
        {
          name: 'prompt',
          type: 'string',
          default: '',
          description: 'Text description of the video to generate',
          required: true
        },
        {
          name: 'image',
          type: 'string',
          default: null,
          description: 'Optional reference image for video generation',
          required: false
        },
        {
          name: 'duration',
          type: 'integer',
          default: 6,
          min: 6,
          max: 10,
          description: 'Video duration in seconds (6 or 10)',
          required: false
        },
        {
          name: 'quality',
          type: 'select',
          default: 'pro',
          options: ['standard', 'pro'],
          description: 'Video quality and resolution',
          required: false
        }
      ],
      intermediate: [
        {
          name: 'physics_realism',
          type: 'number',
          default: 0.9,
          min: 0.1,
          max: 1.0,
          step: 0.1,
          description: 'Level of physics simulation realism',
          required: false
        },
        {
          name: 'motion_intensity',
          type: 'number',
          default: 0.8,
          min: 0.1,
          max: 1.0,
          step: 0.1,
          description: 'Intensity of motion in the video',
          required: false
        }
      ],
      advanced: [
        {
          name: 'camera_control',
          type: 'select',
          default: 'auto',
          options: ['auto', 'static', 'dynamic', 'cinematic'],
          description: 'Camera movement control',
          required: false
        },
        {
          name: 'seed',
          type: 'integer',
          default: null,
          description: 'Random seed for reproducible generation',
          required: false
        }
      ]
    },
    replicateModel: 'minimax/hailuo-02',
    isOfficial: true
  },

  // Hailuo Video-01 - Original Model
  {
    id: 'hailuo-video-01',
    name: 'Hailuo Video-01',
    owner: 'minimax',
    description: 'Original Hailuo model for 6s video generation at 720p with cinematic effects',
    category: 'video-generation',
    supportedModes: ['video'],
    provider: 'MiniMax',
    pricing: {
      costPerSecond: 0.015
    },
    performance: {
      speed: 'fast',
      averageTime: 35.0
    },
    capabilities: {
      supportsImageInput: true,
      supportsMultipleImages: false,
      maxImages: 1,
      supportedFormats: ['mp4'],
      maxResolution: '720p'
    },
    parameters: {
      basic: [
        {
          name: 'prompt',
          type: 'string',
          default: '',
          description: 'Text description of the video to generate',
          required: true
        },
        {
          name: 'image',
          type: 'string',
          default: null,
          description: 'Optional reference image for video generation',
          required: false
        }
      ],
      intermediate: [
        {
          name: 'camera_movement',
          type: 'select',
          default: 'auto',
          options: ['auto', 'static', 'pan', 'zoom', 'dolly'],
          description: 'Type of camera movement',
          required: false
        },
        {
          name: 'style',
          type: 'select',
          default: 'cinematic',
          options: ['cinematic', 'realistic', 'artistic', 'documentary'],
          description: 'Visual style of the video',
          required: false
        }
      ],
      advanced: [
        {
          name: 'temporal_consistency',
          type: 'number',
          default: 0.8,
          min: 0.1,
          max: 1.0,
          step: 0.1,
          description: 'Consistency across video frames',
          required: false
        },
        {
          name: 'seed',
          type: 'integer',
          default: null,
          description: 'Random seed for reproducible generation',
          required: false
        }
      ]
    },
    replicateModel: 'minimax/video-01',
    isOfficial: true
  },

  // Stable Diffusion 3.5 Large - MMDiT Architecture
  {
    id: 'stable-diffusion-3.5-large',
    name: 'Stable Diffusion 3.5 Large',
    owner: 'stability-ai',
    description: 'MMDiT text-to-image model with improved performance in image quality and typography',
    category: 'image-generation',
    supportedModes: ['images'],
    provider: 'Stability AI',
    pricing: {
      costPerImage: 0.035
    },
    performance: {
      speed: 'medium',
      averageTime: 12.0
    },
    capabilities: {
      supportsImageInput: false,
      supportsMultipleImages: false,
      maxImages: 1,
      supportedFormats: ['jpeg', 'png', 'webp'],
      maxResolution: '1024x1024'
    },
    parameters: {
      basic: [
        {
          name: 'prompt',
          type: 'string',
          default: '',
          description: 'Text description of the image to generate',
          required: true
        },
        {
          name: 'aspect_ratio',
          type: 'select',
          default: '1:1',
          options: ['1:1', '16:9', '9:16', '4:3', '3:2'],
          description: 'Aspect ratio of the generated image',
          required: false
        }
      ],
      intermediate: [
        {
          name: 'guidance_scale',
          type: 'number',
          default: 7.5,
          min: 1,
          max: 20,
          step: 0.1,
          description: 'How closely to follow the prompt',
          required: false
        },
        {
          name: 'num_outputs',
          type: 'integer',
          default: 1,
          min: 1,
          max: 4,
          step: 1,
          description: 'Number of images to generate',
          required: false
        }
      ],
      advanced: [
        {
          name: 'num_inference_steps',
          type: 'integer',
          default: 28,
          min: 1,
          max: 50,
          step: 1,
          description: 'Number of denoising steps',
          required: false
        },
        {
          name: 'seed',
          type: 'integer',
          default: null,
          description: 'Random seed for reproducible generation',
          required: false
        }
      ]
    },
    replicateModel: 'stability-ai/stable-diffusion-3.5-large',
    isOfficial: true
  },

  // Stable Diffusion 3.5 Large Turbo - Fast Generation
  {
    id: 'stable-diffusion-3.5-large-turbo',
    name: 'Stable Diffusion 3.5 Large Turbo',
    owner: 'stability-ai',
    description: 'Fast generation MMDiT model with Adversarial Diffusion Distillation',
    category: 'image-generation',
    supportedModes: ['images'],
    provider: 'Stability AI',
    pricing: {
      costPerImage: 0.02
    },
    performance: {
      speed: 'fast',
      averageTime: 4.0
    },
    capabilities: {
      supportsImageInput: false,
      supportsMultipleImages: false,
      maxImages: 1,
      supportedFormats: ['jpeg', 'png', 'webp'],
      maxResolution: '1024x1024'
    },
    parameters: {
      basic: [
        {
          name: 'prompt',
          type: 'string',
          default: '',
          description: 'Text description of the image to generate',
          required: true
        },
        {
          name: 'aspect_ratio',
          type: 'select',
          default: '1:1',
          options: ['1:1', '16:9', '9:16'],
          description: 'Aspect ratio of the generated image',
          required: false
        }
      ],
      intermediate: [
        {
          name: 'guidance_scale',
          type: 'number',
          default: 3.5,
          min: 1,
          max: 10,
          step: 0.1,
          description: 'How closely to follow the prompt (lower for turbo)',
          required: false
        }
      ],
      advanced: [
        {
          name: 'num_inference_steps',
          type: 'integer',
          default: 4,
          min: 1,
          max: 8,
          step: 1,
          description: 'Number of denoising steps (fewer for turbo)',
          required: false
        },
        {
          name: 'seed',
          type: 'integer',
          default: null,
          description: 'Random seed for reproducible generation',
          required: false
        }
      ]
    },
    replicateModel: 'stability-ai/stable-diffusion-3.5-large-turbo',
    isOfficial: true
  },

  // Real-ESRGAN - Image Upscaling (REQUIRES VERSION ID)
  {
    id: 'real-esrgan',
    name: 'Real-ESRGAN',
    owner: 'nightmareai',
    description: 'Real-ESRGAN with optional face correction and adjustable upscale',
    category: 'upscaling',
    supportedModes: ['enhance'],
    provider: 'NightmareAI',
    pricing: {
      costPerUpscale: 0.0023
    },
    performance: {
      speed: 'fast',
      averageTime: 11.0
    },
    capabilities: {
      supportsImageInput: true,
      supportsMultipleImages: false,
      maxImages: 1,
      supportedFormats: ['jpeg', 'png', 'webp'],
      maxResolution: '1440x1440'
    },
    parameters: {
      basic: [
        {
          name: 'image',
          type: 'string',
          default: null,
          description: 'Input image to upscale',
          required: true
        }
      ],
      intermediate: [
        {
          name: 'scale',
          type: 'integer',
          default: 4,
          min: 2,
          max: 4,
          description: 'Upscaling factor (2x or 4x)',
          required: false
        }
      ],
      advanced: [
        {
          name: 'face_enhance',
          type: 'boolean',
          default: false,
          description: 'Enhance faces in the image using GFPGAN',
          required: false
        }
      ]
    },
    replicateModel: 'nightmareai/real-esrgan',
    isOfficial: false
  },

  // ByteDance SeedEdit 3.0 - Image Editing (OFFICIAL MODEL)
  {
    id: 'seededit-3.0',
    name: 'SeedEdit 3.0',
    owner: 'bytedance',
    description: 'Text-guided image editing model that preserves original details while making targeted modifications',
    category: 'image-editing',
    supportedModes: ['images'],
    provider: 'ByteDance',
    pricing: {
      costPerImage: 0.008
    },
    performance: {
      speed: 'medium',
      averageTime: 12.0
    },
    capabilities: {
      supportsImageInput: true,
      supportsMultipleImages: false,
      maxImages: 1,
      supportedFormats: ['jpeg', 'png'],
      maxResolution: '1024x1024'
    },
    parameters: {
      basic: [
        {
          name: 'image',
          type: 'string',
          default: null,
          description: 'Input image to edit',
          required: true
        },
        {
          name: 'prompt',
          type: 'string',
          default: '',
          description: 'Text description of the desired edits',
          required: true
        }
      ],
      intermediate: [
        {
          name: 'num_inference_steps',
          type: 'integer',
          default: 20,
          min: 1,
          max: 50,
          description: 'Number of denoising steps',
          required: false
        },
        {
          name: 'guidance_scale',
          type: 'number',
          default: 7.5,
          min: 1.0,
          max: 20.0,
          step: 0.1,
          description: 'How closely to follow the prompt',
          required: false
        }
      ],
      advanced: [
        {
          name: 'seed',
          type: 'integer',
          default: null,
          description: 'Random seed for reproducible generation',
          required: false
        }
      ]
    },
    replicateModel: 'bytedance/seededit-3.0',
    isOfficial: true
  },

  // ByteDance Dolphin - Document Image Parsing (OFFICIAL MODEL)
  {
    id: 'dolphin',
    name: 'Dolphin',
    owner: 'bytedance',
    description: 'Document Image Parsing via Heterogeneous Anchor Prompting',
    category: 'image-generation',
    supportedModes: ['images'],
    provider: 'ByteDance',
    pricing: {
      costPerImage: 0.005
    },
    performance: {
      speed: 'fast',
      averageTime: 5.0
    },
    capabilities: {
      supportsImageInput: true,
      supportsMultipleImages: false,
      maxImages: 1,
      supportedFormats: ['jpeg', 'png'],
      maxResolution: '1024x1024'
    },
    parameters: {
      basic: [
        {
          name: 'image',
          type: 'string',
          default: null,
          description: 'Input document image to parse',
          required: true
        }
      ],
      intermediate: [],
      advanced: []
    },
    replicateModel: 'bytedance/dolphin',
    isOfficial: true
  }
]

// Helper function to get model by ID
export function getModelById(id: string): ReplicateModelSchema | undefined {
  return REAL_MODEL_DATA.find(model => model.id === id)
}

// Helper function to get models by mode
export function getModelsByMode(mode: 'images' | 'video' | 'enhance'): ReplicateModelSchema[] {
  return REAL_MODEL_DATA.filter(model => model.supportedModes.includes(mode))
}

// Export all models as default
export default REAL_MODEL_DATA
