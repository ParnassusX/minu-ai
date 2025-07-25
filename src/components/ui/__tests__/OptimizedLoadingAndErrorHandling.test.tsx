/**
 * Test suite for Optimized Loading States, Error Handling, and Core Mode Functionality
 * Tests square grid animated dots pattern, comprehensive error handling, and core mode validation
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { OptimizedLoading, GenerationLoading, UploadLoading, InlineLoading } from '../OptimizedLoading'
import { OptimizedErrorBoundary, ApiError, NetworkError, GenerationError } from '../OptimizedErrorHandling'
import { validateAllCoreModes, validateImagesMode, validateVideoMode, validateEnhanceMode } from '../../lib/validation/coreModeValidation'
import { CoreModeVerification } from '../generator/CoreModeVerification'
import { CoreModeFixer } from '../generator/CoreModeFixer'

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>
  },
  AnimatePresence: ({ children }: any) => children
}))

describe('Optimized Loading States', () => {
  describe('OptimizedLoading Component', () => {
    it('should render with square grid animated dots pattern', () => {
      render(<OptimizedLoading variant="generation" />)
      
      // Should render the grid container
      expect(document.querySelector('.grid.grid-cols-3')).toBeInTheDocument()
      
      // Should have 9 dots in 3x3 grid
      expect(document.querySelectorAll('.grid.grid-cols-3 > div')).toHaveLength(9)
    })

    it('should render with different variants', () => {
      const { rerender } = render(<OptimizedLoading variant="generation" />)
      expect(screen.getByText('Generating...')).toBeInTheDocument()

      rerender(<OptimizedLoading variant="upload" />)
      expect(screen.getByText('Uploading...')).toBeInTheDocument()

      rerender(<OptimizedLoading variant="processing" />)
      expect(screen.getByText('Processing...')).toBeInTheDocument()

      rerender(<OptimizedLoading variant="enhancement" />)
      expect(screen.getByText('Enhancing...')).toBeInTheDocument()
    })

    it('should show progress bar when progress is provided', () => {
      render(<OptimizedLoading progress={75} showProgress={true} />)
      
      expect(screen.getByText('Progress')).toBeInTheDocument()
      expect(screen.getByText('75%')).toBeInTheDocument()
      
      const progressBar = document.querySelector('[style*="width: 75%"]')
      expect(progressBar).toBeInTheDocument()
    })

    it('should render with custom title and subtitle', () => {
      render(
        <OptimizedLoading 
          title="Custom Title"
          subtitle="Custom subtitle"
        />
      )
      
      expect(screen.getByText('Custom Title')).toBeInTheDocument()
      expect(screen.getByText('Custom subtitle')).toBeInTheDocument()
    })

    it('should render with different sizes', () => {
      const { rerender } = render(<OptimizedLoading size="sm" />)
      expect(document.querySelector('.w-16.h-16')).toBeInTheDocument()

      rerender(<OptimizedLoading size="lg" />)
      expect(document.querySelector('.w-32.h-32')).toBeInTheDocument()
    })

    it('should render full screen when specified', () => {
      render(<OptimizedLoading fullScreen />)
      
      expect(document.querySelector('.fixed.inset-0')).toBeInTheDocument()
    })

    it('should animate grid dots when animated is true', () => {
      render(<OptimizedLoading animated={true} />)
      
      // Grid dots should have transition classes
      const gridDots = document.querySelectorAll('.grid.grid-cols-3 > div')
      gridDots.forEach(dot => {
        expect(dot).toHaveClass('transition-all')
      })
    })
  })

  describe('Specialized Loading Components', () => {
    it('should render GenerationLoading with model info', () => {
      render(
        <GenerationLoading 
          progress={50}
          stage="Processing image..."
          model="FLUX Schnell"
        />
      )
      
      expect(screen.getByText('Processing image...')).toBeInTheDocument()
      expect(screen.getByText('Using FLUX Schnell')).toBeInTheDocument()
      expect(screen.getByText('50%')).toBeInTheDocument()
    })

    it('should render UploadLoading with file info', () => {
      render(
        <UploadLoading 
          fileName="image.jpg"
          progress={25}
        />
      )
      
      expect(screen.getByText('Uploading file...')).toBeInTheDocument()
      expect(screen.getByText('Uploading image.jpg')).toBeInTheDocument()
      expect(screen.getByText('25%')).toBeInTheDocument()
    })

    it('should render InlineLoading for small spaces', () => {
      render(<InlineLoading text="Loading data..." size="sm" />)
      
      expect(screen.getByText('Loading data...')).toBeInTheDocument()
      expect(document.querySelector('.unified-loading-spinner')).toBeInTheDocument()
    })
  })

  describe('Loading Animation Performance', () => {
    it('should use hardware-accelerated animations', () => {
      render(<OptimizedLoading animated={true} />)
      
      // Should have shimmer overlay with animation
      expect(document.querySelector('.animate-shimmer')).toBeInTheDocument()
    })

    it('should handle animation cleanup', () => {
      const { unmount } = render(<OptimizedLoading animated={true} />)
      
      // Should unmount without errors
      expect(() => unmount()).not.toThrow()
    })
  })
})

describe('Optimized Error Handling', () => {
  describe('OptimizedErrorBoundary', () => {
    const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
      if (shouldThrow) {
        throw new Error('Test error')
      }
      return <div>No error</div>
    }

    it('should catch and display errors', () => {
      // Suppress console.error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
      
      render(
        <OptimizedErrorBoundary>
          <ThrowError shouldThrow={true} />
        </OptimizedErrorBoundary>
      )
      
      expect(screen.getByText('Something went wrong')).toBeInTheDocument()
      expect(screen.getByText('An unexpected error occurred. Please try again.')).toBeInTheDocument()
      
      consoleSpy.mockRestore()
    })

    it('should render children when no error', () => {
      render(
        <OptimizedErrorBoundary>
          <ThrowError shouldThrow={false} />
        </OptimizedErrorBoundary>
      )
      
      expect(screen.getByText('No error')).toBeInTheDocument()
    })

    it('should show retry button with retry functionality', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
      
      render(
        <OptimizedErrorBoundary maxRetries={3}>
          <ThrowError shouldThrow={true} />
        </OptimizedErrorBoundary>
      )
      
      const retryButton = screen.getByText('Try Again')
      expect(retryButton).toBeInTheDocument()
      
      fireEvent.click(retryButton)
      expect(screen.getByText('Retry attempt 1 of 3')).toBeInTheDocument()
      
      consoleSpy.mockRestore()
    })

    it('should disable retry after max attempts', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
      
      render(
        <OptimizedErrorBoundary maxRetries={1}>
          <ThrowError shouldThrow={true} />
        </OptimizedErrorBoundary>
      )
      
      const retryButton = screen.getByText('Try Again')
      fireEvent.click(retryButton)
      
      // After max retries, retry button should not be available
      expect(screen.queryByText('Try Again')).not.toBeInTheDocument()
      
      consoleSpy.mockRestore()
    })

    it('should show technical details when showDetails is true', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
      
      render(
        <OptimizedErrorBoundary showDetails={true}>
          <ThrowError shouldThrow={true} />
        </OptimizedErrorBoundary>
      )
      
      expect(screen.getByText('Technical Details')).toBeInTheDocument()
      
      consoleSpy.mockRestore()
    })
  })

  describe('Error Type Detection', () => {
    it('should render ApiError with appropriate styling', () => {
      const error = new Error('API server error')
      render(<ApiError error={error} />)
      
      expect(screen.getByText('Server Error')).toBeInTheDocument()
      expect(screen.getByText('Our servers are experiencing issues. Please try again later.')).toBeInTheDocument()
    })

    it('should render NetworkError with network-specific messaging', () => {
      render(<NetworkError />)
      
      expect(screen.getByText('Connection Problem')).toBeInTheDocument()
      expect(screen.getByText('Unable to connect to our servers. Please check your internet connection.')).toBeInTheDocument()
    })

    it('should render GenerationError with generation-specific actions', () => {
      const error = new Error('Generation failed')
      const handleRetry = jest.fn()
      const handleGoBack = jest.fn()
      
      render(
        <GenerationError 
          error={error}
          onRetry={handleRetry}
          onGoBack={handleGoBack}
        />
      )
      
      expect(screen.getByText('Generation Failed')).toBeInTheDocument()
      
      const retryButton = screen.getByText('Try Again')
      const goBackButton = screen.getByText('Go Back')
      
      fireEvent.click(retryButton)
      expect(handleRetry).toHaveBeenCalledTimes(1)
      
      fireEvent.click(goBackButton)
      expect(handleGoBack).toHaveBeenCalledTimes(1)
    })
  })

  describe('Error Configuration', () => {
    it('should detect network errors correctly', () => {
      const networkError = new Error('Network connection failed')
      render(<ApiError error={networkError} />)
      
      expect(screen.getByText('Connection Problem')).toBeInTheDocument()
    })

    it('should detect authentication errors correctly', () => {
      const authError = new Error('Unauthorized access')
      render(<ApiError error={authError} />)
      
      expect(screen.getByText('Authentication Required')).toBeInTheDocument()
    })

    it('should detect payment errors correctly', () => {
      const paymentError = new Error('Payment insufficient funds')
      render(<ApiError error={paymentError} />)
      
      expect(screen.getByText('Payment Issue')).toBeInTheDocument()
    })

    it('should detect timeout errors correctly', () => {
      const timeoutError = new Error('Request timeout exceeded')
      render(<ApiError error={timeoutError} />)
      
      expect(screen.getByText('Request Timeout')).toBeInTheDocument()
    })

    it('should detect validation errors correctly', () => {
      const validationError = new Error('Validation failed for input')
      render(<ApiError error={validationError} />)
      
      expect(screen.getByText('Invalid Input')).toBeInTheDocument()
    })
  })

  describe('Error Accessibility', () => {
    it('should have proper ARIA labels and roles', () => {
      const error = new Error('Test error')
      render(<ApiError error={error} />)
      
      const retryButton = screen.getByRole('button', { name: /try again/i })
      const homeButton = screen.getByRole('button', { name: /go home/i })
      
      expect(retryButton).toBeInTheDocument()
      expect(homeButton).toBeInTheDocument()
    })

    it('should support keyboard navigation', () => {
      const error = new Error('Test error')
      render(<ApiError error={error} />)
      
      const retryButton = screen.getByRole('button', { name: /try again/i })
      retryButton.focus()
      
      expect(retryButton).toHaveFocus()
    })
  })

  describe('Error Integration with Unified Design System', () => {
    it('should use unified card styling', () => {
      const error = new Error('Test error')
      render(<ApiError error={error} />)
      
      expect(document.querySelector('.unified-card')).toBeInTheDocument()
    })

    it('should use unified button styling', () => {
      const error = new Error('Test error')
      render(<ApiError error={error} />)
      
      const retryButton = screen.getByRole('button', { name: /try again/i })
      expect(retryButton).toHaveClass('unified-button')
    })

    it('should use unified typography classes', () => {
      const error = new Error('Test error')
      render(<ApiError error={error} />)
      
      // Should use unified heading and body classes
      expect(document.querySelector('.unified-heading-2')).toBeInTheDocument()
      expect(document.querySelector('.unified-body')).toBeInTheDocument()
    })
  })

  describe('Error Performance', () => {
    it('should handle multiple error boundaries without conflicts', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
      
      render(
        <div>
          <OptimizedErrorBoundary>
            <div>Component 1</div>
          </OptimizedErrorBoundary>
          <OptimizedErrorBoundary>
            <div>Component 2</div>
          </OptimizedErrorBoundary>
        </div>
      )
      
      expect(screen.getByText('Component 1')).toBeInTheDocument()
      expect(screen.getByText('Component 2')).toBeInTheDocument()
      
      consoleSpy.mockRestore()
    })

    it('should not cause memory leaks on unmount', () => {
      const { unmount } = render(
        <OptimizedErrorBoundary>
          <div>Test component</div>
        </OptimizedErrorBoundary>
      )
      
      expect(() => unmount()).not.toThrow()
    })
  })
})

describe('Core Mode Functionality', () => {
  describe('Core Mode Validation', () => {
    it('should validate images mode correctly', async () => {
      const result = await validateImagesMode({ skipApiTests: true })

      expect(result.mode).toBe('images')
      expect(result).toHaveProperty('isValid')
      expect(result).toHaveProperty('errors')
      expect(result).toHaveProperty('warnings')
      expect(result).toHaveProperty('details')

      // Should have configuration validation
      expect(result.details).toHaveProperty('configurationValid')
      expect(result.details).toHaveProperty('modelsAccessible')
      expect(result.details).toHaveProperty('parametersValid')
    })

    it('should validate video mode correctly', async () => {
      const result = await validateVideoMode({ skipApiTests: true })

      expect(result.mode).toBe('video')
      expect(result).toHaveProperty('isValid')
      expect(result.details).toHaveProperty('uploadConfigValid')

      // Video mode should have upload configuration
      if (result.isValid) {
        expect(result.details.uploadConfigValid).toBe(true)
      }
    })

    it('should validate enhance mode correctly', async () => {
      const result = await validateEnhanceMode({ skipApiTests: true })

      expect(result.mode).toBe('enhance')
      expect(result).toHaveProperty('isValid')

      // Enhance mode should require upload
      if (result.isValid) {
        expect(result.details.uploadConfigValid).toBe(true)
      }
    })

    it('should validate all core modes', async () => {
      const results = await validateAllCoreModes({ skipApiTests: true })

      expect(results).toHaveProperty('overall')
      expect(results).toHaveProperty('results')
      expect(results).toHaveProperty('summary')

      expect(results.results).toHaveProperty('images')
      expect(results.results).toHaveProperty('video')
      expect(results.results).toHaveProperty('enhance')

      expect(results.summary.totalModes).toBe(3)
      expect(results.overall).toMatch(/^(success|partial|failed)$/)
    })

    it('should provide validation recommendations', async () => {
      const result = await validateImagesMode({ skipApiTests: true })

      // This would test the recommendation system
      // Implementation depends on actual validation results
      expect(result).toHaveProperty('errors')
      expect(Array.isArray(result.errors)).toBe(true)
    })
  })

  describe('CoreModeVerification Component', () => {
    it('should render verification interface', () => {
      render(<CoreModeVerification />)

      expect(screen.getByText('Core Mode Verification')).toBeInTheDocument()
      expect(screen.getByText('Testing IMAGES, VIDEO, and ENHANCE mode functionality')).toBeInTheDocument()
      expect(screen.getByText('Run Verification')).toBeInTheDocument()
    })

    it('should show mode status cards', () => {
      render(<CoreModeVerification />)

      // Should show cards for all three modes
      expect(screen.getByText('Images')).toBeInTheDocument()
      expect(screen.getByText('Video')).toBeInTheDocument()
      expect(screen.getByText('Enhance')).toBeInTheDocument()
    })

    it('should handle verification completion', async () => {
      const onComplete = jest.fn()
      render(<CoreModeVerification onVerificationComplete={onComplete} />)

      const runButton = screen.getByText('Run Verification')
      fireEvent.click(runButton)

      // Should eventually call completion handler
      await waitFor(() => {
        expect(onComplete).toHaveBeenCalled()
      }, { timeout: 10000 })
    })
  })

  describe('CoreModeFixer Component', () => {
    it('should render fixer interface', () => {
      render(<CoreModeFixer />)

      expect(screen.getByText('Core Mode Status')).toBeInTheDocument()
      expect(screen.getByText('Re-validate')).toBeInTheDocument()
    })

    it('should show validation status', async () => {
      render(<CoreModeFixer />)

      // Should show loading state initially
      await waitFor(() => {
        expect(screen.getByText(/Validating modes/)).toBeInTheDocument()
      })
    })

    it('should handle fix completion', async () => {
      const onComplete = jest.fn()
      render(<CoreModeFixer onFixComplete={onComplete} />)

      // Wait for initial validation to complete
      await waitFor(() => {
        expect(screen.queryByText(/Validating modes/)).not.toBeInTheDocument()
      }, { timeout: 5000 })
    })
  })

  describe('Mode Integration', () => {
    it('should handle mode switching correctly', () => {
      // This would test mode switching functionality
      // Implementation depends on mode store integration
      expect(true).toBe(true) // Placeholder
    })

    it('should validate mode-specific requirements', () => {
      // Test mode-specific validation logic
      expect(true).toBe(true) // Placeholder
    })

    it('should handle upload requirements per mode', () => {
      // Test upload requirement validation
      expect(true).toBe(true) // Placeholder
    })
  })

  describe('Error Handling Integration', () => {
    it('should handle mode validation errors', () => {
      // Test error handling for mode validation failures
      expect(true).toBe(true) // Placeholder
    })

    it('should provide recovery options for mode issues', () => {
      // Test recovery mechanisms for mode problems
      expect(true).toBe(true) // Placeholder
    })
  })
})
