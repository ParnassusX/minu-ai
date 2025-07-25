'use client'

import { useState } from 'react'
import { SystemTester } from '@/components/admin/SystemTester'
import { SystemTestReport } from '@/lib/testing/systemTesting'
import { UnifiedCard, UnifiedCardHeader, UnifiedCardContent } from '@/components/ui/UnifiedCard'
import { UnifiedButton } from '@/components/ui/UnifiedButton'
import { cn } from '@/lib/utils'
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
  Server,
  ArrowRight,
  BarChart3
} from 'lucide-react'

/**
 * Comprehensive System Testing Page
 * End-to-end validation of all functionality in production environment
 */
export default function SystemTestingPage() {
  const [systemReport, setSystemReport] = useState<SystemTestReport | null>(null)
  const [activeTab, setActiveTab] = useState<'testing' | 'categories' | 'metrics'>('testing')

  const handleTestComplete = (report: SystemTestReport) => {
    setSystemReport(report)
    console.log('System test completed:', report)
  }

  const testCategories = [
    {
      id: 'navigation',
      name: 'Navigation System',
      description: 'Unified navigation, routing, and mobile menu functionality',
      icon: Settings,
      color: 'blue',
      tests: [
        'Unified navigation functionality',
        'Cross-page routing consistency',
        'Mobile navigation responsiveness',
        'Navigation state management'
      ]
    },
    {
      id: 'generation',
      name: 'Generation System',
      description: 'Complete workflows for IMAGES, VIDEO, and ENHANCE modes',
      icon: Image,
      color: 'green',
      tests: [
        'Image generation workflow',
        'Video generation workflow',
        'Image enhancement workflow',
        'Model selection and parameters'
      ]
    },
    {
      id: 'storage',
      name: 'Storage System',
      description: 'Cloudinary storage and Supabase database operations',
      icon: Database,
      color: 'purple',
      tests: [
        'Cloudinary storage integration',
        'Supabase database operations',
        'CDN delivery and transformations',
        'Metadata storage and retrieval'
      ]
    },
    {
      id: 'ui',
      name: 'UI System',
      description: 'Responsive design and unified design system validation',
      icon: Palette,
      color: 'orange',
      tests: [
        'Responsive design validation',
        'Glassmorphism styling consistency',
        'Touch target compliance',
        'Loading states and animations'
      ]
    },
    {
      id: 'performance',
      name: 'Performance System',
      description: 'Application performance and optimization validation',
      icon: Zap,
      color: 'yellow',
      tests: [
        'Page load performance',
        'Generation performance',
        'Memory usage monitoring',
        'Concurrent operations'
      ]
    },
    {
      id: 'security',
      name: 'Security System',
      description: 'Security measures and API key protection',
      icon: Shield,
      color: 'red',
      tests: [
        'API key protection',
        'Input validation',
        'HTTPS enforcement',
        'Error handling security'
      ]
    },
    {
      id: 'accessibility',
      name: 'Accessibility System',
      description: 'Accessibility standards and compliance validation',
      icon: Eye,
      color: 'teal',
      tests: [
        'Keyboard navigation',
        'Screen reader compatibility',
        'Color contrast compliance',
        'Focus indicator visibility'
      ]
    }
  ]

  const systemFlow = [
    {
      step: 1,
      title: 'Navigation',
      description: 'Test unified navigation and routing',
      icon: Settings
    },
    {
      step: 2,
      title: 'Generation',
      description: 'Validate all generation workflows',
      icon: Image
    },
    {
      step: 3,
      title: 'Storage',
      description: 'Verify storage and database operations',
      icon: Database
    },
    {
      step: 4,
      title: 'UI/UX',
      description: 'Test responsive design and interactions',
      icon: Palette
    },
    {
      step: 5,
      title: 'Performance',
      description: 'Measure performance and optimization',
      icon: Zap
    },
    {
      step: 6,
      title: 'Security',
      description: 'Validate security measures',
      icon: Shield
    },
    {
      step: 7,
      title: 'Accessibility',
      description: 'Test accessibility compliance',
      icon: Eye
    }
  ]

  return (
    <OptimizedErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Comprehensive System Testing
            </h1>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              End-to-end validation of all functionality in production environment 
              to ensure complete application readiness and optimal user experience.
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-2 mb-6">
            <UnifiedButton
              variant={activeTab === 'testing' ? 'primary' : 'secondary'}
              onClick={() => setActiveTab('testing')}
              icon={<Target className="w-4 h-4" />}
            >
              System Testing
            </UnifiedButton>
            
            <UnifiedButton
              variant={activeTab === 'categories' ? 'primary' : 'secondary'}
              onClick={() => setActiveTab('categories')}
              icon={<Activity className="w-4 h-4" />}
            >
              Test Categories
            </UnifiedButton>
            
            <UnifiedButton
              variant={activeTab === 'metrics' ? 'primary' : 'secondary'}
              onClick={() => setActiveTab('metrics')}
              icon={<BarChart3 className="w-4 h-4" />}
            >
              Performance Metrics
            </UnifiedButton>
          </div>

          {/* Tab Content */}
          {activeTab === 'testing' && (
            <div className="space-y-6">
              {/* System Tester */}
              <SystemTester onTestComplete={handleTestComplete} />

              {/* Production Readiness Summary */}
              {systemReport && (
                <UnifiedCard>
                  <UnifiedCardHeader
                    title="Production Deployment Assessment"
                    subtitle="Overall system readiness based on comprehensive testing results"
                  />
                  
                  <UnifiedCardContent>
                    <div className="space-y-4">
                      {/* Overall Status */}
                      <div className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            'flex items-center gap-2 text-lg font-medium',
                            systemReport.productionReadiness.isReady
                              ? 'text-green-600 dark:text-green-400'
                              : 'text-red-600 dark:text-red-400'
                          )}>
                            {systemReport.productionReadiness.isReady ? (
                              <Server className="w-6 h-6" />
                            ) : (
                              <AlertTriangle className="w-6 h-6" />
                            )}
                            Production Ready: {systemReport.productionReadiness.isReady ? 'YES' : 'NO'}
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            System Test Score
                          </div>
                          <div className="text-lg font-medium">
                            {systemReport.productionReadiness.score}%
                          </div>
                        </div>
                      </div>

                      {/* Critical Failures */}
                      {systemReport.criticalFailures.length > 0 && (
                        <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                          <div className="flex items-center gap-2 text-red-800 dark:text-red-200 mb-2">
                            <AlertTriangle className="w-5 h-5" />
                            <span className="font-medium">Critical System Failures</span>
                          </div>
                          <div className="text-sm text-red-700 dark:text-red-300">
                            {systemReport.criticalFailures.length} critical failure{systemReport.criticalFailures.length !== 1 ? 's' : ''} 
                            must be resolved before production deployment.
                          </div>
                        </div>
                      )}

                      {/* Success Summary */}
                      {systemReport.productionReadiness.isReady && (
                        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                          <div className="flex items-center gap-2 text-green-800 dark:text-green-200 mb-2">
                            <CheckCircle className="w-5 h-5" />
                            <span className="font-medium">All System Tests Passing</span>
                          </div>
                          <div className="text-sm text-green-700 dark:text-green-300">
                            All critical system functionality is working correctly. 
                            The application is ready for production deployment.
                          </div>
                        </div>
                      )}

                      {/* Category Status */}
                      <div className="grid gap-4 md:grid-cols-7">
                        {Object.entries(systemReport.categories).map(([category, results]) => {
                          const categoryInfo = testCategories.find(c => c.id === category)
                          const CategoryIcon = categoryInfo?.icon || Target
                          const passedCount = results.filter(r => r.success).length
                          const totalCount = results.length
                          
                          return (
                            <div key={category} className="p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                              <div className="flex items-center gap-2 mb-2">
                                <CategoryIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                                <span className="font-medium text-xs text-gray-900 dark:text-white capitalize">
                                  {category}
                                </span>
                              </div>
                              
                              <div className="space-y-1">
                                <div className={cn(
                                  'text-xs font-medium',
                                  passedCount === totalCount
                                    ? 'text-green-600 dark:text-green-400'
                                    : passedCount > 0
                                    ? 'text-yellow-600 dark:text-yellow-400'
                                    : 'text-red-600 dark:text-red-400'
                                )}>
                                  {passedCount === totalCount ? 'PASSED' : passedCount > 0 ? 'PARTIAL' : 'FAILED'}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  {passedCount}/{totalCount} tests
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </UnifiedCardContent>
                </UnifiedCard>
              )}
            </div>
          )}

          {activeTab === 'categories' && (
            <div className="space-y-6">
              {/* Test Categories Overview */}
              <UnifiedCard>
                <UnifiedCardHeader
                  title="System Test Categories"
                  subtitle="Comprehensive testing categories for end-to-end validation"
                />
                
                <UnifiedCardContent>
                  <div className="grid gap-6 md:grid-cols-2">
                    {testCategories.map((category) => {
                      const CategoryIcon = category.icon
                      
                      return (
                        <div key={category.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                          <div className="flex items-start gap-3">
                            <div className={cn(
                              'flex items-center justify-center w-10 h-10 rounded-lg',
                              category.color === 'blue' && 'bg-blue-100 dark:bg-blue-900/20',
                              category.color === 'green' && 'bg-green-100 dark:bg-green-900/20',
                              category.color === 'purple' && 'bg-purple-100 dark:bg-purple-900/20',
                              category.color === 'orange' && 'bg-orange-100 dark:bg-orange-900/20',
                              category.color === 'yellow' && 'bg-yellow-100 dark:bg-yellow-900/20',
                              category.color === 'red' && 'bg-red-100 dark:bg-red-900/20',
                              category.color === 'teal' && 'bg-teal-100 dark:bg-teal-900/20'
                            )}>
                              <CategoryIcon className={cn(
                                'w-5 h-5',
                                category.color === 'blue' && 'text-blue-600 dark:text-blue-400',
                                category.color === 'green' && 'text-green-600 dark:text-green-400',
                                category.color === 'purple' && 'text-purple-600 dark:text-purple-400',
                                category.color === 'orange' && 'text-orange-600 dark:text-orange-400',
                                category.color === 'yellow' && 'text-yellow-600 dark:text-yellow-400',
                                category.color === 'red' && 'text-red-600 dark:text-red-400',
                                category.color === 'teal' && 'text-teal-600 dark:text-teal-400'
                              )} />
                            </div>
                            
                            <div className="flex-1">
                              <h3 className="font-medium text-gray-900 dark:text-white mb-1">
                                {category.name}
                              </h3>
                              
                              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                {category.description}
                              </p>
                              
                              <div className="space-y-1">
                                <div className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                  Test Cases:
                                </div>
                                {category.tests.map((test, i) => (
                                  <div key={i} className="flex items-center gap-2">
                                    <div className="w-1 h-1 rounded-full bg-gray-400" />
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                      {test}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </UnifiedCardContent>
              </UnifiedCard>

              {/* System Testing Flow */}
              <UnifiedCard>
                <UnifiedCardHeader
                  title="System Testing Flow"
                  subtitle="Sequential testing flow for comprehensive validation"
                />
                
                <UnifiedCardContent>
                  <div className="space-y-6">
                    {/* Flow Diagram */}
                    <div className="flex items-center justify-center">
                      <div className="flex items-center gap-4 flex-wrap justify-center">
                        {systemFlow.map((step, index) => {
                          const StepIcon = step.icon
                          const isLast = index === systemFlow.length - 1
                          
                          return (
                            <div key={step.step} className="flex items-center gap-4">
                              <div className="flex flex-col items-center">
                                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 mb-2">
                                  <StepIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div className="text-center">
                                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                                    {step.title}
                                  </div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400 max-w-20">
                                    {step.description}
                                  </div>
                                </div>
                              </div>
                              
                              {!isLast && (
                                <ArrowRight className="w-5 h-5 text-gray-400 dark:text-gray-600" />
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                </UnifiedCardContent>
              </UnifiedCard>
            </div>
          )}

          {activeTab === 'metrics' && (
            <div className="space-y-6">
              {/* Performance Metrics */}
              <UnifiedCard>
                <UnifiedCardHeader
                  title="Performance Metrics"
                  subtitle="System performance benchmarks and optimization targets"
                />
                
                <UnifiedCardContent>
                  <div className="space-y-6">
                    {/* Performance Targets */}
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
                          Performance Targets
                        </h4>
                        <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                          <li>• Page load time: &lt; 3 seconds</li>
                          <li>• Render time: &lt; 600ms</li>
                          <li>• Interaction time: &lt; 250ms</li>
                          <li>• Memory usage: &lt; 150MB</li>
                        </ul>
                      </div>
                      
                      <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">
                          Quality Criteria
                        </h4>
                        <ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
                          <li>• All critical tests pass</li>
                          <li>• Performance targets met</li>
                          <li>• Security measures validated</li>
                          <li>• Accessibility compliance</li>
                        </ul>
                      </div>
                    </div>

                    {/* Current Metrics */}
                    {systemReport && (
                      <div className="grid gap-4 md:grid-cols-4">
                        <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg text-center">
                          <div className="text-2xl font-bold text-gray-900 dark:text-white">
                            {(systemReport.performanceMetrics.averageLoadTime / 1000).toFixed(1)}s
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            Average Load Time
                          </div>
                        </div>
                        
                        <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg text-center">
                          <div className="text-2xl font-bold text-gray-900 dark:text-white">
                            {Math.round(systemReport.performanceMetrics.averageRenderTime)}ms
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            Average Render Time
                          </div>
                        </div>
                        
                        <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg text-center">
                          <div className="text-2xl font-bold text-gray-900 dark:text-white">
                            {Math.round(systemReport.performanceMetrics.averageInteractionTime)}ms
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            Average Interaction
                          </div>
                        </div>
                        
                        <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg text-center">
                          <div className="text-2xl font-bold text-gray-900 dark:text-white">
                            {Math.round(systemReport.performanceMetrics.memoryUsage)}MB
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            Memory Usage
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </UnifiedCardContent>
              </UnifiedCard>

              {/* System Health */}
              <UnifiedCard>
                <UnifiedCardHeader
                  title="System Health Indicators"
                  subtitle="Key indicators for production readiness assessment"
                />
                
                <UnifiedCardContent>
                  <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                        <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                          Functional Health
                        </h4>
                        <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                          <li>• All core workflows functional</li>
                          <li>• Navigation system working</li>
                          <li>• Generation processes stable</li>
                          <li>• Storage operations reliable</li>
                        </ul>
                      </div>
                      
                      <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                        <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                          Performance Health
                        </h4>
                        <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                          <li>• Load times within targets</li>
                          <li>• Render performance optimal</li>
                          <li>• Memory usage stable</li>
                          <li>• No performance degradation</li>
                        </ul>
                      </div>
                      
                      <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                        <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                          Security Health
                        </h4>
                        <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                          <li>• API keys protected</li>
                          <li>• Input validation working</li>
                          <li>• HTTPS enforced</li>
                          <li>• No sensitive data exposure</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </UnifiedCardContent>
              </UnifiedCard>
            </div>
          )}
        </div>
      </div>
    </OptimizedErrorBoundary>
  )
}
