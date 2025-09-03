'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth/AuthProvider'
import { Generator } from '@/components/generator-v2'
import { GeneratorLayout } from '@/components/layout/UnifiedLayout'

export default function GeneratorPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  // Production auth logic - only authenticated users allowed
  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login?redirect=/generator')
    }
  }, [user, loading, router])

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

  // Only allow access if authenticated - NO BYPASSES
  if (!user) {
    return null
  }

  return (
    <GeneratorLayout>
      <Generator />
    </GeneratorLayout>
  )
}
