import { CostRecord } from '@/types/cost-tracking';
import { CostTrackingService as DatabaseService } from '@/lib/database/cost-tracking';
import { estimateCost } from './cost-estimation';
import { getAuthenticatedUser } from '@/lib/auth/server';
import { createClient } from '@/lib/supabase/server';

class CostTrackingService {
  private supabase = createClient();

  /**
   * Record cost for image generation
   */
  async recordImageGenerationCost(
    generationId: string,
    model: string,
    parameters: Record<string, any>,
    generationTime: number
  ): Promise<string> {
    const { user } = await getAuthenticatedUser();
    if (!user) throw new Error('User not authenticated');
    
    const estimatedCost = estimateCost(model, parameters);
    const provider = this.determineProvider(model);
    
    // For now, just log the cost record since we're focusing on UI components
    console.log('Recording image generation cost:', {
      userId: user.id,
      generationType: 'image',
      generationId,
      modelUsed: model,
      estimatedCost,
      provider,
      parameters,
      generationTime
    });
    
    return `cost_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * Record cost for video generation
   */
  async recordVideoGenerationCost(
    generationId: string,
    model: string,
    parameters: Record<string, any>,
    generationTime: number
  ): Promise<string> {
    const { user } = await getAuthenticatedUser();
    if (!user) throw new Error('User not authenticated');
    
    const estimatedCost = estimateCost(model, parameters);
    const provider = this.determineProvider(model);
    
    // For now, just log the cost record since we're focusing on UI components
    console.log('Recording video generation cost:', {
      userId: user.id,
      generationType: 'video',
      generationId,
      modelUsed: model,
      estimatedCost,
      provider,
      parameters,
      generationTime
    });
    
    return `cost_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * Record cost for image enhancement
   */
  async recordEnhancementCost(
    generationId: string,
    model: string,
    parameters: Record<string, any>,
    generationTime: number
  ): Promise<string> {
    const { user } = await getAuthenticatedUser();
    if (!user) throw new Error('User not authenticated');
    
    const estimatedCost = estimateCost(model, parameters);
    const provider = this.determineProvider(model);
    
    // For now, just log the cost record since we're focusing on UI components
    console.log('Recording enhancement cost:', {
      userId: user.id,
      generationType: 'enhancement',
      generationId,
      modelUsed: model,
      estimatedCost,
      provider,
      parameters,
      generationTime
    });
    
    return `cost_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * Update a cost record with actual cost
   */
  async updateWithActualCost(
    recordId: string,
    actualCost: number,
    providerTransactionId?: string
  ) {
    // For now, just log the update since we're focusing on UI components
    console.log('Updating cost record:', {
      recordId,
      actualCost,
      providerTransactionId,
      billingStatus: 'confirmed'
    });
  }

  /**
   * Get cost records for a user
   */
  async getUserCostRecords(userId?: string): Promise<CostRecord[]> {
    let targetUserId = userId;

    if (!targetUserId) {
      const { user } = await getAuthenticatedUser();
      if (!user) throw new Error('User not authenticated');
      targetUserId = user.id;
    }

    try {
      // Query real cost records from Supabase
      const { data, error } = await this.supabase
        .from('cost_records')
        .select('*')
        .eq('user_id', targetUserId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching cost records:', error);
        throw new Error(`Failed to fetch cost records: ${error.message}`);
      }

      // Transform database records to CostRecord format
      return (data || []).map(record => ({
        id: record.id,
        userId: record.user_id,
        generationType: record.generation_type,
        generationId: record.generation_id,
        modelUsed: record.model_used,
        estimatedCost: record.estimated_cost,
        actualCost: record.actual_cost,
        provider: record.provider,
        parameters: record.parameters || {},
        generationTime: record.generation_time,
        createdAt: new Date(record.created_at),
        updatedAt: new Date(record.updated_at),
        billingStatus: record.billing_status || 'pending'
      }));

    } catch (error) {
      console.error('Error in getUserCostRecords:', error);
      // Return empty array instead of mock data on error
      return [];
    }
  }

  /**
   * Get cost summary for a user
   */
  async getUserCostSummary(userId?: string): Promise<{
    totalCost: number;
    byProvider: Record<string, number>;
    byType: Record<string, number>;
  }> {
    let targetUserId = userId;
    
    if (!targetUserId) {
      const { user } = await getAuthenticatedUser();
      if (!user) throw new Error('User not authenticated');
      targetUserId = user.id;
    }
    
    // Return mock data for UI development
    return {
      totalCost: 2.45,
      byProvider: {
        flux: 1.20,
        replicate: 0.85,
        bytedance: 0.40
      },
      byType: {
        image: 1.80,
        video: 0.65
      }
    };
  }

  /**
   * Reconcile costs - compare estimated vs actual costs and update records
   */
  async reconcileCosts(timeRange?: { start: Date; end: Date }, userId?: string): Promise<{
    reconciled: number;
    totalDifference: number;
    averageAccuracy: number;
  }> {
    let targetUserId = userId;
    
    if (!targetUserId) {
      const { user } = await getAuthenticatedUser();
      if (!user) throw new Error('User not authenticated');
      targetUserId = user.id;
    }

    const supabase = createClient();
    
    // Get pending cost records
    let query = supabase
      .from('cost_records')
      .select('*')
      .eq('user_id', targetUserId)
      .eq('billing_status', 'pending');

    if (timeRange) {
      query = query
        .gte('created_at', timeRange.start.toISOString())
        .lte('created_at', timeRange.end.toISOString());
    }

    const { data: pendingRecords, error } = await query;
    
    if (error) {
      throw new Error(`Failed to fetch pending records: ${error.message}`);
    }

    let reconciledCount = 0;
    let totalDifference = 0;
    let totalRecords = 0;

    for (const record of pendingRecords || []) {
      try {
        // In a real implementation, you would fetch actual costs from provider APIs
        // For now, we'll simulate some variance in actual costs
        const variance = (Math.random() - 0.5) * 0.2; // ±10% variance
        const actualCost = record.estimated_cost * (1 + variance);
        
        await this.updateWithActualCost(record.id, actualCost, `${record.provider}_${record.generation_id}`);
        
        reconciledCount++;
        totalDifference += Math.abs(actualCost - record.estimated_cost);
        totalRecords++;
      } catch (error) {
        console.warn(`Failed to reconcile cost for record ${record.id}:`, error);
      }
    }

    const averageAccuracy = totalRecords > 0 
      ? 1 - (totalDifference / totalRecords) / (pendingRecords?.reduce((sum, r) => sum + r.estimated_cost, 0) || 1)
      : 1;

    return {
      reconciled: reconciledCount,
      totalDifference,
      averageAccuracy: Math.max(0, averageAccuracy)
    };
  }

  /**
   * Get spending analytics for a user
   */
  async getSpendingAnalytics(userId?: string, days: number = 30): Promise<{
    dailySpending: Array<{ date: string; amount: number; count: number }>;
    modelBreakdown: Array<{ model: string; cost: number; count: number }>;
    providerBreakdown: Array<{ provider: string; cost: number; count: number }>;
    totalSpent: number;
    averageCostPerGeneration: number;
  }> {
    let targetUserId = userId;
    
    if (!targetUserId) {
      const { user } = await getAuthenticatedUser();
      if (!user) throw new Error('User not authenticated');
      targetUserId = user.id;
    }

    const supabase = createClient();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data: records, error } = await supabase
      .from('cost_records')
      .select('*')
      .eq('user_id', targetUserId)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch analytics data: ${error.message}`);
    }

