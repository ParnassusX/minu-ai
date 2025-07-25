/**
 * Test suite for Unified Navigation System
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { usePathname } from 'next/navigation'
import { UnifiedNavigation } from '../UnifiedNavigation'
import { TopNavigation } from '../TopNavigation'
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
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>
  },
  AnimatePresence: ({ children }: any) => children
}))

describe('UnifiedNavigation', () => {
  const mockSetMode = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    ;(usePathname as jest.Mock).mockReturnValue('/dashboard')
    ;(useCurrentMode as jest.Mock).mockReturnValue('images')
    ;(useSetMode as jest.Mock).mockReturnValue(mockSetMode)
  })

  describe('Navigation Structure', () => {
    it('should render primary navigation items', () => {
      render(<UnifiedNavigation />)
      
      expect(screen.getByText('Dashboard')).toBeInTheDocument()
      expect(screen.getByText('Generator')).toBeInTheDocument()
      expect(screen.getByText('Gallery')).toBeInTheDocument()
      expect(screen.getByText('Chat')).toBeInTheDocument()
    })

    it('should render Minu.AI branding', () => {
      render(<UnifiedNavigation />)
      
      expect(screen.getByText('Minu.AI')).toBeInTheDocument()
    })

    it('should render settings in secondary navigation', () => {
      render(<UnifiedNavigation />)
      
      expect(screen.getByText('Settings')).toBeInTheDocument()
    })
  })

  describe('Active State Management', () => {
    it('should highlight active page', () => {
      ;(usePathname as jest.Mock).mockReturnValue('/generator')
      render(<UnifiedNavigation />)
      
      const generatorLink = screen.getByText('Generator').closest('button')
      expect(generatorLink).toHaveClass('bg-blue-500/10', 'text-blue-600')
    })

    it('should show active mode badge', () => {
      ;(useCurrentMode as jest.Mock).mockReturnValue('video')
      render(<UnifiedNavigation />)
      
      // Expand generator section first
      const generatorButton = screen.getByText('Generator')
      fireEvent.click(generatorButton)
      
      expect(screen.getByText('Active')).toBeInTheDocument()
    })
  })

  describe('Expandable Sections', () => {
    it('should expand generator section by default', () => {
      render(<UnifiedNavigation />)
      
      expect(screen.getByText('Images')).toBeInTheDocument()
      expect(screen.getByText('Video')).toBeInTheDocument()
      expect(screen.getByText('Enhance')).toBeInTheDocument()
    })

    it('should toggle section expansion', () => {
      render(<UnifiedNavigation />)
      
      const generatorButton = screen.getByText('Generator')
      
      // Should be expanded by default
      expect(screen.getByText('Images')).toBeInTheDocument()
      
      // Click to collapse
      fireEvent.click(generatorButton)
      
      // Should be collapsed (items not visible)
      waitFor(() => {
        expect(screen.queryByText('Images')).not.toBeInTheDocument()
      })
    })

    it('should rotate chevron icon on expansion', () => {
      render(<UnifiedNavigation />)
      
      const generatorButton = screen.getByText('Generator')
      const chevron = generatorButton.parentElement?.querySelector('[data-testid="chevron"]')
      
      // Should have rotation class when expanded
      expect(chevron).toHaveClass('rotate-90')
    })
  })

  describe('Mobile Responsiveness', () => {
    it('should render mobile menu button', () => {
      render(<UnifiedNavigation />)
      
      const mobileButton = screen.getByRole('button', { name: /menu/i })
      expect(mobileButton).toBeInTheDocument()
      expect(mobileButton).toHaveClass('lg:hidden')
    })

    it('should open mobile overlay on menu click', () => {
      render(<UnifiedNavigation />)
      
      const mobileButton = screen.getByRole('button', { name: /menu/i })
      fireEvent.click(mobileButton)
      
      // Check for overlay
      const overlay = screen.getByRole('generic', { hidden: true })
      expect(overlay).toHaveClass('bg-black/50')
    })

    it('should close mobile menu on navigation', () => {
      render(<UnifiedNavigation />)
      
      // Open mobile menu
      const mobileButton = screen.getByRole('button', { name: /menu/i })
      fireEvent.click(mobileButton)
      
      // Click navigation item
      const dashboardLink = screen.getByText('Dashboard')
      fireEvent.click(dashboardLink)
      
      // Menu should close (overlay should not be visible)
      waitFor(() => {
        expect(screen.queryByRole('generic', { hidden: true })).not.toBeInTheDocument()
      })
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<UnifiedNavigation />)
      
      const navigation = screen.getByRole('navigation')
      expect(navigation).toBeInTheDocument()
    })

    it('should support keyboard navigation', () => {
      render(<UnifiedNavigation />)
      
      const dashboardLink = screen.getByText('Dashboard')
      dashboardLink.focus()
      
      expect(document.activeElement).toBe(dashboardLink)
    })

    it('should have proper button roles for expandable sections', () => {
      render(<UnifiedNavigation />)
      
      const generatorButton = screen.getByText('Generator').closest('button')
      expect(generatorButton).toHaveAttribute('role', 'button')
    })
  })
})

describe('TopNavigation', () => {
  const mockSetMode = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    ;(usePathname as jest.Mock).mockReturnValue('/generator')
    ;(useCurrentMode as jest.Mock).mockReturnValue('images')
    ;(useSetMode as jest.Mock).mockReturnValue(mockSetMode)
  })

  describe('Page Title and Breadcrumbs', () => {
    it('should display correct page title', () => {
      render(<TopNavigation />)
      
      expect(screen.getByText('AI Generator')).toBeInTheDocument()
    })

    it('should generate breadcrumbs from pathname', () => {
      ;(usePathname as jest.Mock).mockReturnValue('/generator/settings')
      render(<TopNavigation />)
      
      expect(screen.getByText('Generator')).toBeInTheDocument()
      expect(screen.getByText('Settings')).toBeInTheDocument()
    })
  })

  describe('Mode Selector', () => {
    it('should render mode selector when enabled', () => {
      render(<TopNavigation showModeSelector={true} />)
      
      expect(screen.getByText('🎨')).toBeInTheDocument() // Images icon
      expect(screen.getByText('🎬')).toBeInTheDocument() // Video icon
      expect(screen.getByText('✨')).toBeInTheDocument() // Enhance icon
    })

    it('should not render mode selector when disabled', () => {
      render(<TopNavigation showModeSelector={false} />)
      
      expect(screen.queryByText('🎨')).not.toBeInTheDocument()
    })

    it('should highlight active mode', () => {
      ;(useCurrentMode as jest.Mock).mockReturnValue('video')
      render(<TopNavigation showModeSelector={true} />)
      
      const videoButton = screen.getByText('Video').closest('button')
      expect(videoButton).toHaveClass('bg-white', 'dark:bg-gray-700')
    })

    it('should call setMode on mode change', () => {
      render(<TopNavigation showModeSelector={true} />)
      
      const videoButton = screen.getByText('Video')
      fireEvent.click(videoButton)
      
      expect(mockSetMode).toHaveBeenCalledWith('video')
    })
  })

  describe('Search Functionality', () => {
    it('should render search when enabled', () => {
      render(<TopNavigation showSearch={true} />)
      
      const searchInput = screen.getByPlaceholderText('Search...')
      expect(searchInput).toBeInTheDocument()
    })

    it('should not render search when disabled', () => {
      render(<TopNavigation showSearch={false} />)
      
      expect(screen.queryByPlaceholderText('Search...')).not.toBeInTheDocument()
    })
  })

  describe('User Menu', () => {
    it('should render user menu button', () => {
      render(<TopNavigation />)
      
      const userButton = screen.getByRole('button', { name: /user/i })
      expect(userButton).toBeInTheDocument()
    })

    it('should toggle user dropdown on click', () => {
      render(<TopNavigation />)
      
      const userButton = screen.getByRole('button', { name: /user/i })
      fireEvent.click(userButton)
      
      expect(screen.getByText('Settings')).toBeInTheDocument()
      expect(screen.getByText('Sign Out')).toBeInTheDocument()
    })
  })

  describe('Notifications', () => {
    it('should render notification bell when enabled', () => {
      render(<TopNavigation showNotifications={true} />)
      
      const notificationButton = screen.getByRole('button', { name: /notification/i })
      expect(notificationButton).toBeInTheDocument()
    })

    it('should show notification indicator', () => {
      render(<TopNavigation showNotifications={true} />)
      
      const indicator = screen.getByRole('generic', { hidden: true })
      expect(indicator).toHaveClass('bg-red-500')
    })
  })
})
