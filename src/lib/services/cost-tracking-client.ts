import { CostRecord } from '@/types/cost-tracking';
import { estimateCost } from './cost-estimation';

/**
 * Client-side cost tracking service for React components
 * This service makes API calls to server-side endpoints
 */
class ClientCostTrackingService {
  /**
   * Get cost records for the current user
   */
  async getUserCostRecords(): Promise<CostRecord[]> {
    const response = await fetch('/api/cost-tracking/records');
    if (!response.ok) {
      throw new Error('Failed to fetch cost records');
    }
    return response.json();
  }

  /**
   * Get cost summary for the current user
   */
  async getUserCostSummary(): Promise<{
    totalCost: number;
    byProvider: Record<string, number>;
    byType: Record<string, number>;
  }> {
    const response = await fetch('/api/cost-tracking/summary');
    if (!response.ok) {
      throw new Error('Failed to fetch cost summary');
    }
    return response.json();
  }

  /**
   * Get spending analytics for the current user
   */
  async getSpendingAnalytics(days: number = 30): Promise<{
    dailySpending: Array<{ date: string; amount: number; count: number }>;
    modelBreakdown: Array<{ model: string; cost: number; count: number }>;
    providerBreakdown: Array<{ provider: string; cost: number; count: number }>;
    totalSpent: number;
    averageCostPerGeneration: number;
  }> {
    const response = await fetch(`/api/cost-tracking/analytics?days=${days}`);
    if (!response.ok) {
      throw new Error('Failed to fetch spending analytics');
    }
    return response.json();
  }

  /**
   * Check if user is approaching spending limits
   */
  async checkSpendingLimits(): Promise<{
    dailyLimit: { current: number; limit: number; exceeded: boolean };
    monthlyLimit: { current: number; limit: number; exceeded: boolean };
    warnings: string[];
  }> {
    const response = await fetch('/api/cost-tracking/limits');
    if (!response.ok) {
      throw new Error('Failed to check spending limits');
    }
    return response.json();
  }

  /**
   * Estimate cost for a generation before executing (client-side)
   */
  estimateGenerationCost(
    model: string,
    parameters: Record<string, any>,
    generationType: 'image' | 'video' | 'enhancement' = 'image'
  ): {
    estimatedCost: number;
    provider: CostRecord['provider'];
    breakdown: {
      baseCost: number;
      parameterAdjustments: Record<string, number>;
    };
  } {
    const provider = this.determineProvider(model);
    const baseCost = estimateCost(model, {});
    const totalCost = estimateCost(model, parameters);
    
    // Calculate parameter adjustments
    const parameterAdjustments: Record<string, number> = {};
    const adjustmentCost = totalCost - baseCost;
    
    if (parameters.num_outputs && parameters.num_outputs > 1) {
      parameterAdjustments.multiple_outputs = (parameters.num_outputs - 1) * baseCost;
    }
    
    if (parameters.width && parameters.height) {
      const pixels = parameters.width * parameters.height;
      const standardPixels = 512 * 512;
      if (pixels > standardPixels) {
        parameterAdjustments.high_resolution = adjustmentCost * 0.5;
      }
    }

    return {
      estimatedCost: totalCost,
      provider,
      breakdown: {
        baseCost,
        parameterAdjustments
      }
    };
  }

  /**
   * Reconcile costs via API call
   */
  async reconcileCosts(timeRange?: { start: Date; end: Date }): Promise<{
    reconciled: number;
    totalDifference: number;
    averageAccuracy: number;
  }> {
    const response = await fetch('/api/cost-tracking/reconcile', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ timeRange }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to reconcile costs');
    }
    
    return response.json();
  }

  /**
   * Determine the provider based on the model name
   */
  private determineProvider(model: string): CostRecord['provider'] {
    if (model.includes('bytedance') || model.includes('seedance')) {
      return 'bytedance';
    } else if (model.includes('flux') || model.includes('kontext')) {
      return 'flux';
    } else if (model.includes('stability-ai')) {
      return 'replicate';
    }
    return 'other';
  }
}

export const clientCostTrackingService = new ClientCostTrackingService();