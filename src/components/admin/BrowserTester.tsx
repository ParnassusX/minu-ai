'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { 
  BrowserTester as BrowserTestingEngine,
  ComprehensiveBrowserTestResult,
  BrowserTestSuite,
  TestResult,
  RESPONSIVE_BREAKPOINTS,
  CORE_TEST_SCENARIOS
} from '@/lib/testing/browserTesting'
import { UnifiedCard, UnifiedCardHeader, UnifiedCardContent } from '@/components/ui/UnifiedCard'
import { UnifiedButton } from '@/components/ui/UnifiedButton'
import { OptimizedLoading } from '@/components/ui/OptimizedLoading'
import { OptimizedErrorBoundary } from '@/components/ui/OptimizedErrorHandling'
import {
  Play,
  CheckCircle,
  XCircle,
  Clock,
  Smartphone,
  Tablet,
  Monitor,
  AlertTriangle,
  TrendingUp,
  Eye,
  Settings,
  Image,
  Upload,
  Zap,
  Images
} from 'lucide-react'

interface BrowserTesterProps {
  className?: string
  onTestComplete?: (results: ComprehensiveBrowserTestResult) => void
}

/**
 * BrowserTester - Comprehensive responsive browser testing component
 * 
 * Features:
 * - Tests all responsive breakpoints (375px, 768px, 1920px)
 * - Validates functionality across mobile, tablet, and desktop
 * - Real-time progress tracking with detailed test monitoring
 * - Comprehensive results analysis with breakpoint-specific insights
 * - Integration with unified design system and loading states
 */
