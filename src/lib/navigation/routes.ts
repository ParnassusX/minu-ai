import {
  Home,
  Sparkles,
  Images,
  Settings,
  LayoutGrid,
  Code,
  Wrench
} from 'lucide-react'
import { NavigationRoute, NavigationConfig } from '@/contexts/NavigationContext'

// Route visibility functions
const isProduction = (config: NavigationConfig) => config.environment === 'production'
const isDevelopment = (config: NavigationConfig) => config.environment === 'development'
const isAdmin = (config: NavigationConfig) => config.userRole === 'admin'
const isDeveloper = (config: NavigationConfig) => config.userRole === 'developer'
const isAdminOrDeveloper = (config: NavigationConfig) => isAdmin(config) || isDeveloper(config)

// Always visible routes
const alwaysVisible = () => true

// Hide development routes in production
const hideInProduction = (config: NavigationConfig) => !isProduction(config)

// Only show to admins and developers
const adminOrDeveloperOnly = (config: NavigationConfig) => isAdminOrDeveloper(config)

// Only show in development
const developmentOnly = (config: NavigationConfig) => isDevelopment(config)

// Primary navigation routes
export const navigationRoutes: NavigationRoute[] = [
  {
    id: 'dashboard',
    name: 'Dashboard',
    href: '/dashboard',
    icon: Home,
    category: 'primary',
    requiresAuth: true,
    visible: alwaysVisible,
    description: 'Overview and quick access to key features'
  },
  {
    id: 'generator',
    name: 'Generator',
    href: '/generator',
    icon: Sparkles,
    category: 'primary',
    requiresAuth: true,
    visible: alwaysVisible,
    description: 'AI image generation tools'
  },
  {
    id: 'gallery',
    name: 'Gallery',
    href: '/gallery',
    icon: Images,
    category: 'primary',
    requiresAuth: true,
    visible: alwaysVisible,
    description: 'Browse and manage your generated images'
  },
  // Chat route temporarily disabled
  // {
  //   id: 'chat',
  //   name: 'Chat',
  //   href: '/chat',
  //   icon: LayoutGrid,
  //   category: 'primary',
  //   requiresAuth: true,
  //   visible: alwaysVisible,
  //   description: 'AI-powered chat interface'
  // },
  {
    id: 'settings',
    name: 'Settings',
    href: '/settings',
    icon: Settings,
    category: 'secondary',
    requiresAuth: true,
    visible: alwaysVisible,
    description: 'Account and application settings'
  },
  
  // Development routes (only in development environment)
  ...(process.env.NODE_ENV === 'development' ? [
    {
      id: 'test-components',
      name: 'Component Tests',
      href: '/test/components',
      icon: Code,
      category: 'development' as const,
      requiresAuth: false,
      visible: developmentOnly,
      description: 'Component testing and development'
    }
  ] : []),
  
  // Admin-only routes
  {
    id: 'admin-dashboard',
    name: 'Admin Dashboard',
    href: '/admin',
    icon: Wrench,
    category: 'admin' as const,
    requiresAuth: true,
    visible: adminOrDeveloperOnly,
    description: 'Administrative tools and analytics'
  }
]

// Helper function to get routes by category
export function getRoutesByCategory(category: NavigationRoute['category']): NavigationRoute[] {
  return navigationRoutes.filter(route => route.category === category)
}

// Helper function to get visible routes for a given configuration
export function getVisibleRoutes(config: NavigationConfig): NavigationRoute[] {
  return navigationRoutes.filter(route => route.visible(config))
}

// Helper function to find a route by path
export function findRouteByPath(path: string): NavigationRoute | undefined {
  return navigationRoutes.find(route => {
    // Exact match
    if (route.href === path) return true
    
    // Check if path starts with route href (for nested routes)
    if (path.startsWith(route.href + '/')) return true
    
    return false
  })
}

// Helper function to get breadcrumbs for a path
export function getBreadcrumbsForPath(path: string): Array<{ label: string; href?: string }> {
  const route = findRouteByPath(path)
  if (!route) return []

  const breadcrumbs: Array<{ label: string; href?: string }> = [{ label: 'Home', href: '/dashboard' }]
  
  // Add parent routes if nested
  const pathSegments = path.split('/').filter(Boolean)
  let currentPath = ''
  
  for (const segment of pathSegments) {
    currentPath += `/${segment}`
    const segmentRoute = findRouteByPath(currentPath)
    
    if (segmentRoute && segmentRoute.href !== '/dashboard') {
      breadcrumbs.push({
        label: segmentRoute.name,
        href: currentPath === path ? undefined : currentPath
      })
    }
  }
  
  return breadcrumbs
}