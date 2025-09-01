'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth/AuthProvider'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  User, Mail, Calendar, Settings, Edit, Shield, Key,
  TrendingUp, Image, Folder, FileText, Eye, EyeOff,
  Save, RefreshCw, Trash2, Plus, Activity
} from 'lucide-react'
import { DashboardLayout } from '@/components/layout/UnifiedLayout'

interface UserStats {
  totalGenerations: number
  thisMonth: number
  thisWeek: number
  totalCost: number
  costThisMonth: number
  averageGenerationTime: number
  favoriteCount: number
  favoriteModel: string
  recentActivity: Array<{
    id: string
    model: string
    cost: number
    prompt: string
    created_at: string
  }>
}

interface ApiKey {
  id: string
  name: string
  service: string
  description: string
  is_active: boolean
  masked_key: string
  created_at: string
  last_used: string | null
}

export default function ProfilePage() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()

  // State management
  const [userStats, setUserStats] = useState<UserStats | null>(null)
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')

  // Profile editing state
  const [editingProfile, setEditingProfile] = useState(false)
  const [profileForm, setProfileForm] = useState({
    full_name: '',
    preferences: {
      theme: 'dark',
      defaultModel: 'flux-schnell',
      autoSave: true,
      notifications: {
        email: true,
        push: false,
        marketing: false
      },
      privacy: {
        profileVisible: false,
        showActivity: false
      }
    }
  })

  // API key management state
  const [showApiKeyForm, setShowApiKeyForm] = useState(false)
  const [apiKeyForm, setApiKeyForm] = useState({
    name: '',
    service: 'replicate',
    key: '',
    description: ''
  })

  // Data fetching
  useEffect(() => {
    if (user && profile) {
      setProfileForm({
        full_name: profile.full_name || '',
        preferences: (profile.preferences as any) || profileForm.preferences
      })
      fetchUserStats()
      fetchApiKeys()
    }
  }, [user, profile])

  const fetchUserStats = async () => {
    try {
      const response = await fetch('/api/user/stats')
      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setUserStats(result.data.statistics)
        }
      }
    } catch (error) {
      console.error('Failed to fetch user stats:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchApiKeys = async () => {
    try {
      const response = await fetch('/api/user/api-keys')
      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setApiKeys(result.data)
        }
      }
    } catch (error) {
      console.error('Failed to fetch API keys:', error)
    }
  }

  const updateProfile = async () => {
    setIsUpdating(true)
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileForm)
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setEditingProfile(false)
          // Refresh auth context
          window.location.reload()
        }
      }
    } catch (error) {
      console.error('Failed to update profile:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  const addApiKey = async () => {
    try {
      const response = await fetch('/api/user/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apiKeyForm)
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setApiKeys([...apiKeys, result.data])
          setApiKeyForm({ name: '', service: 'replicate', key: '', description: '' })
          setShowApiKeyForm(false)
        }
      }
    } catch (error) {
      console.error('Failed to add API key:', error)
    }
  }

  const deleteApiKey = async (keyId: string) => {
    try {
      const response = await fetch(`/api/user/api-keys?id=${keyId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setApiKeys(apiKeys.filter(key => key.id !== keyId))
      }
    } catch (error) {
      console.error('Failed to delete API key:', error)
    }
  }

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center">
        <div className="text-white text-lg flex items-center gap-2">
          <RefreshCw className="w-5 h-5 animate-spin" />
          Loading Profile...
        </div>
      </div>
    )
  }

  if (!user) {
    router.push('/auth/login?redirect=/profile')
    return null
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const statsCards = [
    {
      title: 'Images Generated',
      value: userStats?.totalGenerations?.toString() || '0',
      icon: Image,
      color: 'text-blue-500'
    },
    {
      title: 'This Month',
      value: userStats?.thisMonth?.toString() || '0',
      icon: TrendingUp,
      color: 'text-green-500'
    },
    {
      title: 'Total Cost',
      value: `$${userStats?.totalCost?.toFixed(2) || '0.00'}`,
      icon: Activity,
      color: 'text-purple-500'
    },
  ]

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Profile</h1>
          <p className="text-gray-300">Manage your account and preferences</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-white/10 backdrop-blur-md">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="api-keys">API Keys</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-8">
            {/* Profile Header */}
            <Card className="bg-white/10 backdrop-blur-md border-white/20">
              <CardContent className="p-8">
                <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                  <Avatar className="w-24 h-24">
                    <AvatarImage src={user.user_metadata?.avatar_url} />
                    <AvatarFallback className="text-2xl bg-blue-500 text-white">
                      {getInitials(profile?.full_name || user.email?.split('@')[0] || 'U')}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 text-center md:text-left">
                    <h2 className="text-2xl font-bold text-white mb-2">
                      {profile?.full_name || user.email?.split('@')[0] || 'User'}
                    </h2>
                    <p className="text-gray-300 mb-4">{user.email}</p>

                    <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                      <Badge variant="secondary" className="bg-blue-500/20 text-blue-300">
                        {profile?.role || 'User'}
                      </Badge>
                      <Badge variant="secondary" className="bg-green-500/20 text-green-300">
                        Active
                      </Badge>
                      {userStats?.favoriteModel && (
                        <Badge variant="secondary" className="bg-purple-500/20 text-purple-300">
                          Favorite: {userStats.favoriteModel}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <Button
                    onClick={() => setEditingProfile(true)}
                    className="bg-blue-500 hover:bg-blue-600 text-white"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Profile
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {statsCards.map((stat, index) => (
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

            {/* Additional Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-white/10 backdrop-blur-md border-white/20">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Recent Performance
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-300">This Week</span>
                    <span className="text-white font-semibold">{userStats?.thisWeek || 0} generations</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Avg. Generation Time</span>
                    <span className="text-white font-semibold">{userStats?.averageGenerationTime?.toFixed(1) || 0}s</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Favorites</span>
                    <span className="text-white font-semibold">{userStats?.favoriteCount || 0} images</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Cost This Month</span>
                    <span className="text-white font-semibold">${userStats?.costThisMonth?.toFixed(2) || '0.00'}</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/10 backdrop-blur-md border-white/20">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Account Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-300">Member Since</span>
                    <span className="text-white font-semibold">{new Date(user.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Last Login</span>
                    <span className="text-white font-semibold">
                      {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString() : 'Never'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Email Verified</span>
                    <span className="text-white font-semibold">{user.email_confirmed_at ? 'Yes' : 'No'}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card className="bg-white/10 backdrop-blur-md border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Profile Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {editingProfile ? (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="full_name" className="text-white">Full Name</Label>
                      <Input
                        id="full_name"
                        value={profileForm.full_name}
                        onChange={(e) => setProfileForm({...profileForm, full_name: e.target.value})}
                        className="bg-white/10 border-white/20 text-white"
                      />
                    </div>

                    <div className="space-y-3">
                      <Label className="text-white">Preferences</Label>

                      <div className="flex items-center justify-between">
                        <span className="text-gray-300">Auto-save generations</span>
                        <Switch
                          checked={profileForm.preferences.autoSave}
                          onCheckedChange={(checked) => setProfileForm({
                            ...profileForm,
                            preferences: {...profileForm.preferences, autoSave: checked}
                          })}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-gray-300">Email notifications</span>
                        <Switch
                          checked={profileForm.preferences.notifications.email}
                          onCheckedChange={(checked) => setProfileForm({
                            ...profileForm,
                            preferences: {
                              ...profileForm.preferences,
                              notifications: {...profileForm.preferences.notifications, email: checked}
                            }
                          })}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-gray-300">Profile visible to others</span>
                        <Switch
                          checked={profileForm.preferences.privacy.profileVisible}
                          onCheckedChange={(checked) => setProfileForm({
                            ...profileForm,
                            preferences: {
                              ...profileForm.preferences,
                              privacy: {...profileForm.preferences.privacy, profileVisible: checked}
                            }
                          })}
                        />
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={updateProfile}
                        disabled={isUpdating}
                        className="bg-green-500 hover:bg-green-600"
                      >
                        {isUpdating ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                        Save Changes
                      </Button>
                      <Button
                        onClick={() => setEditingProfile(false)}
                        variant="outline"
                        className="border-white/20 text-white hover:bg-white/10"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-gray-400">Full Name</Label>
                        <p className="text-white">{profile?.full_name || 'Not set'}</p>
                      </div>
                      <div>
                        <Label className="text-gray-400">Email</Label>
                        <p className="text-white">{user.email}</p>
                      </div>
                    </div>

                    <Button
                      onClick={() => setEditingProfile(true)}
                      className="bg-blue-500 hover:bg-blue-600"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Profile
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="api-keys" className="space-y-6">
            <Card className="bg-white/10 backdrop-blur-md border-white/20">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-white flex items-center gap-2">
                  <Key className="w-5 h-5" />
                  API Keys
                </CardTitle>
                <Button
                  onClick={() => setShowApiKeyForm(true)}
                  className="bg-green-500 hover:bg-green-600"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add API Key
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {showApiKeyForm && (
                  <Card className="bg-white/5 border-white/10">
                    <CardContent className="p-4 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="api_name" className="text-white">Name</Label>
                          <Input
                            id="api_name"
                            value={apiKeyForm.name}
                            onChange={(e) => setApiKeyForm({...apiKeyForm, name: e.target.value})}
                            placeholder="My API Key"
                            className="bg-white/10 border-white/20 text-white"
                          />
                        </div>
                        <div>
                          <Label htmlFor="api_service" className="text-white">Service</Label>
                          <select
                            id="api_service"
                            value={apiKeyForm.service}
                            onChange={(e) => setApiKeyForm({...apiKeyForm, service: e.target.value})}
                            className="w-full p-2 bg-white/10 border border-white/20 rounded-md text-white"
                          >
                            <option value="replicate">Replicate</option>
                            <option value="openai">OpenAI</option>
                            <option value="gemini">Google Gemini</option>
                            <option value="cloudinary">Cloudinary</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="api_key" className="text-white">API Key</Label>
                        <Input
                          id="api_key"
                          type="password"
                          value={apiKeyForm.key}
                          onChange={(e) => setApiKeyForm({...apiKeyForm, key: e.target.value})}
                          placeholder="Enter your API key"
                          className="bg-white/10 border-white/20 text-white"
                        />
                      </div>

                      <div>
                        <Label htmlFor="api_description" className="text-white">Description (Optional)</Label>
                        <Textarea
                          id="api_description"
                          value={apiKeyForm.description}
                          onChange={(e) => setApiKeyForm({...apiKeyForm, description: e.target.value})}
                          placeholder="Description of this API key"
                          className="bg-white/10 border-white/20 text-white"
                        />
                      </div>

                      <div className="flex gap-2">
                        <Button onClick={addApiKey} className="bg-green-500 hover:bg-green-600">
                          <Save className="w-4 h-4 mr-2" />
                          Save API Key
                        </Button>
                        <Button
                          onClick={() => setShowApiKeyForm(false)}
                          variant="outline"
                          className="border-white/20 text-white hover:bg-white/10"
                        >
                          Cancel
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="space-y-3">
                  {apiKeys.map((apiKey) => (
                    <Card key={apiKey.id} className="bg-white/5 border-white/10">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="text-white font-semibold">{apiKey.name}</h4>
                              <Badge variant="secondary" className="bg-blue-500/20 text-blue-300">
                                {apiKey.service}
                              </Badge>
                              {apiKey.is_active ? (
                                <Badge variant="secondary" className="bg-green-500/20 text-green-300">
                                  Active
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="bg-red-500/20 text-red-300">
                                  Inactive
                                </Badge>
                              )}
                            </div>
                            <p className="text-gray-300 text-sm font-mono">{apiKey.masked_key}</p>
                            {apiKey.description && (
                              <p className="text-gray-400 text-sm mt-1">{apiKey.description}</p>
                            )}
                            <p className="text-gray-500 text-xs mt-2">
                              Created: {new Date(apiKey.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <Button
                            onClick={() => deleteApiKey(apiKey.id)}
                            variant="outline"
                            size="sm"
                            className="border-red-500/20 text-red-400 hover:bg-red-500/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {apiKeys.length === 0 && !showApiKeyForm && (
                    <div className="text-center py-8">
                      <Key className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                      <p className="text-gray-400">No API keys configured</p>
                      <p className="text-gray-500 text-sm">Add your first API key to get started</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity" className="space-y-6">
            <Card className="bg-white/10 backdrop-blur-md border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {userStats?.recentActivity?.map((activity) => (
                    <Card key={activity.id} className="bg-white/5 border-white/10">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="text-white font-medium">{activity.model}</p>
                            <p className="text-gray-300 text-sm">{activity.prompt}</p>
                            <p className="text-gray-500 text-xs mt-1">
                              {new Date(activity.created_at).toLocaleString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-white font-semibold">${activity.cost?.toFixed(3) || '0.000'}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {(!userStats?.recentActivity || userStats.recentActivity.length === 0) && (
                    <div className="text-center py-8">
                      <Activity className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                      <p className="text-gray-400">No recent activity</p>
                      <p className="text-gray-500 text-sm">Your generation history will appear here</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
