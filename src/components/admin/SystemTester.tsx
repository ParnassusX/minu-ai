'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { 
  SystemTester as SystemTestingEngine,
  SystemTestReport,
  SystemTestResult,
  SYSTEM_TEST_CASES
} from '@/lib/testing/systemTesting'
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
  Database,
  Palette,
  Zap,
  Shield,
  Eye,
  Target,
  Activity,
  Server
} from 'lucide-react'

interface SystemTesterProps {
  className?: string
  onTestComplete?: (report: SystemTestReport) => void
}

/**
 * SystemTester - Comprehensive end-to-end system testing interface
 * 
 * Features:
 * - Tests complete application functionality in production environment
 * - Validates all user workflows and system integrations
 * - Real-time progress tracking with detailed status monitoring
 * - Comprehensive results analysis with production readiness assessment
 * - Integration with unified design system and loading states
 */
export function SystemTester({ className, onTestComplete }: SystemTesterProps) {
  const [testingEngine] = useState(() => new SystemTestingEngine())
  const [isRunning, setIsRunning] = useState(false)
  const [systemReport, setSystemReport] = useState<SystemTestReport | null>(null)
  const [currentTest, setCurrentTest] = useState<string | null>(null)
  const [currentCategory, setCurrentCategory] = useState<string | null>(null)
  const [environment, setEnvironment] = useState<'production' | 'staging' | 'development'>('production')

  const runSystemTests = async () => {
    setIsRunning(true)
    setSystemReport(null)
    setCurrentTest(null)
    setCurrentCategory(null)
    
    try {
      // Simulate progressive testing with status updates
      const report = await testingEngine.runSystemTests(environment)
      setSystemReport(report)
      onTestComplete?.(report)
    } catch (error) {
      console.error('Error running system tests:', error)
      setSystemReport({
        reportId: `error-${Date.now()}`,
        timestamp: Date.now(),
        environment,
        overallStatus: 'failed',
        totalTests: 0,
        passedTests: 0,
        failedTests: 1,
        skippedTests: 0,
        categories: {
          navigation: [],
          generation: [],
          storage: [],
          ui: [],
          performance: [],
          security: [],
          accessibility: []
        },
        criticalFailures: ['System testing failed - check environment configuration'],
        performanceMetrics: {
          averageLoadTime: 0,
          averageRenderTime: 0,
          averageInteractionTime: 0,
          memoryUsage: 0
        },
        productionReadiness: {
          isReady: false,
          blockers: ['System testing failure'],
          warnings: [],
          score: 0
        },
        recommendations: ['Review system configuration and environment setup']
      })
    } finally {
      setIsRunning(false)
      setCurrentTest(null)
      setCurrentCategory(null)
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'navigation': return Settings
      case 'generation': return Image
      case 'storage': return Database
      case 'ui': return Palette
      case 'performance': return Zap
      case 'security': return Shield
      case 'accessibility': return Eye
      default: return Target
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
      case 'running': return Clock
      case 'pending': return Clock
      default: return Clock
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'passed': return 'text-green-600 dark:text-green-400'
      case 'failed': return 'text-red-600 dark:text-red-400'
      case 'running': return 'text-blue-600 dark:text-blue-400'
      case 'pending': return 'text-gray-500 dark:text-gray-400'
      default: return 'text-gray-500 dark:text-gray-400'
    }
  }

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
    return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`
  }

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes}B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
  }

  // Simulate progressive testing updates
  useEffect(() => {
    if (isRunning) {
      const simulateProgress = async () => {
        const categories = ['navigation', 'generation', 'storage', 'ui', 'performance', 'security', 'accessibility']
        
        for (const category of categories) {
          setCurrentCategory(category)
          
          const categoryTests = SYSTEM_TEST_CASES.filter(test => test.category === category)
          for (const test of categoryTests) {
            setCurrentTest(test.name)
            await new Promise(resolve => setTimeout(resolve, 500))
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
            title="Comprehensive System Testing"
            subtitle="End-to-end validation of all functionality in production environment"
          />
          
          <UnifiedCardContent>
            <div className="space-y-4">
              {/* Environment Selection */}
              <div>
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Test Environment:
                </div>
                <div className="flex gap-2">
                  {(['production', 'staging', 'development'] as const).map((env) => (
                    <UnifiedButton
                      key={env}
                      variant={environment === env ? 'primary' : 'secondary'}
                      size="sm"
                      onClick={() => setEnvironment(env)}
                      disabled={isRunning}
                    >
                      {env.charAt(0).toUpperCase() + env.slice(1)}
                    </UnifiedButton>
                  ))}
                </div>
              </div>

              {/* Test Categories Overview */}
              <div>
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Test Categories:
                </div>
                <div className="grid grid-cols-7 gap-4">
                  {['navigation', 'generation', 'storage', 'ui', 'performance', 'security', 'accessibility'].map((category) => {
                    const CategoryIcon = getCategoryIcon(category)
                    const categoryTests = SYSTEM_TEST_CASES.filter(test => test.category === category)
                    
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
                          <span className="font-medium text-xs text-gray-900 dark:text-white capitalize">
                            {category}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {categoryTests.length} tests
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Run System Tests Button */}
              <div className="flex gap-2">
                <UnifiedButton
                  variant="primary"
                  onClick={runSystemTests}
                  loading={isRunning}
                  icon={<Play className="w-4 h-4" />}
                >
                  {isRunning ? 'Running System Tests...' : 'Run System Tests'}
                </UnifiedButton>
                
                {systemReport && (
                  <UnifiedButton
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSystemReport(null)
                      testingEngine.clearResults()
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
                        Running Comprehensive System Tests
                      </div>
                      <div className="text-sm text-blue-600 dark:text-blue-400">
                        Testing all functionality in {environment} environment
                      </div>
                    </div>
                  </div>
                  
                  {currentCategory && (
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-blue-700 dark:text-blue-300 capitalize">
                        Current Category: {currentCategory}
                      </div>
                      {currentTest && (
                        <div className="text-sm text-blue-600 dark:text-blue-400">
                          Testing: {currentTest}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </UnifiedCardContent>
        </UnifiedCard>

        {/* System Test Results */}
        {systemReport && (
          <div className="space-y-6">
            {/* Overall Results */}
            <UnifiedCard>
              <UnifiedCardHeader
                title="System Test Results"
                subtitle={`${systemReport.totalTests} system tests completed in ${systemReport.environment} environment`}
              />
              
              <UnifiedCardContent>
                <div className="space-y-4">
                  {/* Overall Status */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'flex items-center gap-2 text-sm font-medium',
                        systemReport.overallStatus === 'passed'
                          ? 'text-green-600 dark:text-green-400'
                          : systemReport.overallStatus === 'partial'
                          ? 'text-yellow-600 dark:text-yellow-400'
                          : 'text-red-600 dark:text-red-400'
                      )}>
                        {systemReport.overallStatus === 'passed' ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : systemReport.overallStatus === 'partial' ? (
                          <AlertTriangle className="w-4 h-4" />
                        ) : (
                          <XCircle className="w-4 h-4" />
                        )}
                        System Tests: {systemReport.overallStatus.toUpperCase()}
                      </div>
                    </div>
                    
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {systemReport.passedTests}/{systemReport.totalTests} passed
                    </div>
                  </div>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Total Tests:</span>
                      <span className="ml-2 font-medium">{systemReport.totalTests}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Passed:</span>
                      <span className="ml-2 font-medium text-green-600 dark:text-green-400">
                        {systemReport.passedTests}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Failed:</span>
                      <span className="ml-2 font-medium text-red-600 dark:text-red-400">
                        {systemReport.failedTests}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Score:</span>
                      <span className="ml-2 font-medium">{systemReport.productionReadiness.score}%</span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className={cn(
                        'h-2 rounded-full transition-all duration-500',
                        systemReport.overallStatus === 'passed'
                          ? 'bg-gradient-to-r from-green-500 to-emerald-600'
                          : systemReport.overallStatus === 'partial'
                          ? 'bg-gradient-to-r from-yellow-500 to-orange-600'
                          : 'bg-gradient-to-r from-red-500 to-red-600'
                      )}
                      style={{ 
                        width: `${(systemReport.passedTests / systemReport.totalTests) * 100}%` 
                      }}
                    />
                  </div>

                  {/* Production Readiness */}
                  <div className={cn(
                    'p-4 rounded-lg border',
                    systemReport.productionReadiness.isReady
                      ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20'
                      : 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20'
                  )}>
                    <div className="flex items-center gap-2 mb-2">
                      {systemReport.productionReadiness.isReady ? (
                        <Server className="w-5 h-5 text-green-600 dark:text-green-400" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                      )}
                      <span className={cn(
                        'font-medium',
                        systemReport.productionReadiness.isReady
                          ? 'text-green-800 dark:text-green-200'
                          : 'text-red-800 dark:text-red-200'
                      )}>
                        Production Readiness: {systemReport.productionReadiness.isReady ? 'READY' : 'NOT READY'}
                      </span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        (Score: {systemReport.productionReadiness.score}%)
                      </span>
                    </div>
                    
                    {systemReport.productionReadiness.blockers.length > 0 && (
                      <div className="text-sm text-red-700 dark:text-red-300 mb-1">
                        Blockers: {systemReport.productionReadiness.blockers.join(', ')}
                      </div>
                    )}
                    
                    {systemReport.productionReadiness.warnings.length > 0 && (
                      <div className="text-sm text-yellow-700 dark:text-yellow-300">
                        Warnings: {systemReport.productionReadiness.warnings.join(', ')}
                      </div>
                    )}
                  </div>

                  {/* Performance Metrics */}
                  <div className="grid grid-cols-4 gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    <div className="text-center">
                      <div className="text-sm text-gray-500 dark:text-gray-400">Avg Load Time</div>
                      <div className="font-medium">{formatDuration(systemReport.performanceMetrics.averageLoadTime)}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-gray-500 dark:text-gray-400">Avg Render Time</div>
                      <div className="font-medium">{formatDuration(systemReport.performanceMetrics.averageRenderTime)}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-gray-500 dark:text-gray-400">Avg Interaction</div>
                      <div className="font-medium">{formatDuration(systemReport.performanceMetrics.averageInteractionTime)}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-gray-500 dark:text-gray-400">Memory Usage</div>
                      <div className="font-medium">{formatBytes(systemReport.performanceMetrics.memoryUsage * 1024 * 1024)}</div>
                    </div>
                  </div>
                </div>
              </UnifiedCardContent>
            </UnifiedCard>

            {/* Category Results */}
            <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
              {Object.entries(systemReport.categories).map(([category, results]) => {
                if (results.length === 0) return null
                
                const CategoryIcon = getCategoryIcon(category)
                const passedCount = results.filter(r => r.success).length
                const failedCount = results.length - passedCount
                
                return (
                  <UnifiedCard key={category}>
                    <UnifiedCardHeader
                      title={category.charAt(0).toUpperCase() + category.slice(1)}
                      subtitle={`${results.length} system tests`}
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
                            const testCase = SYSTEM_TEST_CASES.find(tc => tc.id === result.testCaseId)
                            const StatusIcon = getStatusIcon(result.success ? 'passed' : 'failed')
                            
                            return (
                              <div key={result.testCaseId} className="flex items-center gap-2">
                                <StatusIcon className={cn('w-3 h-3', getStatusColor(result.success ? 'passed' : 'failed'))} />
                                <span className="text-xs text-gray-700 dark:text-gray-300 flex-1 truncate">
                                  {testCase?.name || result.testCaseId}
                                </span>
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  {formatDuration(result.duration)}
                                </span>
                              </div>
                            )
                          })}
                          
                          {results.length > 3 && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                              +{results.length - 3} more tests
                            </div>
                          )}
                        </div>
                      </div>
                    </UnifiedCardContent>
                  </UnifiedCard>
                )
              })}
            </div>

            {/* Critical Failures */}
            {systemReport.criticalFailures.length > 0 && (
              <UnifiedCard>
                <UnifiedCardHeader
                  title="Critical Failures"
                  subtitle="Issues that must be resolved before production deployment"
                />
                
                <UnifiedCardContent>
                  <div className="space-y-2">
                    {systemReport.criticalFailures.map((failure, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <XCircle className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                        <div className="text-sm text-red-700 dark:text-red-300">
                          {failure}
                        </div>
                      </div>
                    ))}
                  </div>
                </UnifiedCardContent>
              </UnifiedCard>
            )}

            {/* Recommendations */}
            {systemReport.recommendations && systemReport.recommendations.length > 0 && (
              <UnifiedCard>
                <UnifiedCardHeader
                  title="System Test Recommendations"
                  subtitle="Suggested improvements based on system test results"
                />
                
                <UnifiedCardContent>
                  <div className="space-y-2">
                    {systemReport.recommendations.map((recommendation, i) => (
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
