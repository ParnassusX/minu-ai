'use client'

import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { useNavigation } from '@/contexts/NavigationContext'
import { cn } from '@/lib/utils'

interface BreadcrumbsProps {
  className?: string
}

export function Breadcrumbs({ className }: BreadcrumbsProps) {
  const { state } = useNavigation()
  const { breadcrumbs } = state

  if (breadcrumbs.length <= 1) {
    return null
  }

  return (
    <nav className={cn("flex items-center space-x-1 text-sm", className)} aria-label="Breadcrumb">
      <ol className="flex items-center space-x-1">
        {breadcrumbs.map((crumb, index) => (
          <li key={index} className="flex items-center">
            {index > 0 && (
              <ChevronRight className="h-4 w-4 text-gray-400 dark:text-gray-500 mx-1" />
            )}
            {crumb.href ? (
              <Link
                href={crumb.href}
                className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors duration-200 flex items-center"
              >
                {crumb.icon && <crumb.icon className="h-4 w-4 mr-1" />}
                {crumb.label}
              </Link>
            ) : (
              <span className="text-gray-900 dark:text-gray-100 font-medium flex items-center">
                {crumb.icon && <crumb.icon className="h-4 w-4 mr-1" />}
                {crumb.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}