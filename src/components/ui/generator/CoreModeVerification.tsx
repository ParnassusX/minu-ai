/**
 * Core Mode Verification Component
 * UI component for testing and verifying core mode functionality
 */

'use client'

import React, { useState } from 'react'
import { cn } from '@/lib/utils'
import { validateAllCoreModes, ModeValidationResult } from '@/lib/validation/coreModeValidation'
import { UnifiedButton } from '@/components/ui/UnifiedButton'
import { UnifiedCard } from '@/components/ui/UnifiedCard'
import { CheckCircle, XCircle, AlertTriangle, Play, Loader2 } from 'lucide-react'

interface CoreModeVerificationProps {
  className?: string
  onValidationComplete?: (results: any) => void
}

export function CoreModeVerification({ 
  className, 
  onValidationComplete 
}: CoreModeVerificationProps) {
  const [isValidating, setIsValidating] = useState(false)
  const [results, setResults] = useState<any>(null)

  const handleRunVerification = async () => {
    setIsValidating(true)
    try {
      const validationResults = await validateAllCoreModes({
        testGeneration: false,
        skipApiTests: false,
        verbose: true
      })
      
      setResults(validationResults)
      onValidationComplete?.(validationResults)
    } catch (error) {
      console.error('Validation failed:', error)
      setResults({
        overall: 'failed',
        results: {},
        summary: {
          totalModes: 3,
          validModes: 0,
          invalidModes: 3,
          totalErrors: 1,
          totalWarnings: 0
        }
      })
    } finally {
      setIsValidating(false)
    }
  }

  const getStatusIcon = (isValid: boolean) => {
    return isValid ? (
      <CheckCircle className="w-5 h-5 text-green-500" />
    ) : (
      <XCircle className="w-5 h-5 text-red-500" />
    )
  }

  const getOverallStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-6 h-6 text-green-500" />
      case 'partial':
        return <AlertTriangle className="w-6 h-6 text-yellow-500" />
      case 'failed':
      default:
        return <XCircle className="w-6 h-6 text-red-500" />
    }
  }

  return (
    <UnifiedCard className={cn('p-6', className)}>
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Core Mode Verification</h2>
          <p className="text-gray-600 mb-4">
            Testing IMAGES, VIDEO, and ENHANCE mode functionality
          </p>
          
          <UnifiedButton
            onClick={handleRunVerification}
            disabled={isValidating}
            className="w-full max-w-xs"
          >
            {isValidating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Validating...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Run Verification
              </>
            )}
          </UnifiedButton>
        </div>

        {results && (
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-3 p-4 bg-gray-50 rounded-lg">
              {getOverallStatusIcon(results.overall)}
              <div className="text-center">
                <div className="font-semibold">
                  Overall Status: {results.overall.toUpperCase()}
                </div>
                <div className="text-sm text-gray-600">
                  {results.summary.validModes}/{results.summary.totalModes} modes valid
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(results.results).map(([mode, result]: [string, any]) => (
                <div
                  key={mode}
                  className="p-4 border rounded-lg bg-white"
                >
                  <div className="flex items-center gap-2 mb-2">
                    {getStatusIcon(result.isValid)}
                    <h3 className="font-semibold capitalize">{mode}</h3>
                  </div>
                  
                  {result.errors.length > 0 && (
                    <div className="mb-2">
                      <div className="text-sm font-medium text-red-600 mb-1">Errors:</div>
                      <ul className="text-xs text-red-500 space-y-1">
                        {result.errors.map((error: string, index: number) => (
                          <li key={index}>• {error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {result.warnings.length > 0 && (
                    <div>
                      <div className="text-sm font-medium text-yellow-600 mb-1">Warnings:</div>
                      <ul className="text-xs text-yellow-500 space-y-1">
                        {result.warnings.map((warning: string, index: number) => (
                          <li key={index}>• {warning}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </UnifiedCard>
  )
}
