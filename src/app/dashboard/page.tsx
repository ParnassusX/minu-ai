'use client'

import { useAuth } from '@/lib/auth/AuthProvider'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Sparkles, Images, Settings, Zap, Clock, Heart } from 'lucide-react'
import { DashboardLayout } from '@/components/layout/UnifiedLayout'

export default function DashboardPage() {
  const { loading } = useAuth()
  const router = useRouter()

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center">
        <div className="text-white text-lg">Loading Dashboard...</div>
      </div>
    )
  }

  const stats = [
    { title: 'Images Generated', value: '42', icon: Images, color: 'text-blue-500' },
    { title: 'Recent Activity', value: '7', icon: Zap, color: 'text-green-500' },
    { title: 'Favorites', value: '12', icon: Heart, color: 'text-red-500' },
    { title: 'This Month', value: '28', icon: Clock, color: 'text-purple-500' },
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
          <h1 className="text-4xl font-bold text-white mb-2">Welcome to Minu.AI</h1>
          <p className="text-gray-300">Your AI-powered creative workspace</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
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
