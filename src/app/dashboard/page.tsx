'use client'

import { useAuth } from '@/lib/auth/AuthProvider'
import { UnifiedLayout } from '@/components/layout/UnifiedLayout'
import { GlassCard, PremiumButton } from '@/components/ui/premium-glass'
import { Icons } from '@/components/ui/premium-icons'
import { Typography } from '@/components/ui/typography'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

// Dashboard statistics interface
interface DashboardStats {
  totalImages: number
  recentActivity: number
  favorites: number
  thisMonth: number
  dailySpending: number
  monthlySpending: number
}

export default function DashboardPage() {
  const { profile, loading } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats>({
    totalImages: 0,
    recentActivity: 0,
    favorites: 0,
    thisMonth: 0,
    dailySpending: 0,
    monthlySpending: 0
  })
  const [loadingStats, setLoadingStats] = useState(true)

  // Fetch dashboard statistics
  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        setLoadingStats(true)

        // Fetch gallery statistics
        const galleryResponse = await fetch('/api/gallery?page=1&limit=1000')
        if (galleryResponse.ok) {
          const galleryData = await galleryResponse.json()
          const images = galleryData.images || []

          // Calculate statistics
          const now = new Date()
          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
          const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000)

          const totalImages = images.length
          const recentActivity = images.filter((img: any) =>
            new Date(img.timestamp) > last24Hours
          ).length
          const favorites = images.filter((img: any) => img.favorite).length
          const thisMonth = images.filter((img: any) =>
            new Date(img.timestamp) > startOfMonth
          ).length

          // Calculate spending (sum of cost fields from gallery data)
          const dailySpending = images
            .filter((img: any) => new Date(img.timestamp) > last24Hours)
            .reduce((sum: number, img: any) => sum + (img.cost || 0), 0)
          const monthlySpending = images
            .filter((img: any) => new Date(img.timestamp) > startOfMonth)
            .reduce((sum: number, img: any) => sum + (img.cost || 0), 0)

          // Fetch additional Replicate API usage data if available
          try {
            const replicateResponse = await fetch('/api/replicate/usage')
            if (replicateResponse.ok) {
              const usageData = await replicateResponse.json()
              // Add Replicate API costs to our calculations if available
              // This would require implementing the /api/replicate/usage endpoint
            }
          } catch (replicateError) {
            console.log('Replicate usage data not available:', replicateError)
          }

          setStats({
            totalImages,
            recentActivity,
            favorites,
            thisMonth,
            dailySpending,
            monthlySpending
          })
        }
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error)
      } finally {
        setLoadingStats(false)
      }
    }

    fetchDashboardStats()
  }, [])

  // SECURITY: Removed development mode authentication bypass
  // All environments now require proper authentication

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full blur-sm opacity-75 animate-pulse"></div>
              <div className="relative animate-spin rounded-full h-16 w-16 border-4 border-transparent bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-border">
                <div className="absolute inset-2 bg-white rounded-full"></div>
              </div>
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                Loading Dashboard
              </h3>
              <p className="text-sm text-gray-500 mt-1">Preparing your creative workspace...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const quickActions = [
    {
      title: 'Generate Image',
      description: 'Create a new AI-generated image',
      icon: 'generator',
      href: '/generator',
      variant: 'primary' as const,
    },
    {
      title: 'Build Prompt',
      description: 'Use templates and suggestions',
      icon: 'prompts',
      href: '/prompt-builder',
      variant: 'secondary' as const,
    },
    {
      title: 'View Gallery',
      description: 'Browse your creations',
      icon: 'gallery',
      href: '/gallery',
      variant: 'success' as const,
    },
  ]

  const statsData = [
    {
      title: 'Images Generated',
      value: loadingStats ? '...' : stats.totalImages.toString(),
      icon: 'zap',
      variant: 'primary' as const,
    },
    {
      title: 'Recent Activity',
      value: loadingStats ? '...' : stats.recentActivity.toString(),
      icon: 'clock',
      variant: 'secondary' as const,
    },
    {
      title: 'Favorites',
      value: loadingStats ? '...' : stats.favorites.toString(),
      icon: 'heart',
      variant: 'error' as const,
    },
    {
      title: 'This Month',
      value: loadingStats ? '...' : stats.thisMonth.toString(),
      icon: 'trending',
      variant: 'success' as const,
    },
    {
      title: 'Daily Spending',
      value: loadingStats ? '...' : `$${stats.dailySpending.toFixed(3)}`,
      icon: 'dollar',
      variant: 'warning' as const,
    },
    {
      title: 'Monthly Spending',
      value: loadingStats ? '...' : `$${stats.monthlySpending.toFixed(2)}`,
      icon: 'clock',
      variant: 'accent' as const,
    },
  ]

  return (
    <UnifiedLayout>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
        <div className="w-full mx-auto py-4 sm:py-6 lg:py-8 px-3 sm:px-4 lg:px-6 space-y-4 sm:space-y-6">
        {/* Premium Welcome Header - Phase 3 Enhanced */}
        <GlassCard
          variant="luxury"
          size="xl"
          animation="slideUp"
          glow="prominent"
          focus="premium"
          className="text-center"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 animate-pulse">
              <Icons.dashboard size="xl" variant="glass" className="text-white" />
            </div>
            <Typography variant="display" color="high-contrast">
              Welcome to Minu.AI Dashboard
            </Typography>
          </div>
          <Typography variant="body-lg" color="medium-contrast">
            Your premium AI image generation workspace
          </Typography>

          <div className="flex gap-3 justify-center mt-6">
            <PremiumButton
              variant="luxury"
              size="lg"
              animation="shimmer"
              onClick={() => router.push('/generator')}
              className="shadow-lg"
            >
              <Icons.generator size="sm" className="mr-2" />
              Start Creating
            </PremiumButton>
            <PremiumButton
              variant="glass"
              size="lg"
              animation="lift"
              onClick={() => router.push('/gallery')}
            >
              <Icons.gallery size="sm" className="mr-2" />
              View Gallery
            </PremiumButton>
          </div>
        </GlassCard>

        {/* Premium Stats Grid - Phase 3 Enhanced */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {statsData.map((stat, index) => (
            <GlassCard
              key={stat.title}
              variant="floating"
              size="md"
              animation="scaleIn"
              glow="subtle"
              focus="ring"
              className="hover:shadow-glass-2xl transition-all duration-500 group"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <Typography variant="body-sm" color="medium-contrast" className="font-medium mb-2">
                    {stat.title}
                  </Typography>
                  <Typography variant="h4" color="high-contrast" className="group-hover:scale-105 transition-transform duration-300">
                    {loadingStats ? (
                      <div className="w-16 h-8 bg-gradient-to-r from-surface-glass/30 via-surface-glass/50 to-surface-glass/30 animate-pulse rounded" />
                    ) : (
                      stat.value
                    )}
                  </Typography>
                </div>
                <div className="p-3 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 group-hover:scale-110 transition-transform duration-300">
                  {stat.icon === 'zap' && <Icons.zap size="lg" variant={stat.variant} />}
                  {stat.icon === 'clock' && <Icons.clock size="lg" variant={stat.variant} />}
                  {stat.icon === 'heart' && <Icons.heart size="lg" variant={stat.variant} />}
                  {stat.icon === 'trending' && <Icons.trending size="lg" variant={stat.variant} />}
                  {stat.icon === 'dollar' && <Icons.dollar size="lg" variant={stat.variant} />}
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
        </div>
      </div>
    </UnifiedLayout>
  )
}
