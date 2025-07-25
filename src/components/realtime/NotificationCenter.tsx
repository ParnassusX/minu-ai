'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { GlassPanel } from '@/components/ui/glass'
import { Typography } from '@/components/ui/typography'
import { useRealTimeNotifications } from '@/lib/hooks/useWebSocket'
import { NotificationData, getNotificationIcon } from '@/types/websocket'
import { 
  Bell, 
  BellOff, 
  X, 
  Check, 
  CheckCheck, 
  Trash2,
  ExternalLink,
  Clock,
  AlertCircle,
  Info,
  CheckCircle,
  XCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface NotificationCenterProps {
  className?: string
  maxHeight?: string
  showHeader?: boolean
}

export function NotificationCenter({
  className,
  maxHeight = "400px",
  showHeader = true
}: NotificationCenterProps) {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
    isConnected
  } = useRealTimeNotifications()

  const [isOpen, setIsOpen] = useState(false)

  const getNotificationLevelIcon = (level: string) => {
    switch (level) {
      case 'info':
        return <Info className="h-4 w-4 text-blue-500" />
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <Info className="h-4 w-4 text-gray-500" />
    }
  }

  const getNotificationLevelColor = (level: string) => {
    switch (level) {
      case 'info': return 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20'
      case 'success': return 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20'
      case 'warning': return 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20'
      case 'error': return 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20'
      default: return 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50'
    }
  }

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date()
    const time = new Date(timestamp)
    const diffInSeconds = Math.floor((now.getTime() - time.getTime()) / 1000)

    if (diffInSeconds < 60) return 'Just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    return `${Math.floor(diffInSeconds / 86400)}d ago`
  }

  return (
    <div className={cn("relative", className)}>
      {/* Notification Bell Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="relative"
      >
        {isConnected ? (
          <Bell className="h-5 w-5" />
        ) : (
          <BellOff className="h-5 w-5 text-gray-400" />
        )}
        
        {unreadCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs flex items-center justify-center"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Button>

      {/* Notification Panel */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Panel */}
          <GlassPanel 
            variant="elevated"
            className="absolute right-0 top-full mt-2 w-96 z-50 shadow-glass-xl"
          >
            {showHeader && (
              <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                <Typography variant="h6" color="high-contrast">
                  Notifications
                </Typography>
                
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={markAllAsRead}
                      className="text-xs"
                    >
                      <CheckCheck className="h-3 w-3 mr-1" />
                      Mark all read
                    </Button>
                  )}
                  
                  {notifications.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearAll}
                      className="text-xs text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            )}

            <ScrollArea style={{ maxHeight }}>
              <div className="p-2">
                {!isConnected && (
                  <div className="p-4 text-center">
                    <BellOff className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <Typography variant="body-sm" color="muted">
                      Real-time notifications unavailable
                    </Typography>
                  </div>
                )}

                {isConnected && notifications.length === 0 && (
                  <div className="p-4 text-center">
                    <Bell className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <Typography variant="body-sm" color="muted">
                      No notifications yet
                    </Typography>
                  </div>
                )}

                {notifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onMarkAsRead={markAsRead}
                    onRemove={removeNotification}
                    getIcon={getNotificationLevelIcon}
                    getColor={getNotificationLevelColor}
                    formatTime={formatTimeAgo}
                  />
                ))}
              </div>
            </ScrollArea>

            {/* Connection Status */}
            <div className="p-2 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  isConnected ? "bg-green-500" : "bg-red-500"
                )} />
                {isConnected ? 'Connected' : 'Disconnected'}
              </div>
            </div>
          </GlassPanel>
        </>
      )}
    </div>
  )
}

interface NotificationItemProps {
  notification: NotificationData & { read?: boolean }
  onMarkAsRead: (id: string) => void
  onRemove: (id: string) => void
  getIcon: (level: string) => React.ReactNode
  getColor: (level: string) => string
  formatTime: (timestamp: string) => string
}

function NotificationItem({
  notification,
  onMarkAsRead,
  onRemove,
  getIcon,
  getColor,
  formatTime
}: NotificationItemProps) {
  const [isHovered, setIsHovered] = useState(false)

  const handleClick = () => {
    if (!notification.read) {
      onMarkAsRead(notification.id)
    }
    
    if (notification.actionUrl) {
      window.open(notification.actionUrl, '_blank')
    }
  }

  return (
    <div
      className={cn(
        "p-3 rounded-lg border transition-all duration-200 mb-2 cursor-pointer",
        getColor(notification.level),
        !notification.read && "ring-1 ring-blue-200 dark:ring-blue-800",
        isHovered && "shadow-sm"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="flex-shrink-0 mt-0.5">
          {getIcon(notification.level)}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <Typography 
                variant="body-sm" 
                color="high-contrast" 
                className={cn(
                  "font-medium",
                  !notification.read && "font-semibold"
                )}
              >
                {notification.title}
              </Typography>
              
              <Typography variant="body-xs" color="medium-contrast" className="mt-1">
                {notification.message}
              </Typography>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1">
              {!notification.read && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    onMarkAsRead(notification.id)
                  }}
                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Check className="h-3 w-3" />
                </Button>
              )}
              
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  onRemove(notification.id)
                }}
                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Clock className="h-3 w-3" />
              {formatTime(new Date().toISOString())}
            </div>

            {notification.actionText && notification.actionUrl && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs text-blue-600 hover:text-blue-700 p-1"
                onClick={(e) => {
                  e.stopPropagation()
                  window.open(notification.actionUrl, '_blank')
                }}
              >
                {notification.actionText}
                <ExternalLink className="h-3 w-3 ml-1" />
              </Button>
            )}
          </div>

          {/* Unread Indicator */}
          {!notification.read && (
            <div className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full" />
          )}
        </div>
      </div>
    </div>
  )
}
