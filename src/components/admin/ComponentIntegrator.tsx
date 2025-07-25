'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { 
  ComponentIntegrator as ComponentIntegrationEngine,
  ComponentIntegrationReport,
  IntegrationResult,
  INTEGRATION_CHECKS
} from '@/lib/integration/componentIntegration'
import { UnifiedCard, UnifiedCardHeader, UnifiedCardContent } from '@/components/ui/UnifiedCard'
import { UnifiedButton } from '@/components/ui/UnifiedButton'
import { OptimizedLoading } from '@/components/ui/OptimizedLoading'
import { OptimizedErrorBoundary } from '@/components/ui/OptimizedErrorHandling'
import { 
  Play, 
  CheckCircle, 
  XCircle, 
  Clock,
  AlertTriangle,
  TrendingUp,
  Settings,
  Image,
  Palette,
  Database,
  TestTube,
  Layers,
  Zap,
  Shield
} from 'lucide-react'

interface ComponentIntegratorProps {
  className?: string
  onIntegrationComplete?: (report: ComponentIntegrationReport) => void
}

/**
 * ComponentIntegrator - Comprehensive component integration testing interface
 * 
 * Features:
 * - Tests integration of all optimized components
 * - Validates dependencies and component interactions
 * - Real-time progress tracking with detailed status monitoring
 * - Comprehensive results analysis with production readiness assessment
 * - Integration with unified design system and loading states
 */
