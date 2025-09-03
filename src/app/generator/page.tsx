'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth/AuthProvider'
import { Generator } from '@/components/generator-v2'
import { GeneratorLayout } from '@/components/layout/UnifiedLayout'

export default function GeneratorPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  // Check for demo mode bypass
  const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'

  // Production auth logic - only authenticated users allowed (unless demo mode)
  useEffect(() => {
    if (!loading && !user && !isDemoMode) {
      router.push('/auth/login?redirect=/generator')
    }
  }, [user, loading, router, isDemoMode])

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading Minu.AI Generator...</p>
          <p className="text-gray-400 text-sm mt-2">Authenticating user...</p>
        </div>
      </div>
    )
  }

  // Only allow access if authenticated (unless demo mode)
  if (!user && !isDemoMode) {
    return null
  }

  return (
    <GeneratorLayout>
      {isDemoMode && !user && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm">
                <strong>Development Mode Active</strong> - Authentication bypassed for testing
              </p>
            </div>
          </div>
        </div>
      )}
      <Generator />
    </GeneratorLayout>
  )
}
