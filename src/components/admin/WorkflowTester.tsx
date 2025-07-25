'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { 
  WorkflowTester as WorkflowTestingEngine,
  WorkflowTest,
  WorkflowTestResult,
  WorkflowStep,
  WORKFLOW_CONFIGURATIONS
} from '@/lib/testing/workflowTesting'
import { UnifiedCard, UnifiedCardHeader, UnifiedCardContent } from '@/components/ui/UnifiedCard'
import { UnifiedButton } from '@/components/ui/UnifiedButton'
import { OptimizedLoading } from '@/components/ui/OptimizedLoading'
import { OptimizedErrorBoundary } from '@/components/ui/OptimizedErrorHandling'
import { 
  Play, 
  CheckCircle, 
  XCircle, 
  Clock,
  Image,
  Video,
  Zap,
  Database,
  Cloud,
  Images,
  Settings,
  AlertTriangle,
  TrendingUp
} from 'lucide-react'

interface WorkflowTesterProps {
  className?: string
  onTestComplete?: (results: any) => void
}

/**
 * WorkflowTester - Comprehensive end-to-end workflow testing component
 * 
 * Features:
 * - Tests complete user workflows from model selection to storage
 * - Validates all three core modes (IMAGES, VIDEO, ENHANCE)
 * - Real-time progress tracking with detailed step monitoring
 * - Comprehensive results analysis with recommendations
 * - Integration with unified design system and loading states
 */
