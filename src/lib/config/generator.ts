// Generator Configuration - Centralized configuration to eliminate hard-coded values

export const GENERATOR_CONFIG = {
  // Layout Configuration - Aligned with standardized responsive system
  layout: {
    navigationSidebarWidth: '256px',  // Matches --nav-sidebar-width
    controlSidebarWidth: '320px',     // Reduced for better balance
    navigationHeight: '64px',         // Standard header height
    maxContentWidth: '100%',          // Use full available width
    promptAreaMaxHeight: '200px',     // Limit prompt area height
    mobileBreakpoint: '375px',        // Standardized mobile
    tabletBreakpoint: '768px',        // Standardized tablet
    desktopBreakpoint: '1920px'       // Standardized desktop
  },

  // Prompt Configuration
  prompt: {
    maxLength: 2000,
    minLength: 3,
    enhanceMinLength: 10,
    placeholders: {
      images: 'Describe the image you want to create... (e.g., "A serene mountain landscape at sunset with golden light reflecting on a crystal-clear lake")',
      video: 'Describe the video motion or animation... (e.g., "Camera slowly pans across the landscape, clouds moving gently")',
      enhance: 'Describe enhancement preferences... (e.g., "Sharpen details, enhance colors, reduce noise")'
    }
  },

  // Upload Configuration
  upload: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    maxFiles: 4,
    supportedFormats: ['jpg', 'jpeg', 'png', 'webp'],
    minDimensions: { width: 256, height: 256 },
    maxDimensions: { width: 4096, height: 4096 }
  },

  // Generation Parameters
  generation: {
    defaults: {
      numOutputs: 1,
      aspectRatio: '1:1',
      guidanceScale: 3.5,
      numInferenceSteps: 28,
      seed: () => Math.floor(Math.random() * 1000000),
      // Video defaults
      duration: 5,
      fps: 24,
      // Enhance defaults
      scale: 4,
      faceEnhance: true,
      denoise: true
    },
    limits: {
      numOutputs: { min: 1, max: 4 },
      guidanceScale: { min: 1, max: 20 },
      numInferenceSteps: { min: 1, max: 50 },
      duration: { min: 1, max: 10 },
      fps: { min: 12, max: 60 },
      scale: { min: 2, max: 8 }
    },
    aspectRatios: [
      { id: '1:1', name: 'Square', ratio: 1 },
      { id: '16:9', name: 'Landscape', ratio: 16/9 },
      { id: '9:16', name: 'Portrait', ratio: 9/16 },
      { id: '4:3', name: 'Standard', ratio: 4/3 },
      { id: '3:2', name: 'Photo', ratio: 3/2 },
      { id: '21:9', name: 'Cinematic', ratio: 21/9 }
    ]
  },

  // Mode Configuration
  modes: {
    images: {
      id: 'images',
      name: 'Images',
      description: 'Text to image generation',
      icon: 'image',
      color: 'from-blue-500 to-cyan-500',
      requiresUpload: false,
      supportsUpload: false,
      maxFiles: 0,
      supportedModels: [
        'flux-dev',
        'flux-schnell',
        'flux-pro',
        'flux-kontext-pro',
        'flux-kontext-max',
        'seedream-3',
        'stable-diffusion-3.5-large',
        'stable-diffusion-3.5-medium',
        'stable-diffusion-3.5-large-turbo'
      ],
      defaultModel: 'flux-dev'
    },
    video: {
      id: 'video',
      name: 'Video',
      description: 'Image to video generation',
      icon: 'video',
      color: 'from-purple-500 to-pink-500',
      requiresUpload: false,
      supportsUpload: true,
      maxFiles: 1,
      supportedModels: [
        'stable-video-diffusion',
        'runway-gen2',
        'seedance-1-lite',
        'seedance-1-pro',
        'hailuo-02',
        'hailuo-video-01'
      ],
      defaultModel: 'stable-video-diffusion'
    },
    enhance: {
      id: 'enhance',
      name: 'Enhance',
      description: 'Upscale and enhance images',
      icon: 'zap',
      color: 'from-orange-500 to-red-500',
      requiresUpload: true,
      supportsUpload: true,
      maxFiles: 1,
      supportedModels: ['real-esrgan', 'esrgan', 'swinir'],
      defaultModel: 'real-esrgan'
    }
  },

  // Animation Configuration
  animations: {
    duration: {
      fast: 0.15,
      normal: 0.3,
      slow: 0.5
    },
    easing: {
      smooth: [0.4, 0, 0.2, 1],
      bounce: [0.68, -0.55, 0.265, 1.55],
      elastic: [0.175, 0.885, 0.32, 1.275]
    }
  },

  // UI Configuration
  ui: {
    suggestions: {
      maxVisible: 6,
      categories: ['style', 'lighting', 'composition', 'mood', 'quality', 'effects'],
      refreshInterval: 30000 // 30 seconds
    },
    recentPrompts: {
      maxItems: 10,
      storageKey: 'minu-recent-prompts'
    },
    notifications: {
      duration: 5000,
      position: 'top-right'
    }
  },

  // API Configuration
  api: {
    timeouts: {
      generation: 120000, // 2 minutes (reduced from 5 minutes)
      enhancement: 60000, // 1 minute (reduced from 2 minutes)
      promptEnhance: 15000 // 15 seconds (reduced from 30 seconds)
    },
    retries: {
      maxAttempts: 2, // Reduced from 3
      backoffMultiplier: 1.5, // Reduced from 2
      initialDelay: 500 // Reduced from 1000
    },
    polling: {
      interval: 1000, // 1 second (reduced from 2 seconds)
      maxDuration: 180000 // 3 minutes (reduced from 10 minutes)
    }
  },

  // Performance Configuration
  performance: {
    imageOptimization: {
      quality: 85,
      format: 'webp',
      fallbackFormat: 'jpeg'
    },
    caching: {
      ttl: 3600000, // 1 hour
      maxSize: 100 * 1024 * 1024 // 100MB
    },
    debounce: {
      search: 300,
      input: 150,
      resize: 100
    }
  }
} as const

