'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { WebSocketManager } from '@/lib/websocket/WebSocketManager'
import {
  WebSocketConnectionInfo,
  WebSocketEventHandlers,
  WebSocketConfig,
  WebSocketMessageType,
  GenerationProgressData,
  GalleryUpdateData,
  NotificationData,
  UserPresenceData,
  SystemStatusData
} from '@/types/websocket'

interface UseWebSocketOptions {
  config?: Partial<WebSocketConfig>
  autoConnect?: boolean
  userId?: string
  authToken?: string
}

interface UseWebSocketReturn {
  connectionInfo: WebSocketConnectionInfo
  isConnected: boolean
  connect: (userId: string, authToken?: string) => void
  disconnect: () => void
  send: (type: WebSocketMessageType, data: any) => boolean
  subscribe: (handlers: Partial<WebSocketEventHandlers>) => void
}

export function useWebSocket(options: UseWebSocketOptions = {}): UseWebSocketReturn {
  const { config, autoConnect = false, userId, authToken } = options
  
  const wsManagerRef = useRef<WebSocketManager | null>(null)
  const [connectionInfo, setConnectionInfo] = useState<WebSocketConnectionInfo>({
    state: 'disconnected',
    reconnectAttempts: 0
  })

  // Initialize WebSocket manager
  useEffect(() => {
    const handlers: WebSocketEventHandlers = {
      onConnectionChange: (info) => {
        setConnectionInfo(info)
      },
      onError: (error) => {
        console.error('WebSocket error:', error)
      }
    }

    wsManagerRef.current = new WebSocketManager(config, handlers)

    return () => {
      wsManagerRef.current?.disconnect()
    }
  }, [])

  // Auto-connect if enabled
  useEffect(() => {
    if (autoConnect && userId && wsManagerRef.current) {
      wsManagerRef.current.connect(userId, authToken)
    }
  }, [autoConnect, userId, authToken])

  const connect = useCallback((userId: string, authToken?: string) => {
    wsManagerRef.current?.connect(userId, authToken)
  }, [])

  const disconnect = useCallback(() => {
    wsManagerRef.current?.disconnect()
  }, [])

  const send = useCallback((type: WebSocketMessageType, data: any): boolean => {
    return wsManagerRef.current?.send(type, data) || false
  }, [])

  const subscribe = useCallback((handlers: Partial<WebSocketEventHandlers>) => {
    wsManagerRef.current?.updateHandlers(handlers)
  }, [])

  const isConnected = connectionInfo.state === 'connected'

  return {
    connectionInfo,
    isConnected,
    connect,
    disconnect,
    send,
    subscribe
  }
}

// Specialized hook for generation progress tracking
export function useGenerationProgress() {
  const [activeGenerations, setActiveGenerations] = useState<Map<string, GenerationProgressData>>(new Map())
  const { subscribe, send, isConnected } = useWebSocket()

  useEffect(() => {
    subscribe({
      onGenerationProgress: (data: GenerationProgressData) => {
        setActiveGenerations(prev => {
          const updated = new Map(prev)
          
          if (data.status === 'completed' || data.status === 'failed' || data.status === 'cancelled') {
            // Remove completed generations after a delay
            setTimeout(() => {
              setActiveGenerations(current => {
                const newMap = new Map(current)
                newMap.delete(data.generationId)
                return newMap
              })
            }, 5000)
          }
          
          updated.set(data.generationId, data)
          return updated
        })
      }
    })
  }, [subscribe])

  const startTracking = useCallback((generationId: string) => {
    if (isConnected) {
      send('generation_progress', { action: 'subscribe', generationId })
    }
  }, [send, isConnected])

  const stopTracking = useCallback((generationId: string) => {
    if (isConnected) {
      send('generation_progress', { action: 'unsubscribe', generationId })
    }
    setActiveGenerations(prev => {
      const updated = new Map(prev)
      updated.delete(generationId)
      return updated
    })
  }, [send, isConnected])

  const cancelGeneration = useCallback((generationId: string) => {
    if (isConnected) {
      send('generation_progress', { action: 'cancel', generationId })
    }
  }, [send, isConnected])

  return {
    activeGenerations: Array.from(activeGenerations.values()),
    getGeneration: (id: string) => activeGenerations.get(id),
    startTracking,
    stopTracking,
    cancelGeneration,
    isConnected
  }
}

