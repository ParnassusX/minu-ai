'use client'

import { Button } from '@/components/ui/button'
import { GlassCard } from '@/components/ui/glass'
import { StatusIndicator, ProgressRing } from '@/components/ui/professional-toast'
import { toastHelpers } from '@/lib/hooks/useToast'

export function ToastDemo() {
  const handleTestToasts = () => {
    // Test different toast types
    setTimeout(() => toastHelpers.success('Success!', 'This is a success message'), 100)
    setTimeout(() => toastHelpers.info('Information', 'This is an info message'), 600)
    setTimeout(() => toastHelpers.warning('Warning', 'This is a warning message'), 1100)
    setTimeout(() => toastHelpers.error('Error', 'This is an error message'), 1600)
    setTimeout(() => toastHelpers.loading('Loading...', 'This is a loading message'), 2100)
  }

  const handleImageGenerationToasts = () => {
    // Test image generation flow
    const loadingToast = toastHelpers.imageGeneration.started('FLUX-schnell')
    
    setTimeout(() => {
      loadingToast.dismiss()
      toastHelpers.imageGeneration.completed(2)
    }, 3000)
  }

  const handleAuthToasts = () => {
    toastHelpers.auth.signedIn('user@example.com')
  }

  const handleApiToasts = () => {
    toastHelpers.api.keyUpdated('Replicate')
  }

  return (
    <GlassCard variant="premium" className="p-6 space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Professional Toast System Demo</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <Button onClick={handleTestToasts} variant="outline">
            Test All Toast Types
          </Button>
          
          <Button onClick={handleImageGenerationToasts} variant="outline">
            Test Image Generation Flow
          </Button>
          
          <Button onClick={handleAuthToasts} variant="outline">
            Test Auth Toast
          </Button>
          
          <Button onClick={handleApiToasts} variant="outline">
            Test API Toast
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="font-medium">Status Indicators</h4>
        <div className="flex flex-wrap gap-3">
          <StatusIndicator status="idle" />
          <StatusIndicator status="loading" />
          <StatusIndicator status="success" />
          <StatusIndicator status="error" />
          <StatusIndicator status="warning" />
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="font-medium">Progress Rings</h4>
        <div className="flex gap-4">
          <ProgressRing progress={25} showPercentage />
          <ProgressRing progress={50} showPercentage />
          <ProgressRing progress={75} showPercentage />
          <ProgressRing progress={100} showPercentage />
        </div>
      </div>
    </GlassCard>
  )
}
