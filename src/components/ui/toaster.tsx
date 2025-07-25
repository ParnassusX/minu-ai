'use client'

import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from '@/components/ui/toast'
import { StatusIndicator, ProgressRing } from '@/components/ui/professional-toast'
import { useToast } from '@/hooks/useToast'
import { CheckCircle, XCircle, AlertTriangle, Info, Loader2 } from 'lucide-react'

export function Toaster() {
  const { toasts } = useToast()

  const getToastIcon = (variant?: string) => {
    switch (variant) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-emerald-500" />
      case 'destructive':
        return <XCircle className="h-5 w-5 text-red-500" />
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-amber-500" />
      case 'info':
        return <Info className="h-5 w-5 text-blue-500" />
      case 'loading':
        return <Loader2 className="h-5 w-5 text-indigo-500 animate-spin" />
      default:
        return <Info className="h-5 w-5 text-gray-500" />
    }
  }

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, variant, ...props }) {
        return (
          <Toast key={id} variant={variant} size="default" {...props}>
            <div className="flex items-start gap-3 w-full">
              {/* Icon */}
              <div className="flex-shrink-0 mt-0.5">
                {getToastIcon(variant || 'default')}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="grid gap-1">
                  {title && (
                    <ToastTitle className="font-semibold leading-tight">
                      {title}
                    </ToastTitle>
                  )}
                  {description && (
                    <ToastDescription className="text-sm opacity-90 leading-relaxed">
                      {description}
                    </ToastDescription>
                  )}
                </div>
                {action && <div className="mt-3">{action}</div>}
              </div>
            </div>
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
