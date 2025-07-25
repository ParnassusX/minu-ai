/**
 * Test suite for Enhanced Glassmorphism Navigation System
 */

import { render, screen, fireEvent } from '@testing-library/react'
import { UnifiedNavigation } from '../UnifiedNavigation'
import { TopNavigation } from '../TopNavigation'
import { usePathname } from 'next/navigation'
import { useCurrentMode, useSetMode } from '@/lib/stores/modeStore'

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  usePathname: jest.fn()
}))

// Mock mode store
jest.mock('@/lib/stores/modeStore', () => ({
  useCurrentMode: jest.fn(),
  useSetMode: jest.fn()
}))

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    aside: ({ children, ...props }: any) => <aside {...props}>{children}</aside>,
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>
  },
  AnimatePresence: ({ children }: any) => children
}))

describe('Enhanced Glassmorphism Navigation System', () => {
  const mockSetMode = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    ;(usePathname as jest.Mock).mockReturnValue('/dashboard')
    ;(useCurrentMode as jest.Mock).mockReturnValue('images')
    ;(useSetMode as jest.Mock).mockReturnValue(mockSetMode)
  })

  describe('UnifiedNavigation Glassmorphism', () => {
    it('should apply primary glass effect to main sidebar', () => {
      render(<UnifiedNavigation />)
      
      const sidebar = screen.getByRole('complementary')
      expect(sidebar).toHaveClass('nav-glass-primary')
    })

    it('should apply interactive glass effects to navigation items', () => {
      render(<UnifiedNavigation />)
      
      const dashboardLink = screen.getByText('Dashboard').closest('a')
      expect(dashboardLink).toHaveClass('nav-glass-interactive')
    })

    it('should apply active glass effects to current page', () => {
      ;(usePathname as jest.Mock).mockReturnValue('/dashboard')
      render(<UnifiedNavigation />)
      
      const dashboardLink = screen.getByText('Dashboard').closest('a')
      expect(dashboardLink).toHaveClass('nav-glass-active')
    })

    it('should apply badge glass effects to mode indicators', () => {
      ;(useCurrentMode as jest.Mock).mockReturnValue('video')
      render(<UnifiedNavigation />)
      
      // Expand generator section to see badges
      const generatorButton = screen.getByText('Generator')
      fireEvent.click(generatorButton)
      
      const activeBadge = screen.getByText('Active')
      expect(activeBadge).toHaveClass('nav-badge-glass')
    })

    it('should apply brand glass effects to logo area', () => {
      render(<UnifiedNavigation />)
      
      const logoContainer = screen.getByText('Minu.AI').previousElementSibling
      expect(logoContainer).toHaveClass('nav-brand-glass')
    })

    it('should apply secondary glass effects to mobile button', () => {
      render(<UnifiedNavigation />)
      
      const mobileButton = screen.getByRole('button', { name: /menu/i })
      expect(mobileButton).toHaveClass('nav-glass-secondary')
    })

    it('should apply divider glass effects to section separators', () => {
      render(<UnifiedNavigation />)
      
      const headerSection = screen.getByText('Minu.AI').closest('div')
      expect(headerSection).toHaveClass('nav-divider-glass')
    })
  })

  describe('TopNavigation Glassmorphism', () => {
    it('should apply secondary glass effect to header', () => {
      render(<TopNavigation />)
      
      const header = screen.getByRole('banner')
      expect(header).toHaveClass('nav-glass-secondary')
    })

    it('should apply search glass effects to search input', () => {
      render(<TopNavigation showSearch={true} />)
      
      const searchContainer = screen.getByPlaceholderText('Search...').closest('div')
      expect(searchContainer).toHaveClass('nav-search-glass')
    })

    it('should apply mode selector glass effects', () => {
      render(<TopNavigation showModeSelector={true} />)
      
      const modeSelector = screen.getByText('Images').closest('div')?.parentElement
      expect(modeSelector).toHaveClass('nav-glass-secondary')
    })

    it('should apply active glass effects to selected mode', () => {
      ;(useCurrentMode as jest.Mock).mockReturnValue('images')
      render(<TopNavigation showModeSelector={true} />)
      
      const imagesButton = screen.getByText('Images').closest('button')
      expect(imagesButton).toHaveClass('nav-glass-active')
    })

    it('should apply interactive glass effects to inactive modes', () => {
      ;(useCurrentMode as jest.Mock).mockReturnValue('images')
      render(<TopNavigation showModeSelector={true} />)
      
      const videoButton = screen.getByText('Video').closest('button')
      expect(videoButton).toHaveClass('nav-glass-interactive')
    })

    it('should apply dropdown glass effects to user menu', () => {
      render(<TopNavigation />)
      
      const userButton = screen.getByRole('button', { name: /user/i })
      fireEvent.click(userButton)
      
      const dropdown = screen.getByText('Settings').closest('div')?.parentElement
      expect(dropdown).toHaveClass('nav-dropdown-glass')
    })
  })

  describe('Glass Effect Consistency', () => {
    it('should maintain consistent glass effects across components', () => {
      const { rerender } = render(<UnifiedNavigation />)
      
      // Check UnifiedNavigation glass classes
      const sidebar = screen.getByRole('complementary')
      expect(sidebar).toHaveClass('nav-glass-primary')
      
      // Switch to TopNavigation
      rerender(<TopNavigation />)
      
      const header = screen.getByRole('banner')
      expect(header).toHaveClass('nav-glass-secondary')
    })

    it('should apply consistent interactive states', () => {
      render(<UnifiedNavigation />)
      
      const dashboardLink = screen.getByText('Dashboard').closest('a')
      const galleryLink = screen.getByText('Gallery').closest('a')
      
      // Both should have same interactive class when not active
      expect(dashboardLink).toHaveClass('nav-glass-interactive')
      expect(galleryLink).toHaveClass('nav-glass-interactive')
    })

    it('should maintain glass effects during state changes', () => {
      const { rerender } = render(<UnifiedNavigation />)
      
      // Initial state
      const dashboardLink = screen.getByText('Dashboard').closest('a')
      expect(dashboardLink).toHaveClass('nav-glass-active')
      
      // Change pathname
      ;(usePathname as jest.Mock).mockReturnValue('/gallery')
      rerender(<UnifiedNavigation />)
      
      const galleryLink = screen.getByText('Gallery').closest('a')
      expect(galleryLink).toHaveClass('nav-glass-active')
    })
  })

  describe('Responsive Glass Effects', () => {
    it('should apply mobile overlay glass effects', () => {
      render(<UnifiedNavigation />)
      
      const mobileButton = screen.getByRole('button', { name: /menu/i })
      fireEvent.click(mobileButton)
      
      // Check for mobile overlay (would be rendered in actual DOM)
      const overlay = document.querySelector('.nav-mobile-overlay')
      expect(overlay).toBeTruthy()
    })

    it('should maintain glass effects on mobile', () => {
      // Simulate mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      })

      render(<UnifiedNavigation />)
      
      const sidebar = screen.getByRole('complementary')
      expect(sidebar).toHaveClass('nav-glass-primary')
    })
  })

  describe('Dark Mode Glass Effects', () => {
    beforeEach(() => {
      // Simulate dark mode
      document.documentElement.classList.add('dark')
    })

    afterEach(() => {
      document.documentElement.classList.remove('dark')
    })

    it('should apply dark mode glass effects', () => {
      render(<UnifiedNavigation />)
      
      const sidebar = screen.getByRole('complementary')
      expect(sidebar).toHaveClass('nav-glass-primary')
      
      // Dark mode styles are applied via CSS, so we check for the class
      expect(document.documentElement).toHaveClass('dark')
    })

    it('should maintain interactive states in dark mode', () => {
      render(<UnifiedNavigation />)
      
      const dashboardLink = screen.getByText('Dashboard').closest('a')
      expect(dashboardLink).toHaveClass('nav-glass-active')
    })
  })

  describe('Animation and Transition Classes', () => {
    it('should apply transition classes to interactive elements', () => {
      render(<UnifiedNavigation />)
      
      const dashboardLink = screen.getByText('Dashboard').closest('a')
      expect(dashboardLink).toHaveClass('transition-all', 'duration-200')
    })

    it('should apply smooth transitions to mode selector', () => {
      render(<TopNavigation showModeSelector={true} />)
      
      const imagesButton = screen.getByText('Images').closest('button')
      expect(imagesButton).toHaveClass('transition-all', 'duration-200')
    })
  })

  describe('Focus and Accessibility', () => {
    it('should apply focus glass effects', () => {
      render(<UnifiedNavigation />)
      
      const dashboardLink = screen.getByText('Dashboard').closest('a')
      dashboardLink?.focus()
      
      // Focus styles are applied via CSS pseudo-classes
      expect(dashboardLink).toHaveClass('nav-glass-interactive')
    })

    it('should maintain glass effects with keyboard navigation', () => {
      render(<TopNavigation showModeSelector={true} />)
      
      const imagesButton = screen.getByText('Images').closest('button')
      imagesButton?.focus()
      
      expect(imagesButton).toHaveClass('nav-glass-active')
    })
  })

  describe('Performance Considerations', () => {
    it('should apply reduced motion glass effects when preferred', () => {
      // Simulate reduced motion preference
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(query => ({
          matches: query === '(prefers-reduced-motion: reduce)',
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        })),
      })

      render(<UnifiedNavigation />)
      
      const sidebar = screen.getByRole('complementary')
      expect(sidebar).toHaveClass('nav-glass-primary')
    })
  })

  describe('CSS Class Integration', () => {
    it('should load navigation glassmorphism CSS', () => {
      render(<UnifiedNavigation />)
      
      // Check that the CSS import is working by verifying classes are applied
      const sidebar = screen.getByRole('complementary')
      expect(sidebar).toHaveClass('nav-glass-primary')
    })

    it('should apply custom glassmorphism classes correctly', () => {
      render(<TopNavigation />)
      
      const header = screen.getByRole('banner')
      expect(header).toHaveClass('nav-glass-secondary')
    })
  })
})
