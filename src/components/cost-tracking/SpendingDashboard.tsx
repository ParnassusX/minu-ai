'use client';

import React, { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, Calendar, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import useCostTracking from '../../hooks/useCostTracking';
import CostBadge from './CostBadge';

interface SpendingDashboardProps {
  className?: string;
  days?: number;
}

export function SpendingDashboard({ className, days = 30 }: SpendingDashboardProps) {
  const { analytics, summary, fetchAnalytics, fetchSummary, loading } = useCostTracking();
  const [selectedPeriod, setSelectedPeriod] = useState(days);

  useEffect(() => {
    fetchAnalytics(selectedPeriod);
    fetchSummary();
  }, [fetchAnalytics, fetchSummary, selectedPeriod]);

  if (loading) {
    return (
      <div className={cn('p-6 bg-white rounded-lg border', className)}>
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!analytics || !summary) {
    return null;
  }

  const periods = [
    { value: 7, label: '7 days' },
    { value: 30, label: '30 days' },
    { value: 90, label: '90 days' }
  ];

  return (
    <div className={cn('p-6 bg-white rounded-lg border space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Spending Overview</h3>
        <div className="flex gap-2">
          {periods.map(period => (
            <button
              key={period.value}
              onClick={() => setSelectedPeriod(period.value)}
              className={cn(
                'px-3 py-1 text-sm rounded-md transition-colors',
                selectedPeriod === period.value
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              )}
            >
              {period.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center gap-3">
            <DollarSign className="h-8 w-8 text-blue-600" />
            <div>
              <p className="text-sm text-blue-600 font-medium">Total Spent</p>
              <p className="text-2xl font-bold text-blue-900">
                ${analytics.totalSpent.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
          <div className="flex items-center gap-3">
            <Zap className="h-8 w-8 text-green-600" />
            <div>
              <p className="text-sm text-green-600 font-medium">Avg per Generation</p>
              <p className="text-2xl font-bold text-green-900">
                ${analytics.averageCostPerGeneration.toFixed(3)}
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
          <div className="flex items-center gap-3">
            <TrendingUp className="h-8 w-8 text-purple-600" />
            <div>
              <p className="text-sm text-purple-600 font-medium">Total Generations</p>
              <p className="text-2xl font-bold text-purple-900">
                {analytics.dailySpending.reduce((sum: number, day: any) => sum + day.count, 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Provider Breakdown */}
      <div>
        <h4 className="text-md font-medium text-gray-900 mb-3">By Provider</h4>
        <div className="space-y-2">
          {analytics.providerBreakdown.map((provider: any) => (
            <div key={provider.provider} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="capitalize font-medium text-gray-900">
                  {provider.provider}
                </div>
                <span className="text-sm text-gray-500">
                  {provider.count} generations
                </span>
              </div>
              <CostBadge 
                cost={provider.cost} 
                provider={provider.provider as any}
                size="sm"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Model Breakdown */}
      <div>
        <h4 className="text-md font-medium text-gray-900 mb-3">Top Models</h4>
        <div className="space-y-2">
          {analytics.modelBreakdown
            .sort((a: any, b: any) => b.cost - a.cost)
            .slice(0, 5)
            .map((model: any) => (
              <div key={model.model} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="font-medium text-gray-900 text-sm">
                    {model.model.split('/').pop() || model.model}
                  </div>
                  <span className="text-sm text-gray-500">
                    {model.count}x
                  </span>
                </div>
                <CostBadge cost={model.cost} size="sm" />
              </div>
            ))}
        </div>
      </div>

      {/* Daily Spending Chart (Simple) */}
      <div>
        <h4 className="text-md font-medium text-gray-900 mb-3">Daily Spending</h4>
        <div className="space-y-1">
          {analytics.dailySpending.slice(-7).map((day: any) => {
            const maxAmount = Math.max(...analytics.dailySpending.map((d: any) => d.amount));
            const percentage = maxAmount > 0 ? (day.amount / maxAmount) * 100 : 0;
            
            return (
              <div key={day.date} className="flex items-center gap-3">
                <div className="w-16 text-xs text-gray-500">
                  {new Date(day.date).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </div>
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <div className="w-16 text-xs text-right">
                  ${day.amount.toFixed(2)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default SpendingDashboard;