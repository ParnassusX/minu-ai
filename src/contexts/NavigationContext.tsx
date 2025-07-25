'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { LucideIcon } from 'lucide-react'
import { navigationRoutes, getVisibleRoutes, getBreadcrumbsForPath } from '@/lib/navigation/routes'

// Navigation route interface
export interface NavigationRoute {
  id: string
  name: string
  href: string
  icon: LucideIcon
  category: 'primary' | 'secondary' | 'admin' | 'development'
  requiresAuth: boolean
  visible: (config: NavigationConfig) => boolean
  description?: string
}

// Navigation configuration interface
export interface NavigationConfig {
  routes: NavigationRoute[]
  currentPath: string
  userRole: 'user' | 'admin' | 'developer'
  environment: 'development' | 'production'
}

// Navigation state interface
export interface NavigationState {
  currentRoute: string
  sidebarOpen: boolean
  sidePanelOpen: boolean
  breadcrumbs: BreadcrumbItem[]
  pageTitle: string
  pageActions: PageAction[]
}

export interface BreadcrumbItem {
  label: string
  href?: string
  icon?: LucideIcon
}

export interface PageAction {
  id: string
  label: string
  icon: LucideIcon
  action: () => void
  variant: 'default' | 'secondary' | 'ghost' | 'premium' | 'outline' | 'destructive'
}

// Navigation context interface
interface NavigationContextType {
  config: NavigationConfig
  state: NavigationState
  visibleRoutes: NavigationRoute[]
  updatePageTitle: (title: string) => void
  updateBreadcrumbs: (breadcrumbs: BreadcrumbItem[]) => void
  updatePageActions: (actions: PageAction[]) => void
  setSidebarOpen: (open: boolean) => void
  setSidePanelOpen: (open: boolean) => void
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined)

// Hook to use navigation context
export function useNavigation() {
  const context = useContext(NavigationContext)
  if (context === undefined) {
    throw new Error('useNavigation must be used within a NavigationProvider')
  }
  return context
}

// Navigation provider props
interface NavigationProviderProps {
  children: React.ReactNode
  userRole?: 'user' | 'admin' | 'developer'
}

export function NavigationProvider({ 
  children, 
  userRole = 'user' 
}: NavigationProviderProps) {
  const pathname = usePathname()
  const environment = process.env.NODE_ENV as 'development' | 'production'

  // Navigation state
  const [state, setState] = useState<NavigationState>({
    currentRoute: pathname,
    sidebarOpen: false,
    sidePanelOpen: false,
    breadcrumbs: [],
    pageTitle: '',
    pageActions: []
  })

  // Update current route when pathname changes
  useEffect(() => {
    setState(prev => ({ ...prev, currentRoute: pathname }))
  }, [pathname])

  // Navigation configuration
  const config: NavigationConfig = {
    routes: navigationRoutes,
    currentPath: pathname,
    userRole,
    environment
  }

  // Filter visible routes based on configuration
  const visibleRoutes = getVisibleRoutes(config)

  // Auto-update breadcrumbs when route changes
  useEffect(() => {
    const breadcrumbs = getBreadcrumbsForPath(pathname)
    setState(prev => ({ ...prev, breadcrumbs }))
  }, [pathname])

  // Context methods
  const updatePageTitle = (title: string) => {
    setState(prev => ({ ...prev, pageTitle: title }))
  }

  const updateBreadcrumbs = (breadcrumbs: BreadcrumbItem[]) => {
    setState(prev => ({ ...prev, breadcrumbs }))
  }

  const updatePageActions = (actions: PageAction[]) => {
    setState(prev => ({ ...prev, pageActions: actions }))
  }

  const setSidebarOpen = (open: boolean) => {
    setState(prev => ({ ...prev, sidebarOpen: open }))
  }

  const setSidePanelOpen = (open: boolean) => {
    setState(prev => ({ ...prev, sidePanelOpen: open }))
  }

  const contextValue: NavigationContextType = {
    config,
    state,
    visibleRoutes,
    updatePageTitle,
    updateBreadcrumbs,
    updatePageActions,
    setSidebarOpen,
    setSidePanelOpen
  }

  return (
    <NavigationContext.Provider value={contextValue}>
      {children}
    </NavigationContext.Provider>
  )
}