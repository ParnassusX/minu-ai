/**
 * Real Model Data - Legacy compatibility file
 * This file provides compatibility with existing imports
 */

// Re-export from the new Generator V2 system
export {
  type ModelSchema as ReplicateModelSchema,
  type ModelParameter
} from '@/components/generator-v2/lib/models'

// Legacy compatibility exports
export const REAL_MODEL_DATA = [
  {
    id: 'flux-schnell',
    name: 'FLUX.1 Schnell',
    replicateModel: 'black-forest-labs/flux-schnell'
  },
  {
    id: 'flux-ultra',
    name: 'FLUX.1 Ultra',
    replicateModel: 'black-forest-labs/flux-ultra'
  },
  {
    id: 'flux-kontext-pro',
    name: 'FLUX Kontext Pro',
    replicateModel: 'black-forest-labs/flux-kontext-pro'
  },
  {
    id: 'flux-kontext-max',
    name: 'FLUX Kontext Max',
    replicateModel: 'black-forest-labs/flux-kontext-max'
  },
  {
    id: 'seedream-3',
    name: 'Seedream 3.1',
    replicateModel: 'seedream/seedream-3'
  }
]
