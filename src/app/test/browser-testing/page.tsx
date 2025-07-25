'use client'

import { useState } from 'react'
import { BrowserTester } from '@/components/admin/BrowserTester'
import { cn } from '@/lib/utils'
import { ComprehensiveBrowserTestResult } from '@/lib/testing/browserTesting'
import { UnifiedCard, UnifiedCardHeader, UnifiedCardContent } from '@/components/ui/UnifiedCard'
import { UnifiedButton } from '@/components/ui/UnifiedButton'
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
  Images,
  Code,
  TestTube
} from 'lucide-react'

/**
 * Browser Testing Page
 * Comprehensive responsive browser testing interface
 */
export default function BrowserTestingPage() {
  const [testResults, setTestResults] = useState<ComprehensiveBrowserTestResult | null>(null)
  const [activeTab, setActiveTab] = useState<'testing' | 'scenarios' | 'guidelines'>('testing')

  const handleTestComplete = (results: ComprehensiveBrowserTestResult) => {
    setTestResults(results)
    console.log('Browser test completed:', results)
  }

  const testScenarios = [
    {
      id: 'navigation-functionality',
      name: 'Navigation Functionality',
      description: 'Test navigation components and routing across breakpoints',
      icon: Settings,
      priority: 'high',
      details: [
        'Navigation visibility and accessibility',
        'Mobile menu functionality',
        'Routing and breadcrumb behavior',
        'Logo and branding display',
        'Touch target adequacy'
      ]
    },
    {
      id: 'generator-interface',
      name: 'Generator Interface',
      description: 'Test main generator interface responsiveness and functionality',
      icon: Image,
      priority: 'high',
      details: [
        'Single-column layout responsiveness',
        'Prompt area visibility and usability',
        'Generate button accessibility',
        'Parameter control collapse/expand',
        'Touch interaction optimization'
      ]
    },
    {
      id: 'model-selection',
      name: 'Model Selection',
      description: 'Test model selection interface and parameter controls',
      icon: Settings,
      priority: 'high',
      details: [
        'Model dropdown functionality',
        'Model description visibility',
        'Model switching behavior',
        'Parameter updates on model change',
        'Progressive disclosure effectiveness'
      ]
    },
    {
      id: 'parameter-controls',
      name: 'Parameter Controls',
      description: 'Test progressive disclosure and parameter control responsiveness',
      icon: Settings,
      priority: 'high',
      details: [
        'Basic/Intermediate/Advanced disclosure',
        'Slider responsiveness and accuracy',
        'Input field accessibility',
        'Parameter validation feedback',
        'Mobile-optimized controls'
      ]
    },
    {
      id: 'image-upload',
      name: 'Image Upload',
      description: 'Test image upload functionality across devices',
      icon: Upload,
      priority: 'medium',
      details: [
        'Upload area visibility and size',
        'Drag and drop functionality',
        'File selection interface',
        'Image preview display',
        'Upload progress indication'
      ]
    },
    {
      id: 'generation-workflow',
      name: 'Generation Workflow',
      description: 'Test complete generation workflow from start to finish',
      icon: Zap,
      priority: 'high',
      details: [
        'End-to-end workflow completion',
        'Loading state visibility',
        'Result display and formatting',
        'Download functionality',
        'Error handling and recovery'
      ]
    },
    {
      id: 'loading-states',
      name: 'Loading States',
      description: 'Test loading states and animations across breakpoints',
      icon: Clock,
      priority: 'medium',
      details: [
        'Square grid animation visibility',
        'Loading text and progress display',
        'Animation smoothness',
        'Loading overlay behavior',
        'Performance across devices'
      ]
    },
    {
      id: 'error-handling',
      name: 'Error Handling',
      description: 'Test error handling and recovery mechanisms',
      icon: AlertTriangle,
      priority: 'medium',
      details: [
        'Error message visibility',
        'Error icon and styling consistency',
        'Retry button accessibility',
        'Error boundary functionality',
        'Recovery mechanism effectiveness'
      ]
    },
    {
      id: 'gallery-interface',
      name: 'Gallery Interface',
      description: 'Test gallery layout and functionality across devices',
      icon: Images,
      priority: 'medium',
      details: [
        'Grid layout responsiveness',
        'Image preview quality',
        'Gallery navigation',
        'Image detail accessibility',
        'Infinite scroll performance'
      ]
    },
    {
      id: 'settings-interface',
      name: 'Settings Interface',
      description: 'Test settings and configuration interfaces',
      icon: Settings,
      priority: 'low',
      details: [
        'Settings form layout',
        'Input field accessibility',
        'Save button functionality',
        'Settings validation',
        'Responsive form behavior'
      ]
    }
  ]

  const responsiveGuidelines = [
    {
      breakpoint: 'Mobile (375px)',
      icon: Smartphone,
      guidelines: [
        'Touch targets must be at least 48px for comfortable interaction',
        'Navigation should collapse to hamburger menu',
        'Parameter controls should use progressive disclosure',
        'Text should remain readable without horizontal scrolling',
        'Images and media should scale appropriately'
      ]
    },
    {
      breakpoint: 'Tablet (768px)',
      icon: Tablet,
      guidelines: [
        'Layout should adapt to landscape and portrait orientations',
        'Navigation can show more items but may still need collapsing',
        'Parameter controls can show more options simultaneously',
        'Touch targets should remain adequate for finger interaction',
        'Content should utilize available screen real estate effectively'
      ]
    },
    {
      breakpoint: 'Desktop (1920px)',
      icon: Monitor,
      guidelines: [
        'Full navigation and feature set should be accessible',
        'Parameter controls can show all options without scrolling',
        'Hover states and mouse interactions should work properly',
        'Content should not stretch excessively on wide screens',
        'Keyboard navigation should be fully functional'
      ]
    }
  ]

  return (
    <OptimizedErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Responsive Browser Testing
            </h1>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Comprehensive testing across mobile (375px), tablet (768px), and desktop (1920px) breakpoints 
              to ensure optimal user experience on all devices.
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-2 mb-6">
            <UnifiedButton
              variant={activeTab === 'testing' ? 'primary' : 'secondary'}
              onClick={() => setActiveTab('testing')}
              icon={<TestTube className="w-4 h-4" />}
            >
              Browser Testing
            </UnifiedButton>
            
            <UnifiedButton
              variant={activeTab === 'scenarios' ? 'primary' : 'secondary'}
              onClick={() => setActiveTab('scenarios')}
              icon={<Eye className="w-4 h-4" />}
            >
              Test Scenarios
            </UnifiedButton>
            
            <UnifiedButton
              variant={activeTab === 'guidelines' ? 'primary' : 'secondary'}
              onClick={() => setActiveTab('guidelines')}
              icon={<Code className="w-4 h-4" />}
            >
              Responsive Guidelines
            </UnifiedButton>
          </div>

          {/* Tab Content */}
          {activeTab === 'testing' && (
            <div className="space-y-6">
              {/* Browser Tester */}
              <BrowserTester onTestComplete={handleTestComplete} />

              {/* Production Readiness Assessment */}
              {testResults && (
                <UnifiedCard>
                  <UnifiedCardHeader
                    title="Responsive Design Assessment"
                    subtitle="Overall responsive design readiness based on browser test results"
                  />
                  
                  <UnifiedCardContent>
                    <div className="space-y-4">
                      {/* Overall Status */}
                      <div className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            'flex items-center gap-2 text-lg font-medium',
                            testResults.overallStatus === 'passed'
                              ? 'text-green-600 dark:text-green-400'
                              : testResults.overallStatus === 'partial'
                              ? 'text-yellow-600 dark:text-yellow-400'
                              : 'text-red-600 dark:text-red-400'
                          )}>
                            {testResults.overallStatus === 'passed' ? (
                              <CheckCircle className="w-6 h-6" />
                            ) : testResults.overallStatus === 'partial' ? (
                              <AlertTriangle className="w-6 h-6" />
                            ) : (
                              <XCircle className="w-6 h-6" />
                            )}
                            Responsive Design: {testResults.overallStatus.toUpperCase()}
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            Test Success Rate
                          </div>
                          <div className="text-lg font-medium">
                            {Math.round((testResults.summary.passedTests / testResults.summary.totalTests) * 100)}%
                          </div>
                        </div>
                      </div>

                      {/* Critical Issues */}
                      {testResults.summary.failedTests > 0 && (
                        <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                          <div className="flex items-center gap-2 text-red-800 dark:text-red-200 mb-2">
                            <AlertTriangle className="w-5 h-5" />
                            <span className="font-medium">Responsive Design Issues Detected</span>
                          </div>
                          <div className="text-sm text-red-700 dark:text-red-300">
                            {testResults.summary.failedTests} test{testResults.summary.failedTests !== 1 ? 's' : ''} failed 
                            across different breakpoints. These issues should be addressed for optimal user experience.
                          </div>
                        </div>
                      )}

                      {/* Success Summary */}
                      {testResults.overallStatus === 'passed' && (
                        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                          <div className="flex items-center gap-2 text-green-800 dark:text-green-200 mb-2">
                            <CheckCircle className="w-5 h-5" />
                            <span className="font-medium">All Responsive Tests Passing</span>
                          </div>
                          <div className="text-sm text-green-700 dark:text-green-300">
                            All responsive design tests passed across mobile, tablet, and desktop breakpoints. 
                            The application provides excellent user experience on all devices.
                          </div>
                        </div>
                      )}

                      {/* Breakpoint-Specific Status */}
                      <div className="grid gap-4 md:grid-cols-3">
                        {testResults.breakpoints.map((suite) => {
                          const BreakpointIcon = suite.breakpoint.deviceType === 'mobile' ? Smartphone :
                                                suite.breakpoint.deviceType === 'tablet' ? Tablet : Monitor
                          
                          return (
                            <div key={suite.suiteId} className="p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                              <div className="flex items-center gap-2 mb-2">
                                <BreakpointIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                                <span className="font-medium text-gray-900 dark:text-white">
                                  {suite.breakpoint.name}
                                </span>
                              </div>
                              
                              <div className="space-y-1">
                                <div className={cn(
                                  'text-sm font-medium',
                                  suite.overallStatus === 'passed'
                                    ? 'text-green-600 dark:text-green-400'
                                    : suite.overallStatus === 'partial'
                                    ? 'text-yellow-600 dark:text-yellow-400'
                                    : 'text-red-600 dark:text-red-400'
                                )}>
                                  {suite.overallStatus.toUpperCase()}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  {suite.passedTests}/{suite.totalTests} tests passed
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  {suite.breakpoint.width}x{suite.breakpoint.height}
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

          {activeTab === 'scenarios' && (
            <div className="space-y-6">
              {/* Test Scenarios Overview */}
              <UnifiedCard>
                <UnifiedCardHeader
                  title="Browser Test Scenarios"
                  subtitle="Comprehensive test scenarios validated across all responsive breakpoints"
                />
                
                <UnifiedCardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    {testScenarios.map((scenario) => {
                      const ScenarioIcon = scenario.icon
                      
                      return (
                        <div key={scenario.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                          <div className="flex items-start gap-3">
                            <div className={cn(
                              'flex items-center justify-center w-8 h-8 rounded-lg',
                              scenario.priority === 'high' && 'bg-red-100 dark:bg-red-900/20',
                              scenario.priority === 'medium' && 'bg-yellow-100 dark:bg-yellow-900/20',
                              scenario.priority === 'low' && 'bg-blue-100 dark:bg-blue-900/20'
                            )}>
                              <ScenarioIcon className={cn(
                                'w-4 h-4',
                                scenario.priority === 'high' && 'text-red-600 dark:text-red-400',
                                scenario.priority === 'medium' && 'text-yellow-600 dark:text-yellow-400',
                                scenario.priority === 'low' && 'text-blue-600 dark:text-blue-400'
                              )} />
                            </div>
                            
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-medium text-gray-900 dark:text-white">
                                  {scenario.name}
                                </h3>
                                <span className={cn(
                                  'text-xs px-2 py-0.5 rounded-full',
                                  scenario.priority === 'high' && 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400',
                                  scenario.priority === 'medium' && 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400',
                                  scenario.priority === 'low' && 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                                )}>
                                  {scenario.priority}
                                </span>
                              </div>
                              
                              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                {scenario.description}
                              </p>
                              
                              <div className="space-y-1">
                                {scenario.details.map((detail, i) => (
                                  <div key={i} className="flex items-center gap-2">
                                    <div className="w-1 h-1 rounded-full bg-gray-400" />
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                      {detail}
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

          {activeTab === 'guidelines' && (
            <div className="space-y-6">
              {/* Responsive Guidelines */}
              <UnifiedCard>
                <UnifiedCardHeader
                  title="Responsive Design Guidelines"
                  subtitle="Best practices and requirements for each breakpoint"
                />
                
                <UnifiedCardContent>
                  <div className="space-y-6">
                    {responsiveGuidelines.map((guideline) => {
                      const GuidelineIcon = guideline.icon
                      
                      return (
                        <div key={guideline.breakpoint} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                          <div className="flex items-center gap-3 mb-4">
                            <GuidelineIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                              {guideline.breakpoint}
                            </h3>
                          </div>
                          
                          <div className="space-y-2">
                            {guideline.guidelines.map((guide, i) => (
                              <div key={i} className="flex items-start gap-2">
                                <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                                <span className="text-sm text-gray-700 dark:text-gray-300">
                                  {guide}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </UnifiedCardContent>
              </UnifiedCard>

              {/* Testing Best Practices */}
              <UnifiedCard>
                <UnifiedCardHeader
                  title="Browser Testing Best Practices"
                  subtitle="Guidelines for effective responsive testing"
                />
                
                <UnifiedCardContent>
                  <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
                          Testing Strategy
                        </h4>
                        <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                          <li>• Test on actual devices when possible</li>
                          <li>• Validate touch interactions on mobile</li>
                          <li>• Check performance across breakpoints</li>
                          <li>• Verify accessibility at all sizes</li>
                        </ul>
                      </div>
                      
                      <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">
                          Quality Criteria
                        </h4>
                        <ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
                          <li>• No horizontal scrolling required</li>
                          <li>• All content remains accessible</li>
                          <li>• Touch targets meet minimum size</li>
                          <li>• Loading states work consistently</li>
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
