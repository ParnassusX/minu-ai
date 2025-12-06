'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth/AuthProvider'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Sparkles, Images, Settings, Zap, Clock, Heart, RefreshCw } from 'lucide-react'
import { DashboardLayout } from '@/components/layout/UnifiedLayout'

interface DashboardStats {
  totalImages: number
  recentActivity: number
  favorites: number
  thisMonth: number
}

export default function DashboardPage() {
  const { loading, user } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [statsLoading, setStatsLoading] = useState(true)
  const [statsError, setStatsError] = useState<string | null>(null)

  // Fetch real dashboard statistics
  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return
      
      setStatsLoading(true)
      setStatsError(null)
      
      try {
        // Fetch user stats from API
        const response = await fetch('/api/user/stats')
        
        if (response.ok) {
          const data = await response.json()
          // Handle the nested response structure from /api/user/stats
          const statistics = data.data?.statistics || data.statistics || data
          setStats({
            totalImages: statistics.totalGenerations ?? statistics.totalImages ?? 0,
            recentActivity: statistics.thisWeek ?? statistics.recentActivity ?? 0,
            favorites: statistics.favoriteCount ?? statistics.favorites ?? 0,
            thisMonth: statistics.thisMonth ?? 0
          })
        } else if (response.status === 401) {
          // User not authenticated - redirect to login
          router.push('/auth/login')
        } else {
          // Fallback to gallery count if stats endpoint not available
          const galleryResponse = await fetch('/api/gallery?page=1&limit=1')
          if (galleryResponse.ok) {
            const galleryData = await galleryResponse.json()
            setStats({
              totalImages: galleryData.pagination?.total ?? galleryData.images?.length ?? 0,
              recentActivity: 0,
              favorites: 0,
              thisMonth: 0
            })
          } else {
            setStats({ totalImages: 0, recentActivity: 0, favorites: 0, thisMonth: 0 })
          }
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
        console.error('Error fetching stats:', { error: errorMessage, details: error })
        setStatsError('Unable to load statistics')
        setStats({ totalImages: 0, recentActivity: 0, favorites: 0, thisMonth: 0 })
      } finally {
        setStatsLoading(false)
      }
    }
    
    fetchStats()
  }, [user, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-400" />
          <div className="text-white text-lg">Loading Dashboard...</div>
        </div>
      </div>
    )
  }

  const statsConfig = [
    { 
      title: 'Images Generated', 
      value: statsLoading ? '...' : (stats?.totalImages ?? 0).toString(), 
      icon: Images, 
      color: 'text-blue-500' 
    },
    { 
      title: 'Recent Activity', 
      value: statsLoading ? '...' : (stats?.recentActivity ?? 0).toString(), 
      icon: Zap, 
      color: 'text-green-500' 
    },
    { 
      title: 'Favorites', 
      value: statsLoading ? '...' : (stats?.favorites ?? 0).toString(), 
      icon: Heart, 
      color: 'text-red-500' 
    },
    { 
      title: 'This Month', 
      value: statsLoading ? '...' : (stats?.thisMonth ?? 0).toString(), 
      icon: Clock, 
      color: 'text-purple-500' 
    },
  ]

  const quickActions = [
    { title: 'Generate Image', href: '/generator', icon: Sparkles, color: 'bg-blue-500' },
    { title: 'View Gallery', href: '/gallery', icon: Images, color: 'bg-green-500' },
    { title: 'Settings', href: '/settings', icon: Settings, color: 'bg-gray-500' },
  ]

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Welcome{user?.user_metadata?.full_name ? `, ${user.user_metadata.full_name}` : ''} to Minu.AI
          </h1>
          <p className="text-gray-300">Your AI-powered creative workspace</p>
        </div>
        
        {statsError && (
          <div className="mb-4 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <p className="text-yellow-400 text-sm">{statsError}</p>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statsConfig.map((stat, index) => (
            <Card key={index} className="bg-white/10 backdrop-blur-md border-white/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-300 text-sm">{stat.title}</p>
                    <p className="text-2xl font-bold text-white">{stat.value}</p>
                  </div>
                  <stat.icon className={`w-8 h-8 ${stat.color}`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="bg-white/10 backdrop-blur-md border-white/20 mb-8">
          <CardHeader>
            <CardTitle className="text-white">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {quickActions.map((action, index) => (
                <Button
                  key={index}
                  onClick={() => router.push(action.href)}
                  className={`${action.color} hover:opacity-90 text-white p-6 h-auto flex flex-col items-center gap-2`}
                >
                  <action.icon className="w-6 h-6" />
                  {action.title}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
