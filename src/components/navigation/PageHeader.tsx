'use client'

import { Button } from '@/components/ui/button'
import { useNavigation } from '@/contexts/NavigationContext'
import { Breadcrumbs } from './Breadcrumbs'
import { cn } from '@/lib/utils'

interface PageHeaderProps {
  className?: string
  showBreadcrumbs?: boolean
}

export function PageHeader({ className, showBreadcrumbs = true }: PageHeaderProps) {
  const { state } = useNavigation()
  const { pageTitle, pageActions } = state

  if (!pageTitle && !pageActions.length && !showBreadcrumbs) {
    return null
  }

  return (
    <div className={cn(
      "flex flex-col space-y-4 p-6 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm border-b border-gray-200/50 dark:border-gray-700/50",
      className
    )}>
      {showBreadcrumbs && <Breadcrumbs />}
      
      {(pageTitle || pageActions.length > 0) && (
        <div className="flex items-center justify-between">
          {pageTitle && (
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {pageTitle}
            </h1>
          )}
          
          {pageActions.length > 0 && (
            <div className="flex items-center space-x-2">
              {pageActions.map((action) => (
                <Button
                  key={action.id}
                  variant={action.variant}
                  onClick={action.action}
                  className="flex items-center space-x-2"
                >
                  <action.icon className="h-4 w-4" />
                  <span>{action.label}</span>
                </Button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}