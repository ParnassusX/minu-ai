/**
 * Mode System Types for Minu.AI Generator
 * Defines the three primary modes: Images, Video, Enhance
 * Note: Edit functionality is handled separately via chat interface
 */

export type GeneratorMode = 'images' | 'video' | 'enhance'

export interface ModeConfig {
  id: GeneratorMode
  name: string
  displayName: string
  description: string
  icon: string
  supportedModels: string[]
  requiresUpload: boolean
  uploadConfig?: UploadConfig
  defaultParameters: Record<string, any>
  suggestedPrompts: string[]
}

export interface UploadConfig {
  maxFiles: number
  acceptedTypes: string[]
  required: boolean
  supportsMask: boolean
  supportsMultiple: boolean
  multipleImageLabels?: string[] // Labels for multiple image inputs
}

export interface ModeState {
  currentMode: GeneratorMode
  previousMode: GeneratorMode | null
  isTransitioning: boolean
}

export interface ModeActions {
  setMode: (mode: GeneratorMode) => void
  resetMode: () => void
  canSwitchMode: () => boolean
}

export type ModeStore = ModeState & ModeActions

// Mode configurations
export const MODE_CONFIGS: Record<GeneratorMode, ModeConfig> = {
  images: {
    id: 'images',
    name: 'images',
    displayName: 'Images',
    description: 'Generate stunning AI images from text prompts',
    icon: 'image',
    supportedModels: [
      'flux-schnell',
      'flux-dev',
      'flux-pro',
      'flux-ultra',
      'flux-kontext-dev',
      'flux-kontext-pro',
      'flux-kontext-max',
      'sdxl-lightning',
      'sdxl-lightning-4step', // ByteDance ultra-fast model
      'ideogram-v2',
      'seedream-3'
    ],
    requiresUpload: false,
    defaultParameters: {
      numOutputs: 1,
      aspectRatio: '1:1',
      guidanceScale: 3.5,
      numInferenceSteps: 28
    },
    suggestedPrompts: [
      'professional photography',
      'cinematic lighting',
      'high resolution',
      'detailed artwork',
      'photorealistic'
    ]
  },
  video: {
    id: 'video',
    name: 'video',
    displayName: 'Video',
    description: 'Generate AI videos from images or text prompts',
    icon: 'video',
    supportedModels: [
      'minimax-video-01',
      'runway-gen3-alpha',
      'luma-dream-machine',
      'stable-video-diffusion',
      'seedance-1-lite',
      'seedance-1-pro'
    ],
    requiresUpload: false, // Can work with or without image input
    uploadConfig: {
      maxFiles: 2, // Support multiple images for Seedance models (first_frame_image, subject_reference)
      acceptedTypes: ['image/jpeg', 'image/png', 'image/webp'],
      required: false, // Optional for image-to-video
      supportsMask: false,
      supportsMultiple: true, // Enable multiple image uploads for advanced models
      multipleImageLabels: ['First Frame Image', 'Subject Reference'] // Labels for multiple inputs
    },
    defaultParameters: {
      numOutputs: 1,
      aspectRatio: '16:9',
      duration: 5, // seconds
      fps: 24,
      guidanceScale: 3.5,
      numInferenceSteps: 28
    },
    suggestedPrompts: [
      'cinematic movement',
      'smooth camera motion',
      'dynamic action',
      'flowing animation',
      'realistic physics'
    ]
  },
  enhance: {
    id: 'enhance',
    name: 'enhance',
    displayName: 'Enhance',
    description: 'Upscale and enhance image quality with AI',
    icon: 'zap',
    supportedModels: [
      'real-esrgan',
      'esrgan',
      'swinir'
    ],
    requiresUpload: true,
    uploadConfig: {
      maxFiles: 1,
      acceptedTypes: ['image/jpeg', 'image/png', 'image/webp'],
      required: true,
      supportsMask: false,
      supportsMultiple: false
    },
    defaultParameters: {
      scale: 4,
      faceEnhance: true,
      denoise: true
    },
    suggestedPrompts: [
      'upscale 4x',
      'enhance quality',
      'denoise image',
      'sharpen details',
      'restore colors'
    ]
  }
}

// Helper functions
export const getModeConfig = (mode: GeneratorMode): ModeConfig => {
  return MODE_CONFIGS[mode]
}

export const getModeSupportedModels = (mode: GeneratorMode): string[] => {
  return MODE_CONFIGS[mode].supportedModels
}

export const getModeDefaultParameters = (mode: GeneratorMode): Record<string, any> => {
  return MODE_CONFIGS[mode].defaultParameters
}

export const isModelSupportedInMode = (modelId: string, mode: GeneratorMode): boolean => {
  return MODE_CONFIGS[mode].supportedModels.includes(modelId)
}

export const getDefaultModeForModel = (modelId: string): GeneratorMode => {
  for (const [mode, config] of Object.entries(MODE_CONFIGS)) {
    if (config.supportedModels.includes(modelId)) {
      return mode as GeneratorMode
    }
  }
  return 'images' // fallback
}

export const getAllModes = (): GeneratorMode[] => {
  return Object.keys(MODE_CONFIGS) as GeneratorMode[]
}

export const getModeDisplayInfo = (mode: GeneratorMode) => {
  const config = MODE_CONFIGS[mode]
  return {
    name: config.displayName,
    description: config.description,
    icon: config.icon,
    requiresUpload: config.requiresUpload
  }
}
