'use client'

import { useEffect, useCallback } from 'react'
import { useCurrentMode, useSetMode } from '@/lib/stores/modeStore'
import { useUploadStore } from '@/lib/stores/uploadStore'
import { GeneratorMode } from '@/lib/types/modes'
// import { toastHelpers } from './useToast'

interface ModeDetectionConfig {
  enableAutoSuggestion: boolean
  enableAutoSwitch: boolean
  showNotifications: boolean
}

interface ModeDetectionResult {
  suggestedMode: GeneratorMode
  confidence: number
  reason: string
  action: 'switch' | 'suggest' | 'none'
}

export function useSmartModeDetection(config: ModeDetectionConfig = {
  enableAutoSuggestion: true,
  enableAutoSwitch: false,
  showNotifications: true
}) {
  const currentMode = useCurrentMode()
  const setMode = useSetMode()
  const uploadedFiles = useUploadStore((state) => state.files)
  const clearFiles = useUploadStore((state) => state.clearFiles)

  // Analyze user context and suggest appropriate mode
  const analyzeContext = useCallback((): ModeDetectionResult => {
    const hasImages = uploadedFiles.length > 0
    const hasReadyImages = uploadedFiles.some(file => file.status === 'ready')
    
    // If user uploads images, suggest video or enhance modes
    if (hasReadyImages) {
      // Check image characteristics to determine best mode
      const firstImage = uploadedFiles.find(file => file.status === 'ready')
      
      if (firstImage) {
        // Analyze image for enhancement potential
        const isLowResolution = firstImage.dimensions?.width && firstImage.dimensions.width < 1024
        const isOldPhoto = firstImage.name?.toLowerCase().includes('old') || 
                          firstImage.name?.toLowerCase().includes('vintage')
        
        if (isLowResolution || isOldPhoto) {
          return {
            suggestedMode: 'enhance',
            confidence: 0.8,
            reason: 'Uploaded image appears to be low resolution or could benefit from enhancement',
            action: config.enableAutoSwitch ? 'switch' : 'suggest'
          }
        }
        
        // For high-quality images, suggest video mode
        return {
          suggestedMode: 'video',
          confidence: 0.7,
          reason: 'High-quality image detected - perfect for creating videos',
          action: config.enableAutoSwitch ? 'switch' : 'suggest'
        }
      }
    }
    
    // If no images and in enhance/video mode, suggest images mode
    if (!hasImages && (currentMode === 'enhance' || currentMode === 'video')) {
      return {
        suggestedMode: 'images',
        confidence: 0.6,
        reason: 'No images uploaded - text-to-image generation might be more suitable',
        action: 'suggest'
      }
    }
    
    return {
      suggestedMode: currentMode,
      confidence: 1.0,
      reason: 'Current mode is appropriate',
      action: 'none'
    }
  }, [uploadedFiles, currentMode, config.enableAutoSwitch])

  // Handle mode suggestions
  const handleModeSuggestion = useCallback((detection: ModeDetectionResult) => {
    if (detection.action === 'none' || detection.suggestedMode === currentMode) {
      return
    }

    if (detection.action === 'switch') {
      setMode(detection.suggestedMode)
      
      if (config.showNotifications) {
        console.log('Mode Switched', `Automatically switched to ${detection.suggestedMode} mode: ${detection.reason}`)
      }
    } else if (detection.action === 'suggest' && config.enableAutoSuggestion) {
      if (config.showNotifications) {
        console.log('Mode Suggestion', `Consider switching to ${detection.suggestedMode} mode: ${detection.reason}`)
      }
    }
  }, [currentMode, setMode, config])

  // Monitor upload changes
  useEffect(() => {
    if (!config.enableAutoSuggestion && !config.enableAutoSwitch) {
      return
    }

    const detection = analyzeContext()
    handleModeSuggestion(detection)
  }, [uploadedFiles, analyzeContext, handleModeSuggestion, config])

  // Validate mode requirements
  const validateModeRequirements = useCallback((mode: GeneratorMode): {
    isValid: boolean
    issues: string[]
    suggestions: string[]
  } => {
    const issues: string[] = []
    const suggestions: string[] = []
    
    switch (mode) {
      case 'images':
        // Images mode doesn't require uploads
        if (uploadedFiles.length > 0) {
          suggestions.push('Consider using Video or Enhance mode to utilize your uploaded images')
        }
        break
        
      case 'video':
        // Video mode works better with image input
        if (uploadedFiles.length === 0) {
          suggestions.push('Upload an image to create image-to-video generation')
        }
        break
        
      case 'enhance':
        // Enhance mode requires image upload
        if (uploadedFiles.length === 0) {
          issues.push('Enhance mode requires an image upload')
          suggestions.push('Upload an image to enhance its quality and resolution')
        }
        break
    }
    
    return {
      isValid: issues.length === 0,
      issues,
      suggestions
    }
  }, [uploadedFiles])

  // Smart mode switching with validation
  const smartSwitchMode = useCallback((targetMode: GeneratorMode) => {
    const validation = validateModeRequirements(targetMode)
    
    if (validation.isValid) {
      setMode(targetMode)
      
      if (config.showNotifications) {
        console.log('Mode Switched', `Switched to ${targetMode} mode`)
      }
    } else {
      if (config.showNotifications) {
        console.warn('Mode Switch Warning', validation.issues[0] || 'Cannot switch to this mode with current setup')
      }
    }
    
    return validation.isValid
  }, [setMode, validateModeRequirements, config.showNotifications])

  // Clear uploads when switching to images mode
  const handleModeSwitch = useCallback((newMode: GeneratorMode) => {
    if (newMode === 'images' && uploadedFiles.length > 0) {
      if (config.showNotifications) {
        console.log('Uploads Cleared', 'Uploaded files cleared for text-to-image generation')
      }
      clearFiles()
    }
    
    setMode(newMode)
  }, [uploadedFiles, clearFiles, setMode, config.showNotifications])

  // Get mode-specific guidance
  const getModeGuidance = useCallback((mode: GeneratorMode) => {
    const validation = validateModeRequirements(mode)
    
    switch (mode) {
      case 'images':
        return {
          title: 'Text-to-Image Generation',
          description: 'Create images from text descriptions',
          requirements: 'Enter a detailed text prompt',
          tips: [
            'Be specific about style, lighting, and composition',
            'Include details about colors, mood, and setting',
            'Mention camera angles or artistic styles for better results'
          ],
          validation
        }
        
      case 'video':
        return {
          title: 'Image-to-Video Generation',
          description: 'Transform images into dynamic videos',
          requirements: 'Upload an image (optional) and describe the motion',
          tips: [
            'Upload a high-quality image for best results',
            'Describe the type of motion or animation you want',
            'Consider the video duration and frame rate'
          ],
          validation
        }
        
      case 'enhance':
        return {
          title: 'Image Enhancement',
          description: 'Upscale and improve image quality',
          requirements: 'Upload an image to enhance',
          tips: [
            'Lower resolution images benefit most from enhancement',
            'Photos with good composition work best',
            'Avoid images that are already high resolution'
          ],
          validation
        }
        
      default:
        return {
          title: 'AI Generation',
          description: 'Create content with AI',
          requirements: 'Select a generation mode',
          tips: [],
          validation: { isValid: false, issues: ['Unknown mode'], suggestions: [] }
        }
    }
  }, [validateModeRequirements])

  return {
    // Core functions
    analyzeContext,
    validateModeRequirements,
    smartSwitchMode,
    handleModeSwitch,
    getModeGuidance,
    
    // Current state
    currentMode,
    uploadedFiles,
    
    // Utilities
    isValidForMode: (mode: GeneratorMode) => validateModeRequirements(mode).isValid,
    getModeSuggestion: () => analyzeContext(),
    canSwitchToMode: (mode: GeneratorMode) => validateModeRequirements(mode).isValid
  }
}
