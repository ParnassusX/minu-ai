import { mcp_replicate_create_predictions, mcp_replicate_get_predictions } from '@/lib/mcp-tools';

export interface GenerationRequest {
  model: string;
  prompt: string;
  parameters: Record<string, any>;
}

export interface GenerationResponse {
  id: string;
  status: 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled';
  output?: any;
  error?: string;
  cost?: number;
  metadata?: Record<string, any>;
}

export interface ApiProvider {
  name: string;
  generateImage(request: GenerationRequest): Promise<GenerationResponse>;
  generateVideo(request: GenerationRequest): Promise<GenerationResponse>;
  enhanceImage(request: GenerationRequest): Promise<GenerationResponse>;
  getStatus(id: string): Promise<GenerationResponse>;
  estimateCost(model: string, parameters: Record<string, any>): number;
}

// Replicate Provider (using MCP)
export class ReplicateProvider implements ApiProvider {
  name = 'replicate';

  async generateImage(request: GenerationRequest): Promise<GenerationResponse> {
    const startTime = Date.now();
    
    try {
      const prediction = await mcp_replicate_create_predictions({
        version: request.model,
        input: request.parameters,
        Prefer: 'wait'
      });

      // Cost tracking will be handled at the API route level

      return {
        id: prediction.id,
        status: prediction.status as any,
        output: prediction.output,
        error: prediction.error,
        cost: this.calculateCost(prediction),
        metadata: {
          model: request.model,
          prompt: request.prompt,
          createdAt: prediction.created_at
        }
      };
    } catch (error) {
      throw new Error(`Replicate generation failed: ${error}`);
    }
  }

  async generateVideo(request: GenerationRequest): Promise<GenerationResponse> {
    const startTime = Date.now();
    
    try {
      const prediction = await mcp_replicate_create_predictions({
        version: request.model,
        input: request.parameters,
        Prefer: 'wait'
      });

      // Cost tracking will be handled at the API route level

      return {
        id: prediction.id,
        status: prediction.status as any,
        output: prediction.output,
        error: prediction.error,
        cost: this.calculateCost(prediction),
        metadata: {
          model: request.model,
          prompt: request.prompt,
          createdAt: prediction.created_at
        }
      };
    } catch (error) {
      throw new Error(`Replicate video generation failed: ${error}`);
    }
  }

  async enhanceImage(request: GenerationRequest): Promise<GenerationResponse> {
    const startTime = Date.now();
    
    try {
      const prediction = await mcp_replicate_create_predictions({
        version: request.model,
        input: request.parameters,
        Prefer: 'wait'
      });

      // Cost tracking will be handled at the API route level

      return {
        id: prediction.id,
        status: prediction.status as any,
        output: prediction.output,
        error: prediction.error,
        cost: this.calculateCost(prediction),
        metadata: {
          model: request.model,
          prompt: request.prompt,
          createdAt: prediction.created_at
        }
      };
    } catch (error) {
      throw new Error(`Replicate enhancement failed: ${error}`);
    }
  }

  async getStatus(id: string): Promise<GenerationResponse> {
    try {
      const prediction = await mcp_replicate_get_predictions({ prediction_id: id });
      
      return {
        id: prediction.id,
        status: prediction.status as any,
        output: prediction.output,
        error: prediction.error,
        cost: this.calculateCost(prediction)
      };
    } catch (error) {
      throw new Error(`Failed to get Replicate status: ${error}`);
    }
  }

  estimateCost(model: string, parameters: Record<string, any>): number {
    // Basic cost estimation for Replicate models
    const baseCosts: Record<string, number> = {
      'stability-ai/sdxl': 0.0023,
      'stability-ai/stable-video-diffusion': 0.0085,
      'black-forest-labs/flux-schnell': 0.003
    };
    
    return baseCosts[model] || 0.005; // Default cost
  }

  private calculateCost(prediction: any): number {
    // In a real implementation, you'd calculate based on actual usage
    // For now, return estimated cost
    return prediction.metrics?.predict_time ? prediction.metrics.predict_time * 0.001 : 0;
  }
}

// ByteDance Provider (using direct REST API)
export class ByteDanceProvider implements ApiProvider {
  name = 'bytedance';
  private baseUrl = 'https://api.bytedance.com/v1';
  private apiKey = process.env.BYTEDANCE_API_KEY;

