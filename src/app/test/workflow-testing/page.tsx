'use client'

import { useState } from 'react'
import { WorkflowTester } from '@/components/admin/WorkflowTester'
import { cn } from '@/lib/utils'
import { UnifiedCard, UnifiedCardHeader, UnifiedCardContent } from '@/components/ui/UnifiedCard'
import { UnifiedButton } from '@/components/ui/UnifiedButton'
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
  TrendingUp,
  ArrowRight,
  Workflow
} from 'lucide-react'

/**
 * End-to-End Workflow Testing Page
 * Comprehensive testing interface for complete user workflows from model selection to storage
 */
export default function WorkflowTestingPage() {
  const [testResults, setTestResults] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'testing' | 'documentation' | 'architecture'>('testing')

  const handleTestComplete = (results: any) => {
    setTestResults(results)
    console.log('Workflow test completed:', results)
  }

  const workflowSteps = [
    {
      id: 'model-selection',
      name: 'Model Selection',
      description: 'Select and validate AI model for generation',
      icon: Settings,
      details: 'Validates model availability, compatibility with selected mode, and parameter support'
    },
    {
      id: 'parameter-validation',
      name: 'Parameter Validation',
      description: 'Validate all generation parameters and settings',
      icon: CheckCircle,
      details: 'Ensures all parameters are within valid ranges and compatible with selected model'
    },
    {
      id: 'prompt-enhancement',
      name: 'Prompt Enhancement',
      description: 'Enhance prompt using Google Gemini API (if enabled)',
      icon: Zap,
      details: 'Optionally enhances user prompts for better generation results using AI assistance'
    },
    {
      id: 'image-generation',
      name: 'Image Generation',
      description: 'Generate image using Replicate API',
      icon: Image,
      details: 'Core generation step using selected model and parameters via Replicate API'
    },
    {
      id: 'cloudinary-storage',
      name: 'Cloudinary Storage',
      description: 'Upload and store generated image in Cloudinary',
      icon: Cloud,
      details: 'Uploads generated content to Cloudinary CDN for optimized delivery and storage'
    },
    {
      id: 'database-storage',
      name: 'Database Storage',
      description: 'Save generation metadata to Supabase database',
      icon: Database,
      details: 'Stores generation metadata, user information, and references in Supabase database'
    },
    {
      id: 'gallery-integration',
      name: 'Gallery Integration',
      description: 'Integrate generated image into user gallery',
      icon: Images,
      details: 'Makes generated content available in user gallery with proper indexing and search'
    }
  ]

  return (
    <OptimizedErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              End-to-End Workflow Testing
            </h1>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Comprehensive testing of complete user workflows from model selection through image generation 
              to Cloudinary storage, ensuring all components work together seamlessly.
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-2 mb-6">
            <UnifiedButton
              variant={activeTab === 'testing' ? 'primary' : 'secondary'}
              onClick={() => setActiveTab('testing')}
              icon={<Play className="w-4 h-4" />}
            >
              Workflow Testing
            </UnifiedButton>
            
            <UnifiedButton
              variant={activeTab === 'documentation' ? 'primary' : 'secondary'}
              onClick={() => setActiveTab('documentation')}
              icon={<Workflow className="w-4 h-4" />}
            >
              Workflow Documentation
            </UnifiedButton>
            
            <UnifiedButton
              variant={activeTab === 'architecture' ? 'primary' : 'secondary'}
              onClick={() => setActiveTab('architecture')}
              icon={<TrendingUp className="w-4 h-4" />}
            >
              Architecture Overview
            </UnifiedButton>
          </div>

          {/* Tab Content */}
          {activeTab === 'testing' && (
            <div className="space-y-6">
              {/* Workflow Tester */}
              <WorkflowTester onTestComplete={handleTestComplete} />

              {/* Production Readiness Assessment */}
              {testResults && (
                <UnifiedCard>
                  <UnifiedCardHeader
                    title="Production Readiness Assessment"
                    subtitle="Overall system readiness based on workflow test results"
                  />
                  
                  <UnifiedCardContent>
                    <div className="space-y-4">
                      {/* Overall Status */}
                      <div className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            'flex items-center gap-2 text-lg font-medium',
                            testResults.overallSuccess
                              ? 'text-green-600 dark:text-green-400'
                              : 'text-red-600 dark:text-red-400'
                          )}>
                            {testResults.overallSuccess ? (
                              <CheckCircle className="w-6 h-6" />
                            ) : (
                              <XCircle className="w-6 h-6" />
                            )}
                            Production Readiness: {testResults.overallSuccess ? 'READY' : 'NOT READY'}
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            Workflow Success Rate
                          </div>
                          <div className="text-lg font-medium">
                            {Math.round((testResults.successfulTests / testResults.totalTests) * 100)}%
                          </div>
                        </div>
                      </div>

                      {/* Critical Issues */}
                      {testResults.failedTests > 0 && (
                        <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                          <div className="flex items-center gap-2 text-red-800 dark:text-red-200 mb-2">
                            <AlertTriangle className="w-5 h-5" />
                            <span className="font-medium">Critical Issues Detected</span>
                          </div>
                          <div className="text-sm text-red-700 dark:text-red-300">
                            {testResults.failedTests} workflow test{testResults.failedTests !== 1 ? 's' : ''} failed. 
                            These issues must be resolved before production deployment.
                          </div>
                        </div>
                      )}

                      {/* Success Summary */}
                      {testResults.overallSuccess && (
                        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                          <div className="flex items-center gap-2 text-green-800 dark:text-green-200 mb-2">
                            <CheckCircle className="w-5 h-5" />
                            <span className="font-medium">All Workflows Passing</span>
                          </div>
                          <div className="text-sm text-green-700 dark:text-green-300">
                            All core workflows (IMAGES, VIDEO, ENHANCE) are functioning correctly. 
                            The system is ready for production deployment.
                          </div>
                        </div>
                      )}

                      {/* Mode-Specific Status */}
                      <div className="grid gap-4 md:grid-cols-3">
                        {['IMAGES', 'VIDEO', 'ENHANCE'].map((mode) => {
                          const modeResult = testResults.summary?.[mode.toLowerCase() + 'Workflow']
                          const ModeIcon = mode === 'IMAGES' ? Image : mode === 'VIDEO' ? Video : Zap
                          
                          return (
                            <div key={mode} className="p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                              <div className="flex items-center gap-2 mb-2">
                                <ModeIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                                <span className="font-medium text-gray-900 dark:text-white">
                                  {mode}
                                </span>
                              </div>
                              
                              {modeResult ? (
                                <div className="space-y-1">
                                  <div className={cn(
                                    'text-sm font-medium',
                                    modeResult.success
                                      ? 'text-green-600 dark:text-green-400'
                                      : 'text-red-600 dark:text-red-400'
                                  )}>
                                    {modeResult.success ? 'PASSED' : 'FAILED'}
                                  </div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400">
                                    {modeResult.successfulSteps}/{modeResult.totalSteps} steps
                                  </div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400">
                                    {(modeResult.totalDuration / 1000).toFixed(1)}s duration
                                  </div>
                                </div>
                              ) : (
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                  Not tested
                                </div>
                              )}
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

          {activeTab === 'documentation' && (
            <div className="space-y-6">
              {/* Workflow Overview */}
              <UnifiedCard>
                <UnifiedCardHeader
                  title="Workflow Architecture"
                  subtitle="Complete end-to-end workflow from user input to final storage"
                />
                
                <UnifiedCardContent>
                  <div className="space-y-6">
                    {workflowSteps.map((step, index) => {
                      const StepIcon = step.icon
                      const isLast = index === workflowSteps.length - 1
                      
                      return (
                        <div key={step.id} className="relative">
                          <div className="flex items-start gap-4">
                            <div className="flex flex-col items-center">
                              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800">
                                <StepIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                              </div>
                              {!isLast && (
                                <div className="w-0.5 h-12 bg-gray-200 dark:bg-gray-700 mt-2" />
                              )}
                            </div>
                            
                            <div className="flex-1 pb-8">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-medium text-gray-900 dark:text-white">
                                  {step.name}
                                </h3>
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                  Step {index + 1}
                                </div>
                              </div>
                              
                              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                {step.description}
                              </p>
                              
                              <p className="text-xs text-gray-500 dark:text-gray-500">
                                {step.details}
                              </p>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </UnifiedCardContent>
              </UnifiedCard>

              {/* Mode-Specific Workflows */}
              <div className="grid gap-6 md:grid-cols-3">
                {Object.entries({
                  IMAGES: {
                    icon: Image,
                    description: 'Text-to-image generation workflow',
                    steps: ['Model Selection', 'Parameter Validation', 'Prompt Enhancement', 'Image Generation', 'Storage & Gallery']
                  },
                  VIDEO: {
                    icon: Video,
                    description: 'Image-to-video generation workflow',
                    steps: ['Model Selection', 'Image Upload', 'Parameter Validation', 'Video Generation', 'Storage & Gallery']
                  },
                  ENHANCE: {
                    icon: Zap,
                    description: 'Image enhancement workflow',
                    steps: ['Model Selection', 'Image Upload', 'Parameter Validation', 'Enhancement Processing', 'Storage & Gallery']
                  }
                }).map(([mode, config]) => {
                  const ModeIcon = config.icon
                  
                  return (
                    <UnifiedCard key={mode}>
                      <UnifiedCardHeader
                        title={`${mode} Mode`}
                        subtitle={config.description}
                        icon={<ModeIcon className="w-5 h-5" />}
                      />
                      
                      <UnifiedCardContent>
                        <div className="space-y-2">
                          {config.steps.map((step, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                              <span className="text-sm text-gray-700 dark:text-gray-300">
                                {step}
                              </span>
                            </div>
                          ))}
                        </div>
                      </UnifiedCardContent>
                    </UnifiedCard>
                  )
                })}
              </div>
            </div>
          )}

          {activeTab === 'architecture' && (
            <div className="space-y-6">
              {/* System Architecture */}
              <UnifiedCard>
                <UnifiedCardHeader
                  title="System Architecture Overview"
                  subtitle="Technical architecture and integration points"
                />
                
                <UnifiedCardContent>
                  <div className="space-y-6">
                    {/* Architecture Diagram */}
                    <div className="p-6 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                      <div className="text-center text-sm text-gray-600 dark:text-gray-400 mb-4">
                        End-to-End Workflow Architecture
                      </div>
                      
                      <div className="flex items-center justify-center gap-4 flex-wrap">
                        <div className="flex items-center gap-2 px-3 py-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                          <Settings className="w-4 h-4 text-blue-600" />
                          <span className="text-sm font-medium">Frontend</span>
                        </div>
                        
                        <ArrowRight className="w-4 h-4 text-gray-400" />
                        
                        <div className="flex items-center gap-2 px-3 py-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                          <Zap className="w-4 h-4 text-green-600" />
                          <span className="text-sm font-medium">API Routes</span>
                        </div>
                        
                        <ArrowRight className="w-4 h-4 text-gray-400" />
                        
                        <div className="flex items-center gap-2 px-3 py-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                          <Image className="w-4 h-4 text-purple-600" />
                          <span className="text-sm font-medium">Replicate</span>
                        </div>
                        
                        <ArrowRight className="w-4 h-4 text-gray-400" />
                        
                        <div className="flex items-center gap-2 px-3 py-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                          <Cloud className="w-4 h-4 text-orange-600" />
                          <span className="text-sm font-medium">Cloudinary</span>
                        </div>
                        
                        <ArrowRight className="w-4 h-4 text-gray-400" />
                        
                        <div className="flex items-center gap-2 px-3 py-2 bg-teal-100 dark:bg-teal-900/20 rounded-lg">
                          <Database className="w-4 h-4 text-teal-600" />
                          <span className="text-sm font-medium">Supabase</span>
                        </div>
                      </div>
                    </div>

                    {/* Integration Points */}
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                        <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                          External Services
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-purple-500" />
                            <span>Replicate API - AI model execution</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-blue-500" />
                            <span>Google Gemini - Prompt enhancement</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-orange-500" />
                            <span>Cloudinary - Image storage & CDN</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-teal-500" />
                            <span>Supabase - Database & authentication</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                        <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                          Quality Assurance
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-500" />
                            <span>Comprehensive error handling</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-blue-500" />
                            <span>Loading states & user feedback</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-yellow-500" />
                            <span>Parameter validation</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-red-500" />
                            <span>Retry mechanisms</span>
                          </div>
                        </div>
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
