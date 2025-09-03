/**
 * Validation Schemas - Minu.AI Generator V2
 * Zod schemas for robust input validation
 */

import { z } from 'zod'

// Base schemas
export const AspectRatioSchema = z.enum([
  '1:1', '16:9', '9:16', '4:3', '3:4', '3:2', '2:3', 
  '4:5', '5:4', '21:9', '9:21', '2:1', '1:2', 'match_input_image'
])

export const OutputFormatSchema = z.enum(['jpg', 'png', 'webp'])

export const VideoResolutionSchema = z.enum(['480p', '720p', '1080p'])

export const VideoDurationSchema = z.union([z.literal(5), z.literal(10)])

export const GenerationModeSchema = z.enum(['images', 'video', 'enhance'])

// Parameter schemas
export const PromptSchema = z.string()
  .min(1, 'Prompt is required')
  .max(1000, 'Prompt must be less than 1000 characters')
  .refine(
    (prompt) => prompt.trim().length > 0,
    'Prompt cannot be empty or only whitespace'
  )

export const SeedSchema = z.number()
  .int('Seed must be an integer')
  .min(0, 'Seed must be non-negative')
  .max(2147483647, 'Seed must be less than 2^31')
  .optional()

export const SafetyToleranceSchema = z.number()
  .int('Safety tolerance must be an integer')
  .min(0, 'Safety tolerance must be at least 0')
  .max(6, 'Safety tolerance must be at most 6')
  .default(2)

// Image generation parameter schemas
export const ImageGenerationParamsSchema = z.object({
  prompt: PromptSchema,
  aspect_ratio: AspectRatioSchema.optional().default('1:1'),
  output_format: OutputFormatSchema.optional().default('jpg'),
  seed: SeedSchema,
  safety_tolerance: SafetyToleranceSchema.optional(),
  prompt_upsampling: z.boolean().optional().default(false),
  input_image: z.string().url().optional()
})

// Video generation parameter schemas
export const VideoGenerationParamsSchema = z.object({
  prompt: PromptSchema,
  image: z.string().url().optional(),
  last_frame_image: z.string().url().optional(),
  duration: VideoDurationSchema.optional().default(5),
  resolution: VideoResolutionSchema.optional().default('720p'),
  aspect_ratio: AspectRatioSchema.optional().default('16:9'),
  fps: z.literal(24).optional().default(24),
  camera_fixed: z.boolean().optional().default(false),
  seed: SeedSchema
})

// Enhancement parameter schemas
export const EnhanceParamsSchema = z.object({
  image: z.string().url('Image URL is required'),
  scale: z.number().min(1).max(4).optional().default(2),
  face_enhance: z.boolean().optional().default(false),
  background_enhance: z.boolean().optional().default(false)
})

// Union schema for all generation parameters
export const GenerationParamsSchema = z.discriminatedUnion('mode', [
  z.object({
    mode: z.literal('images'),
    params: ImageGenerationParamsSchema
  }),
  z.object({
    mode: z.literal('video'),
    params: VideoGenerationParamsSchema
  }),
  z.object({
    mode: z.literal('enhance'),
    params: EnhanceParamsSchema
  })
])

// Generation request schema
export const GenerationRequestSchema = z.object({
  model: z.string().min(1, 'Model is required'),
  mode: GenerationModeSchema,
  input: z.record(z.any()), // Will be validated against specific model schema
  options: z.object({
    webhook: z.string().url().optional(),
    priority: z.enum(['low', 'normal', 'high']).optional().default('normal'),
    timeout: z.number().min(1000).max(300000).optional().default(60000),
    retries: z.number().min(0).max(5).optional().default(2),
    saveToGallery: z.boolean().optional().default(true),
    metadata: z.record(z.any()).optional()
  }).optional()
})