  async generateImage(request: GenerationRequest): Promise<GenerationResponse> {
    const startTime = Date.now();
    
    try {
      const response = await fetch(`${this.baseUrl}/generate/image`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: request.model,
          prompt: request.prompt,
          ...request.parameters
        })
      });

      if (!response.ok) {
        throw new Error(`ByteDance API error: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Cost tracking will be handled at the API route level
      
      return {
        id: data.id,
        status: this.mapStatus(data.status),
        output: data.output,
        error: data.error,
        cost: this.estimateCost(request.model, request.parameters),
        metadata: {
          model: request.model,
          prompt: request.prompt,
          createdAt: data.created_at
        }
      };
    } catch (error) {
      throw new Error(`ByteDance generation failed: ${error}`);
    }
  }

  async generateVideo(request: GenerationRequest): Promise<GenerationResponse> {
    const startTime = Date.now();
    
    try {
      const response = await fetch(`${this.baseUrl}/generate/video`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: request.model,
          prompt: request.prompt,
          ...request.parameters
        })
      });

      if (!response.ok) {
        throw new Error(`ByteDance API error: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Cost tracking will be handled at the API route level
      
      return {
        id: data.id,
        status: this.mapStatus(data.status),
        output: data.output,
        error: data.error,
        cost: this.estimateCost(request.model, request.parameters),
        metadata: {
          model: request.model,
          prompt: request.prompt,
          createdAt: data.created_at
        }
      };
    } catch (error) {
      throw new Error(`ByteDance video generation failed: ${error}`);
    }
  }

  async enhanceImage(request: GenerationRequest): Promise<GenerationResponse> {
    // ByteDance doesn't have enhancement, delegate to Flux
    throw new Error('ByteDance does not support image enhancement');
  }

  async getStatus(id: string): Promise<GenerationResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/status/${id}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      if (!response.ok) {
        throw new Error(`ByteDance API error: ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        id: data.id,
        status: this.mapStatus(data.status),
        output: data.output,
        error: data.error,
        cost: data.cost
      };
    } catch (error) {
      throw new Error(`Failed to get ByteDance status: ${error}`);
    }
  }

  estimateCost(model: string, parameters: Record<string, any>): number {
    // ByteDance cost estimation
    const baseCosts: Record<string, number> = {
      'bytedance/stable-diffusion-xl': 0.002,
      'bytedance/flux-dev': 0.0025,
      'bytedance/stable-video-diffusion': 0.008,
      'bytedance/runway-gen2': 0.012
    };
    
    return baseCosts[model] || 0.004;
  }

  private mapStatus(status: string): GenerationResponse['status'] {
    const statusMap: Record<string, GenerationResponse['status']> = {
      'pending': 'starting',
      'running': 'processing',
      'completed': 'succeeded',
      'failed': 'failed',
      'cancelled': 'canceled'
    };
    
    return statusMap[status] || 'starting';
  }
}

// Flux Provider (using direct REST API)
export class FluxProvider implements ApiProvider {
  name = 'flux';
  private baseUrl = 'https://api.flux.ai/v1';
  private apiKey = process.env.FLUX_API_KEY;

  async generateImage(request: GenerationRequest): Promise<GenerationResponse> {
    // Flux is primarily for enhancement, delegate to ByteDance for generation
    throw new Error('Flux is primarily for enhancement, use ByteDance for image generation');
  }

  async generateVideo(request: GenerationRequest): Promise<GenerationResponse> {
    throw new Error('Flux does not support video generation');
  }

  async enhanceImage(request: GenerationRequest): Promise<GenerationResponse> {
    const startTime = Date.now();
    
    try {
      const response = await fetch(`${this.baseUrl}/enhance`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: request.model,
          image_url: request.parameters.image_url,
          ...request.parameters
        })
      });

      if (!response.ok) {
        throw new Error(`Flux API error: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Cost tracking will be handled at the API route level
      
      return {
        id: data.id,
        status: this.mapStatus(data.status),
        output: data.output,
        error: data.error,
        cost: this.estimateCost(request.model, request.parameters),
        metadata: {
          model: request.model,
          createdAt: data.created_at
        }
      };
    } catch (error) {
      throw new Error(`Flux enhancement failed: ${error}`);
    }
  }

  async getStatus(id: string): Promise<GenerationResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/status/${id}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      if (!response.ok) {
        throw new Error(`Flux API error: ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        id: data.id,
        status: this.mapStatus(data.status),
        output: data.output,
        error: data.error,
        cost: data.cost
      };
    } catch (error) {
      throw new Error(`Failed to get Flux status: ${error}`);
    }
  }

  estimateCost(model: string, parameters: Record<string, any>): number {
    // Flux cost estimation
    const baseCosts: Record<string, number> = {
      'flux/upscaler': 0.001,
      'flux/face-enhance': 0.0015,
      'flux/style-transfer': 0.002,
      'flux/artistic-filter': 0.0018
    };
    
    return baseCosts[model] || 0.002;
  }

  private mapStatus(status: string): GenerationResponse['status'] {
    const statusMap: Record<string, GenerationResponse['status']> = {
      'queued': 'starting',
      'processing': 'processing',
      'completed': 'succeeded',
      'error': 'failed',
      'cancelled': 'canceled'
    };
    
    return statusMap[status] || 'starting';
  }
}

// Provider Factory
export class ProviderFactory {
  private providers: Map<string, ApiProvider> = new Map();

  constructor() {
    this.providers.set('replicate', new ReplicateProvider());
    this.providers.set('bytedance', new ByteDanceProvider());
    this.providers.set('flux', new FluxProvider());
  }

  getProvider(name: string): ApiProvider {
    const provider = this.providers.get(name);
    if (!provider) {
      throw new Error(`Unknown provider: ${name}`);
    }
    return provider;
  }

  getProviderForModel(model: string): ApiProvider {
    if (model.includes('stability-ai') || model.includes('black-forest-labs')) {
      return this.getProvider('replicate');
    } else if (model.includes('bytedance')) {
      return this.getProvider('bytedance');
    } else if (model.includes('flux')) {
      return this.getProvider('flux');
    }
    
    // Default to replicate
    return this.getProvider('replicate');
  }

  getAllProviders(): ApiProvider[] {
    return Array.from(this.providers.values());
  }
}

export const providerFactory = new ProviderFactory();