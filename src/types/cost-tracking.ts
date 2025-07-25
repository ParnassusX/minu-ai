// Cost Tracking Types for Minu.AI

export interface CostRecord {
  id?: string;
  userId: string;
  generationType: 'image' | 'video' | 'enhancement' | 'prompt-attempt';
  generationId: string;
  modelUsed: string;
  estimatedCost: number;
  actualCost: number;
  provider: 'replicate' | 'bytedance' | 'flux' | 'other';
  parameters: Record<string, any>;
  generationTime: number;
  createdAt: Date;
  updatedAt: Date;
  billingStatus: 'pending' | 'confirmed' | 'error';
  providerTransactionId?: string;
}

export interface GenerationCost {
  id: string
  user_id: string
  generation_type: 'image' | 'video' | 'image-edit' | 'prompt-attempt'
  generation_id: string
  model_used: string
  estimated_cost: number
  actual_cost?: number
  cost_currency: string
  provider: string
  provider_transaction_id?: string
  parameters: Record<string, any>
  generation_time?: number
  tokens_used?: number
  compute_units?: number
  base_cost: number
  parameter_cost: number
  priority_cost: number
  billing_status: 'pending' | 'confirmed' | 'disputed' | 'refunded'
  billed_at?: string
  created_at: string
  updated_at: string
}

export interface UserSpendingLimits {
  id: string
  user_id: string
  daily_limit: number
  weekly_limit: number
  monthly_limit: number
  daily_alert_threshold: number
  weekly_alert_threshold: number
  monthly_alert_threshold: number
  enforce_daily_limit: boolean
  enforce_weekly_limit: boolean
  enforce_monthly_limit: boolean
  email_alerts: boolean
  push_alerts: boolean
  created_at: string
  updated_at: string
}

export interface CostAlert {
  id: string
  user_id: string
  alert_type: 'threshold_warning' | 'limit_exceeded' | 'unusual_spending' | 'cost_spike'
  alert_level: 'info' | 'warning' | 'critical'
  period_type: 'daily' | 'weekly' | 'monthly'
  current_spending: number
  limit_amount: number
  threshold_percentage?: number
  title: string
  message: string
  is_read: boolean
  is_dismissed: boolean
  created_at: string
  updated_at: string
}

export interface UserSpendingAnalytics {
  user_id: string
  email: string
  today_spending: number
  week_spending: number
  month_spending: number
  total_generations_30d: number
  avg_daily_spending: number
  most_used_model?: string
  most_expensive_model?: string
  daily_limit: number
  weekly_limit: number
  monthly_limit: number
  daily_limit_used_percent: number
  weekly_limit_used_percent: number
  monthly_limit_used_percent: number
  unread_alerts: number
  last_generation_at?: string
}

export interface CostEstimate {
  model: string
  estimated_cost: number
  cost_breakdown: {
    base_cost: number
    parameter_cost: number
    priority_cost: number
  }
  cost_factors: {
    resolution?: string
    duration?: number
    quality_settings?: string
    batch_size?: number
  }
}

export interface SpendingPeriod {
  period: 'daily' | 'weekly' | 'monthly'
  start_date: string
  end_date: string
  total_spending: number
  generation_count: number
  avg_cost_per_generation: number
  models_used: string[]
}

export interface ModelCostBreakdown {
  model: string
  total_cost: number
  generation_count: number
  avg_cost: number
  percentage_of_total: number
}

export interface CostTrend {
  date: string
  daily_cost: number
  cumulative_cost: number
  generation_count: number
}

// API Request/Response Types
export interface RecordCostRequest {
  user_id: string
  generation_type: GenerationCost['generation_type']
  generation_id: string
  model_used: string
  estimated_cost: number
  provider?: string
  parameters?: Record<string, any>
  generation_time?: number
  provider_transaction_id?: string
}

export interface UpdateCostRequest {
  cost_record_id: string
  actual_cost: number
  billing_status?: GenerationCost['billing_status']
}

export interface SpendingLimitsUpdateRequest {
  daily_limit?: number
  weekly_limit?: number
  monthly_limit?: number
  daily_alert_threshold?: number
  weekly_alert_threshold?: number
  monthly_alert_threshold?: number
  enforce_daily_limit?: boolean
  enforce_weekly_limit?: boolean
  enforce_monthly_limit?: boolean
  email_alerts?: boolean
  push_alerts?: boolean
}

export interface CostAnalyticsQuery {
  user_id: string
  period?: 'day' | 'week' | 'month' | 'year'
  start_date?: string
  end_date?: string
  model_filter?: string[]
  generation_type_filter?: GenerationCost['generation_type'][]
}

// Utility Types
export type CostPeriod = 'today' | 'week' | 'month' | 'year' | 'all-time'
export type AlertSeverity = CostAlert['alert_level']
export type BillingStatus = GenerationCost['billing_status']
export type GenerationType = GenerationCost['generation_type']

// Constants
export const DEFAULT_SPENDING_LIMITS: Omit<UserSpendingLimits, 'id' | 'user_id' | 'created_at' | 'updated_at'> = {
  daily_limit: 10.00,
  weekly_limit: 50.00,
  monthly_limit: 200.00,
  daily_alert_threshold: 80.00,
  weekly_alert_threshold: 80.00,
  monthly_alert_threshold: 80.00,
  enforce_daily_limit: false,
  enforce_weekly_limit: false,
  enforce_monthly_limit: true,
  email_alerts: true,
  push_alerts: true
}

export const COST_ALERT_COLORS = {
  info: '#3B82F6',
  warning: '#F59E0B',
  critical: '#EF4444'
} as const

export const GENERATION_TYPE_LABELS = {
  image: 'Image Generation',
  video: 'Video Generation',
  'image-edit': 'Image Editing',
  'prompt-attempt': 'Prompt Processing'
} as const