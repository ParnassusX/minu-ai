'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { 
  scanForMockData, 
  performProductionReadinessCheck,
  validateEnvironmentConfiguration,
  MockDataScanResult,
  MockDataIssue
} from '@/lib/validation/mockDataDetection'
import { UnifiedCard, UnifiedCardHeader, UnifiedCardContent } from '@/components/ui/UnifiedCard'
import { UnifiedButton } from '@/components/ui/UnifiedButton'
import { OptimizedLoading } from '@/components/ui/OptimizedLoading'
import { OptimizedErrorBoundary } from '@/components/ui/OptimizedErrorHandling'
import { 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  RefreshCw, 
  FileText, 
  Settings,
  Database,
  Code,
  Shield
} from 'lucide-react'

interface MockDataEliminatorProps {
  className?: string
  onIssuesResolved?: () => void
}

/**
 * MockDataEliminator - Comprehensive tool for identifying and eliminating mock data
 * 
 * Features:
 * - Scans for mock data, placeholders, and test-only code
 * - Validates environment configuration
 * - Provides production readiness assessment
 * - Integrates with unified design system and loading states
 * - Comprehensive error handling and recovery
 */
export function MockDataEliminator({ className, onIssuesResolved }: MockDataEliminatorProps) {
  const [scanResult, setScanResult] = useState<MockDataScanResult | null>(null)
  const [productionCheck, setProductionCheck] = useState<any>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [selectedIssue, setSelectedIssue] = useState<MockDataIssue | null>(null)

  const runScan = async () => {
    setIsScanning(true)
    try {
      const [mockDataResult, productionResult] = await Promise.all([
        scanForMockData(),
        performProductionReadinessCheck()
      ])
      
      setScanResult(mockDataResult)
      setProductionCheck(productionResult)
    } catch (error) {
      console.error('Error running mock data scan:', error)
    } finally {
      setIsScanning(false)
    }
  }

  const getSeverityIcon = (severity: MockDataIssue['severity']) => {
    switch (severity) {
      case 'critical': return XCircle
      case 'high': return AlertTriangle
      case 'medium': return AlertTriangle
      case 'low': return FileText
    }
  }

  const getSeverityColor = (severity: MockDataIssue['severity']) => {
    switch (severity) {
      case 'critical': return 'text-red-600 dark:text-red-400'
      case 'high': return 'text-orange-600 dark:text-orange-400'
      case 'medium': return 'text-yellow-600 dark:text-yellow-400'
      case 'low': return 'text-blue-600 dark:text-blue-400'
    }
  }

  const getTypeIcon = (type: MockDataIssue['type']) => {
    switch (type) {
      case 'mock_data': return Database
      case 'placeholder': return FileText
      case 'hardcoded': return Code
      case 'test_only': return Settings
      case 'development_only': return Settings
      case 'todo': return AlertTriangle
    }
  }

  // Run initial scan on mount
  useEffect(() => {
    runScan()
  }, [])

  return (
    <OptimizedErrorBoundary>
      <div className={cn('space-y-6', className)}>
        {/* Header */}
        <UnifiedCard>
          <UnifiedCardHeader
            title="Mock Data Elimination"
            subtitle="Identify and eliminate mock data, placeholders, and test-only code for production readiness"
            action={
              <UnifiedButton
                variant="secondary"
                size="sm"
                onClick={runScan}
                loading={isScanning}
                icon={<RefreshCw className="w-4 h-4" />}
              >
                Re-scan
              </UnifiedButton>
            }
          />
          
          <UnifiedCardContent>
            {isScanning ? (
              <OptimizedLoading
                variant="processing"
                title="Scanning codebase..."
                subtitle="Identifying mock data and production readiness issues"
                size="sm"
              />
            ) : productionCheck ? (
              <div className="space-y-4">
                {/* Overall Readiness Score */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'flex items-center gap-2 text-sm font-medium',
                      productionCheck.overallReadiness.isReady 
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-600 dark:text-red-400'
                    )}>
                      {productionCheck.overallReadiness.isReady ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        <XCircle className="w-4 h-4" />
                      )}
                      Production Ready: {productionCheck.overallReadiness.isReady ? 'YES' : 'NO'}
                    </div>
                    
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Score: {productionCheck.overallReadiness.score}/100
                    </div>
                  </div>
                  
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {productionCheck.overallReadiness.criticalIssues} critical issues
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className={cn(
                      'h-2 rounded-full transition-all duration-500',
                      productionCheck.overallReadiness.score >= 80 
                        ? 'bg-gradient-to-r from-green-500 to-emerald-600'
                        : productionCheck.overallReadiness.score >= 60
                        ? 'bg-gradient-to-r from-yellow-500 to-orange-600'
                        : 'bg-gradient-to-r from-red-500 to-red-600'
                    )}
                    style={{ width: `${productionCheck.overallReadiness.score}%` }}
                  />
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Total Issues:</span>
                    <span className="ml-2 font-medium">{scanResult?.totalIssues || 0}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Critical:</span>
                    <span className="ml-2 font-medium text-red-600 dark:text-red-400">
                      {scanResult?.criticalIssues || 0}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Blockers:</span>
                    <span className="ml-2 font-medium text-orange-600 dark:text-orange-400">
                      {scanResult?.productionBlockingIssues || 0}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Mock Data:</span>
                    <span className="ml-2 font-medium text-blue-600 dark:text-blue-400">
                      {scanResult?.issuesByType?.mock_data || 0}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-gray-500 dark:text-gray-400">
                Click "Re-scan" to check for mock data issues
              </div>
            )}
          </UnifiedCardContent>
        </UnifiedCard>

        {/* Environment Configuration */}
        {productionCheck?.environmentCheck && (
          <UnifiedCard>
            <UnifiedCardHeader
              title="Environment Configuration"
              subtitle="Validate environment variables and configuration"
            />
            
            <UnifiedCardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'flex items-center gap-2 text-sm font-medium',
                    productionCheck.environmentCheck.isValid
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-red-600 dark:text-red-400'
                  )}>
                    {productionCheck.environmentCheck.isValid ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <XCircle className="w-4 h-4" />
                    )}
                    Environment: {productionCheck.environmentCheck.isValid ? 'VALID' : 'INVALID'}
                  </div>
                </div>

                {productionCheck.environmentCheck.missingVariables.length > 0 && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <div className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">
                      Missing Environment Variables:
                    </div>
                    <ul className="text-sm text-red-700 dark:text-red-300 space-y-1">
                      {productionCheck.environmentCheck.missingVariables.map((variable: string) => (
                        <li key={variable}>• {variable}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {productionCheck.environmentCheck.testVariables.length > 0 && (
                  <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                    <div className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                      Test Values Detected:
                    </div>
                    <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                      {productionCheck.environmentCheck.testVariables.map((variable: string) => (
                        <li key={variable}>• {variable}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {productionCheck.environmentCheck.recommendations.length > 0 && (
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                      Recommendations:
                    </div>
                    <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                      {productionCheck.environmentCheck.recommendations.map((rec: string, i: number) => (
                        <li key={i}>• {rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </UnifiedCardContent>
          </UnifiedCard>
        )}

        {/* Mock Data Issues */}
        {scanResult && scanResult.issues.length > 0 && (
          <UnifiedCard>
            <UnifiedCardHeader
              title="Mock Data Issues"
              subtitle={`${scanResult.issues.length} issues found that need attention`}
            />
            
            <UnifiedCardContent>
              <div className="space-y-3">
                {scanResult.issues.map((issue) => {
                  const SeverityIcon = getSeverityIcon(issue.severity)
                  const TypeIcon = getTypeIcon(issue.type)
                  
                  return (
                    <div
                      key={issue.id}
                      className={cn(
                        'p-4 rounded-lg border cursor-pointer transition-colors',
                        issue.isProductionBlocking 
                          ? 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20'
                          : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50',
                        selectedIssue?.id === issue.id && 'ring-2 ring-blue-500'
                      )}
                      onClick={() => setSelectedIssue(selectedIssue?.id === issue.id ? null : issue)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className="flex items-center gap-2">
                            <SeverityIcon className={cn('w-4 h-4', getSeverityColor(issue.severity))} />
                            <TypeIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                          </div>
                          
                          <div className="flex-1">
                            <div className="font-medium text-sm text-gray-900 dark:text-white">
                              {issue.description}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {issue.location}
                            </div>
                            {issue.isProductionBlocking && (
                              <div className="text-xs text-red-600 dark:text-red-400 mt-1 font-medium">
                                ⚠️ Production Blocking
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <div className={cn(
                            'text-xs px-2 py-1 rounded-full',
                            issue.severity === 'critical' && 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400',
                            issue.severity === 'high' && 'bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400',
                            issue.severity === 'medium' && 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400',
                            issue.severity === 'low' && 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                          )}>
                            {issue.severity.toUpperCase()}
                          </div>
                          
                          <div className={cn(
                            'text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                          )}>
                            {issue.type.replace('_', ' ').toUpperCase()}
                          </div>
                        </div>
                      </div>
                      
                      {selectedIssue?.id === issue.id && (
                        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                          <div className="space-y-3">
                            <div>
                              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                                Mock Content:
                              </div>
                              <div className="text-sm text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 p-2 rounded font-mono">
                                {issue.mockContent}
                              </div>
                            </div>
                            
                            <div>
                              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                                Suggested Fix:
                              </div>
                              <div className="text-sm text-gray-700 dark:text-gray-300">
                                {issue.suggestedFix}
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
        {productionCheck?.overallReadiness?.recommendations && productionCheck.overallReadiness.recommendations.length > 0 && (
          <UnifiedCard>
            <UnifiedCardHeader
              title="Production Readiness Recommendations"
              subtitle="Actions needed to achieve production readiness"
            />
            
            <UnifiedCardContent>
              <div className="space-y-2">
                {productionCheck.overallReadiness.recommendations.map((recommendation: string, i: number) => (
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
