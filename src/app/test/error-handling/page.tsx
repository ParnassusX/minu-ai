'use client'

import { useState } from 'react'
import { ErrorHandlingAuditor } from '@/components/admin/ErrorHandlingAuditor'
import { FormErrorDisplay, FormSuccess, FormInfo, useFormErrors, createFormError, createServerError, createNetworkError } from '@/components/ui/FormErrorHandling'
import { UnifiedCard, UnifiedCardHeader, UnifiedCardContent } from '@/components/ui/UnifiedCard'
import { UnifiedButton } from '@/components/ui/UnifiedButton'
import { OptimizedErrorBoundary, GenerationError, ApiError, NetworkError } from '@/components/ui/OptimizedErrorHandling'
import { OptimizedLoading, GenerationLoading, UploadLoading } from '@/components/ui/OptimizedLoading'
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  Zap,
  RefreshCw,
  Upload,
  Image,
  Settings
} from 'lucide-react'

/**
 * Error Handling and Loading States Test Page
 * Comprehensive testing interface for error handling and loading state coverage
 */
export default function ErrorHandlingTestPage() {
  const [activeTab, setActiveTab] = useState<'audit' | 'components' | 'scenarios'>('audit')
  const [testScenario, setTestScenario] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { errors, addError, clearErrors, hasErrors } = useFormErrors()

  const simulateError = (type: string) => {
    setTestScenario(type)
    clearErrors()
    
    switch (type) {
      case 'validation':
        addError(createFormError('email', 'Please enter a valid email address'))
        addError(createFormError('password', 'Password must be at least 8 characters'))
        break
      case 'server':
        addError(createServerError('Server is temporarily unavailable. Please try again later.'))
        break
      case 'network':
        addError(createNetworkError())
        break
      case 'generation':
        setTestScenario('generation-error')
        break
      case 'loading':
        setIsLoading(true)
        setTimeout(() => setIsLoading(false), 3000)
        break
    }
  }

  const TestErrorBoundary = ({ children }: { children: React.ReactNode }) => {
    const [hasError, setHasError] = useState(false)
    
    if (hasError) {
      throw new Error('Test error boundary trigger')
    }
    
    return (
      <div>
        <UnifiedButton
          variant="secondary"
          size="sm"
          onClick={() => setHasError(true)}
          className="mb-4"
        >
          Trigger Error Boundary
        </UnifiedButton>
        {children}
      </div>
    )
  }

  return (
    <OptimizedErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Error Handling & Loading States Test
            </h1>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Comprehensive testing and validation of error handling coverage and loading states
              throughout the Minu.AI application.
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-2 mb-6">
            <UnifiedButton
              variant={activeTab === 'audit' ? 'primary' : 'secondary'}
              onClick={() => setActiveTab('audit')}
              icon={<Shield className="w-4 h-4" />}
            >
              Coverage Audit
            </UnifiedButton>
            
            <UnifiedButton
              variant={activeTab === 'components' ? 'primary' : 'secondary'}
              onClick={() => setActiveTab('components')}
              icon={<CheckCircle className="w-4 h-4" />}
            >
              Component Testing
            </UnifiedButton>
            
            <UnifiedButton
              variant={activeTab === 'scenarios' ? 'primary' : 'secondary'}
              onClick={() => setActiveTab('scenarios')}
              icon={<AlertTriangle className="w-4 h-4" />}
            >
              Error Scenarios
            </UnifiedButton>
          </div>

          {/* Tab Content */}
          {activeTab === 'audit' && (
            <ErrorHandlingAuditor />
          )}

          {activeTab === 'components' && (
            <div className="space-y-6">
              {/* Loading States Testing */}
              <UnifiedCard>
                <UnifiedCardHeader
                  title="Loading States Testing"
                  subtitle="Test different loading state components and patterns"
                />
                
                <UnifiedCardContent>
                  <div className="space-y-6">
                    {/* Square Grid Loading */}
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                        Square Grid Animated Dots Pattern
                      </h4>
                      <div className="grid gap-4 md:grid-cols-3">
                        <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                          <div className="text-sm font-medium mb-2">Generation Loading</div>
                          <GenerationLoading
                            progress={75}
                            stage="Processing image..."
                            model="FLUX Schnell"
                          />
                        </div>
                        
                        <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                          <div className="text-sm font-medium mb-2">Upload Loading</div>
                          <UploadLoading
                            fileName="image.jpg"
                            progress={45}
                          />
                        </div>
                        
                        <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                          <div className="text-sm font-medium mb-2">Processing Loading</div>
                          <OptimizedLoading
                            variant="processing"
                            title="Processing..."
                            size="sm"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Interactive Loading Test */}
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                        Interactive Loading Test
                      </h4>
                      <div className="flex gap-2 mb-4">
                        <UnifiedButton
                          variant="primary"
                          onClick={() => simulateError('loading')}
                          loading={isLoading}
                          icon={<Zap className="w-4 h-4" />}
                        >
                          {isLoading ? 'Loading...' : 'Test Loading State'}
                        </UnifiedButton>
                      </div>
                      
                      {isLoading && (
                        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                          <OptimizedLoading
                            variant="generation"
                            title="Testing loading state..."
                            subtitle="This will complete in 3 seconds"
                            progress={66}
                            size="sm"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </UnifiedCardContent>
              </UnifiedCard>

              {/* Error Components Testing */}
              <UnifiedCard>
                <UnifiedCardHeader
                  title="Error Components Testing"
                  subtitle="Test different error handling components and patterns"
                />
                
                <UnifiedCardContent>
                  <div className="space-y-6">
                    {/* Form Error Testing */}
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                        Form Error Handling
                      </h4>
                      <div className="flex gap-2 mb-4">
                        <UnifiedButton
                          variant="secondary"
                          size="sm"
                          onClick={() => simulateError('validation')}
                        >
                          Validation Errors
                        </UnifiedButton>
                        <UnifiedButton
                          variant="secondary"
                          size="sm"
                          onClick={() => simulateError('server')}
                        >
                          Server Error
                        </UnifiedButton>
                        <UnifiedButton
                          variant="secondary"
                          size="sm"
                          onClick={() => simulateError('network')}
                        >
                          Network Error
                        </UnifiedButton>
                        <UnifiedButton
                          variant="ghost"
                          size="sm"
                          onClick={clearErrors}
                        >
                          Clear Errors
                        </UnifiedButton>
                      </div>
                      
                      {hasErrors && (
                        <FormErrorDisplay
                          errors={errors}
                          onRetry={() => console.log('Retry clicked')}
                          onDismiss={clearErrors}
                        />
                      )}
                    </div>

                    {/* Success and Info Messages */}
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                        Success and Info Messages
                      </h4>
                      <div className="space-y-3">
                        <FormSuccess
                          message="Settings saved successfully!"
                          onDismiss={() => console.log('Success dismissed')}
                        />
                        
                        <FormInfo
                          message="Your changes will take effect after the next generation."
                          onDismiss={() => console.log('Info dismissed')}
                        />
                      </div>
                    </div>

                    {/* Specialized Error Components */}
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                        Specialized Error Components
                      </h4>
                      <div className="space-y-4">
                        {testScenario === 'generation-error' && (
                          <GenerationError
                            error={new Error('Generation failed due to content policy violation')}
                            onRetry={() => setTestScenario(null)}
                            onGoBack={() => setTestScenario(null)}
                          />
                        )}
                        
                        <div className="grid gap-4 md:grid-cols-2">
                          <ApiError
                            error={new Error('API rate limit exceeded')}
                            onRetry={() => console.log('API retry')}
                          />
                          
                          <NetworkError
                            onRetry={() => console.log('Network retry')}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </UnifiedCardContent>
              </UnifiedCard>

              {/* Error Boundary Testing */}
              <UnifiedCard>
                <UnifiedCardHeader
                  title="Error Boundary Testing"
                  subtitle="Test error boundary functionality and recovery"
                />
                
                <UnifiedCardContent>
                  <TestErrorBoundary>
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <div className="text-sm text-green-700 dark:text-green-300">
                        This component is protected by an error boundary. Click the button above to trigger an error and see the boundary in action.
                      </div>
                    </div>
                  </TestErrorBoundary>
                </UnifiedCardContent>
              </UnifiedCard>
            </div>
          )}

          {activeTab === 'scenarios' && (
            <div className="space-y-6">
              {/* Error Scenario Testing */}
              <UnifiedCard>
                <UnifiedCardHeader
                  title="Error Scenario Testing"
                  subtitle="Test various error scenarios and recovery mechanisms"
                />
                
                <UnifiedCardContent>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <UnifiedButton
                      variant="secondary"
                      onClick={() => simulateError('generation')}
                      icon={<Image className="w-4 h-4" />}
                      className="h-auto p-4 flex-col items-start"
                    >
                      <div className="font-medium">Generation Error</div>
                      <div className="text-xs text-gray-500 mt-1">
                        Test image generation failure
                      </div>
                    </UnifiedButton>
                    
                    <UnifiedButton
                      variant="secondary"
                      onClick={() => simulateError('upload')}
                      icon={<Upload className="w-4 h-4" />}
                      className="h-auto p-4 flex-col items-start"
                    >
                      <div className="font-medium">Upload Error</div>
                      <div className="text-xs text-gray-500 mt-1">
                        Test file upload failure
                      </div>
                    </UnifiedButton>
                    
                    <UnifiedButton
                      variant="secondary"
                      onClick={() => simulateError('auth')}
                      icon={<Shield className="w-4 h-4" />}
                      className="h-auto p-4 flex-col items-start"
                    >
                      <div className="font-medium">Auth Error</div>
                      <div className="text-xs text-gray-500 mt-1">
                        Test authentication failure
                      </div>
                    </UnifiedButton>
                    
                    <UnifiedButton
                      variant="secondary"
                      onClick={() => simulateError('network')}
                      icon={<RefreshCw className="w-4 h-4" />}
                      className="h-auto p-4 flex-col items-start"
                    >
                      <div className="font-medium">Network Error</div>
                      <div className="text-xs text-gray-500 mt-1">
                        Test network connectivity issues
                      </div>
                    </UnifiedButton>
                    
                    <UnifiedButton
                      variant="secondary"
                      onClick={() => simulateError('settings')}
                      icon={<Settings className="w-4 h-4" />}
                      className="h-auto p-4 flex-col items-start"
                    >
                      <div className="font-medium">Settings Error</div>
                      <div className="text-xs text-gray-500 mt-1">
                        Test settings update failure
                      </div>
                    </UnifiedButton>
                    
                    <UnifiedButton
                      variant="secondary"
                      onClick={() => simulateError('validation')}
                      icon={<AlertTriangle className="w-4 h-4" />}
                      className="h-auto p-4 flex-col items-start"
                    >
                      <div className="font-medium">Validation Error</div>
                      <div className="text-xs text-gray-500 mt-1">
                        Test form validation errors
                      </div>
                    </UnifiedButton>
                  </div>
                </UnifiedCardContent>
              </UnifiedCard>

              {/* Recovery Testing */}
              <UnifiedCard>
                <UnifiedCardHeader
                  title="Error Recovery Testing"
                  subtitle="Test error recovery mechanisms and retry functionality"
                />
                
                <UnifiedCardContent>
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
                        Recovery Mechanisms
                      </h4>
                      <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                        <li>• Automatic retry with exponential backoff</li>
                        <li>• Manual retry buttons with clear feedback</li>
                        <li>• Graceful degradation for non-critical features</li>
                        <li>• Error boundary fallbacks with recovery options</li>
                        <li>• Network connectivity detection and handling</li>
                      </ul>
                    </div>
                    
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">
                        User Experience Features
                      </h4>
                      <ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
                        <li>• Clear, non-technical error messages</li>
                        <li>• Contextual help and guidance</li>
                        <li>• Progress preservation during retries</li>
                        <li>• Consistent error styling with glassmorphism</li>
                        <li>• Accessible error handling for screen readers</li>
                      </ul>
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