// Type definitions for configuration
export type GeneratorConfig = typeof GENERATOR_CONFIG
export type ModeConfig = typeof GENERATOR_CONFIG.modes[keyof typeof GENERATOR_CONFIG.modes]
export type GenerationDefaults = typeof GENERATOR_CONFIG.generation.defaults
export type GenerationLimits = typeof GENERATOR_CONFIG.generation.limits

// Helper functions
export const getConfig = () => GENERATOR_CONFIG

export const getModeConfig = (mode: keyof typeof GENERATOR_CONFIG.modes) => {
  return GENERATOR_CONFIG.modes[mode]
}

export const getGenerationDefaults = () => {
  return {
    ...GENERATOR_CONFIG.generation.defaults,
    seed: GENERATOR_CONFIG.generation.defaults.seed()
  }
}

export const getGenerationLimits = () => {
  return GENERATOR_CONFIG.generation.limits
}

export const getAspectRatios = () => {
  return GENERATOR_CONFIG.generation.aspectRatios
}

export const getUploadConfig = () => {
  return GENERATOR_CONFIG.upload
}

export const getPromptConfig = () => {
  return GENERATOR_CONFIG.prompt
}

export const getLayoutConfig = () => {
  return GENERATOR_CONFIG.layout
}

export const getAnimationConfig = () => {
  return GENERATOR_CONFIG.animations
}

export const getUIConfig = () => {
  return GENERATOR_CONFIG.ui
}

export const getAPIConfig = () => {
  return GENERATOR_CONFIG.api
}

export const getPerformanceConfig = () => {
  return GENERATOR_CONFIG.performance
}

// Validation helpers
export const validatePrompt = (prompt: string, mode: keyof typeof GENERATOR_CONFIG.modes) => {
  const config = GENERATOR_CONFIG.prompt
  const modeConfig = getModeConfig(mode)
  
  const errors: string[] = []
  
  if (prompt.length < config.minLength) {
    errors.push(`Prompt must be at least ${config.minLength} characters`)
  }
  
  if (prompt.length > config.maxLength) {
    errors.push(`Prompt must be less than ${config.maxLength} characters`)
  }
  
  // Mode-specific validation
  if (mode === 'enhance' && prompt.length > 0 && prompt.length < config.enhanceMinLength) {
    errors.push(`Enhancement prompts should be at least ${config.enhanceMinLength} characters for better results`)
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

export const validateUpload = (files: File[]) => {
  const config = GENERATOR_CONFIG.upload
  const errors: string[] = []
  
  if (files.length > config.maxFiles) {
    errors.push(`Maximum ${config.maxFiles} files allowed`)
  }
  
  files.forEach((file, index) => {
    if (file.size > config.maxFileSize) {
      errors.push(`File ${index + 1} exceeds maximum size of ${config.maxFileSize / (1024 * 1024)}MB`)
    }
    
    const extension = file.name.split('.').pop()?.toLowerCase() as 'jpg' | 'jpeg' | 'png' | 'webp'
    if (!extension || !config.supportedFormats.includes(extension)) {
      errors.push(`File ${index + 1} format not supported. Use: ${config.supportedFormats.join(', ')}`)
    }
  })
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

export const validateGenerationParams = (params: any) => {
  const limits = GENERATOR_CONFIG.generation.limits
  const errors: string[] = []
  
  if (params.numOutputs < limits.numOutputs.min || params.numOutputs > limits.numOutputs.max) {
    errors.push(`Number of outputs must be between ${limits.numOutputs.min} and ${limits.numOutputs.max}`)
  }
  
  if (params.guidanceScale < limits.guidanceScale.min || params.guidanceScale > limits.guidanceScale.max) {
    errors.push(`Guidance scale must be between ${limits.guidanceScale.min} and ${limits.guidanceScale.max}`)
  }
  
  if (params.numInferenceSteps < limits.numInferenceSteps.min || params.numInferenceSteps > limits.numInferenceSteps.max) {
    errors.push(`Inference steps must be between ${limits.numInferenceSteps.min} and ${limits.numInferenceSteps.max}`)
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}
