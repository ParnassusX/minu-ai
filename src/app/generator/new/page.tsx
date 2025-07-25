'use client'

import { Suspense } from 'react'
import { GeneratorLayout } from '@/components/layout/UnifiedLayout'
import { ModernGenerator } from '@/components/generator/ModernGenerator'

function NewGeneratorPageContent() {
  return (
    <GeneratorLayout>
      <ModernGenerator />
    </GeneratorLayout>
  )
}

export default function NewGeneratorPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <NewGeneratorPageContent />
    </Suspense>
  )
}
