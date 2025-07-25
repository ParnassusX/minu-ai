'use client'

import { GlassCard, PremiumSkeleton } from '@/components/ui/premium-glass'

export function DashboardSkeleton() {
  return (
    <div className="max-w-4xl mx-auto py-12 space-y-8">
      {/* Header Skeleton */}
      <GlassCard variant="skeleton" size="xl" animation="fadeIn">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <PremiumSkeleton variant="shimmer" size="xl" shape="circle" />
            <PremiumSkeleton variant="wave" size="xl" className="w-64" />
          </div>
          <PremiumSkeleton variant="pulse" size="md" className="w-96 mx-auto" />
          
          <div className="flex gap-3 justify-center mt-6">
            <PremiumSkeleton variant="shimmer" size="lg" className="w-32" shape="pill" />
            <PremiumSkeleton variant="shimmer" size="lg" className="w-32" shape="pill" />
          </div>
        </div>
      </GlassCard>

      {/* Stats Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <GlassCard 
            key={index}
            variant="skeleton" 
            size="md" 
            animation="scaleIn"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1 space-y-2">
                <PremiumSkeleton variant="pulse" size="sm" className="w-24" />
                <PremiumSkeleton variant="wave" size="lg" className="w-16" />
              </div>
              <PremiumSkeleton variant="shimmer" size="xl" shape="circle" />
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Quick Actions Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, index) => (
          <GlassCard 
            key={index}
            variant="skeleton" 
            size="lg" 
            animation="slideUp"
            style={{ animationDelay: `${index * 150}ms` }}
          >
            <div className="space-y-4">
              <PremiumSkeleton variant="shimmer" size="2xl" shape="circle" className="w-16 h-16" />
              <div className="space-y-2">
                <PremiumSkeleton variant="wave" size="md" className="w-32" />
                <PremiumSkeleton variant="pulse" size="sm" className="w-full" />
                <PremiumSkeleton variant="pulse" size="sm" className="w-3/4" />
              </div>
              <PremiumSkeleton variant="shimmer" size="lg" className="w-full" shape="pill" />
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Recent Activity Skeleton */}
      <GlassCard variant="skeleton" size="lg" animation="fadeIn">
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <PremiumSkeleton variant="pulse" size="sm" shape="circle" className="w-2 h-2" />
            <PremiumSkeleton variant="wave" size="lg" className="w-48" />
          </div>
          
          <div className="text-center py-12 space-y-4">
            <PremiumSkeleton variant="shimmer" size="2xl" shape="circle" className="w-16 h-16 mx-auto" />
            <PremiumSkeleton variant="wave" size="md" className="w-64 mx-auto" />
            <PremiumSkeleton variant="pulse" size="sm" className="w-96 mx-auto" />
            <PremiumSkeleton variant="shimmer" size="lg" className="w-48 mx-auto" shape="pill" />
          </div>
        </div>
      </GlassCard>
    </div>
  )
}

export function DashboardLoadingCard({ 
  title, 
  delay = 0 
}: { 
  title: string
  delay?: number 
}) {
  return (
    <GlassCard 
      variant="skeleton" 
      size="md" 
      animation="scaleIn"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="space-y-3">
        <PremiumSkeleton variant="pulse" size="sm" className="w-24" />
        <PremiumSkeleton variant="wave" size="md" className="w-full" />
        <div className="flex justify-between items-center">
          <PremiumSkeleton variant="shimmer" size="lg" className="w-20" />
          <PremiumSkeleton variant="pulse" size="lg" shape="circle" />
        </div>
      </div>
    </GlassCard>
  )
}

export function DashboardQuickActionSkeleton({ delay = 0 }: { delay?: number }) {
  return (
    <GlassCard 
      variant="skeleton" 
      size="lg" 
      animation="slideUp"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="space-y-4">
        <PremiumSkeleton variant="shimmer" size="2xl" shape="circle" className="w-16 h-16" />
        <div className="space-y-2">
          <PremiumSkeleton variant="wave" size="md" className="w-32" />
          <PremiumSkeleton variant="pulse" size="sm" className="w-full" />
        </div>
        <PremiumSkeleton variant="shimmer" size="lg" className="w-full" shape="pill" />
      </div>
    </GlassCard>
  )
}
