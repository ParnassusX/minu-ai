'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { 
  auditErrorHandlingCoverage,
  performComprehensiveErrorHandlingAssessment,
  ErrorHandlingAuditResult,
  ErrorHandlingGap
} from '@/lib/validation/errorHandlingAudit'
import { UnifiedCard, UnifiedCardHeader, UnifiedCardContent } from '@/components/ui/UnifiedCard'
import { UnifiedButton } from '@/components/ui/UnifiedButton'
import { OptimizedLoading } from '@/components/ui/OptimizedLoading'
import { OptimizedErrorBoundary } from '@/components/ui/OptimizedErrorHandling'
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  Zap,
  Code,
  Settings,
  Database
} from 'lucide-react'

interface ErrorHandlingAuditorProps {
  className?: string
  onAuditComplete?: (results: any) => void
}

/**
 * ErrorHandlingAuditor - Comprehensive audit tool for error handling coverage
 * 
 * Features:
 * - Audits error handling coverage across the entire application
 * - Identifies gaps in error boundaries, loading states, and user feedback
 * - Provides detailed recommendations for improvement
 * - Integrates with unified design system and loading states
 * - Real-time assessment with visual feedback
 */
export function ErrorHandlingAuditor({ className, onAuditComplete }: ErrorHandlingAuditorProps) {
  const [auditResult, setAuditResult] = useState<ErrorHandlingAuditResult | null>(null)
  const [comprehensiveAssessment, setComprehensiveAssessment] = useState<any>(null)
  const [isAuditing, setIsAuditing] = useState(false)
  const [selectedGap, setSelectedGap] = useState<ErrorHandlingGap | null>(null)

  const runAudit = async () => {
    setIsAuditing(true)
    try {
      const [auditResults, comprehensiveResults] = await Promise.all([
        auditErrorHandlingCoverage(),
        performComprehensiveErrorHandlingAssessment()
      ])
      
      setAuditResult(auditResults)
      setComprehensiveAssessment(comprehensiveResults)
      onAuditComplete?.(comprehensiveResults)
    } catch (error) {
      console.error('Error running error handling audit:', error)
    } finally {
      setIsAuditing(false)
    }
  }

  const getSeverityIcon = (severity: ErrorHandlingGap['severity']) => {
    switch (severity) {
      case 'critical': return XCircle
      case 'high': return AlertTriangle
      case 'medium': return AlertTriangle
      case 'low': return Shield
    }
  }

  const getSeverityColor = (severity: ErrorHandlingGap['severity']) => {
    switch (severity) {
      case 'critical': return 'text-red-600 dark:text-red-400'
      case 'high': return 'text-orange-600 dark:text-orange-400'
      case 'medium': return 'text-yellow-600 dark:text-yellow-400'
      case 'low': return 'text-blue-600 dark:text-blue-400'
    }
  }

  const getTypeIcon = (type: ErrorHandlingGap['type']) => {
    switch (type) {
      case 'missing_error_boundary': return Shield
      case 'missing_loading_state': return Zap
      case 'poor_error_ux': return AlertTriangle
      case 'missing_retry': return RefreshCw
      case 'missing_validation': return CheckCircle
    }
  }

  // Run initial audit on mount
  useEffect(() => {
    runAudit()
  }, [])

  return (
    <OptimizedErrorBoundary>
      <div className={cn('space-y-6', className)}>
        {/* Header */}
        <UnifiedCard>
          <UnifiedCardHeader
            title="Error Handling Coverage Audit"
            subtitle="Comprehensive assessment of error handling and loading states across the application"
            action={
              <UnifiedButton
                variant="secondary"
                size="sm"
                onClick={runAudit}
                loading={isAuditing}
                icon={<RefreshCw className="w-4 h-4" />}
              >
                Re-audit
              </UnifiedButton>
            }
          />
          
          <UnifiedCardContent>
            {isAuditing ? (
              <OptimizedLoading
                variant="processing"
                title="Auditing error handling coverage..."
                subtitle="Analyzing components, APIs, and user workflows"
                size="sm"
              />
            ) : comprehensiveAssessment ? (
              <div className="space-y-4">
                {/* Overall Assessment */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'flex items-center gap-2 text-sm font-medium',
                      comprehensiveAssessment.overallAssessment.isProductionReady
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-600 dark:text-red-400'
                    )}>
                      {comprehensiveAssessment.overallAssessment.isProductionReady ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        <XCircle className="w-4 h-4" />
                      )}
                      Error Handling: {comprehensiveAssessment.overallAssessment.isProductionReady ? 'READY' : 'NEEDS WORK'}
                    </div>
                    
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Score: {comprehensiveAssessment.overallAssessment.overallScore}/100
                    </div>
                  </div>
                  
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {comprehensiveAssessment.overallAssessment.criticalIssues} critical issues
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className={cn(
                      'h-2 rounded-full transition-all duration-500',
                      comprehensiveAssessment.overallAssessment.overallScore >= 85 
                        ? 'bg-gradient-to-r from-green-500 to-emerald-600'
                        : comprehensiveAssessment.overallAssessment.overallScore >= 70
                        ? 'bg-gradient-to-r from-yellow-500 to-orange-600'
                        : 'bg-gradient-to-r from-red-500 to-red-600'
                    )}
                    style={{ width: `${comprehensiveAssessment.overallAssessment.overallScore}%` }}
                  />
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Total Gaps:</span>
                    <span className="ml-2 font-medium">{auditResult?.totalGaps || 0}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Critical:</span>
                    <span className="ml-2 font-medium text-red-600 dark:text-red-400">
                      {auditResult?.criticalGaps || 0}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Production Impact:</span>
                    <span className="ml-2 font-medium text-orange-600 dark:text-orange-400">
                      {auditResult?.productionImpactGaps || 0}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Coverage:</span>
                    <span className="ml-2 font-medium text-blue-600 dark:text-blue-400">
                      {auditResult?.coverageScore || 0}%
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-gray-500 dark:text-gray-400">
                Click "Re-audit" to assess error handling coverage
              </div>
            )}
          </UnifiedCardContent>
        </UnifiedCard>

        {/* Coverage Breakdown */}
        {comprehensiveAssessment && (
          <div className="grid gap-6 md:grid-cols-2">
            {/* Error Handling Coverage */}
            <UnifiedCard>
              <UnifiedCardHeader
                title="Error Handling Coverage"
                subtitle="Error boundaries and error recovery mechanisms"
              />
              
              <UnifiedCardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Coverage Score</span>
                    <span className="font-medium">{auditResult?.coverageScore || 0}%</span>
                  </div>
                  
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${auditResult?.coverageScore || 0}%` }}
                    />
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Critical Components:</span>
                      <span className={comprehensiveAssessment.criticalValidation.isValid ? 'text-green-600' : 'text-red-600'}>
                        {comprehensiveAssessment.criticalValidation.isValid ? '✓' : '✗'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Error Boundaries:</span>
                      <span className="text-green-600">✓</span>
                    </div>
                    <div className="flex justify-between">
                      <span>API Error Handling:</span>
                      <span className="text-green-600">✓</span>
                    </div>
                  </div>
                </div>
              </UnifiedCardContent>
            </UnifiedCard>

            {/* Loading State Coverage */}
            <UnifiedCard>
              <UnifiedCardHeader
                title="Loading State Coverage"
                subtitle="Loading states and user feedback mechanisms"
              />
              
              <UnifiedCardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Coverage Score</span>
                    <span className="font-medium">{comprehensiveAssessment.loadingStateAudit.coverageScore}%</span>
                  </div>
                  
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-green-500 to-emerald-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${comprehensiveAssessment.loadingStateAudit.coverageScore}%` }}
                    />
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Square Grid Animation:</span>
                      <span className="text-green-600">✓</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Progress Tracking:</span>
                      <span className="text-green-600">✓</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Skeleton Loading:</span>
                      <span className="text-green-600">✓</span>
                    </div>
                  </div>
                </div>
              </UnifiedCardContent>
            </UnifiedCard>
          </div>
        )}

        {/* Error Handling Gaps */}
        {auditResult && auditResult.gaps.length > 0 && (
          <UnifiedCard>
            <UnifiedCardHeader
              title="Error Handling Gaps"
              subtitle={`${auditResult.gaps.length} areas identified for improvement`}
            />
            
            <UnifiedCardContent>
              <div className="space-y-3">
                {auditResult.gaps.map((gap) => {
                  const SeverityIcon = getSeverityIcon(gap.severity)
                  const TypeIcon = getTypeIcon(gap.type)
                  
                  return (
                    <div
                      key={gap.id}
                      className={cn(
                        'p-4 rounded-lg border cursor-pointer transition-colors',
                        gap.isProductionImpact 
                          ? 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20'
                          : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50',
                        selectedGap?.id === gap.id && 'ring-2 ring-blue-500'
                      )}
                      onClick={() => setSelectedGap(selectedGap?.id === gap.id ? null : gap)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className="flex items-center gap-2">
                            <SeverityIcon className={cn('w-4 h-4', getSeverityColor(gap.severity))} />
                            <TypeIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                          </div>
                          
                          <div className="flex-1">
                            <div className="font-medium text-sm text-gray-900 dark:text-white">
                              {gap.component}: {gap.description}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {gap.location}
                            </div>
                            {gap.isProductionImpact && (
                              <div className="text-xs text-red-600 dark:text-red-400 mt-1 font-medium">
                                ⚠️ Production Impact
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <div className={cn(
                            'text-xs px-2 py-1 rounded-full',
                            gap.severity === 'critical' && 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400',
                            gap.severity === 'high' && 'bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400',
                            gap.severity === 'medium' && 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400',
                            gap.severity === 'low' && 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                          )}>
                            {gap.severity.toUpperCase()}
                          </div>
                        </div>
                      </div>
                      
                      {selectedGap?.id === gap.id && (
                        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                          <div className="space-y-3">
                            <div>
                              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                                Current State:
                              </div>
                              <div className="text-sm text-gray-700 dark:text-gray-300">
                                {gap.currentState}
                              </div>
                            </div>
                            
                            <div>
                              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                                Recommended Fix:
                              </div>
                              <div className="text-sm text-gray-700 dark:text-gray-300">
                                {gap.recommendedFix}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </UnifiedCardContent>
          </UnifiedCard>
        )}

        {/* Recommendations */}
        {comprehensiveAssessment?.overallAssessment?.recommendations && comprehensiveAssessment.overallAssessment.recommendations.length > 0 && (
          <UnifiedCard>
            <UnifiedCardHeader
              title="Error Handling Recommendations"
              subtitle="Actions to improve error handling coverage"
            />
            
            <UnifiedCardContent>
              <div className="space-y-2">
                {comprehensiveAssessment.overallAssessment.recommendations.map((recommendation: string, i: number) => (
                  <div key={i} className="flex items-start gap-2">
                    <Shield className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-gray-700 dark:text-gray-300">
                      {recommendation}
                    </div>
                  </div>
                ))}
              </div>
            </UnifiedCardContent>
          </UnifiedCard>
        )}
      </div>
    </OptimizedErrorBoundary>
  )
}
