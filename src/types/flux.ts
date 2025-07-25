export interface FluxGenerationParams {
  prompt: string
  width?: number
  height?: number
  num_inference_steps?: number
  guidance_scale?: number
  seed?: number
  safety_tolerance?: number
}

export interface FluxResponse {
  id: string
  status: 'pending' | 'completed' | 'failed'
  result?: {
    sample: string // Base64 encoded image
    seed: number
    finish_reason: string
  }
  error?: string
}

export interface FluxImage {
  id: string
  prompt: string
  parameters: FluxGenerationParams
  imageUrl: string
  width: number
  height: number
  seed: number
  createdAt: string
}

export type AspectRatio = '1:1' | '16:9' | '9:16' | '4:3' | '3:4' | '21:9'

export interface FluxPreset {
  name: string
  width: number
  height: number
  steps: number
  guidance: number
}

export type ImageModel = 'flux' | 'gemini'

export interface ModelOption {
  id: ImageModel
  name: string
  description: string
  provider: string
  available: boolean
  features: string[]
}
