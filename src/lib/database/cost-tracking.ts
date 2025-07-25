// Cost Tracking Database Service
import { createClient } from '@supabase/supabase-js'
import type {
  GenerationCost,
  UserSpendingLimits,
  CostAlert,
  UserSpendingAnalytics,
  RecordCostRequest,
  UpdateCostRequest,
  SpendingLimitsUpdateRequest,
  CostAnalyticsQuery,
  SpendingPeriod,
  ModelCostBreakdown,
  CostTrend
} from '@/types/cost-tracking'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export class CostTrackingService {
  /**
   * Record a new generation cost
   */
  static async recordGenerationCost(request: RecordCostRequest): Promise<{ success: boolean; cost_record_id?: string; error?: string }> {
    try {
      const { data, error } = await supabase.rpc('record_generation_cost', {
        p_user_id: request.user_id,
        p_generation_type: request.generation_type,
        p_generation_id: request.generation_id,
        p_model_used: request.model_used,
        p_estimated_cost: request.estimated_cost,
        p_provider: request.provider || 'replicate',
        p_parameters: request.parameters || {},
        p_generation_time: request.generation_time,
        p_provider_transaction_id: request.provider_transaction_id
      })

      if (error) {
        console.error('Error recording generation cost:', error)
        return { success: false, error: error.message }
      }

      return { success: true, cost_record_id: data }
    } catch (error) {
      console.error('Error recording generation cost:', error)
      return { success: false, error: 'Failed to record generation cost' }
    }
  }

  /**
   * Update actual cost after generation completion
   */
  static async updateActualCost(request: UpdateCostRequest): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.rpc('update_actual_cost', {
        p_cost_record_id: request.cost_record_id,
        p_actual_cost: request.actual_cost,
        p_billing_status: request.billing_status || 'confirmed'
      })

      if (error) {
        console.error('Error updating actual cost:', error)
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      console.error('Error updating actual cost:', error)
      return { success: false, error: 'Failed to update actual cost' }
    }
  }

  /**
   * Get user spending analytics
   */
  static async getUserSpendingAnalytics(userId: string): Promise<{ success: boolean; data?: UserSpendingAnalytics; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('user_spending_analytics')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error) {
        console.error('Error fetching spending analytics:', error)
        return { success: false, error: error.message }
      }

      return { success: true, data }
    } catch (error) {
      console.error('Error fetching spending analytics:', error)
      return { success: false, error: 'Failed to fetch spending analytics' }
    }
  }

  /**
   * Get user spending limits
   */
  static async getUserSpendingLimits(userId: string): Promise<{ success: boolean; data?: UserSpendingLimits; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('user_spending_limits')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error) {
        console.error('Error fetching spending limits:', error)
        return { success: false, error: error.message }
      }

      return { success: true, data }
    } catch (error) {
      console.error('Error fetching spending limits:', error)
      return { success: false, error: 'Failed to fetch spending limits' }
    }
  }

  /**
   * Update user spending limits
   */
  static async updateSpendingLimits(userId: string, updates: SpendingLimitsUpdateRequest): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('user_spending_limits')
        .upsert({
          user_id: userId,
          ...updates,
          updated_at: new Date().toISOString()
        })

      if (error) {
        console.error('Error updating spending limits:', error)
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      console.error('Error updating spending limits:', error)
      return { success: false, error: 'Failed to update spending limits' }
    }
  }

  /**
   * Get cost alerts for user
   */
  static async getCostAlerts(userId: string, unreadOnly: boolean = false): Promise<{ success: boolean; data?: CostAlert[]; error?: string }> {
    try {
      let query = supabase
        .from('cost_alerts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (unreadOnly) {
        query = query.eq('is_read', false)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching cost alerts:', error)
        return { success: false, error: error.message }
      }

      return { success: true, data: data || [] }
    } catch (error) {
      console.error('Error fetching cost alerts:', error)
      return { success: false, error: 'Failed to fetch cost alerts' }
    }
  }

  /**
   * Mark cost alert as read
   */
  static async markAlertAsRead(alertId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('cost_alerts')
        .update({ is_read: true, updated_at: new Date().toISOString() })
        .eq('id', alertId)

      if (error) {
        console.error('Error marking alert as read:', error)
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      console.error('Error marking alert as read:', error)
      return { success: false, error: 'Failed to mark alert as read' }
    }
  }

  /**
   * Dismiss cost alert
   */
  static async dismissAlert(alertId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('cost_alerts')
        .update({ is_dismissed: true, updated_at: new Date().toISOString() })
        .eq('id', alertId)

      if (error) {
        console.error('Error dismissing alert:', error)
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      console.error('Error dismissing alert:', error)
      return { success: false, error: 'Failed to dismiss alert' }
    }
  }

  /**
   * Get generation costs for user
   */
  static async getGenerationCosts(
    userId: string, 
    limit: number = 50, 
    offset: number = 0,
    filters?: {
      generation_type?: string
      model_used?: string
      start_date?: string
      end_date?: string
    }
  ): Promise<{ success: boolean; data?: GenerationCost[]; total?: number; error?: string }> {
    try {
      let query = supabase
        .from('generation_costs')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (filters?.generation_type) {
        query = query.eq('generation_type', filters.generation_type)
      }

      if (filters?.model_used) {
        query = query.eq('model_used', filters.model_used)
      }

      if (filters?.start_date) {
        query = query.gte('created_at', filters.start_date)
      }

      if (filters?.end_date) {
        query = query.lte('created_at', filters.end_date)
      }

      const { data, error, count } = await query

      if (error) {
        console.error('Error fetching generation costs:', error)
        return { success: false, error: error.message }
      }

      return { success: true, data: data || [], total: count || 0 }
    } catch (error) {
      console.error('Error fetching generation costs:', error)
      return { success: false, error: 'Failed to fetch generation costs' }
    }
  }

  /**
   * Get spending trends over time
   */
  static async getSpendingTrends(
    userId: string, 
    days: number = 30
  ): Promise<{ success: boolean; data?: CostTrend[]; error?: string }> {
    try {
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)

      const { data, error } = await supabase
        .from('generation_costs')
        .select('created_at, estimated_cost, actual_cost')
        .eq('user_id', userId)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Error fetching spending trends:', error)
        return { success: false, error: error.message }
      }

      // Process data into daily trends
      const trendsMap = new Map<string, { cost: number; count: number }>()
      let cumulativeCost = 0

      data?.forEach(record => {
        const date = new Date(record.created_at).toISOString().split('T')[0]
        const cost = record.actual_cost || record.estimated_cost || 0
        
        if (!trendsMap.has(date)) {
          trendsMap.set(date, { cost: 0, count: 0 })
        }
        
        const dayData = trendsMap.get(date)!
        dayData.cost += cost
        dayData.count += 1
        cumulativeCost += cost
      })

      const trends: CostTrend[] = Array.from(trendsMap.entries()).map(([date, data]) => ({
        date,
        daily_cost: data.cost,
        cumulative_cost: cumulativeCost,
        generation_count: data.count
      }))

      return { success: true, data: trends }
    } catch (error) {
      console.error('Error fetching spending trends:', error)
      return { success: false, error: 'Failed to fetch spending trends' }
    }
  }

  /**
   * Get model cost breakdown
   */
  static async getModelCostBreakdown(
    userId: string, 
    days: number = 30
  ): Promise<{ success: boolean; data?: ModelCostBreakdown[]; error?: string }> {
    try {
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)

      const { data, error } = await supabase
        .from('generation_costs')
        .select('model_used, estimated_cost, actual_cost')
        .eq('user_id', userId)
        .gte('created_at', startDate.toISOString())

      if (error) {
        console.error('Error fetching model cost breakdown:', error)
        return { success: false, error: error.message }
      }

      // Process data into model breakdown
      const modelMap = new Map<string, { total_cost: number; count: number }>()
      let totalSpending = 0

      data?.forEach(record => {
        const cost = record.actual_cost || record.estimated_cost || 0
        totalSpending += cost

        if (!modelMap.has(record.model_used)) {
          modelMap.set(record.model_used, { total_cost: 0, count: 0 })
        }

        const modelData = modelMap.get(record.model_used)!
        modelData.total_cost += cost
        modelData.count += 1
      })

      const breakdown: ModelCostBreakdown[] = Array.from(modelMap.entries()).map(([model, data]) => ({
        model,
        total_cost: data.total_cost,
        generation_count: data.count,
        avg_cost: data.total_cost / data.count,
        percentage_of_total: totalSpending > 0 ? (data.total_cost / totalSpending) * 100 : 0
      }))

      // Sort by total cost descending
      breakdown.sort((a, b) => b.total_cost - a.total_cost)

      return { success: true, data: breakdown }
    } catch (error) {
      console.error('Error fetching model cost breakdown:', error)
      return { success: false, error: 'Failed to fetch model cost breakdown' }
    }
  }

  /**
   * Check if user can afford a generation
   */
  static async canAffordGeneration(
    userId: string, 
    estimatedCost: number
  ): Promise<{ success: boolean; canAfford: boolean; reason?: string; error?: string }> {
    try {
      const analyticsResult = await this.getUserSpendingAnalytics(userId)
      
      if (!analyticsResult.success || !analyticsResult.data) {
        return { success: false, canAfford: false, error: 'Failed to fetch spending analytics' }
      }

      const analytics = analyticsResult.data

      // Check daily limit
      if (analytics.daily_limit > 0) {
        const projectedDailySpending = analytics.today_spending + estimatedCost
        if (projectedDailySpending > analytics.daily_limit) {
          return { 
            success: true, 
            canAfford: false, 
            reason: `This generation would exceed your daily limit of $${analytics.daily_limit.toFixed(2)}` 
          }
        }
      }

      // Check weekly limit
      if (analytics.weekly_limit > 0) {
        const projectedWeeklySpending = analytics.week_spending + estimatedCost
        if (projectedWeeklySpending > analytics.weekly_limit) {
          return { 
            success: true, 
            canAfford: false, 
            reason: `This generation would exceed your weekly limit of $${analytics.weekly_limit.toFixed(2)}` 
          }
        }
      }

      // Check monthly limit
      if (analytics.monthly_limit > 0) {
        const projectedMonthlySpending = analytics.month_spending + estimatedCost
        if (projectedMonthlySpending > analytics.monthly_limit) {
          return { 
            success: true, 
            canAfford: false, 
            reason: `This generation would exceed your monthly limit of $${analytics.monthly_limit.toFixed(2)}` 
          }
        }
      }

      return { success: true, canAfford: true }
    } catch (error) {
      console.error('Error checking affordability:', error)
      return { success: false, canAfford: false, error: 'Failed to check affordability' }
    }
  }
}