// Specialized hook for real-time gallery updates
export function useRealTimeGallery() {
  const [pendingUpdates, setPendingUpdates] = useState<GalleryUpdateData[]>([])
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null)
  const { subscribe, isConnected } = useWebSocket()

  useEffect(() => {
    subscribe({
      onGalleryUpdate: (data: GalleryUpdateData) => {
        setPendingUpdates(prev => [...prev, data])
        setLastUpdateTime(new Date())
      }
    })
  }, [subscribe])

  const clearPendingUpdates = useCallback(() => {
    setPendingUpdates([])
  }, [])

  const getUpdatesByType = useCallback((action: string) => {
    return pendingUpdates.filter(update => update.action === action)
  }, [pendingUpdates])

  return {
    pendingUpdates,
    lastUpdateTime,
    hasUpdates: pendingUpdates.length > 0,
    clearPendingUpdates,
    getUpdatesByType,
    isConnected
  }
}

// Specialized hook for real-time notifications
export function useRealTimeNotifications() {
  const [notifications, setNotifications] = useState<NotificationData[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const { subscribe, isConnected } = useWebSocket()

  useEffect(() => {
    subscribe({
      onNotification: (data: NotificationData) => {
        setNotifications(prev => [data, ...prev].slice(0, 50)) // Keep last 50
        setUnreadCount(prev => prev + 1)
      }
    })
  }, [subscribe])

  const markAsRead = useCallback((notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    )
    setUnreadCount(prev => Math.max(0, prev - 1))
  }, [])

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    setUnreadCount(0)
  }, [])

  const removeNotification = useCallback((notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId))
  }, [])

  const clearAll = useCallback(() => {
    setNotifications([])
    setUnreadCount(0)
  }, [])

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
    isConnected
  }
}

// Specialized hook for user presence
export function useUserPresence() {
  const [currentUser, setCurrentUser] = useState<UserPresenceData | null>(null)
  const [otherUsers, setOtherUsers] = useState<UserPresenceData[]>([])
  const { subscribe, send, isConnected } = useWebSocket()

  useEffect(() => {
    subscribe({
      onUserPresence: (data: UserPresenceData) => {
        if (data.userId === currentUser?.userId) {
          setCurrentUser(data)
        } else {
          setOtherUsers(prev => {
            const filtered = prev.filter(u => u.userId !== data.userId)
            if (data.status !== 'offline') {
              return [...filtered, data]
            }
            return filtered
          })
        }
      }
    })
  }, [subscribe, currentUser?.userId])

  const updatePresence = useCallback((status: UserPresenceData['status'], currentPage?: string) => {
    if (isConnected) {
      send('user_presence', { status, currentPage })
    }
  }, [send, isConnected])

  const totalOnlineUsers = otherUsers.filter(u => u.status === 'online').length + (currentUser?.status === 'online' ? 1 : 0)

  return {
    currentUser,
    otherUsers,
    totalOnlineUsers,
    updatePresence,
    isConnected
  }
}

// Specialized hook for system status
export function useSystemStatus() {
  const [systemStatus, setSystemStatus] = useState<SystemStatusData>({
    status: 'operational'
  })
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const { subscribe, isConnected } = useWebSocket()

  useEffect(() => {
    subscribe({
      onSystemStatus: (data: SystemStatusData) => {
        setSystemStatus(data)
        setLastUpdate(new Date())
      }
    })
  }, [subscribe])

  const isOperational = systemStatus.status === 'operational'
  const isMaintenanceMode = systemStatus.status === 'maintenance'
  const hasIssues = systemStatus.status === 'degraded' || systemStatus.status === 'outage'

  return {
    systemStatus,
    lastUpdate,
    isOperational,
    isMaintenanceMode,
    hasIssues,
    isConnected
  }
}