export function BrowserTester({ className, onTestComplete }: BrowserTesterProps) {
  const [testEngine] = useState(() => new BrowserTestingEngine())
  const [isRunning, setIsRunning] = useState(false)
  const [testResults, setTestResults] = useState<ComprehensiveBrowserTestResult | null>(null)
  const [currentBreakpoint, setCurrentBreakpoint] = useState<string | null>(null)
  const [currentTest, setCurrentTest] = useState<string | null>(null)

  const runBrowserTests = async () => {
    setIsRunning(true)
    setTestResults(null)
    setCurrentBreakpoint(null)
    setCurrentTest(null)
    
    try {
      // Simulate progressive testing with status updates
      const results = await testEngine.runComprehensiveTests()
      setTestResults(results)
      onTestComplete?.(results)
    } catch (error) {
      console.error('Error running browser tests:', error)
      setTestResults({
        testRunId: `error-${Date.now()}`,
        timestamp: Date.now(),
        breakpoints: [],
        overallStatus: 'failed',
        summary: {
          totalSuites: 0,
          totalTests: 0,
          passedTests: 0,
          failedTests: 1,
          skippedTests: 0,
          totalDuration: 0
        },
        recommendations: ['Test execution failed - check system configuration']
      })
    } finally {
      setIsRunning(false)
      setCurrentBreakpoint(null)
      setCurrentTest(null)
    }
  }

  const getBreakpointIcon = (deviceType: string) => {
    switch (deviceType) {
      case 'mobile': return Smartphone
      case 'tablet': return Tablet
      case 'desktop': return Monitor
      default: return Monitor
    }
  }

  const getTestIcon = (testId: string) => {
    switch (testId) {
      case 'navigation-functionality': return Settings
      case 'generator-interface': return Image
      case 'model-selection': return Settings
      case 'parameter-controls': return Settings
      case 'image-upload': return Upload
      case 'generation-workflow': return Zap
      case 'loading-states': return Clock
      case 'error-handling': return AlertTriangle
      case 'gallery-interface': return Images
      case 'settings-interface': return Settings
      default: return Eye
    }
  }

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'passed': return 'text-green-600 dark:text-green-400'
      case 'failed': return 'text-red-600 dark:text-red-400'
      case 'skipped': return 'text-gray-500 dark:text-gray-400'
    }
  }

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'passed': return CheckCircle
      case 'failed': return XCircle
      case 'skipped': return Clock
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
        for (const breakpoint of RESPONSIVE_BREAKPOINTS) {
          setCurrentBreakpoint(breakpoint.name)
          
          for (const scenario of CORE_TEST_SCENARIOS) {
            setCurrentTest(scenario.name)
            await new Promise(resolve => setTimeout(resolve, 200))
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
            title="Responsive Browser Testing"
            subtitle="Comprehensive testing across mobile, tablet, and desktop breakpoints"
          />
          
          <UnifiedCardContent>
            <div className="space-y-4">
              {/* Breakpoint Overview */}
              <div>
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Test Breakpoints:
                </div>
                <div className="grid grid-cols-3 gap-4">
                  {RESPONSIVE_BREAKPOINTS.map((breakpoint) => {
                    const BreakpointIcon = getBreakpointIcon(breakpoint.deviceType)
                    
                    return (
                      <div
                        key={breakpoint.name}
                        className={cn(
                          'p-3 rounded-lg border transition-colors',
                          currentBreakpoint === breakpoint.name
                            ? 'border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-200 dark:border-gray-700'
                        )}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <BreakpointIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                          <span className="font-medium text-sm text-gray-900 dark:text-white">
                            {breakpoint.name}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {breakpoint.width}x{breakpoint.height}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {breakpoint.description}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Run Tests Button */}
              <div className="flex gap-2">
                <UnifiedButton
                  variant="primary"
                  onClick={runBrowserTests}
                  loading={isRunning}
                  icon={<Play className="w-4 h-4" />}
                >
                  {isRunning ? 'Running Tests...' : 'Run Browser Tests'}
                </UnifiedButton>
                
                {testResults && (
                  <UnifiedButton
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setTestResults(null)
                      testEngine.clearResults()
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
                        Running Browser Tests
                      </div>
                      <div className="text-sm text-blue-600 dark:text-blue-400">
                        Testing responsive design across all breakpoints
                      </div>
                    </div>
                  </div>
                  
                  {currentBreakpoint && (
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-blue-700 dark:text-blue-300">
                        Current Breakpoint: {currentBreakpoint}
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

        {/* Test Results */}
        {testResults && (
          <div className="space-y-6">
            {/* Overall Results */}
            <UnifiedCard>
              <UnifiedCardHeader
                title="Test Results Summary"
                subtitle={`${testResults.summary.totalTests} tests across ${testResults.summary.totalSuites} breakpoints`}
              />
              
              <UnifiedCardContent>
                <div className="space-y-4">
                  {/* Overall Status */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'flex items-center gap-2 text-sm font-medium',
                        testResults.overallStatus === 'passed'
                          ? 'text-green-600 dark:text-green-400'
                          : testResults.overallStatus === 'partial'
                          ? 'text-yellow-600 dark:text-yellow-400'
                          : 'text-red-600 dark:text-red-400'
                      )}>
                        {testResults.overallStatus === 'passed' ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : testResults.overallStatus === 'partial' ? (
                          <AlertTriangle className="w-4 h-4" />
                        ) : (
                          <XCircle className="w-4 h-4" />
                        )}
                        Browser Tests: {testResults.overallStatus.toUpperCase()}
                      </div>
                    </div>
                    
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {testResults.summary.passedTests}/{testResults.summary.totalTests} passed
                    </div>
                  </div>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Total Tests:</span>
                      <span className="ml-2 font-medium">{testResults.summary.totalTests}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Passed:</span>
                      <span className="ml-2 font-medium text-green-600 dark:text-green-400">
                        {testResults.summary.passedTests}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Failed:</span>
                      <span className="ml-2 font-medium text-red-600 dark:text-red-400">
                        {testResults.summary.failedTests}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Duration:</span>
                      <span className="ml-2 font-medium">
                        {formatDuration(testResults.summary.totalDuration)}
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className={cn(
                        'h-2 rounded-full transition-all duration-500',
                        testResults.overallStatus === 'passed'
                          ? 'bg-gradient-to-r from-green-500 to-emerald-600'
                          : testResults.overallStatus === 'partial'
                          ? 'bg-gradient-to-r from-yellow-500 to-orange-600'
                          : 'bg-gradient-to-r from-red-500 to-red-600'
                      )}
                      style={{ 
                        width: `${(testResults.summary.passedTests / testResults.summary.totalTests) * 100}%` 
                      }}
                    />
                  </div>
                </div>
              </UnifiedCardContent>
            </UnifiedCard>

            {/* Breakpoint Results */}
            <div className="grid gap-6 lg:grid-cols-3">
              {testResults.breakpoints.map((suite) => {
                const BreakpointIcon = getBreakpointIcon(suite.breakpoint.deviceType)
                
                return (
                  <UnifiedCard key={suite.suiteId}>
                    <UnifiedCardHeader
                      title={suite.breakpoint.name}
                      subtitle={`${suite.breakpoint.width}x${suite.breakpoint.height}`}
                      icon={<BreakpointIcon className="w-5 h-5" />}
                    />
                    
                    <UnifiedCardContent>
                      <div className="space-y-4">
                        {/* Suite Status */}
                        <div className="flex items-center justify-between">
                          <div className={cn(
                            'flex items-center gap-2 text-sm font-medium',
                            suite.overallStatus === 'passed'
                              ? 'text-green-600 dark:text-green-400'
                              : suite.overallStatus === 'partial'
                              ? 'text-yellow-600 dark:text-yellow-400'
                              : 'text-red-600 dark:text-red-400'
                          )}>
                            {suite.overallStatus === 'passed' ? (
                              <CheckCircle className="w-4 h-4" />
                            ) : suite.overallStatus === 'partial' ? (
                              <AlertTriangle className="w-4 h-4" />
                            ) : (
                              <XCircle className="w-4 h-4" />
                            )}
                            {suite.overallStatus.toUpperCase()}
                          </div>
                          
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {formatDuration(suite.totalDuration)}
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                          <div 
                            className={cn(
                              'h-1.5 rounded-full transition-all duration-300',
                              suite.overallStatus === 'passed'
                                ? 'bg-gradient-to-r from-green-500 to-emerald-600'
                                : suite.overallStatus === 'partial'
                                ? 'bg-gradient-to-r from-yellow-500 to-orange-600'
                                : 'bg-gradient-to-r from-red-500 to-red-600'
                            )}
                            style={{ width: `${(suite.passedTests / suite.totalTests) * 100}%` }}
                          />
                        </div>

                        {/* Test Results */}
                        <div className="space-y-2">
                          {suite.tests.slice(0, 5).map((test) => {
                            const TestIcon = getTestIcon(test.testId.split('-')[0])
                            const StatusIcon = getStatusIcon(test.status)
                            
                            return (
                              <div key={test.testId} className="flex items-center gap-2">
                                <TestIcon className="w-3 h-3 text-gray-500 dark:text-gray-400" />
                                <StatusIcon className={cn('w-3 h-3', getStatusColor(test.status))} />
                                <span className="text-xs text-gray-700 dark:text-gray-300 flex-1 truncate">
                                  {test.testName.replace(` - ${suite.breakpoint.name}`, '')}
                                </span>
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  {formatDuration(test.duration)}
                                </span>
                              </div>
                            )
                          })}
                          
                          {suite.tests.length > 5 && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                              +{suite.tests.length - 5} more tests
                            </div>
                          )}
                        </div>

                        {/* Quick Stats */}
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div className="text-center">
                            <div className="font-medium text-green-600 dark:text-green-400">
                              {suite.passedTests}
                            </div>
                            <div className="text-gray-500 dark:text-gray-400">Passed</div>
                          </div>
                          <div className="text-center">
                            <div className="font-medium text-red-600 dark:text-red-400">
                              {suite.failedTests}
                            </div>
                            <div className="text-gray-500 dark:text-gray-400">Failed</div>
                          </div>
                          <div className="text-center">
                            <div className="font-medium text-gray-600 dark:text-gray-400">
                              {suite.skippedTests}
                            </div>
                            <div className="text-gray-500 dark:text-gray-400">Skipped</div>
                          </div>
                        </div>
                      </div>
                    </UnifiedCardContent>
                  </UnifiedCard>
                )
              })}
            </div>

            {/* Recommendations */}
            {testResults.recommendations && testResults.recommendations.length > 0 && (
              <UnifiedCard>
                <UnifiedCardHeader
                  title="Recommendations"
                  subtitle="Suggested improvements based on browser test results"
                />
                
                <UnifiedCardContent>
                  <div className="space-y-2">
                    {testResults.recommendations.map((recommendation, i) => (
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
