'use client'

import React, { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { 
  ProductionReadinessValidator as ProductionValidator,
  ProductionReadinessReport,
  PRODUCTION_READINESS_CHECKS
} from '@/lib/validation/productionReadiness'
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
  Zap,
  Shield,
  Eye,
  Palette,
  Server,
  TestTube,
  Target,
  Rocket,
  Award,
  AlertCircle
} from 'lucide-react'

interface ProductionReadinessValidatorProps {
  className?: string
  onValidationComplete?: (report: ProductionReadinessReport) => void
}

/**
 * ProductionReadinessValidator - Comprehensive production deployment readiness assessment
 * 
 * Features:
 * - Validates all aspects of application readiness for production deployment
 * - Assesses functionality, performance, security, accessibility, design, infrastructure, and testing
 * - Real-time progress tracking with detailed status monitoring
 * - Comprehensive results analysis with deployment decision guidance
 * - Integration with unified design system and loading states
 */
export function ProductionReadinessValidator({ className, onValidationComplete }: ProductionReadinessValidatorProps) {
  const [validator] = useState(() => new ProductionValidator())
  const [isRunning, setIsRunning] = useState(false)
  const [validationReport, setValidationReport] = useState<ProductionReadinessReport | null>(null)
  const [currentCheck, setCurrentCheck] = useState<string | null>(null)
  const [currentCategory, setCurrentCategory] = useState<string | null>(null)

  const runValidation = async () => {
    setIsRunning(true)
    setValidationReport(null)
    setCurrentCheck(null)
    setCurrentCategory(null)
    
    try {
      // Simulate progressive validation with status updates
      const report = await validator.validateProductionReadiness()
      setValidationReport(report)
      onValidationComplete?.(report)
    } catch (error) {
      console.error('Error running production readiness validation:', error)
      setValidationReport({
        reportId: `error-${Date.now()}`,
        timestamp: Date.now(),
        overallStatus: 'not-ready',
        overallScore: 0,
        readinessThreshold: 90,
        categories: {
          functionality: { categoryName: 'Functionality', score: 0, status: 'failed', checks: [], criticalFailures: 1, totalChecks: 0, passedChecks: 0 },
          performance: { categoryName: 'Performance', score: 0, status: 'failed', checks: [], criticalFailures: 0, totalChecks: 0, passedChecks: 0 },
          security: { categoryName: 'Security', score: 0, status: 'failed', checks: [], criticalFailures: 0, totalChecks: 0, passedChecks: 0 },
          accessibility: { categoryName: 'Accessibility', score: 0, status: 'failed', checks: [], criticalFailures: 0, totalChecks: 0, passedChecks: 0 },
          design: { categoryName: 'Design', score: 0, status: 'failed', checks: [], criticalFailures: 0, totalChecks: 0, passedChecks: 0 },
          infrastructure: { categoryName: 'Infrastructure', score: 0, status: 'failed', checks: [], criticalFailures: 0, totalChecks: 0, passedChecks: 0 },
          testing: { categoryName: 'Testing', score: 0, status: 'failed', checks: [], criticalFailures: 0, totalChecks: 0, passedChecks: 0 }
        },
        criticalIssues: ['Production readiness validation failed - check system configuration'],
        blockers: ['Validation system failure'],
        warnings: [],
        recommendations: ['Review system configuration and validation setup'],
        deploymentDecision: {
          canDeploy: false,
          confidence: 'low',
          reasoning: ['Validation process failed'],
          nextSteps: ['Fix validation system and re-run assessment']
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
      case 'functionality': return Settings
      case 'performance': return Zap
      case 'security': return Shield
      case 'accessibility': return Eye
      case 'design': return Palette
      case 'infrastructure': return Server
      case 'testing': return TestTube
      default: return Target
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed': return CheckCircle
      case 'failed': return XCircle
      case 'warning': return AlertTriangle
      case 'checking': return Clock
      case 'pending': return Clock
      default: return Clock
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'passed': return 'text-green-600 dark:text-green-400'
      case 'failed': return 'text-red-600 dark:text-red-400'
      case 'warning': return 'text-yellow-600 dark:text-yellow-400'
      case 'checking': return 'text-blue-600 dark:text-blue-400'
      case 'pending': return 'text-gray-500 dark:text-gray-400'
      default: return 'text-gray-500 dark:text-gray-400'
    }
  }

  const getReadinessStatusIcon = (status: string) => {
    switch (status) {
      case 'ready': return Rocket
      case 'conditional': return AlertCircle
      case 'not-ready': return XCircle
      default: return Clock
    }
  }

  const getReadinessStatusColor = (status: string) => {
    switch (status) {
      case 'ready': return 'text-green-600 dark:text-green-400'
      case 'conditional': return 'text-yellow-600 dark:text-yellow-400'
      case 'not-ready': return 'text-red-600 dark:text-red-400'
      default: return 'text-gray-500 dark:text-gray-400'
    }
  }

  // Simulate progressive validation updates
  useEffect(() => {
    if (isRunning) {
      const simulateProgress = async () => {
        const categories = ['functionality', 'performance', 'security', 'accessibility', 'design', 'infrastructure', 'testing']
        
        for (const category of categories) {
          setCurrentCategory(category)
          
          const categoryChecks = PRODUCTION_READINESS_CHECKS.filter(check => check.category === category)
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
            title="Production Deployment Readiness"
            subtitle="Comprehensive assessment of application readiness for production deployment"
          />
          
          <UnifiedCardContent>
            <div className="space-y-4">
              {/* Validation Categories Overview */}
              <div>
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Validation Categories:
                </div>
                <div className="grid grid-cols-7 gap-4">
                  {['functionality', 'performance', 'security', 'accessibility', 'design', 'infrastructure', 'testing'].map((category) => {
                    const CategoryIcon = getCategoryIcon(category)
                    const categoryChecks = PRODUCTION_READINESS_CHECKS.filter(check => check.category === category)
                    
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
                          {categoryChecks.length} checks
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Run Validation Button */}
              <div className="flex gap-2">
                <UnifiedButton
                  variant="primary"
                  onClick={runValidation}
                  loading={isRunning}
                  icon={<Target className="w-4 h-4" />}
                >
                  {isRunning ? 'Running Production Validation...' : 'Run Production Readiness Validation'}
                </UnifiedButton>
                
                {validationReport && (
                  <UnifiedButton
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setValidationReport(null)
                      validator.clearValidationResults()
                    }}
                  >
                    Clear Results
                  </UnifiedButton>
                )}
              </div>

              {/* Running Validation Progress */}
              {isRunning && (
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-3 mb-3">
                    <OptimizedLoading variant="processing" size="sm" />
                    <div>
                      <div className="font-medium text-blue-800 dark:text-blue-200">
                        Running Production Readiness Validation
                      </div>
                      <div className="text-sm text-blue-600 dark:text-blue-400">
                        Comprehensive assessment of deployment readiness across all categories
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
                          Validating: {currentCheck}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </UnifiedCardContent>
        </UnifiedCard>

        {/* Validation Results */}
        {validationReport && (
          <div className="space-y-6">
            {/* Overall Readiness Status */}
            <UnifiedCard>
              <UnifiedCardHeader
                title="Production Deployment Decision"
                subtitle={`Overall readiness score: ${validationReport.overallScore}% (Threshold: ${validationReport.readinessThreshold}%)`}
              />
              
              <UnifiedCardContent>
                <div className="space-y-4">
                  {/* Deployment Decision */}
                  <div className={cn(
                    'p-6 rounded-lg border',
                    validationReport.deploymentDecision.canDeploy
                      ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20'
                      : 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20'
                  )}>
                    <div className="flex items-center gap-3 mb-4">
                      {validationReport.deploymentDecision.canDeploy ? (
                        <Rocket className="w-8 h-8 text-green-600 dark:text-green-400" />
                      ) : (
                        <XCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
                      )}
                      <div>
                        <div className={cn(
                          'text-xl font-bold',
                          validationReport.deploymentDecision.canDeploy
                            ? 'text-green-800 dark:text-green-200'
                            : 'text-red-800 dark:text-red-200'
                        )}>
                          {validationReport.deploymentDecision.canDeploy ? 'READY FOR PRODUCTION' : 'NOT READY FOR PRODUCTION'}
                        </div>
                        <div className={cn(
                          'text-sm',
                          validationReport.deploymentDecision.canDeploy
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-red-600 dark:text-red-400'
                        )}>
                          Confidence: {validationReport.deploymentDecision.confidence.toUpperCase()}
                        </div>
                      </div>
                    </div>

                    {/* Reasoning */}
                    <div className="mb-4">
                      <div className="font-medium text-gray-900 dark:text-white mb-2">
                        Decision Reasoning:
                      </div>
                      <ul className="space-y-1">
                        {validationReport.deploymentDecision.reasoning.map((reason, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <div className="w-1 h-1 rounded-full bg-gray-400 mt-2 flex-shrink-0" />
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              {reason}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Next Steps */}
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white mb-2">
                        Next Steps:
                      </div>
                      <ul className="space-y-1">
                        {validationReport.deploymentDecision.nextSteps.map((step, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <div className="w-1 h-1 rounded-full bg-gray-400 mt-2 flex-shrink-0" />
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              {step}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Overall Status */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'flex items-center gap-2 text-sm font-medium',
                        getReadinessStatusColor(validationReport.overallStatus)
                      )}>
                        {React.createElement(getReadinessStatusIcon(validationReport.overallStatus), { className: 'w-4 h-4' })}
                        Overall Status: {validationReport.overallStatus.toUpperCase().replace('-', ' ')}
                      </div>
                    </div>
                    
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Score: {validationReport.overallScore}%
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                    <div 
                      className={cn(
                        'h-3 rounded-full transition-all duration-500',
                        validationReport.overallStatus === 'ready'
                          ? 'bg-gradient-to-r from-green-500 to-emerald-600'
                          : validationReport.overallStatus === 'conditional'
                          ? 'bg-gradient-to-r from-yellow-500 to-orange-600'
                          : 'bg-gradient-to-r from-red-500 to-red-600'
                      )}
                      style={{ width: `${validationReport.overallScore}%` }}
                    />
                  </div>
                </div>
              </UnifiedCardContent>
            </UnifiedCard>

            {/* Category Results */}
            <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
              {Object.entries(validationReport.categories).map(([categoryKey, category]) => {
                const CategoryIcon = getCategoryIcon(categoryKey)
                
                return (
                  <UnifiedCard key={categoryKey}>
                    <UnifiedCardHeader
                      title={category.categoryName}
                      subtitle={`${category.totalChecks} validation checks`}
                      icon={<CategoryIcon className="w-5 h-5" />}
                    />
                    
                    <UnifiedCardContent>
                      <div className="space-y-4">
                        {/* Category Status */}
                        <div className="flex items-center justify-between">
                          <div className={cn(
                            'flex items-center gap-2 text-sm font-medium',
                            getStatusColor(category.status)
                          )}>
                            {React.createElement(getStatusIcon(category.status), { className: 'w-4 h-4' })}
                            {category.status.toUpperCase()}
                          </div>
                          
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {category.passedChecks}/{category.totalChecks}
                          </div>
                        </div>

                        {/* Score Display */}
                        <div className="text-center">
                          <div className="text-2xl font-bold text-gray-900 dark:text-white">
                            {category.score}%
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            Category Score
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div 
                            className={cn(
                              'h-2 rounded-full transition-all duration-300',
                              category.status === 'passed'
                                ? 'bg-gradient-to-r from-green-500 to-emerald-600'
                                : category.status === 'warning'
                                ? 'bg-gradient-to-r from-yellow-500 to-orange-600'
                                : 'bg-gradient-to-r from-red-500 to-red-600'
                            )}
                            style={{ width: `${category.score}%` }}
                          />
                        </div>

                        {/* Critical Failures */}
                        {category.criticalFailures > 0 && (
                          <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-800">
                            <div className="text-xs text-red-700 dark:text-red-300">
                              {category.criticalFailures} critical failure{category.criticalFailures !== 1 ? 's' : ''}
                            </div>
                          </div>
                        )}
                      </div>
                    </UnifiedCardContent>
                  </UnifiedCard>
                )
              })}
            </div>

            {/* Critical Issues */}
            {validationReport.criticalIssues.length > 0 && (
              <UnifiedCard>
                <UnifiedCardHeader
                  title="Critical Issues"
                  subtitle="Issues that must be resolved before production deployment"
                />
                
                <UnifiedCardContent>
                  <div className="space-y-2">
                    {validationReport.criticalIssues.map((issue, i) => (
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

            {/* Warnings */}
            {validationReport.warnings.length > 0 && (
              <UnifiedCard>
                <UnifiedCardHeader
                  title="Warnings"
                  subtitle="Non-critical issues that should be addressed"
                />
                
                <UnifiedCardContent>
                  <div className="space-y-2">
                    {validationReport.warnings.map((warning, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                        <div className="text-sm text-yellow-700 dark:text-yellow-300">
                          {warning}
                        </div>
                      </div>
                    ))}
                  </div>
                </UnifiedCardContent>
              </UnifiedCard>
            )}

            {/* Recommendations */}
            {validationReport.recommendations && validationReport.recommendations.length > 0 && (
              <UnifiedCard>
                <UnifiedCardHeader
                  title="Production Readiness Recommendations"
                  subtitle="Suggested actions based on validation results"
                />
                
                <UnifiedCardContent>
                  <div className="space-y-2">
                    {validationReport.recommendations.map((recommendation, i) => (
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
