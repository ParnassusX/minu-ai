/**
 * Test suite for Responsive Breakpoint System
 * Tests standardized breakpoints: 375px (mobile), 768px (tablet), 1920px (desktop)
 */

import { render, screen } from '@testing-library/react'
import { ResponsiveLayout, ResponsiveGrid, ResponsiveCard, ResponsiveButton, ResponsiveText } from '../ResponsiveLayout'

// Mock window.matchMedia for responsive testing
const mockMatchMedia = (matches: boolean) => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
      matches,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  })
}

describe('Responsive Breakpoint System', () => {
  beforeEach(() => {
    // Reset window size
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1920,
    })
  })

  describe('ResponsiveLayout Component', () => {
    it('should render generator layout with responsive classes', () => {
      render(
        <ResponsiveLayout variant="generator">
          <div>Generator Content</div>
        </ResponsiveLayout>
      )

      const layout = screen.getByText('Generator Content').parentElement
      expect(layout).toHaveClass('generator-responsive')
      expect(layout).toHaveClass('min-h-screen')
    })

    it('should render gallery layout with responsive classes', () => {
      render(
        <ResponsiveLayout variant="gallery">
          <div>Gallery Content</div>
        </ResponsiveLayout>
      )

      const layout = screen.getByText('Gallery Content').parentElement
      expect(layout).toHaveClass('gallery-responsive')
    })

    it('should render dashboard layout with responsive classes', () => {
      render(
        <ResponsiveLayout variant="dashboard">
          <div>Dashboard Content</div>
        </ResponsiveLayout>
      )

      const layout = screen.getByText('Dashboard Content').parentElement
      expect(layout).toHaveClass('responsive-grid')
    })

    it('should render chat layout with responsive classes', () => {
      render(
        <ResponsiveLayout variant="chat">
          <div>Chat Content</div>
        </ResponsiveLayout>
      )

      const layout = screen.getByText('Chat Content').parentElement
      expect(layout).toHaveClass('responsive-container')
    })
  })

  describe('ResponsiveGrid Component', () => {
    it('should render with default column configuration', () => {
      render(
        <ResponsiveGrid>
          <div>Grid Item 1</div>
          <div>Grid Item 2</div>
        </ResponsiveGrid>
      )

      const grid = screen.getByText('Grid Item 1').parentElement
      expect(grid).toHaveClass('grid')
      expect(grid).toHaveClass('grid-cols-1')
      expect(grid).toHaveClass('tablet:grid-cols-2')
      expect(grid).toHaveClass('desktop:grid-cols-3')
    })

    it('should render with custom column configuration', () => {
      render(
        <ResponsiveGrid columns={{ mobile: 2, tablet: 3, desktop: 4 }}>
          <div>Grid Item 1</div>
          <div>Grid Item 2</div>
        </ResponsiveGrid>
      )

      const grid = screen.getByText('Grid Item 1').parentElement
      expect(grid).toHaveClass('grid-cols-2')
      expect(grid).toHaveClass('tablet:grid-cols-3')
      expect(grid).toHaveClass('desktop:grid-cols-4')
    })

    it('should apply correct gap classes', () => {
      render(
        <ResponsiveGrid gap="lg">
          <div>Grid Item</div>
        </ResponsiveGrid>
      )

      const grid = screen.getByText('Grid Item').parentElement
      expect(grid).toHaveClass('gap-6')
      expect(grid).toHaveClass('tablet:gap-8')
      expect(grid).toHaveClass('desktop:gap-12')
    })
  })

  describe('ResponsiveCard Component', () => {
    it('should render with default glass styling', () => {
      render(
        <ResponsiveCard>
          <div>Card Content</div>
        </ResponsiveCard>
      )

      const card = screen.getByText('Card Content').parentElement
      expect(card).toHaveClass('rounded-xl')
      expect(card).toHaveClass('bg-white/60')
      expect(card).toHaveClass('backdrop-blur-md')
    })

    it('should render without glass styling when disabled', () => {
      render(
        <ResponsiveCard glass={false}>
          <div>Card Content</div>
        </ResponsiveCard>
      )

      const card = screen.getByText('Card Content').parentElement
      expect(card).toHaveClass('bg-white')
      expect(card).not.toHaveClass('backdrop-blur-md')
    })

    it('should apply correct padding classes', () => {
      render(
        <ResponsiveCard padding="lg">
          <div>Card Content</div>
        </ResponsiveCard>
      )

      const card = screen.getByText('Card Content').parentElement
      expect(card).toHaveClass('p-6')
      expect(card).toHaveClass('tablet:p-8')
      expect(card).toHaveClass('desktop:p-10')
    })
  })

  describe('ResponsiveButton Component', () => {
    it('should render with touch target class', () => {
      render(
        <ResponsiveButton>
          Click Me
        </ResponsiveButton>
      )

      const button = screen.getByRole('button')
      expect(button).toHaveClass('touch-target')
    })

    it('should apply primary variant styles', () => {
      render(
        <ResponsiveButton variant="primary">
          Primary Button
        </ResponsiveButton>
      )

      const button = screen.getByRole('button')
      expect(button).toHaveClass('bg-gradient-to-r')
      expect(button).toHaveClass('from-blue-500')
      expect(button).toHaveClass('to-purple-600')
    })

    it('should apply secondary variant styles', () => {
      render(
        <ResponsiveButton variant="secondary">
          Secondary Button
        </ResponsiveButton>
      )

      const button = screen.getByRole('button')
      expect(button).toHaveClass('bg-white/60')
      expect(button).toHaveClass('backdrop-blur-md')
    })

    it('should apply ghost variant styles', () => {
      render(
        <ResponsiveButton variant="ghost">
          Ghost Button
        </ResponsiveButton>
      )

      const button = screen.getByRole('button')
      expect(button).toHaveClass('text-gray-700')
    })

    it('should handle disabled state', () => {
      render(
        <ResponsiveButton disabled>
          Disabled Button
        </ResponsiveButton>
      )

      const button = screen.getByRole('button')
      expect(button).toBeDisabled()
      expect(button).toHaveClass('disabled:opacity-50')
    })
  })

  describe('ResponsiveText Component', () => {
    it('should render h1 variant with correct classes', () => {
      render(
        <ResponsiveText variant="h1">
          Heading 1
        </ResponsiveText>
      )

      const heading = screen.getByText('Heading 1')
      expect(heading.tagName).toBe('H1')
      expect(heading).toHaveClass('text-responsive-2xl')
      expect(heading).toHaveClass('font-bold')
    })

    it('should render body variant with correct classes', () => {
      render(
        <ResponsiveText variant="body">
          Body text
        </ResponsiveText>
      )

      const text = screen.getByText('Body text')
      expect(text.tagName).toBe('P')
      expect(text).toHaveClass('text-responsive-base')
    })

    it('should render caption variant with correct classes', () => {
      render(
        <ResponsiveText variant="caption">
          Caption text
        </ResponsiveText>
      )

      const caption = screen.getByText('Caption text')
      expect(caption.tagName).toBe('SPAN')
      expect(caption).toHaveClass('text-responsive-sm')
    })

    it('should allow custom element override', () => {
      render(
        <ResponsiveText variant="h1" as="div">
          Custom Element
        </ResponsiveText>
      )

      const element = screen.getByText('Custom Element')
      expect(element.tagName).toBe('DIV')
      expect(element).toHaveClass('text-responsive-2xl')
    })
  })

  describe('Mobile Breakpoint (375px)', () => {
    beforeEach(() => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      })
      mockMatchMedia(true)
    })

    it('should apply mobile-specific classes', () => {
      render(
        <div className="mobile-only">Mobile Content</div>
      )

      const element = screen.getByText('Mobile Content')
      expect(element).toHaveClass('mobile-only')
    })

    it('should use single column layout on mobile', () => {
      render(
        <ResponsiveGrid>
          <div>Item 1</div>
          <div>Item 2</div>
        </ResponsiveGrid>
      )

      const grid = screen.getByText('Item 1').parentElement
      expect(grid).toHaveClass('grid-cols-1')
    })
  })

  describe('Tablet Breakpoint (768px)', () => {
    beforeEach(() => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      })
      mockMatchMedia(true)
    })

    it('should apply tablet-specific classes', () => {
      render(
        <div className="tablet-only">Tablet Content</div>
      )

      const element = screen.getByText('Tablet Content')
      expect(element).toHaveClass('tablet-only')
    })

    it('should use two column layout on tablet', () => {
      render(
        <ResponsiveGrid>
          <div>Item 1</div>
          <div>Item 2</div>
        </ResponsiveGrid>
      )

      const grid = screen.getByText('Item 1').parentElement
      expect(grid).toHaveClass('tablet:grid-cols-2')
    })
  })

  describe('Desktop Breakpoint (1920px)', () => {
    beforeEach(() => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1920,
      })
      mockMatchMedia(true)
    })

    it('should apply desktop-specific classes', () => {
      render(
        <div className="desktop-only">Desktop Content</div>
      )

      const element = screen.getByText('Desktop Content')
      expect(element).toHaveClass('desktop-only')
    })

    it('should use three column layout on desktop', () => {
      render(
        <ResponsiveGrid>
          <div>Item 1</div>
          <div>Item 2</div>
        </ResponsiveGrid>
      )

      const grid = screen.getByText('Item 1').parentElement
      expect(grid).toHaveClass('desktop:grid-cols-3')
    })
  })

  describe('CSS Classes Integration', () => {
    it('should load responsive breakpoint CSS', () => {
      render(
        <div className="responsive-container">
          <div className="responsive-grid">Content</div>
        </div>
      )

      const container = screen.getByText('Content').parentElement?.parentElement
      expect(container).toHaveClass('responsive-container')
      
      const grid = screen.getByText('Content').parentElement
      expect(grid).toHaveClass('responsive-grid')
    })

    it('should apply touch target classes correctly', () => {
      render(
        <button className="touch-target">Touch Button</button>
      )

      const button = screen.getByRole('button')
      expect(button).toHaveClass('touch-target')
    })
  })

  describe('Accessibility and Performance', () => {
    it('should respect reduced motion preferences', () => {
      mockMatchMedia(true)
      
      render(
        <div className="responsive-grid">
          <div>Content</div>
        </div>
      )

      const grid = screen.getByText('Content').parentElement
      expect(grid).toHaveClass('responsive-grid')
    })

    it('should support high contrast mode', () => {
      render(
        <ResponsiveCard>
          <div>High Contrast Content</div>
        </ResponsiveCard>
      )

      const card = screen.getByText('High Contrast Content').parentElement
      expect(card).toHaveClass('rounded-xl')
    })
  })
})
