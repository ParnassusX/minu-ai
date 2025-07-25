'use client';

import React, { useState, useEffect } from 'react';
import { AlertTriangle, DollarSign, X, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import useCostTracking from '../../hooks/useCostTracking';

interface CostAlertProps {
  className?: string;
  autoRefresh?: boolean;
  refreshInterval?: number; // in milliseconds
}

export function CostAlert({ 
  className, 
  autoRefresh = true, 
  refreshInterval = 30000 // 30 seconds
}: CostAlertProps) {
  const { limits, fetchLimits, loading, error } = useCostTracking();
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchLimits();
  }, [fetchLimits]);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        fetchLimits();
      }, refreshInterval);

      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval, fetchLimits]);

  if (loading || error || !limits) {
    return null;
  }

  const alerts = [];

  // Daily limit alerts
  if (limits.dailyLimit.exceeded && !dismissed.has('daily-exceeded')) {
    alerts.push({
      id: 'daily-exceeded',
      type: 'error' as const,
      title: 'Daily Spending Limit Exceeded',
      message: `You've spent $${limits.dailyLimit.current.toFixed(2)} today, exceeding your $${limits.dailyLimit.limit.toFixed(2)} daily limit.`,
      icon: AlertTriangle
    });
  } else if (limits.dailyLimit.current > limits.dailyLimit.limit * 0.8 && !dismissed.has('daily-warning')) {
    alerts.push({
      id: 'daily-warning',
      type: 'warning' as const,
      title: 'Approaching Daily Limit',
      message: `You've spent $${limits.dailyLimit.current.toFixed(2)} of your $${limits.dailyLimit.limit.toFixed(2)} daily limit.`,
      icon: TrendingUp
    });
  }

  // Monthly limit alerts
  if (limits.monthlyLimit.exceeded && !dismissed.has('monthly-exceeded')) {
    alerts.push({
      id: 'monthly-exceeded',
      type: 'error' as const,
      title: 'Monthly Spending Limit Exceeded',
      message: `You've spent $${limits.monthlyLimit.current.toFixed(2)} this month, exceeding your $${limits.monthlyLimit.limit.toFixed(2)} monthly limit.`,
      icon: AlertTriangle
    });
  } else if (limits.monthlyLimit.current > limits.monthlyLimit.limit * 0.8 && !dismissed.has('monthly-warning')) {
    alerts.push({
      id: 'monthly-warning',
      type: 'warning' as const,
      title: 'Approaching Monthly Limit',
      message: `You've spent $${limits.monthlyLimit.current.toFixed(2)} of your $${limits.monthlyLimit.limit.toFixed(2)} monthly limit.`,
      icon: TrendingUp
    });
  }

  // Custom warnings from the service
  limits.warnings.forEach((warning: string, index: number) => {
    const id = `warning-${index}`;
    if (!dismissed.has(id)) {
      alerts.push({
        id,
        type: 'warning' as const,
        title: 'Spending Alert',
        message: warning,
        icon: DollarSign
      });
    }
  });

  if (alerts.length === 0) {
    return null;
  }

  const handleDismiss = (alertId: string) => {
    setDismissed(prev => new Set([...prev, alertId]));
  };

  const alertTypeClasses = {
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800'
  };

  const iconTypeClasses = {
    error: 'text-red-500',
    warning: 'text-yellow-500',
    info: 'text-blue-500'
  };

  return (
    <div className={cn('space-y-3', className)}>
      {alerts.map((alert) => {
        const Icon = alert.icon;
        return (
          <div
            key={alert.id}
            className={cn(
              'flex items-start gap-3 p-4 rounded-lg border',
              alertTypeClasses[alert.type]
            )}
          >
            <Icon className={cn('h-5 w-5 mt-0.5 flex-shrink-0', iconTypeClasses[alert.type])} />
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-sm">{alert.title}</h4>
              <p className="text-sm opacity-90 mt-1">{alert.message}</p>
            </div>
            <button
              onClick={() => handleDismiss(alert.id)}
              className="flex-shrink-0 p-1 rounded-md hover:bg-black/5 transition-colors"
              aria-label="Dismiss alert"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

export default CostAlert;