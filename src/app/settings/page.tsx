'use client'

import { useState } from 'react'
import { UnifiedLayout } from '@/components/layout/UnifiedLayout'
import { GlassCard, PremiumButton, PremiumInput } from '@/components/ui/premium-glass'
import { Icons } from '@/components/ui/premium-icons'
import { Typography } from '@/components/ui/typography'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { useAuth } from '@/lib/auth/AuthProvider'
import { useTheme } from 'next-themes'

export default function SettingsPage() {
  const { profile } = useAuth()
  const { theme, setTheme } = useTheme()
  const [showApiKey, setShowApiKey] = useState(false)
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    generation: true,
    errors: true
  })

  const [formData, setFormData] = useState({
    fullName: profile?.full_name || '',
    email: profile?.email || '',
    replicateApiKey: '',
    geminiApiKey: '',
    defaultModel: 'flux-schnell',
    imageQuality: 'standard',
    autoSave: true,
    darkMode: theme === 'dark'
  })

  const handleSave = () => {
    console.log('Settings saved:', formData)
    // TODO: Implement actual save functionality
  }

  return (
    <UnifiedLayout>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 p-3 sm:p-4 lg:p-6">
        <div className="w-full space-y-3 sm:space-y-4 lg:space-y-6">
        {/* Header - Phase 3 Enhanced */}
        <GlassCard
          variant="luxury"
          size="xl"
          animation="slideDown"
          glow="prominent"
          focus="premium"
          className="text-center"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 animate-pulse">
              <Icons.settings size="2xl" variant="glass" className="text-white" />
            </div>
            <Typography variant="display" color="high-contrast">
              Settings
            </Typography>
          </div>
          <Typography variant="body-lg" color="medium-contrast" className="max-w-2xl mx-auto">
            Manage your account and application preferences
          </Typography>
        </GlassCard>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Account Settings */}
          <div className="lg:col-span-2 space-y-6">
            <GlassCard
              variant="floating"
              size="md"
              animation="slideUp"
              glow="subtle"
              focus="ring"
            >
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-surface-border">
                  <Icons.user size="sm" variant="primary" />
                  <Typography variant="h6" color="high-contrast">Account Information</Typography>
                </div>
                <Typography variant="body-sm" color="medium-contrast">
                  Update your personal information and account details
                </Typography>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="fullName">Full Name</Label>
                    <PremiumInput
                      variant="premium"
                      id="fullName"
                      value={formData.fullName}
                      onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                      placeholder="Enter your full name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <PremiumInput
                      variant="premium"
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="Enter your email"
                    />
                  </div>
                </div>
              </div>
            </GlassCard>

            {/* API Configuration */}
            <GlassCard variant="elevated" size="md">
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-surface-border">
                  <Icons.key size="sm" variant="primary" />
                  <Typography variant="h6" color="high-contrast">API Configuration</Typography>
                </div>
                <Typography variant="body-sm" color="medium-contrast">
                  Configure your API keys for image generation and text enhancement
                </Typography>

                <div>
                  <Label htmlFor="replicateKey">Replicate API Key</Label>
                  <div className="relative">
                    <PremiumInput
                      variant="premium"
                      id="replicateKey"
                      type={showApiKey ? "text" : "password"}
                      value={formData.replicateApiKey}
                      onChange={(e) => setFormData(prev => ({ ...prev, replicateApiKey: e.target.value }))}
                      placeholder="r8_..."
                    />
                    <PremiumButton
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowApiKey(!showApiKey)}
                    >
                      {showApiKey ? <Icons.eyeOff size="sm" /> : <Icons.eye size="sm" />}
                    </PremiumButton>
                  </div>
                </div>
                <div>
                  <Label htmlFor="geminiKey">Google Gemini API Key</Label>
                  <div className="relative">
                    <PremiumInput
                      variant="premium"
                      id="geminiKey"
                      type={showApiKey ? "text" : "password"}
                      value={formData.geminiApiKey}
                      onChange={(e) => setFormData(prev => ({ ...prev, geminiApiKey: e.target.value }))}
                      placeholder="AIza..."
                    />
                    <PremiumButton
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowApiKey(!showApiKey)}
                    >
                      {showApiKey ? <Icons.eyeOff size="sm" /> : <Icons.eye size="sm" />}
                    </PremiumButton>
                  </div>
                </div>
              </div>
            </GlassCard>

            {/* Generation Preferences */}
            <GlassCard variant="elevated" size="md">
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-surface-border">
                  <Icons.palette size="sm" variant="primary" />
                  <Typography variant="h6" color="high-contrast">Generation Preferences</Typography>
                </div>
                <Typography variant="body-sm" color="medium-contrast">
                  Configure default settings for image generation
                </Typography>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="defaultModel">Default Model</Label>
                    <Select value={formData.defaultModel} onValueChange={(value) => setFormData(prev => ({ ...prev, defaultModel: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select model" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="flux-schnell">FLUX Schnell</SelectItem>
                        <SelectItem value="flux-dev">FLUX Dev</SelectItem>
                        <SelectItem value="sdxl">Stable Diffusion XL</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="imageQuality">Image Quality</Label>
                    <Select value={formData.imageQuality} onValueChange={(value) => setFormData(prev => ({ ...prev, imageQuality: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select quality" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="standard">Standard</SelectItem>
                        <SelectItem value="high">High Quality</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="autoSave">Auto-save to Gallery</Label>
                    <p className="text-sm text-gray-500">Automatically save generated images to your gallery</p>
                  </div>
                  <Switch
                    id="autoSave"
                    checked={formData.autoSave}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, autoSave: checked }))}
                  />
                </div>
              </div>
            </GlassCard>
          </div>

          {/* Sidebar Settings */}
          <div className="space-y-6">
            {/* Appearance */}
            <GlassCard variant="elevated" size="md">
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-surface-border">
                  <Icons.palette size="sm" variant="primary" />
                  <Typography variant="h6" color="high-contrast">Appearance</Typography>
                </div>
                <Typography variant="body-sm" color="medium-contrast">
                  Customize the look and feel of the application
                </Typography>
                <div>
                  <Label htmlFor="theme">Theme</Label>
                  <Select value={theme} onValueChange={setTheme}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select theme" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </GlassCard>

            {/* Notifications */}
            <GlassCard variant="elevated" size="md">
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-surface-border">
                  <Icons.bell size="sm" variant="primary" />
                  <Typography variant="h6" color="high-contrast">Notifications</Typography>
                </div>
                <Typography variant="body-sm" color="medium-contrast">
                  Configure how you receive notifications
                </Typography>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="emailNotif">Email Notifications</Label>
                    <p className="text-sm text-gray-500">Receive updates via email</p>
                  </div>
                  <Switch
                    id="emailNotif"
                    checked={notifications.email}
                    onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, email: checked }))}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="generationNotif">Generation Complete</Label>
                    <p className="text-sm text-gray-500">Notify when images finish generating</p>
                  </div>
                  <Switch
                    id="generationNotif"
                    checked={notifications.generation}
                    onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, generation: checked }))}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="errorNotif">Error Alerts</Label>
                    <p className="text-sm text-gray-500">Notify about errors and issues</p>
                  </div>
                  <Switch
                    id="errorNotif"
                    checked={notifications.errors}
                    onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, errors: checked }))}
                  />
                </div>
              </div>
            </GlassCard>

            {/* Security */}
            <GlassCard variant="elevated" size="md">
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-surface-border">
                  <Icons.shield size="sm" variant="error" />
                  <Typography variant="h6" color="high-contrast">Security</Typography>
                </div>
                <Typography variant="body-sm" color="medium-contrast">
                  Account security and privacy settings
                </Typography>

                <PremiumButton variant="outline" className="w-full">
                  Change Password
                </PremiumButton>
                <PremiumButton variant="outline" className="w-full">
                  Two-Factor Authentication
                </PremiumButton>
                <PremiumButton variant="outline" className="w-full text-error-600 hover:text-error-700">
                  Delete Account
                </PremiumButton>
              </div>
            </GlassCard>
          </div>
        </div>

        {/* Save Button - Phase 3 Enhanced */}
        <GlassCard variant="floating" size="md" animation="slideUp" glow="prominent">
          <div className="flex justify-end">
            <PremiumButton
              variant="luxury"
              size="lg"
              animation="shimmer"
              onClick={handleSave}
              className="shadow-lg"
            >
              <Icons.save size="sm" className="mr-2" />
              Save Changes
            </PremiumButton>
          </div>
        </GlassCard>
        </div>
      </div>
    </UnifiedLayout>
  )
}
