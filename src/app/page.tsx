'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth/AuthProvider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Sparkles, Palette, Zap, Shield } from 'lucide-react'

export default function HomePage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  // SECURITY: Removed development mode authentication bypass
  // All environments now require proper authentication

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard')
    }
  }, [user, loading, router])

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen gradient-bg">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-6xl font-bold mb-6 text-primary">
            Minu.AI
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Transform your ideas into stunning visuals with the power of FLUX AI technology. 
            Create, customize, and collaborate on AI-generated images.
          </p>
          <div className="flex gap-4 justify-center">
            <Button 
              size="lg" 
              onClick={() => router.push('/auth/signup')}
              className="px-8 py-3"
            >
              Get Started
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              onClick={() => router.push('/auth/login')}
              className="px-8 py-3"
            >
              Sign In
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <Card className="glass-effect">
            <CardHeader className="text-center">
              <Sparkles className="h-12 w-12 mx-auto mb-4 text-blue-600" />
              <CardTitle className="text-lg">AI-Powered Generation</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Leverage FLUX Kontext Pro1 for state-of-the-art image generation with incredible detail and accuracy.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="glass-effect">
            <CardHeader className="text-center">
              <Palette className="h-12 w-12 mx-auto mb-4 text-purple-600" />
              <CardTitle className="text-lg">Smart Prompt Builder</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Build complex prompts with our intuitive template system and drag-and-drop suggestion components.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="glass-effect">
            <CardHeader className="text-center">
              <Zap className="h-12 w-12 mx-auto mb-4 text-yellow-600" />
              <CardTitle className="text-lg">Lightning Fast</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Generate high-quality images in seconds with optimized processing and real-time status updates.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="glass-effect">
            <CardHeader className="text-center">
              <Shield className="h-12 w-12 mx-auto mb-4 text-green-600" />
              <CardTitle className="text-lg">Secure & Private</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Your creations are protected with enterprise-grade security and role-based access control.
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <Card className="glass-effect max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-2xl">Ready to Create?</CardTitle>
              <CardDescription className="text-lg">
                Join thousands of creators using Minu.AI to bring their imagination to life.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                size="lg" 
                onClick={() => router.push('/auth/signup')}
                className="px-12 py-3"
              >
                Start Creating Now
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