// File upload schema
export const FileUploadSchema = z.object({
  file: z.instanceof(File)
    .refine(
      (file) => file.size <= 10 * 1024 * 1024,
      'File size must be less than 10MB'
    )
    .refine(
      (file) => ['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type),
      'File must be a JPEG, PNG, WebP, or GIF image'
    ),
  purpose: z.enum(['input_image', 'last_frame_image', 'reference_image']).optional()
})

// Model-specific parameter schemas
export const FluxSchnellParamsSchema = z.object({
  prompt: PromptSchema,
  aspect_ratio: AspectRatioSchema.optional(),
  output_format: OutputFormatSchema.optional(),
  seed: SeedSchema
})

export const FluxUltraParamsSchema = z.object({
  prompt: PromptSchema,
  aspect_ratio: AspectRatioSchema.optional(),
  output_format: OutputFormatSchema.optional(),
  safety_tolerance: SafetyToleranceSchema.optional(),
  seed: SeedSchema
})

export const FluxKontextProParamsSchema = z.object({
  prompt: PromptSchema,
  input_image: z.string().url().optional(),
  aspect_ratio: AspectRatioSchema.optional(),
  prompt_upsampling: z.boolean().optional(),
  seed: SeedSchema,
  output_format: OutputFormatSchema.optional(),
  safety_tolerance: SafetyToleranceSchema.optional()
})

export const FluxKontextMaxParamsSchema = FluxKontextProParamsSchema

export const Seedream3ParamsSchema = z.object({
  prompt: PromptSchema,
  aspect_ratio: z.enum(['1:1', '16:9', '9:16', '4:3', '3:4']).optional(),
  output_format: OutputFormatSchema.optional(),
  seed: SeedSchema
})

export const Seedance1LiteParamsSchema = z.object({
  prompt: PromptSchema,
  image: z.string().url().optional(),
  last_frame_image: z.string().url().optional(),
  duration: VideoDurationSchema.optional(),
  resolution: z.enum(['480p', '720p']).optional(),
  aspect_ratio: z.enum(['16:9', '4:3', '1:1', '3:4', '9:16', '21:9', '9:21']).optional(),
  fps: z.literal(24).optional(),
  camera_fixed: z.boolean().optional(),
  seed: SeedSchema
})

export const Seedance1ProParamsSchema = z.object({
  prompt: PromptSchema,
  image: z.string().url().optional(),
  duration: VideoDurationSchema.optional(),
  resolution: z.enum(['480p', '1080p']).optional(),
  aspect_ratio: z.enum(['16:9', '4:3', '1:1', '3:4', '9:16', '21:9', '9:21']).optional(),
  fps: z.literal(24).optional(),
  camera_fixed: z.boolean().optional(),
  seed: SeedSchema
})

// Model parameter schema mapping
export const MODEL_PARAM_SCHEMAS = {
  'flux-schnell': FluxSchnellParamsSchema,
  'flux-ultra': FluxUltraParamsSchema,
  'flux-kontext-pro': FluxKontextProParamsSchema,
  'flux-kontext-max': FluxKontextMaxParamsSchema,
  'seedream-3': Seedream3ParamsSchema,
  'seedance-1-lite': Seedance1LiteParamsSchema,
  'seedance-1-pro': Seedance1ProParamsSchema
} as const

// Validation helper functions
export const validateGenerationRequest = (data: unknown) => {
  return GenerationRequestSchema.safeParse(data)
}

export const validateModelParameters = (modelId: string, params: unknown) => {
  const schema = MODEL_PARAM_SCHEMAS[modelId as keyof typeof MODEL_PARAM_SCHEMAS]
  if (!schema) {
    return {
      success: false,
      error: { message: `Unknown model: ${modelId}` }
    }
  }
  return schema.safeParse(params)
}

export const validateFileUpload = (data: unknown) => {
  return FileUploadSchema.safeParse(data)
}

// Type inference from schemas
export type ImageGenerationParams = z.infer<typeof ImageGenerationParamsSchema>
export type VideoGenerationParams = z.infer<typeof VideoGenerationParamsSchema>
export type EnhanceParams = z.infer<typeof EnhanceParamsSchema>
export type GenerationRequest = z.infer<typeof GenerationRequestSchema>
export type FileUpload = z.infer<typeof FileUploadSchema>

// Model-specific parameter types
export type FluxSchnellParams = z.infer<typeof FluxSchnellParamsSchema>
export type FluxUltraParams = z.infer<typeof FluxUltraParamsSchema>
export type FluxKontextProParams = z.infer<typeof FluxKontextProParamsSchema>
export type FluxKontextMaxParams = z.infer<typeof FluxKontextMaxParamsSchema>
export type Seedream3Params = z.infer<typeof Seedream3ParamsSchema>
export type Seedance1LiteParams = z.infer<typeof Seedance1LiteParamsSchema>
export type Seedance1ProParams = z.infer<typeof Seedance1ProParamsSchema>