    // Process daily spending
    const dailySpending = new Map<string, { amount: number; count: number }>();
    const modelBreakdown = new Map<string, { cost: number; count: number }>();
    const providerBreakdown = new Map<string, { cost: number; count: number }>();
    
    let totalSpent = 0;
    let totalGenerations = 0;

    for (const record of records || []) {
      const cost = record.actual_cost || record.estimated_cost;
      const date = new Date(record.created_at).toISOString().split('T')[0];
      
      // Daily spending
      const daily = dailySpending.get(date) || { amount: 0, count: 0 };
      daily.amount += cost;
      daily.count += 1;
      dailySpending.set(date, daily);
      
      // Model breakdown
      const model = modelBreakdown.get(record.model_used) || { cost: 0, count: 0 };
      model.cost += cost;
      model.count += 1;
      modelBreakdown.set(record.model_used, model);
      
      // Provider breakdown
      const provider = providerBreakdown.get(record.provider) || { cost: 0, count: 0 };
      provider.cost += cost;
      provider.count += 1;
      providerBreakdown.set(record.provider, provider);
      
      totalSpent += cost;
      totalGenerations += 1;
    }

    return {
      dailySpending: Array.from(dailySpending.entries()).map(([date, data]) => ({
        date,
        amount: data.amount,
        count: data.count
      })),
      modelBreakdown: Array.from(modelBreakdown.entries()).map(([model, data]) => ({
        model,
        cost: data.cost,
        count: data.count
      })),
      providerBreakdown: Array.from(providerBreakdown.entries()).map(([provider, data]) => ({
        provider,
        cost: data.cost,
        count: data.count
      })),
      totalSpent,
      averageCostPerGeneration: totalGenerations > 0 ? totalSpent / totalGenerations : 0
    };
  }

  /**
   * Check if user is approaching spending limits
   */
  async checkSpendingLimits(userId?: string): Promise<{
    dailyLimit: { current: number; limit: number; exceeded: boolean };
    monthlyLimit: { current: number; limit: number; exceeded: boolean };
    warnings: string[];
  }> {
    let targetUserId = userId;
    
    if (!targetUserId) {
      const { user } = await getAuthenticatedUser();
      if (!user) throw new Error('User not authenticated');
      targetUserId = user.id;
    }

    // Get user's spending limits (these would typically be stored in user preferences)
    const dailyLimit = 10.0; // $10 daily limit
    const monthlyLimit = 100.0; // $100 monthly limit

    const supabase = createClient();
    const now = new Date();
    
    // Daily spending
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const { data: dailyRecords } = await supabase
      .from('cost_records')
      .select('estimated_cost, actual_cost')
      .eq('user_id', targetUserId)
      .gte('created_at', startOfDay.toISOString());

    const dailySpent = (dailyRecords || []).reduce((sum, record) => 
      sum + (record.actual_cost || record.estimated_cost), 0);

    // Monthly spending
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const { data: monthlyRecords } = await supabase
      .from('cost_records')
      .select('estimated_cost, actual_cost')
      .eq('user_id', targetUserId)
      .gte('created_at', startOfMonth.toISOString());

    const monthlySpent = (monthlyRecords || []).reduce((sum, record) => 
      sum + (record.actual_cost || record.estimated_cost), 0);

    const warnings: string[] = [];
    
    if (dailySpent > dailyLimit * 0.8) {
      warnings.push(`Approaching daily spending limit: $${dailySpent.toFixed(2)} of $${dailyLimit.toFixed(2)}`);
    }
    
    if (monthlySpent > monthlyLimit * 0.8) {
      warnings.push(`Approaching monthly spending limit: $${monthlySpent.toFixed(2)} of $${monthlyLimit.toFixed(2)}`);
    }

    return {
      dailyLimit: {
        current: dailySpent,
        limit: dailyLimit,
        exceeded: dailySpent > dailyLimit
      },
      monthlyLimit: {
        current: monthlySpent,
        limit: monthlyLimit,
        exceeded: monthlySpent > monthlyLimit
      },
      warnings
    };
  }

  /**
   * Estimate cost for a generation before executing
   */
  async estimateGenerationCost(
    model: string,
    parameters: Record<string, any>,
    generationType: 'image' | 'video' | 'enhancement' = 'image'
  ): Promise<{
    estimatedCost: number;
    provider: CostRecord['provider'];
    breakdown: {
      baseCost: number;
      parameterAdjustments: Record<string, number>;
    };
  }> {
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

export const costTrackingService = new CostTrackingService();