'use client'

import { useState } from 'react'
import { ComponentIntegrator } from '@/components/admin/ComponentIntegrator'
import { ComponentIntegrationReport } from '@/lib/integration/componentIntegration'
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
  Palette,
  Database,
  TestTube,
  Layers,
  Zap,
  Shield,
  ArrowRight,
  Target
} from 'lucide-react'

/**
 * Component Integration Testing Page
 * Comprehensive testing interface for all optimized components working together
 */
export default function IntegrationTestingPage() {
  const [integrationReport, setIntegrationReport] = useState<ComponentIntegrationReport | null>(null)
  const [activeTab, setActiveTab] = useState<'testing' | 'components' | 'architecture'>('testing')

  const handleIntegrationComplete = (report: ComponentIntegrationReport) => {
    setIntegrationReport(report)
    console.log('Integration test completed:', report)
  }

  const integrationCategories = [
    {
      id: 'navigation',
      name: 'Navigation Integration',
      description: 'Unified navigation system working across all pages and breakpoints',
      icon: Settings,
      color: 'blue',
      checks: [
        'Unified navigation integration',
        'Navigation routing consistency',
        'Mobile navigation functionality'
      ]
    },
    {
      id: 'generator',
      name: 'Generator Integration',
      description: 'Single-column layout and progressive disclosure working seamlessly',
      icon: Image,
      color: 'green',
      checks: [
        'Single-column layout integration',
        'Progressive disclosure functionality',
        'Dynamic parameter controls integration',
        'Model selection integration',
        'Core modes functionality'
      ]
    },
    {
      id: 'ui',
      name: 'UI System Integration',
      description: 'Unified design system and responsive breakpoints working consistently',
      icon: Palette,
      color: 'purple',
      checks: [
        'Unified design system integration',
        'Glassmorphism styling consistency',
        'Responsive breakpoints compliance',
        'Touch target compliance',
        'Loading states integration',
        'Error handling integration'
      ]
    },
    {
      id: 'data',
      name: 'Data Integration',
      description: 'End-to-end workflows and data storage working properly',
      icon: Database,
      color: 'orange',
      checks: [
        'Mock data elimination verification',
        'Replicate MCP integration',
        'Cloudinary storage integration',
        'Supabase database integration',
        'End-to-end workflow integration'
      ]
    },
    {
      id: 'testing',
      name: 'Testing Integration',
      description: 'All testing systems working together for comprehensive validation',
      icon: TestTube,
      color: 'teal',
      checks: [
        'Browser testing integration',
        'Workflow testing integration',
        'Error handling testing integration'
      ]
    }
  ]

  const integrationFlow = [
    {
      step: 1,
      title: 'Navigation System',
      description: 'Unified navigation with mobile menu and routing',
      icon: Settings
    },
    {
      step: 2,
      title: 'Generator Interface',
      description: 'Single-column layout with progressive disclosure',
      icon: Image
    },
    {
      step: 3,
      title: 'Design System',
      description: 'Unified styling and responsive breakpoints',
      icon: Palette
    },
    {
      step: 4,
      title: 'Data Flow',
      description: 'End-to-end workflows and storage integration',
      icon: Database
    },
    {
      step: 5,
      title: 'Testing Coverage',
      description: 'Comprehensive testing and validation',
      icon: TestTube
    }
  ]

  return (
    <OptimizedErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Component Integration Testing
            </h1>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Comprehensive testing of all optimized components working together seamlessly 
              to ensure production readiness and cohesive application functionality.
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-2 mb-6">
            <UnifiedButton
              variant={activeTab === 'testing' ? 'primary' : 'secondary'}
              onClick={() => setActiveTab('testing')}
              icon={<Target className="w-4 h-4" />}
            >
              Integration Testing
            </UnifiedButton>
            
            <UnifiedButton
              variant={activeTab === 'components' ? 'primary' : 'secondary'}
              onClick={() => setActiveTab('components')}
              icon={<Layers className="w-4 h-4" />}
            >
              Component Categories
            </UnifiedButton>
            
            <UnifiedButton
              variant={activeTab === 'architecture' ? 'primary' : 'secondary'}
              onClick={() => setActiveTab('architecture')}
              icon={<Zap className="w-4 h-4" />}
            >
              Integration Flow
            </UnifiedButton>
          </div>

          {/* Tab Content */}
          {activeTab === 'testing' && (
            <div className="space-y-6">
              {/* Component Integrator */}
              <ComponentIntegrator onIntegrationComplete={handleIntegrationComplete} />

              {/* Production Readiness Summary */}
              {integrationReport && (
                <UnifiedCard>
                  <UnifiedCardHeader
                    title="Production Readiness Assessment"
                    subtitle="Overall application readiness based on component integration results"
                  />
                  
                  <UnifiedCardContent>
                    <div className="space-y-4">
                      {/* Overall Status */}
                      <div className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            'flex items-center gap-2 text-lg font-medium',
                            integrationReport.productionReadiness.isReady
                              ? 'text-green-600 dark:text-green-400'
                              : 'text-red-600 dark:text-red-400'
                          )}>
                            {integrationReport.productionReadiness.isReady ? (
                              <Shield className="w-6 h-6" />
                            ) : (
                              <AlertTriangle className="w-6 h-6" />
                            )}
                            Production Ready: {integrationReport.productionReadiness.isReady ? 'YES' : 'NO'}
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            Integration Success Rate
                          </div>
                          <div className="text-lg font-medium">
                            {Math.round((integrationReport.passedChecks / integrationReport.totalChecks) * 100)}%
                          </div>
                        </div>
                      </div>

                      {/* Critical Issues */}
                      {integrationReport.criticalIssues.length > 0 && (
                        <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                          <div className="flex items-center gap-2 text-red-800 dark:text-red-200 mb-2">
                            <AlertTriangle className="w-5 h-5" />
                            <span className="font-medium">Critical Integration Issues</span>
                          </div>
                          <div className="text-sm text-red-700 dark:text-red-300">
                            {integrationReport.criticalIssues.length} critical issue{integrationReport.criticalIssues.length !== 1 ? 's' : ''} 
                            must be resolved before production deployment.
                          </div>
                        </div>
                      )}

                      {/* Success Summary */}
                      {integrationReport.productionReadiness.isReady && (
                        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                          <div className="flex items-center gap-2 text-green-800 dark:text-green-200 mb-2">
                            <CheckCircle className="w-5 h-5" />
                            <span className="font-medium">All Integration Tests Passing</span>
                          </div>
                          <div className="text-sm text-green-700 dark:text-green-300">
                            All optimized components are working together seamlessly. 
                            The application is ready for production deployment.
                          </div>
                        </div>
                      )}

                      {/* Category Status */}
                      <div className="grid gap-4 md:grid-cols-5">
                        {Object.entries(integrationReport.categories).map(([category, results]) => {
                          const categoryInfo = integrationCategories.find(c => c.id === category)
                          const CategoryIcon = categoryInfo?.icon || Layers
                          const passedCount = results.filter(r => r.success).length
                          const totalCount = results.length
                          
                          return (
                            <div key={category} className="p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                              <div className="flex items-center gap-2 mb-2">
                                <CategoryIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                                <span className="font-medium text-gray-900 dark:text-white capitalize">
                                  {category}
                                </span>
                              </div>
                              
                              <div className="space-y-1">
                                <div className={cn(
                                  'text-sm font-medium',
                                  passedCount === totalCount
                                    ? 'text-green-600 dark:text-green-400'
                                    : passedCount > 0
                                    ? 'text-yellow-600 dark:text-yellow-400'
                                    : 'text-red-600 dark:text-red-400'
                                )}>
                                  {passedCount === totalCount ? 'PASSED' : passedCount > 0 ? 'PARTIAL' : 'FAILED'}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  {passedCount}/{totalCount} checks
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

          {activeTab === 'components' && (
            <div className="space-y-6">
              {/* Integration Categories Overview */}
              <UnifiedCard>
                <UnifiedCardHeader
                  title="Component Integration Categories"
                  subtitle="Comprehensive testing categories for all optimized components"
                />
                
                <UnifiedCardContent>
                  <div className="grid gap-6 md:grid-cols-2">
                    {integrationCategories.map((category) => {
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
                              category.color === 'teal' && 'bg-teal-100 dark:bg-teal-900/20'
                            )}>
                              <CategoryIcon className={cn(
                                'w-5 h-5',
                                category.color === 'blue' && 'text-blue-600 dark:text-blue-400',
                                category.color === 'green' && 'text-green-600 dark:text-green-400',
                                category.color === 'purple' && 'text-purple-600 dark:text-purple-400',
                                category.color === 'orange' && 'text-orange-600 dark:text-orange-400',
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
                                  Integration Checks:
                                </div>
                                {category.checks.map((check, i) => (
                                  <div key={i} className="flex items-center gap-2">
                                    <div className="w-1 h-1 rounded-full bg-gray-400" />
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                      {check}
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
            </div>
          )}

          {activeTab === 'architecture' && (
            <div className="space-y-6">
              {/* Integration Flow */}
              <UnifiedCard>
                <UnifiedCardHeader
                  title="Component Integration Flow"
                  subtitle="Sequential integration testing flow for all optimized components"
                />
                
                <UnifiedCardContent>
                  <div className="space-y-6">
                    {/* Flow Diagram */}
                    <div className="flex items-center justify-center">
                      <div className="flex items-center gap-4 flex-wrap justify-center">
                        {integrationFlow.map((step, index) => {
                          const StepIcon = step.icon
                          const isLast = index === integrationFlow.length - 1
                          
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
                                  <div className="text-xs text-gray-500 dark:text-gray-400 max-w-24">
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

                    {/* Integration Dependencies */}
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
                          Critical Dependencies
                        </h4>
                        <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                          <li>• Unified navigation system integration</li>
                          <li>• Single-column layout with progressive disclosure</li>
                          <li>• Dynamic parameter controls based on model schemas</li>
                          <li>• End-to-end workflow functionality</li>
                          <li>• Responsive breakpoint compliance</li>
                        </ul>
                      </div>
                      
                      <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">
                          Integration Benefits
                        </h4>
                        <ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
                          <li>• Seamless component interaction</li>
                          <li>• Consistent user experience</li>
                          <li>• Production-ready reliability</li>
                          <li>• Comprehensive error handling</li>
                          <li>• Optimal performance across devices</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </UnifiedCardContent>
              </UnifiedCard>

              {/* Integration Validation */}
              <UnifiedCard>
                <UnifiedCardHeader
                  title="Integration Validation Criteria"
                  subtitle="Key criteria for successful component integration"
                />
                
                <UnifiedCardContent>
                  <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                        <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                          Functional Integration
                        </h4>
                        <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                          <li>• All components work together</li>
                          <li>• No duplicate functionality</li>
                          <li>• Proper data flow</li>
                          <li>• Error handling coverage</li>
                        </ul>
                      </div>
                      
                      <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                        <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                          Design Integration
                        </h4>
                        <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                          <li>• Consistent styling</li>
                          <li>• Unified design tokens</li>
                          <li>• Responsive behavior</li>
                          <li>• Glassmorphism effects</li>
                        </ul>
                      </div>
                      
                      <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                        <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                          Performance Integration
                        </h4>
                        <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                          <li>• Optimized loading states</li>
                          <li>• Efficient data handling</li>
                          <li>• Smooth animations</li>
                          <li>• Cross-device performance</li>
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
