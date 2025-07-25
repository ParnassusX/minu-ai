'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface CostBadgeProps {
  cost: number;
  provider?: 'replicate' | 'bytedance' | 'flux' | 'other';
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'success' | 'warning' | 'error';
  showProvider?: boolean;
  className?: string;
}

const providerColors = {
  replicate: 'bg-blue-100 text-blue-800 border-blue-200',
  bytedance: 'bg-purple-100 text-purple-800 border-purple-200',
  flux: 'bg-green-100 text-green-800 border-green-200',
  other: 'bg-gray-100 text-gray-800 border-gray-200'
};

const providerNames = {
  replicate: 'Replicate',
  bytedance: 'ByteDance',
  flux: 'Flux',
  other: 'Other'
};

const sizeClasses = {
  sm: 'px-2 py-1 text-xs',
  md: 'px-3 py-1.5 text-sm',
  lg: 'px-4 py-2 text-base'
};

const variantClasses = {
  default: 'bg-gray-100 text-gray-800 border-gray-200',
  success: 'bg-green-100 text-green-800 border-green-200',
  warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  error: 'bg-red-100 text-red-800 border-red-200'
};

export function CostBadge({
  cost,
  provider,
  size = 'md',
  variant = 'default',
  showProvider = false,
  className
}: CostBadgeProps) {
  const formatCost = (cost: number) => {
    if (cost < 0.01) {
      return `$${(cost * 1000).toFixed(1)}m`; // Show in millidollars for very small amounts
    }
    return `$${cost.toFixed(3)}`;
  };

  const badgeClasses = cn(
    'inline-flex items-center gap-1.5 rounded-full border font-medium transition-colors',
    sizeClasses[size],
    provider && !variant ? providerColors[provider] : variantClasses[variant],
    className
  );

  return (
    <span className={badgeClasses}>
      <span className="flex items-center gap-1">
        <span className="font-mono">{formatCost(cost)}</span>
        {showProvider && provider && (
          <>
            <span className="text-gray-400">•</span>
            <span className="text-xs opacity-75">{providerNames[provider]}</span>
          </>
        )}
      </span>
    </span>
  );
}

export default CostBadge;