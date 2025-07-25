'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Icons } from '@/components/ui/premium-icons'
import { Typography } from '@/components/ui/typography'
import { PremiumButton } from '@/components/ui/premium-glass'
import { cn } from '@/lib/utils'
import { 
  validateAPIConfiguration,
  enhancePrompt,
  useAPIState,
  usePromptEnhancement,
  API_KEYS
} from '@/lib/api'

interface APITestPanelProps {
  className?: string
}

export function APITestPanel({ className }: APITestPanelProps) {
  const [testResults, setTestResults] = useState<{
    replicate?: boolean
    gemini?: boolean
    errors: string[]
  } | null>(null)
  const [isTestingAPI, setIsTestingAPI] = useState(false)
  const [testPrompt, setTestPrompt] = useState('A beautiful sunset over mountains')
  
  const apiState = useAPIState()
  const promptEnhancement = usePromptEnhancement()

  const handleTestAPIs = async () => {
    setIsTestingAPI(true)
    setTestResults(null)

    try {
      const results = await validateAPIConfiguration()
      setTestResults(results)
    } catch (error) {
      setTestResults({
        replicate: false,
        gemini: false,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      })
    } finally {
      setIsTestingAPI(false)
    }
  }

  const handleTestPromptEnhancement = async () => {
    if (!testPrompt.trim()) return
    
    try {
      await enhancePrompt(testPrompt)
    } catch (error) {
      console.error('Prompt enhancement test failed:', error)
    }
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* API Test Panel Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-blue-500/20">
          <Icons.settings size="sm" className="text-blue-400" />
        </div>
        <div>
          <Typography variant="body" className="font-semibold text-gray-200">
            API Integration Test
          </Typography>
          <Typography variant="body-xs" className="text-gray-400">
            Test Replicate and Gemini API connections
          </Typography>
        </div>
      </div>

      {/* API Configuration Display */}
      <div className="glass-panel-subtle rounded-lg p-4 space-y-3">
        <Typography variant="body-sm" className="font-medium text-gray-200">
          API Configuration
        </Typography>
        
        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Replicate API Key:</span>
            <span className="text-gray-300 font-mono">
              {API_KEYS.REPLICATE ? `${API_KEYS.REPLICATE.slice(0, 8)}...` : 'Not configured'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Gemini API Key:</span>
            <span className="text-gray-300 font-mono">
              {API_KEYS.GEMINI ? `${API_KEYS.GEMINI.slice(0, 8)}...` : 'Not configured'}
            </span>
          </div>
        </div>
      </div>

      {/* API Test Button */}
      <PremiumButton
        onClick={handleTestAPIs}
        disabled={isTestingAPI}
        className="w-full"
        variant="primary"
      >
        {isTestingAPI ? (
          <>
            <Icons.loader className="animate-spin" size="sm" />
            Testing APIs...
          </>
        ) : (
          <>
            <Icons.checkCircle size="sm" />
            Test API Connections
          </>
        )}
      </PremiumButton>

      {/* Test Results */}
      {testResults && (
        <motion.div
          className="glass-panel-subtle rounded-lg p-4 space-y-3"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Typography variant="body-sm" className="font-medium text-gray-200">
            Test Results
          </Typography>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Replicate API:</span>
              <div className="flex items-center gap-2">
                {testResults.replicate ? (
                  <>
                    <Icons.checkCircle size="xs" className="text-green-400" />
                    <span className="text-green-400 text-xs">Connected</span>
                  </>
                ) : (
                  <>
                    <Icons.alert size="xs" className="text-red-400" />
                    <span className="text-red-400 text-xs">Failed</span>
                  </>
                )}
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Gemini API:</span>
              <div className="flex items-center gap-2">
                {testResults.gemini ? (
                  <>
                    <Icons.checkCircle size="xs" className="text-green-400" />
                    <span className="text-green-400 text-xs">Connected</span>
                  </>
                ) : (
                  <>
                    <Icons.alert size="xs" className="text-red-400" />
                    <span className="text-red-400 text-xs">Failed</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {testResults.errors.length > 0 && (
            <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <Typography variant="body-xs" className="text-red-400 font-medium mb-1">
                Errors:
              </Typography>
              {testResults.errors.map((error, index) => (
                <Typography key={index} variant="body-xs" className="text-red-400">
                  • {error}
                </Typography>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* Prompt Enhancement Test */}
      <div className="glass-panel-subtle rounded-lg p-4 space-y-3">
        <Typography variant="body-sm" className="font-medium text-gray-200">
          Prompt Enhancement Test
        </Typography>
        
        <div className="space-y-2">
          <input
            type="text"
            value={testPrompt}
            onChange={(e) => setTestPrompt(e.target.value)}
            placeholder="Enter a prompt to enhance..."
            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-400/50"
          />
          
          <PremiumButton
            onClick={handleTestPromptEnhancement}
            disabled={promptEnhancement.isEnhancing || !testPrompt.trim()}
            variant="secondary"
            size="sm"
            className="w-full"
          >
            {promptEnhancement.isEnhancing ? (
              <>
                <Icons.loader className="animate-spin" size="xs" />
                Enhancing...
              </>
            ) : (
              <>
                <Icons.sparkles size="xs" />
                Test Enhancement
              </>
            )}
          </PremiumButton>
        </div>

        {promptEnhancement.enhancedPrompt && (
          <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <Typography variant="body-xs" className="text-blue-400 font-medium mb-1">
              Enhanced Prompt:
            </Typography>
            <Typography variant="body-xs" className="text-gray-300">
              {promptEnhancement.enhancedPrompt}
            </Typography>
          </div>
        )}

        {promptEnhancement.error && (
          <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
            <Typography variant="body-xs" className="text-red-400">
              Error: {promptEnhancement.error}
            </Typography>
          </div>
        )}
      </div>

      {/* API State Display */}
      <div className="glass-panel-subtle rounded-lg p-4 space-y-3">
        <Typography variant="body-sm" className="font-medium text-gray-200">
          API State
        </Typography>
        
        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Loading:</span>
            <span className={cn(
              "font-medium",
              apiState.isLoading ? "text-yellow-400" : "text-gray-400"
            )}>
              {apiState.isLoading ? 'Yes' : 'No'}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Error:</span>
            <span className={cn(
              "font-medium",
              apiState.error ? "text-red-400" : "text-gray-400"
            )}>
              {apiState.error ? 'Yes' : 'No'}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-gray-400">History Count:</span>
            <span className="text-gray-300 font-medium">
              {apiState.generationHistory.length}
            </span>
          </div>
        </div>

        {apiState.error && (
          <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
            <Typography variant="body-xs" className="text-red-400">
              {apiState.error}
            </Typography>
          </div>
        )}
      </div>
    </div>
  )
}
