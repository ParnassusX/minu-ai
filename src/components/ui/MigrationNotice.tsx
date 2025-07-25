'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { GlassCard, PremiumButton } from '@/components/ui/premium-glass'
import { Icons } from '@/components/ui/premium-icons'
import { Typography } from '@/components/ui/typography'
import { toastHelpers } from '@/lib/hooks/useToast'

interface MigrationNoticeProps {
  fromPage: 'suggestions' | 'prompt-builder'
  className?: string
}

const migrationInfo = {
  suggestions: {
    title: 'Suggestions Moved to Generator',
    description: 'All suggestion features are now integrated into the Generator page for a seamless workflow.',
    newLocation: 'Generator → Suggestion Panel',
    redirectTo: '/generator',
    features: [
      'Drag & drop suggestions directly into prompts',
      'Category filtering and search',
      'Quick suggestion chips',
      'Integrated with prompt enhancement'
    ]
  },
  'prompt-builder': {
    title: 'Prompt Builder Moved to Generator',
    description: 'Advanced prompt building features are now available in the Generator\'s advanced mode.',
    newLocation: 'Generator → Advanced Mode',
    redirectTo: '/generator',
    features: [
      'Variable support and templates',
      'Prompt history and analytics',
      'AI-powered enhancement',
      'Template saving and management'
    ]
  }
}

export function MigrationNotice({ fromPage, className }: MigrationNoticeProps) {
  const router = useRouter()
  const info = migrationInfo[fromPage]

  useEffect(() => {
    // Show toast notification about the migration
    toastHelpers.info(
      'Page Moved!',
      `${info.title.split(' ')[0]} features are now in the Generator page`
    )
  }, [info.title])

  const handleRedirect = () => {
    router.push(info.redirectTo)
  }

  const handleStayHere = () => {
    // User chooses to stay on this page (maybe they want to read more)
    toastHelpers.success('Got it!', 'You can find these features in the Generator page')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/30 dark:from-gray-900 dark:via-gray-800/50 dark:to-gray-900/80 flex items-center justify-center p-6">
      <GlassCard variant="elevated" size="lg" className="max-w-2xl w-full">
        <div className="text-center space-y-6">
          {/* Icon */}
          <div className="flex justify-center">
            <div className="p-4 rounded-full bg-gradient-to-r from-blue-500 to-purple-500">
              <Icons.arrowRight size="xl" variant="glass" className="text-white" />
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Typography variant="h2" className="font-bold">
              {info.title}
            </Typography>
            <Typography variant="body-lg" color="muted">
              {info.description}
            </Typography>
          </div>

          {/* New Location */}
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <Typography variant="body-sm" className="font-medium text-blue-700 dark:text-blue-300">
              New Location: {info.newLocation}
            </Typography>
          </div>

          {/* Features List */}
          <div className="space-y-3">
            <Typography variant="body" className="font-medium">
              Available Features:
            </Typography>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {info.features.map((feature, index) => (
                <div key={index} className="flex items-center gap-2 text-left">
                  <Icons.check size="sm" variant="success" />
                  <Typography variant="body-sm">
                    {feature}
                  </Typography>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <PremiumButton
              variant="gradient"
              size="lg"
              onClick={handleRedirect}
              className="gap-2"
            >
              <Icons.arrowRight size="sm" />
              Go to Generator
            </PremiumButton>
            
            <PremiumButton
              variant="outline"
              size="lg"
              onClick={handleStayHere}
              className="gap-2"
            >
              <Icons.info size="sm" />
              Got it, thanks!
            </PremiumButton>
          </div>

          {/* Additional Info */}
          <div className="pt-4 border-t border-surface-border">
            <Typography variant="caption" color="muted">
              This change simplifies navigation while keeping all features easily accessible.
              <br />
              Your workflow is now more streamlined and efficient!
            </Typography>
          </div>
        </div>
      </GlassCard>
    </div>
  )
}
