'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth/AuthProvider'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Shield, Users, Database, Settings, Activity, AlertTriangle } from 'lucide-react'
import { DashboardLayout } from '@/components/layout/UnifiedLayout'

export default function AdminPage() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()
  const [users, setUsers] = useState([])
  const [systemStats, setSystemStats] = useState({
    totalUsers: 0,
    totalGenerations: 0,
    totalCost: 0,
    activeUsers: 0
  })
  const [loadingData, setLoadingData] = useState(true)

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center">
        <div className="text-white text-lg">Loading Admin Dashboard...</div>
      </div>
    )
  }

  if (!user) {
    router.push('/auth/login?redirect=/admin')
    return null
  }

  // Check if user has admin access
  if (profile?.role !== 'admin' && profile?.role !== 'developer') {
    return (
      <DashboardLayout>
        <div className="container mx-auto px-4 py-8">
          <Card className="bg-red-500/10 backdrop-blur-md border-red-500/20">
            <CardContent className="p-8 text-center">
              <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
              <p className="text-gray-300 mb-4">You don't have permission to access the admin dashboard.</p>
              <Button onClick={() => router.push('/dashboard')} className="bg-blue-500 hover:bg-blue-600">
                Go to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    )
  }

  const adminStats = [
    { title: 'Total Users', value: '156', icon: Users, color: 'text-blue-500' },
    { title: 'Images Generated', value: '2,847', icon: Database, color: 'text-green-500' },
    { title: 'System Health', value: '98%', icon: Activity, color: 'text-purple-500' },
    { title: 'Active Sessions', value: '23', icon: Shield, color: 'text-orange-500' },
  ]

  const adminActions = [
    { title: 'User Management', href: '/admin/users', icon: Users, color: 'bg-blue-500', description: 'Manage user accounts and permissions' },
    { title: 'System Settings', href: '/admin/settings', icon: Settings, color: 'bg-green-500', description: 'Configure system-wide settings' },
    { title: 'Database Admin', href: '/admin/database', icon: Database, color: 'bg-purple-500', description: 'Database management and monitoring' },
    { title: 'System Health', href: '/admin/health', icon: Activity, color: 'bg-orange-500', description: 'Monitor system performance and health' },
  ]

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Admin Dashboard</h1>
          <p className="text-gray-300">System administration and management</p>
        </div>

        {/* Admin Badge */}
        <Card className="bg-gradient-to-r from-red-500/10 to-orange-500/10 backdrop-blur-md border-red-500/20 mb-8">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <Shield className="w-12 h-12 text-red-500" />
              <div>
                <h2 className="text-xl font-bold text-white">Administrator Access</h2>
                <p className="text-gray-300">You have full system administration privileges</p>
              </div>
              <Badge variant="destructive" className="ml-auto">
                {profile?.role?.toUpperCase()}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {adminStats.map((stat, index) => (
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

        {/* Admin Actions */}
        <Card className="bg-white/10 backdrop-blur-md border-white/20 mb-8">
          <CardHeader>
            <CardTitle className="text-white">Administration Tools</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {adminActions.map((action, index) => (
                <Card key={index} className="bg-white/5 border-white/10 hover:bg-white/10 transition-colors cursor-pointer"
                      onClick={() => router.push(action.href)}>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-lg ${action.color}`}>
                        <action.icon className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-white mb-1">{action.title}</h3>
                        <p className="text-gray-400 text-sm">{action.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* System Status */}
        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Activity className="w-5 h-5" />
              System Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center justify-between p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                <span className="text-white">API Services</span>
                <Badge className="bg-green-500 text-white">Online</Badge>
              </div>
              <div className="flex items-center justify-between p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                <span className="text-white">Database</span>
                <Badge className="bg-green-500 text-white">Healthy</Badge>
              </div>
              <div className="flex items-center justify-between p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                <span className="text-white">Storage</span>
                <Badge className="bg-green-500 text-white">Available</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
