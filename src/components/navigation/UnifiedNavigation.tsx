'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Home,
  Sparkles,
  Images,
  MessageSquare,
  Settings,
  Menu,
  X
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useNavigationMode } from '@/lib/hooks/useMediaQuery'

import '@/styles/navigation-glassmorphism.css'
import '@/styles/responsive-breakpoints.css'

interface NavigationItem {
  id: string
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string
  description?: string
  isActive?: boolean
}

interface UnifiedNavigationProps {
  className?: string
}

export function UnifiedNavigation({ className }: UnifiedNavigationProps) {
  const pathname = usePathname()
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const { isMobileMode, shouldShowOverlay } = useNavigationMode()

  // Calculate sidebar transform based on responsive mode
  const getSidebarTransform = () => {
    if (!isMobileMode) return 0 // Desktop: always visible
    return isMobileOpen ? 0 : '-100%' // Mobile: controlled by state
  }

  // Define navigation structure based on research insights
  const navigationItems: NavigationItem[] = [
    {
      id: 'dashboard',
      name: 'Dashboard',
      href: '/dashboard',
      icon: Home,
      description: 'Overview and analytics'
    },
    {
      id: 'generator',
      name: 'Generator',
      href: '/generator',
      icon: Sparkles,
      description: 'AI content generation'
    },
    {
      id: 'gallery',
      name: 'Gallery',
      href: '/gallery',
      icon: Images,
      description: 'Browse and manage creations'
    },
    {
      id: 'chat',
      name: 'Chat',
      href: '/chat',
      icon: MessageSquare,
      description: 'AI assistant and editing'
    },
    {
      id: 'settings',
      name: 'Settings',
      href: '/settings',
      icon: Settings,
      description: 'Account and preferences'
    }
  ]

  const isItemActive = (item: NavigationItem): boolean => {
    if (item.href === pathname) return true
    return pathname.startsWith(item.href) && item.href !== '/'
  }

  const renderNavigationItem = (item: NavigationItem) => {
    const isActive = isItemActive(item)
    const IconComponent = item.icon

    return (
      <Link
        key={item.id}
        href={item.href}
        onClick={() => setIsMobileOpen(false)}
        className={cn(
          "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
          isActive
            ? "nav-glass-active text-blue-600 dark:text-blue-400"
            : "nav-glass-interactive text-gray-700 dark:text-gray-300"
        )}
      >
        <IconComponent className="w-5 h-5" />
        <span>{item.name}</span>
        {item.badge && (
          <span className="nav-badge-glass px-2 py-0.5 text-xs text-blue-600 dark:text-blue-400 rounded-full">
            {item.badge}
          </span>
        )}
      </Link>
    )
  }

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="tablet:hidden nav-mobile-trigger nav-glass-secondary rounded-lg touch-target"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="tablet:hidden fixed inset-0 nav-mobile-overlay z-40"
            onClick={() => setIsMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Navigation Sidebar */}
      <motion.aside
        initial={false}
        animate={{
          x: getSidebarTransform()
        }}
        className={cn(
          "nav-responsive nav-glass-primary border-r border-gray-200/50 dark:border-gray-700/50",
          isMobileOpen && "open",
          className
        )}
        style={{
          // Ensure proper containment and prevent overflow
          contain: 'layout style paint',
          willChange: isMobileMode ? 'transform' : 'auto'
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b nav-divider-glass">
          <div className="flex items-center gap-3">
            <div className="nav-brand-glass w-8 h-8 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold text-gray-900 dark:text-white">Minu.AI</span>
          </div>
          
          <button
            onClick={() => setIsMobileOpen(false)}
            className="lg:hidden p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Content */}
        <div className="flex flex-col h-full overflow-y-auto">
          {/* Unified Navigation - All items together */}
          <nav className="flex-1 p-4 space-y-2 min-h-0">
            <div className="space-y-1">
              {navigationItems.map(item => renderNavigationItem(item))}
            </div>
          </nav>
        </div>
      </motion.aside>
    </>
  )
}