export function ComponentIntegrator({ className, onIntegrationComplete }: ComponentIntegratorProps) {
  const [integrationEngine] = useState(() => new ComponentIntegrationEngine())
  const [isRunning, setIsRunning] = useState(false)
  const [integrationReport, setIntegrationReport] = useState<ComponentIntegrationReport | null>(null)
  const [currentCheck, setCurrentCheck] = useState<string | null>(null)
  const [currentCategory, setCurrentCategory] = useState<string | null>(null)

  const runIntegrationTests = async () => {
    setIsRunning(true)
    setIntegrationReport(null)
    setCurrentCheck(null)
    setCurrentCategory(null)
    
    try {
      // Simulate progressive testing with status updates
      const report = await integrationEngine.runIntegrationTests()
      setIntegrationReport(report)
      onIntegrationComplete?.(report)
    } catch (error) {
      console.error('Error running integration tests:', error)
      setIntegrationReport({
        reportId: `error-${Date.now()}`,
        timestamp: Date.now(),
        overallStatus: 'failed',
        totalChecks: 0,
        passedChecks: 0,
        failedChecks: 1,
        categories: {
          navigation: [],
          generator: [],
          ui: [],
          data: [],
          testing: []
        },
        criticalIssues: ['Integration testing failed - check system configuration'],
        recommendations: ['Review system configuration and component dependencies'],
        productionReadiness: {
          isReady: false,
          blockers: ['Integration testing failure'],
          warnings: []
        }
      })
    } finally {
      setIsRunning(false)
      setCurrentCheck(null)
      setCurrentCategory(null)
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'navigation': return Settings
      case 'generator': return Image
      case 'ui': return Palette
      case 'data': return Database
      case 'testing': return TestTube
      default: return Layers
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-600 dark:text-red-400'
      case 'high': return 'text-orange-600 dark:text-orange-400'
      case 'medium': return 'text-yellow-600 dark:text-yellow-400'
      case 'low': return 'text-blue-600 dark:text-blue-400'
      default: return 'text-gray-600 dark:text-gray-400'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed': return CheckCircle
      case 'failed': return XCircle
      case 'checking': return Clock
      case 'pending': return Clock
      default: return Clock
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'passed': return 'text-green-600 dark:text-green-400'
      case 'failed': return 'text-red-600 dark:text-red-400'
      case 'checking': return 'text-blue-600 dark:text-blue-400'
      case 'pending': return 'text-gray-500 dark:text-gray-400'
      default: return 'text-gray-500 dark:text-gray-400'
    }
  }

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`
    return `${(ms / 1000).toFixed(1)}s`
  }

  // Simulate progressive testing updates
  useEffect(() => {
    if (isRunning) {
      const simulateProgress = async () => {
        const categories = ['navigation', 'generator', 'ui', 'data', 'testing']
        
        for (const category of categories) {
          setCurrentCategory(category)
          
          const categoryChecks = INTEGRATION_CHECKS.filter(check => check.category === category)
          for (const check of categoryChecks) {
            setCurrentCheck(check.name)
            await new Promise(resolve => setTimeout(resolve, 300))
          }
        }
      }
      
      simulateProgress()
    }
  }, [isRunning])

  return (
    <OptimizedErrorBoundary>
      <div className={cn('space-y-6', className)}>
        {/* Header */}
        <UnifiedCard>
          <UnifiedCardHeader
            title="Component Integration Testing"
            subtitle="Comprehensive testing of all optimized components working together seamlessly"
          />
          
          <UnifiedCardContent>
            <div className="space-y-4">
              {/* Integration Overview */}
              <div>
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Integration Categories:
                </div>
                <div className="grid grid-cols-5 gap-4">
                  {['navigation', 'generator', 'ui', 'data', 'testing'].map((category) => {
                    const CategoryIcon = getCategoryIcon(category)
                    const categoryChecks = INTEGRATION_CHECKS.filter(check => check.category === category)
                    
                    return (
                      <div
                        key={category}
                        className={cn(
                          'p-3 rounded-lg border transition-colors',
                          currentCategory === category
                            ? 'border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-200 dark:border-gray-700'
                        )}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <CategoryIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                          <span className="font-medium text-sm text-gray-900 dark:text-white capitalize">
                            {category}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {categoryChecks.length} checks
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Run Integration Tests Button */}
              <div className="flex gap-2">
                <UnifiedButton
                  variant="primary"
                  onClick={runIntegrationTests}
                  loading={isRunning}
                  icon={<Play className="w-4 h-4" />}
                >
                  {isRunning ? 'Running Integration Tests...' : 'Run Integration Tests'}
                </UnifiedButton>
                
                {integrationReport && (
                  <UnifiedButton
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setIntegrationReport(null)
                      integrationEngine.clearResults()
                    }}
                  >
                    Clear Results
                  </UnifiedButton>
                )}
              </div>

              {/* Running Test Progress */}
              {isRunning && (
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-3 mb-3">
                    <OptimizedLoading variant="processing" size="sm" />
                    <div>
                      <div className="font-medium text-blue-800 dark:text-blue-200">
                        Running Component Integration Tests
                      </div>
                      <div className="text-sm text-blue-600 dark:text-blue-400">
                        Testing all optimized components working together seamlessly
                      </div>
                    </div>
                  </div>
                  
                  {currentCategory && (
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-blue-700 dark:text-blue-300 capitalize">
                        Current Category: {currentCategory}
                      </div>
                      {currentCheck && (
                        <div className="text-sm text-blue-600 dark:text-blue-400">
                          Testing: {currentCheck}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </UnifiedCardContent>
        </UnifiedCard>

        {/* Integration Results */}
        {integrationReport && (
          <div className="space-y-6">
            {/* Overall Results */}
            <UnifiedCard>
              <UnifiedCardHeader
                title="Integration Test Results"
                subtitle={`${integrationReport.totalChecks} integration checks completed`}
              />
              
              <UnifiedCardContent>
                <div className="space-y-4">
                  {/* Overall Status */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'flex items-center gap-2 text-sm font-medium',
                        integrationReport.overallStatus === 'passed'
                          ? 'text-green-600 dark:text-green-400'
                          : integrationReport.overallStatus === 'partial'
                          ? 'text-yellow-600 dark:text-yellow-400'
                          : 'text-red-600 dark:text-red-400'
                      )}>
                        {integrationReport.overallStatus === 'passed' ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : integrationReport.overallStatus === 'partial' ? (
                          <AlertTriangle className="w-4 h-4" />
                        ) : (
                          <XCircle className="w-4 h-4" />
                        )}
                        Integration Tests: {integrationReport.overallStatus.toUpperCase()}
                      </div>
                    </div>
                    
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {integrationReport.passedChecks}/{integrationReport.totalChecks} passed
                    </div>
                  </div>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Total Checks:</span>
                      <span className="ml-2 font-medium">{integrationReport.totalChecks}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Passed:</span>
                      <span className="ml-2 font-medium text-green-600 dark:text-green-400">
                        {integrationReport.passedChecks}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Failed:</span>
                      <span className="ml-2 font-medium text-red-600 dark:text-red-400">
                        {integrationReport.failedChecks}
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className={cn(
                        'h-2 rounded-full transition-all duration-500',
                        integrationReport.overallStatus === 'passed'
                          ? 'bg-gradient-to-r from-green-500 to-emerald-600'
                          : integrationReport.overallStatus === 'partial'
                          ? 'bg-gradient-to-r from-yellow-500 to-orange-600'
                          : 'bg-gradient-to-r from-red-500 to-red-600'
                      )}
                      style={{ 
                        width: `${(integrationReport.passedChecks / integrationReport.totalChecks) * 100}%` 
                      }}
                    />
                  </div>

                  {/* Production Readiness */}
                  <div className={cn(
                    'p-4 rounded-lg border',
                    integrationReport.productionReadiness.isReady
                      ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20'
                      : 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20'
                  )}>
                    <div className="flex items-center gap-2 mb-2">
                      {integrationReport.productionReadiness.isReady ? (
                        <Shield className="w-5 h-5 text-green-600 dark:text-green-400" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                      )}
                      <span className={cn(
                        'font-medium',
                        integrationReport.productionReadiness.isReady
                          ? 'text-green-800 dark:text-green-200'
                          : 'text-red-800 dark:text-red-200'
                      )}>
                        Production Readiness: {integrationReport.productionReadiness.isReady ? 'READY' : 'NOT READY'}
                      </span>
                    </div>
                    
                    {integrationReport.productionReadiness.blockers.length > 0 && (
                      <div className="text-sm text-red-700 dark:text-red-300">
                        Blockers: {integrationReport.productionReadiness.blockers.join(', ')}
                      </div>
                    )}
                    
                    {integrationReport.productionReadiness.warnings.length > 0 && (
                      <div className="text-sm text-yellow-700 dark:text-yellow-300">
                        Warnings: {integrationReport.productionReadiness.warnings.join(', ')}
                      </div>
                    )}
                  </div>
                </div>
              </UnifiedCardContent>
            </UnifiedCard>

            {/* Category Results */}
            <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
              {Object.entries(integrationReport.categories).map(([category, results]) => {
                if (results.length === 0) return null
                
                const CategoryIcon = getCategoryIcon(category)
                const passedCount = results.filter(r => r.success).length
                const failedCount = results.length - passedCount
                
                return (
                  <UnifiedCard key={category}>
                    <UnifiedCardHeader
                      title={category.charAt(0).toUpperCase() + category.slice(1)}
                      subtitle={`${results.length} integration checks`}
                      icon={<CategoryIcon className="w-5 h-5" />}
                    />
                    
                    <UnifiedCardContent>
                      <div className="space-y-4">
                        {/* Category Status */}
                        <div className="flex items-center justify-between">
                          <div className={cn(
                            'flex items-center gap-2 text-sm font-medium',
                            failedCount === 0
                              ? 'text-green-600 dark:text-green-400'
                              : passedCount > 0
                              ? 'text-yellow-600 dark:text-yellow-400'
                              : 'text-red-600 dark:text-red-400'
                          )}>
                            {failedCount === 0 ? (
                              <CheckCircle className="w-4 h-4" />
                            ) : passedCount > 0 ? (
                              <AlertTriangle className="w-4 h-4" />
                            ) : (
                              <XCircle className="w-4 h-4" />
                            )}
                            {failedCount === 0 ? 'PASSED' : passedCount > 0 ? 'PARTIAL' : 'FAILED'}
                          </div>
                          
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {passedCount}/{results.length}
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                          <div 
                            className={cn(
                              'h-1.5 rounded-full transition-all duration-300',
                              failedCount === 0
                                ? 'bg-gradient-to-r from-green-500 to-emerald-600'
                                : passedCount > 0
                                ? 'bg-gradient-to-r from-yellow-500 to-orange-600'
                                : 'bg-gradient-to-r from-red-500 to-red-600'
                            )}
                            style={{ width: `${(passedCount / results.length) * 100}%` }}
                          />
                        </div>

                        {/* Individual Results */}
                        <div className="space-y-2">
                          {results.slice(0, 3).map((result, index) => {
                            const check = INTEGRATION_CHECKS.find(c => c.id === result.checkId)
                            const StatusIcon = getStatusIcon(result.success ? 'passed' : 'failed')
                            
                            return (
                              <div key={result.checkId} className="flex items-center gap-2">
                                <StatusIcon className={cn('w-3 h-3', getStatusColor(result.success ? 'passed' : 'failed'))} />
                                <span className="text-xs text-gray-700 dark:text-gray-300 flex-1 truncate">
                                  {check?.name || result.checkId}
                                </span>
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  {formatDuration(result.duration)}
                                </span>
                              </div>
                            )
                          })}
                          
                          {results.length > 3 && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                              +{results.length - 3} more checks
                            </div>
                          )}
                        </div>
                      </div>
                    </UnifiedCardContent>
                  </UnifiedCard>
                )
              })}
            </div>

            {/* Critical Issues */}
            {integrationReport.criticalIssues.length > 0 && (
              <UnifiedCard>
                <UnifiedCardHeader
                  title="Critical Issues"
                  subtitle="Issues that must be resolved before production deployment"
                />
                
                <UnifiedCardContent>
                  <div className="space-y-2">
                    {integrationReport.criticalIssues.map((issue, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <XCircle className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                        <div className="text-sm text-red-700 dark:text-red-300">
                          {issue}
                        </div>
                      </div>
                    ))}
                  </div>
                </UnifiedCardContent>
              </UnifiedCard>
            )}

            {/* Recommendations */}
            {integrationReport.recommendations && integrationReport.recommendations.length > 0 && (
              <UnifiedCard>
                <UnifiedCardHeader
                  title="Integration Recommendations"
                  subtitle="Suggested improvements based on integration test results"
                />
                
                <UnifiedCardContent>
                  <div className="space-y-2">
                    {integrationReport.recommendations.map((recommendation, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
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
        )}
      </div>
    </OptimizedErrorBoundary>
  )
}
