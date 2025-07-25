'use client'

import { forwardRef } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Info, 
  Loader2,
  X,
  Clock,
  Zap
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { LoadingSpinner, LoadingDots } from './loading'

// Professional Toast with Icons and Progress
const professionalToastVariants = cva(
  "relative flex items-start gap-3 p-4 rounded-xl border backdrop-blur-md shadow-glass-lg transition-all duration-300 slide-up",
  {
    variants: {
      variant: {
        default: "glass-panel-elevated border-gray-200/50 bg-white/90 text-gray-900 dark:border-gray-700/50 dark:bg-gray-800/90 dark:text-gray-100",
        success: "border-emerald-200/50 bg-emerald-50/90 text-emerald-900 dark:border-emerald-800/50 dark:bg-emerald-900/20 dark:text-emerald-100",
        error: "border-red-200/50 bg-red-50/90 text-red-900 dark:border-red-800/50 dark:bg-red-900/20 dark:text-red-100",
        warning: "border-amber-200/50 bg-amber-50/90 text-amber-900 dark:border-amber-800/50 dark:bg-amber-900/20 dark:text-amber-100",
        info: "border-blue-200/50 bg-blue-50/90 text-blue-900 dark:border-blue-800/50 dark:bg-blue-900/20 dark:text-blue-100",
        loading: "border-indigo-200/50 bg-indigo-50/90 text-indigo-900 dark:border-indigo-800/50 dark:bg-indigo-900/20 dark:text-indigo-100",
      },
      size: {
        sm: "text-sm",
        default: "text-base",
        lg: "text-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

interface ProfessionalToastProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof professionalToastVariants> {
  title: string
  description?: string
  progress?: number
  showProgress?: boolean
  onClose?: () => void
  action?: React.ReactNode
  duration?: number
}

const ProfessionalToast = forwardRef<HTMLDivElement, ProfessionalToastProps>(
  ({ 
    className, 
    variant = "default", 
    size, 
    title, 
    description, 
    progress, 
    showProgress = false,
    onClose,
    action,
    ...props 
  }, ref) => {
    const icons = {
      default: Info,
      success: CheckCircle,
      error: XCircle,
      warning: AlertTriangle,
      info: Info,
      loading: Loader2,
    }

    const Icon = icons[variant || 'default']

    return (
      <div
        ref={ref}
        className={cn(professionalToastVariants({ variant, size }), className)}
        {...props}
      >
        {/* Icon */}
        <div className="flex-shrink-0 mt-0.5">
          {variant === 'loading' ? (
            <LoadingSpinner size="sm" variant="premium" />
          ) : (
            <Icon className="h-5 w-5" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className="font-semibold leading-tight">{title}</h4>
              {description && (
                <p className="mt-1 text-sm opacity-90 leading-relaxed">
                  {description}
                </p>
              )}
            </div>

            {/* Close Button */}
            {onClose && (
              <button
                onClick={onClose}
                className="flex-shrink-0 ml-3 p-1 rounded-md hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                aria-label="Close notification"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Progress Bar */}
          {showProgress && progress !== undefined && (
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="opacity-75">Progress</span>
                <span className="font-medium">{Math.round(progress)}%</span>
              </div>
              <div className="h-2 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-current rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                />
              </div>
            </div>
          )}

          {/* Action */}
          {action && (
            <div className="mt-3">
              {action}
            </div>
          )}
        </div>
      </div>
    )
  }
)
ProfessionalToast.displayName = "ProfessionalToast"

// Status Indicator Component
interface StatusIndicatorProps {
  status: 'idle' | 'loading' | 'success' | 'error' | 'warning'
  message?: string
  size?: 'sm' | 'md' | 'lg'
  showIcon?: boolean
  className?: string
}

const StatusIndicator = forwardRef<HTMLDivElement, StatusIndicatorProps>(
  ({ status, message, size = 'md', showIcon = true, className }, ref) => {
    const statusConfig = {
      idle: {
        icon: Clock,
        color: 'text-gray-500 dark:text-gray-400',
        bgColor: 'bg-gray-100 dark:bg-gray-800',
        label: 'Ready'
      },
      loading: {
        icon: Loader2,
        color: 'text-indigo-500 dark:text-indigo-400',
        bgColor: 'bg-indigo-100 dark:bg-indigo-900/20',
        label: 'Processing'
      },
      success: {
        icon: CheckCircle,
        color: 'text-emerald-500 dark:text-emerald-400',
        bgColor: 'bg-emerald-100 dark:bg-emerald-900/20',
        label: 'Success'
      },
      error: {
        icon: XCircle,
        color: 'text-red-500 dark:text-red-400',
        bgColor: 'bg-red-100 dark:bg-red-900/20',
        label: 'Error'
      },
      warning: {
        icon: AlertTriangle,
        color: 'text-amber-500 dark:text-amber-400',
        bgColor: 'bg-amber-100 dark:bg-amber-900/20',
        label: 'Warning'
      }
    }

    const config = statusConfig[status]
    const Icon = config.icon

    const sizeClasses = {
      sm: 'text-xs px-2 py-1',
      md: 'text-sm px-3 py-1.5',
      lg: 'text-base px-4 py-2'
    }

    const iconSizes = {
      sm: 'h-3 w-3',
      md: 'h-4 w-4',
      lg: 'h-5 w-5'
    }

    return (
      <div
        ref={ref}
        className={cn(
          'inline-flex items-center gap-2 rounded-full font-medium transition-all duration-200',
          config.bgColor,
          config.color,
          sizeClasses[size],
          className
        )}
      >
        {showIcon && (
          <Icon 
            className={cn(
              iconSizes[size],
              status === 'loading' && 'animate-spin'
            )} 
          />
        )}
        <span>{message || config.label}</span>
      </div>
    )
  }
)
StatusIndicator.displayName = "StatusIndicator"

// Progress Ring Component
interface ProgressRingProps {
  progress: number
  size?: number
  strokeWidth?: number
  className?: string
  showPercentage?: boolean
}

const ProgressRing = forwardRef<SVGSVGElement, ProgressRingProps>(
  ({ progress, size = 40, strokeWidth = 3, className, showPercentage = false }, ref) => {
    const radius = (size - strokeWidth) / 2
    const circumference = radius * 2 * Math.PI
    const strokeDasharray = circumference
    const strokeDashoffset = circumference - (progress / 100) * circumference

    return (
      <div className={cn('relative inline-flex items-center justify-center', className)}>
        <svg
          ref={ref}
          width={size}
          height={size}
          className="transform -rotate-90"
        >
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="none"
            className="opacity-20"
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-500 ease-out"
          />
        </svg>
        {showPercentage && (
          <span className="absolute text-xs font-semibold">
            {Math.round(progress)}%
          </span>
        )}
      </div>
    )
  }
)
ProgressRing.displayName = "ProgressRing"

export {
  ProfessionalToast,
  StatusIndicator,
  ProgressRing,
  professionalToastVariants,
}