export function WorkflowTester({ className, onTestComplete }: WorkflowTesterProps) {
  const [testEngine] = useState(() => new WorkflowTestingEngine())
  const [isRunning, setIsRunning] = useState(false)
  const [currentTest, setCurrentTest] = useState<WorkflowTest | null>(null)
  const [testResults, setTestResults] = useState<any>(null)
  const [selectedMode, setSelectedMode] = useState<'IMAGES' | 'VIDEO' | 'ENHANCE' | 'ALL'>('ALL')

  const runWorkflowTest = async (mode: 'IMAGES' | 'VIDEO' | 'ENHANCE' | 'ALL') => {
    setIsRunning(true)
    setTestResults(null)
    
    try {
      if (mode === 'ALL') {
        // Run comprehensive test suite
        const results = await testEngine.runComprehensiveTestSuite()
        setTestResults(results)
        onTestComplete?.(results)
      } else {
        // Run single mode test
        const test = testEngine.createTest(mode)
        setCurrentTest(test)
        
        const result = await testEngine.executeTest(test.id)
        setTestResults({ 
          overallSuccess: result.success,
          totalTests: 1,
          successfulTests: result.success ? 1 : 0,
          failedTests: result.success ? 0 : 1,
          results: [result],
          summary: {
            [mode.toLowerCase() + 'Workflow']: result
          },
          recommendations: result.recommendations
        })
        onTestComplete?.(result)
      }
    } catch (error) {
      console.error('Error running workflow test:', error)
      setTestResults({
        overallSuccess: false,
        totalTests: 0,
        successfulTests: 0,
        failedTests: 1,
        results: [],
        summary: {},
        recommendations: ['Test execution failed - check system configuration'],
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setIsRunning(false)
      setCurrentTest(null)
    }
  }

  const getStepIcon = (stepId: string) => {
    switch (stepId) {
      case 'model-selection': return Settings
      case 'parameter-validation': return CheckCircle
      case 'prompt-enhancement': return Zap
      case 'image-generation': return Image
      case 'video-processing': return Video
      case 'enhancement-processing': return TrendingUp
      case 'cloudinary-storage': return Cloud
      case 'database-storage': return Database
      case 'gallery-integration': return Images
      default: return Clock
    }
  }

  const getStatusColor = (status: WorkflowStep['status']) => {
    switch (status) {
      case 'success': return 'text-green-600 dark:text-green-400'
      case 'error': return 'text-red-600 dark:text-red-400'
      case 'running': return 'text-blue-600 dark:text-blue-400'
      case 'pending': return 'text-gray-500 dark:text-gray-400'
    }
  }

  const getStatusIcon = (status: WorkflowStep['status']) => {
    switch (status) {
      case 'success': return CheckCircle
      case 'error': return XCircle
      case 'running': return Clock
      case 'pending': return Clock
    }
  }

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`
    return `${(ms / 1000).toFixed(1)}s`
  }

  return (
    <OptimizedErrorBoundary>
      <div className={cn('space-y-6', className)}>
        {/* Header */}
        <UnifiedCard>
          <UnifiedCardHeader
            title="End-to-End Workflow Testing"
            subtitle="Comprehensive testing of complete user workflows from model selection to storage"
          />
          
          <UnifiedCardContent>
            <div className="space-y-4">
              {/* Mode Selection */}
              <div>
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Test Mode:
                </div>
                <div className="flex gap-2">
                  <UnifiedButton
                    variant={selectedMode === 'ALL' ? 'primary' : 'secondary'}
                    size="sm"
                    onClick={() => setSelectedMode('ALL')}
                    disabled={isRunning}
                  >
                    All Modes
                  </UnifiedButton>
                  
                  <UnifiedButton
                    variant={selectedMode === 'IMAGES' ? 'primary' : 'secondary'}
                    size="sm"
                    onClick={() => setSelectedMode('IMAGES')}
                    disabled={isRunning}
                    icon={<Image className="w-4 h-4" />}
                  >
                    Images
                  </UnifiedButton>
                  
                  <UnifiedButton
                    variant={selectedMode === 'VIDEO' ? 'primary' : 'secondary'}
                    size="sm"
                    onClick={() => setSelectedMode('VIDEO')}
                    disabled={isRunning}
                    icon={<Video className="w-4 h-4" />}
                  >
                    Video
                  </UnifiedButton>
                  
                  <UnifiedButton
                    variant={selectedMode === 'ENHANCE' ? 'primary' : 'secondary'}
                    size="sm"
                    onClick={() => setSelectedMode('ENHANCE')}
                    disabled={isRunning}
                    icon={<Zap className="w-4 h-4" />}
                  >
                    Enhance
                  </UnifiedButton>
                </div>
              </div>

              {/* Run Test Button */}
              <div className="flex gap-2">
                <UnifiedButton
                  variant="primary"
                  onClick={() => runWorkflowTest(selectedMode)}
                  loading={isRunning}
                  icon={<Play className="w-4 h-4" />}
                >
                  {isRunning ? 'Running Tests...' : `Run ${selectedMode === 'ALL' ? 'All' : selectedMode} Test${selectedMode === 'ALL' ? 's' : ''}`}
                </UnifiedButton>
                
                {testResults && (
                  <UnifiedButton
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setTestResults(null)
                      testEngine.clearAll()
                    }}
                  >
                    Clear Results
                  </UnifiedButton>
                )}
              </div>

              {/* Running Test Progress */}
              {isRunning && currentTest && (
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-3 mb-3">
                    <OptimizedLoading variant="processing" size="sm" />
                    <div>
                      <div className="font-medium text-blue-800 dark:text-blue-200">
                        Running {currentTest.name}
                      </div>
                      <div className="text-sm text-blue-600 dark:text-blue-400">
                        Testing {currentTest.mode} workflow with {currentTest.modelId}
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    {currentTest.steps.map((step, index) => {
                      const StepIcon = getStepIcon(step.id)
                      const StatusIcon = getStatusIcon(step.status)
                      
                      return (
                        <div key={step.id} className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <StepIcon className="w-4 h-4 text-gray-500" />
                            <StatusIcon className={cn('w-4 h-4', getStatusColor(step.status))} />
                          </div>
                          
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {step.name}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {step.description}
                            </div>
                          </div>
                          
                          {step.duration && (
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {formatDuration(step.duration)}
                            </div>
                          )}
                          
                          {step.status === 'error' && step.error && (
                            <div className="text-xs text-red-600 dark:text-red-400 max-w-xs truncate">
                              {step.error}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
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
                subtitle={`${testResults.totalTests} workflow test${testResults.totalTests !== 1 ? 's' : ''} completed`}
              />
              
              <UnifiedCardContent>
                <div className="space-y-4">
                  {/* Overall Status */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'flex items-center gap-2 text-sm font-medium',
                        testResults.overallSuccess
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-red-600 dark:text-red-400'
                      )}>
                        {testResults.overallSuccess ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : (
                          <XCircle className="w-4 h-4" />
                        )}
                        Workflow Tests: {testResults.overallSuccess ? 'PASSED' : 'FAILED'}
                      </div>
                    </div>
                    
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {testResults.successfulTests}/{testResults.totalTests} passed
                    </div>
                  </div>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Total Tests:</span>
                      <span className="ml-2 font-medium">{testResults.totalTests}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Successful:</span>
                      <span className="ml-2 font-medium text-green-600 dark:text-green-400">
                        {testResults.successfulTests}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Failed:</span>
                      <span className="ml-2 font-medium text-red-600 dark:text-red-400">
                        {testResults.failedTests}
                      </span>
                    </div>
                  </div>

                  {/* Error Display */}
                  {testResults.error && (
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                      <div className="flex items-center gap-2 text-red-800 dark:text-red-200">
                        <AlertTriangle className="w-4 h-4" />
                        <span className="font-medium">Test Execution Error</span>
                      </div>
                      <div className="text-sm text-red-700 dark:text-red-300 mt-1">
                        {testResults.error}
                      </div>
                    </div>
                  )}
                </div>
              </UnifiedCardContent>
            </UnifiedCard>

            {/* Individual Test Results */}
            {testResults.results && testResults.results.length > 0 && (
              <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
                {testResults.results.map((result: WorkflowTestResult) => {
                  const mode = result.testId.split('-')[0].toUpperCase()
                  const ModeIcon = mode === 'IMAGES' ? Image : mode === 'VIDEO' ? Video : Zap
                  
                  return (
                    <UnifiedCard key={result.testId}>
                      <UnifiedCardHeader
                        title={`${mode} Workflow`}
                        subtitle={`${result.successfulSteps}/${result.totalSteps} steps completed`}
                        icon={<ModeIcon className="w-5 h-5" />}
                      />
                      
                      <UnifiedCardContent>
                        <div className="space-y-3">
                          {/* Status */}
                          <div className="flex items-center justify-between">
                            <div className={cn(
                              'flex items-center gap-2 text-sm font-medium',
                              result.success
                                ? 'text-green-600 dark:text-green-400'
                                : 'text-red-600 dark:text-red-400'
                            )}>
                              {result.success ? (
                                <CheckCircle className="w-4 h-4" />
                              ) : (
                                <XCircle className="w-4 h-4" />
                              )}
                              {result.success ? 'PASSED' : 'FAILED'}
                            </div>
                            
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {formatDuration(result.totalDuration)}
                            </div>
                          </div>

                          {/* Progress Bar */}
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div 
                              className={cn(
                                'h-2 rounded-full transition-all duration-300',
                                result.success
                                  ? 'bg-gradient-to-r from-green-500 to-emerald-600'
                                  : 'bg-gradient-to-r from-red-500 to-red-600'
                              )}
                              style={{ width: `${(result.successfulSteps / result.totalSteps) * 100}%` }}
                            />
                          </div>

                          {/* Errors */}
                          {result.errors.length > 0 && (
                            <div className="space-y-1">
                              <div className="text-xs font-medium text-red-600 dark:text-red-400">
                                Errors:
                              </div>
                              {result.errors.slice(0, 2).map((error, i) => (
                                <div key={i} className="text-xs text-red-700 dark:text-red-300">
                                  • {error}
                                </div>
                              ))}
                              {result.errors.length > 2 && (
                                <div className="text-xs text-red-600 dark:text-red-400">
                                  +{result.errors.length - 2} more errors
                                </div>
                              )}
                            </div>
                          )}

                          {/* Key Results */}
                          {result.results && (
                            <div className="space-y-1">
                              <div className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                Key Results:
                              </div>
                              {result.results.imageGeneration && (
                                <div className="text-xs text-gray-700 dark:text-gray-300">
                                  • Generation: {result.results.imageGeneration.status}
                                </div>
                              )}
                              {result.results.cloudinaryStorage && (
                                <div className="text-xs text-gray-700 dark:text-gray-300">
                                  • Storage: {result.results.cloudinaryStorage.format} ({result.results.cloudinaryStorage.bytes} bytes)
                                </div>
                              )}
                              {result.results.databaseStorage && (
                                <div className="text-xs text-gray-700 dark:text-gray-300">
                                  • Database: {result.results.databaseStorage.imageId}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </UnifiedCardContent>
                    </UnifiedCard>
                  )
                })}
              </div>
            )}

            {/* Recommendations */}
            {testResults.recommendations && testResults.recommendations.length > 0 && (
              <UnifiedCard>
                <UnifiedCardHeader
                  title="Recommendations"
                  subtitle="Suggested improvements based on test results"
                />
                
                <UnifiedCardContent>
                  <div className="space-y-2">
                    {testResults.recommendations.map((recommendation: string, i: number) => (
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
