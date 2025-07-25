/**
 * Test suite for Progressive Parameter Controls
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ProgressiveParameterControls } from '../ProgressiveParameterControls'
import { getModelSchema, getParametersByLevel } from '@/lib/validation/modelParameterValidation'

// Mock the validation functions
jest.mock('@/lib/validation/modelParameterValidation', () => ({
  getModelSchema: jest.fn(),
  getParametersByLevel: jest.fn(),
  validateModelParameters: jest.fn()
}))

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>
  },
  AnimatePresence: ({ children }: any) => children
}))

const mockGetModelSchema = getModelSchema as jest.MockedFunction<typeof getModelSchema>
const mockGetParametersByLevel = getParametersByLevel as jest.MockedFunction<typeof getParametersByLevel>

describe('ProgressiveParameterControls', () => {
  const mockOnParametersChange = jest.fn()
  
  const mockBasicParams = [
    { name: 'aspect_ratio', type: 'select', options: ['1:1', '16:9'], default: '1:1', required: false },
    { name: 'num_outputs', type: 'integer', min: 1, max: 4, default: 1, required: false }
  ]
  
  const mockIntermediateParams = [
    { name: 'guidance_scale', type: 'number', min: 1, max: 20, default: 7.5, required: false },
    { name: 'num_inference_steps', type: 'integer', min: 1, max: 50, default: 28, required: false }
  ]
  
  const mockAdvancedParams = [
    { name: 'seed', type: 'integer', min: 0, max: 1000000, default: null, required: false },
    { name: 'output_format', type: 'select', options: ['webp', 'jpg', 'png'], default: 'webp', required: false }
  ]

  beforeEach(() => {
    jest.clearAllMocks()
    
    mockGetModelSchema.mockReturnValue({
      id: 'flux-schnell',
      name: 'FLUX Schnell',
      parameters: {
        basic: mockBasicParams,
        intermediate: mockIntermediateParams,
        advanced: mockAdvancedParams
      }
    } as any)
    
    mockGetParametersByLevel.mockImplementation((modelId, level) => {
      switch (level) {
        case 'basic': return mockBasicParams
        case 'intermediate': return mockIntermediateParams
        case 'advanced': return mockAdvancedParams
        default: return []
      }
    })
  })

  describe('Progressive Disclosure Structure', () => {
    it('should render all three parameter sections', () => {
      render(
        <ProgressiveParameterControls
          modelId="flux-schnell"
          parameters={{}}
          onParametersChange={mockOnParametersChange}
        />
      )

      expect(screen.getByText('Basic Settings')).toBeInTheDocument()
      expect(screen.getByText('Intermediate Settings')).toBeInTheDocument()
      expect(screen.getByText('Advanced Settings')).toBeInTheDocument()
    })

    it('should show parameter counts for each section', () => {
      render(
        <ProgressiveParameterControls
          modelId="flux-schnell"
          parameters={{}}
          onParametersChange={mockOnParametersChange}
        />
      )

      expect(screen.getByText('2 parameters')).toBeInTheDocument() // Basic
      expect(screen.getByText('2 parameters')).toBeInTheDocument() // Intermediate
      expect(screen.getByText('2 parameters')).toBeInTheDocument() // Advanced
    })

    it('should have basic section expanded by default', () => {
      render(
        <ProgressiveParameterControls
          modelId="flux-schnell"
          parameters={{}}
          onParametersChange={mockOnParametersChange}
        />
      )

      // Basic section should be expanded (parameters visible)
      const basicSection = screen.getByText('Basic Settings').closest('div')
      expect(basicSection).toBeInTheDocument()
      
      // Intermediate and Advanced should be collapsed initially
      const intermediateButton = screen.getByText('Intermediate Settings').closest('button')
      const advancedButton = screen.getByText('Advanced Settings').closest('button')
      
      expect(intermediateButton).toBeInTheDocument()
      expect(advancedButton).toBeInTheDocument()
    })
  })

  describe('Section Expansion and Collapse', () => {
    it('should expand intermediate section when clicked', async () => {
      render(
        <ProgressiveParameterControls
          modelId="flux-schnell"
          parameters={{}}
          onParametersChange={mockOnParametersChange}
        />
      )

      const intermediateButton = screen.getByText('Intermediate Settings').closest('button')
      fireEvent.click(intermediateButton!)

      // Should show expanded content
      await waitFor(() => {
        expect(screen.getByText('Essential parameters for most users')).toBeInTheDocument()
      })
    })

    it('should expand advanced section when clicked', async () => {
      render(
        <ProgressiveParameterControls
          modelId="flux-schnell"
          parameters={{}}
          onParametersChange={mockOnParametersChange}
        />
      )

      const advancedButton = screen.getByText('Advanced Settings').closest('button')
      fireEvent.click(advancedButton!)

      // Should show expanded content
      await waitFor(() => {
        expect(screen.getByText('Expert-level parameters and options')).toBeInTheDocument()
      })
    })

    it('should not allow collapsing basic section', () => {
      render(
        <ProgressiveParameterControls
          modelId="flux-schnell"
          parameters={{}}
          onParametersChange={mockOnParametersChange}
        />
      )

      const basicButton = screen.getByText('Basic Settings').closest('button')
      expect(basicButton).toBeDisabled()
    })

    it('should collapse expanded sections when clicked again', async () => {
      render(
        <ProgressiveParameterControls
          modelId="flux-schnell"
          parameters={{}}
          onParametersChange={mockOnParametersChange}
        />
      )

      const intermediateButton = screen.getByText('Intermediate Settings').closest('button')
      
      // Expand
      fireEvent.click(intermediateButton!)
      await waitFor(() => {
        expect(screen.getByText('Additional control for fine-tuning')).toBeInTheDocument()
      })

      // Collapse
      fireEvent.click(intermediateButton!)
      await waitFor(() => {
        expect(screen.queryByText('Additional control for fine-tuning')).not.toBeInTheDocument()
      })
    })
  })

  describe('Quick Actions', () => {
    it('should render expand all and collapse all buttons', () => {
      render(
        <ProgressiveParameterControls
          modelId="flux-schnell"
          parameters={{}}
          onParametersChange={mockOnParametersChange}
        />
      )

      expect(screen.getByText('Expand All')).toBeInTheDocument()
      expect(screen.getByText('Collapse All')).toBeInTheDocument()
    })

    it('should expand all sections when expand all is clicked', async () => {
      render(
        <ProgressiveParameterControls
          modelId="flux-schnell"
          parameters={{}}
          onParametersChange={mockOnParametersChange}
        />
      )

      const expandAllButton = screen.getByText('Expand All')
      fireEvent.click(expandAllButton)

      // All sections should be expanded
      await waitFor(() => {
        expect(screen.getByText('Essential parameters for most users')).toBeInTheDocument()
        expect(screen.getByText('Additional control for fine-tuning')).toBeInTheDocument()
        expect(screen.getByText('Expert-level parameters and options')).toBeInTheDocument()
      })
    })

    it('should collapse all sections except basic when collapse all is clicked', async () => {
      render(
        <ProgressiveParameterControls
          modelId="flux-schnell"
          parameters={{}}
          onParametersChange={mockOnParametersChange}
        />
      )

      // First expand all
      const expandAllButton = screen.getByText('Expand All')
      fireEvent.click(expandAllButton)

      await waitFor(() => {
        expect(screen.getByText('Additional control for fine-tuning')).toBeInTheDocument()
      })

      // Then collapse all
      const collapseAllButton = screen.getByText('Collapse All')
      fireEvent.click(collapseAllButton)

      await waitFor(() => {
        expect(screen.queryByText('Additional control for fine-tuning')).not.toBeInTheDocument()
        expect(screen.queryByText('Expert-level parameters and options')).not.toBeInTheDocument()
      })

      // Basic should still be visible
      expect(screen.getByText('Essential parameters for most users')).toBeInTheDocument()
    })
  })

  describe('Visual Design', () => {
    it('should apply correct styling for different section levels', () => {
      render(
        <ProgressiveParameterControls
          modelId="flux-schnell"
          parameters={{}}
          onParametersChange={mockOnParametersChange}
        />
      )

      // Check for level-specific badges
      const basicBadge = screen.getByText('2 parameters')
      expect(basicBadge).toHaveClass('bg-green-100')

      // Check for section icons
      expect(screen.getByText('Basic Settings')).toBeInTheDocument()
      expect(screen.getByText('Intermediate Settings')).toBeInTheDocument()
      expect(screen.getByText('Advanced Settings')).toBeInTheDocument()
    })

    it('should show chevron icons for expandable sections', () => {
      render(
        <ProgressiveParameterControls
          modelId="flux-schnell"
          parameters={{}}
          onParametersChange={mockOnParametersChange}
        />
      )

      // Intermediate and Advanced should have chevron icons
      const intermediateButton = screen.getByText('Intermediate Settings').closest('button')
      const advancedButton = screen.getByText('Advanced Settings').closest('button')

      expect(intermediateButton?.querySelector('svg')).toBeInTheDocument()
      expect(advancedButton?.querySelector('svg')).toBeInTheDocument()
    })
  })

  describe('Validation Integration', () => {
    it('should display validation summary', () => {
      render(
        <ProgressiveParameterControls
          modelId="flux-schnell"
          parameters={{}}
          onParametersChange={mockOnParametersChange}
        />
      )

      expect(screen.getByText('All parameters are valid')).toBeInTheDocument()
    })

    it('should show section count in quick actions', () => {
      render(
        <ProgressiveParameterControls
          modelId="flux-schnell"
          parameters={{}}
          onParametersChange={mockOnParametersChange}
        />
      )

      expect(screen.getByText(/1 of 3 sections expanded/)).toBeInTheDocument()
    })
  })

  describe('Empty Sections Handling', () => {
    it('should hide sections with no parameters', () => {
      mockGetParametersByLevel.mockImplementation((modelId, level) => {
        switch (level) {
          case 'basic': return mockBasicParams
          case 'intermediate': return [] // Empty intermediate
          case 'advanced': return mockAdvancedParams
          default: return []
        }
      })

      render(
        <ProgressiveParameterControls
          modelId="flux-schnell"
          parameters={{}}
          onParametersChange={mockOnParametersChange}
        />
      )

      expect(screen.getByText('Basic Settings')).toBeInTheDocument()
      expect(screen.queryByText('Intermediate Settings')).not.toBeInTheDocument()
      expect(screen.getByText('Advanced Settings')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have proper button roles and labels', () => {
      render(
        <ProgressiveParameterControls
          modelId="flux-schnell"
          parameters={{}}
          onParametersChange={mockOnParametersChange}
        />
      )

      const buttons = screen.getAllByRole('button')
      expect(buttons.length).toBeGreaterThan(0)

      // Check that expandable sections have proper button elements
      const intermediateButton = screen.getByText('Intermediate Settings').closest('button')
      const advancedButton = screen.getByText('Advanced Settings').closest('button')

      expect(intermediateButton).toHaveAttribute('type', 'button')
      expect(advancedButton).toHaveAttribute('type', 'button')
    })

    it('should support keyboard navigation', () => {
      render(
        <ProgressiveParameterControls
          modelId="flux-schnell"
          parameters={{}}
          onParametersChange={mockOnParametersChange}
        />
      )

      const intermediateButton = screen.getByText('Intermediate Settings').closest('button')
      intermediateButton?.focus()

      expect(document.activeElement).toBe(intermediateButton)
    })
  })
})
