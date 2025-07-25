'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useWebSocket } from '@/lib/hooks/useWebSocket'
import { WebSocketConnectionInfo } from '@/types/websocket'
import { useAuth } from '@/lib/auth/AuthProvider'
import { toastHelpers } from '@/lib/hooks/useToast'

interface WebSocketContextType {
  connectionInfo: WebSocketConnectionInfo
  isConnected: boolean
  connect: () => void
  disconnect: () => void
  reconnect: () => void
}

const WebSocketContext = createContext<WebSocketContextType | null>(null)

interface WebSocketProviderProps {
  children: ReactNode
  autoConnect?: boolean
  enableLogging?: boolean
}

export function WebSocketProvider({ 
  children, 
  autoConnect = true,
  enableLogging = false 
}: WebSocketProviderProps) {
  const { user, isAuthenticated } = useAuth()
  const [hasShownConnectionError, setHasShownConnectionError] = useState(false)
  const [lastConnectionState, setLastConnectionState] = useState<string>('disconnected')

  const {
    connectionInfo,
    isConnected,
    connect: wsConnect,
    disconnect: wsDisconnect
  } = useWebSocket({
    config: {
      enableLogging,
      reconnectInterval: 2000,
      maxReconnectAttempts: 5,
      heartbeatInterval: 30000
    },
    autoConnect: false // We'll handle connection manually
  })

  // Handle connection state changes
  useEffect(() => {
    if (connectionInfo.state !== lastConnectionState) {
      setLastConnectionState(connectionInfo.state)

      switch (connectionInfo.state) {
        case 'connected':
          if (hasShownConnectionError) {
            toastHelpers.success('Connected!', 'Real-time features are now available')
            setHasShownConnectionError(false)
          }
          break

        case 'disconnected':
          if (lastConnectionState === 'connected') {
            toastHelpers.warning('Disconnected', 'Real-time features are temporarily unavailable')
          }
          break

        case 'error':
          if (!hasShownConnectionError) {
            toastHelpers.error(
              'Connection Error', 
              'Unable to connect to real-time services. Some features may be limited.'
            )
            setHasShownConnectionError(true)
          }
          break

        case 'reconnecting':
          toastHelpers.info('Reconnecting...', 'Attempting to restore real-time connection')
          break
      }
    }
  }, [connectionInfo.state, lastConnectionState, hasShownConnectionError])

  // Auto-connect when user is authenticated
  useEffect(() => {
    if (autoConnect && isAuthenticated && user?.id && !isConnected) {
      connect()
    } else if (!isAuthenticated && isConnected) {
      disconnect()
    }
  }, [autoConnect, isAuthenticated, user?.id, isConnected])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isConnected) {
        wsDisconnect()
      }
    }
  }, [])

  const connect = () => {
    if (user?.id) {
      // Get auth token if available
      const authToken = localStorage.getItem('auth_token') || undefined
      wsConnect(user.id, authToken)
    }
  }

  const disconnect = () => {
    wsDisconnect()
  }

  const reconnect = () => {
    disconnect()
    setTimeout(connect, 1000)
  }

  const contextValue: WebSocketContextType = {
    connectionInfo,
    isConnected,
    connect,
    disconnect,
    reconnect
  }

  return (
    <WebSocketContext.Provider value={contextValue}>
      {children}
    </WebSocketContext.Provider>
  )
}

export function useWebSocketContext(): WebSocketContextType {
  const context = useContext(WebSocketContext)
  if (!context) {
    throw new Error('useWebSocketContext must be used within a WebSocketProvider')
  }
  return context
}

// Connection status hook for components
export function useConnectionStatus() {
  const { connectionInfo, isConnected } = useWebSocketContext()
  
  return {
    isConnected,
    state: connectionInfo.state,
    isConnecting: connectionInfo.state === 'connecting',
    isReconnecting: connectionInfo.state === 'reconnecting',
    hasError: connectionInfo.state === 'error',
    reconnectAttempts: connectionInfo.reconnectAttempts,
    lastConnected: connectionInfo.lastConnected,
    error: connectionInfo.error
  }
}

// Real-time feature availability hook
export function useRealTimeFeatures() {
  const { isConnected } = useWebSocketContext()
  
  return {
    isAvailable: isConnected,
    progressTracking: isConnected,
    gallerySync: isConnected,
    notifications: isConnected,
    userPresence: isConnected,
    systemStatus: isConnected
  }
}

// Connection management hook for admin/debug purposes
export function useConnectionManagement() {
  const { connect, disconnect, reconnect, connectionInfo } = useWebSocketContext()
  const [connectionHistory, setConnectionHistory] = useState<Array<{
    timestamp: Date
    state: string
    error?: string
  }>>([])

  useEffect(() => {
    setConnectionHistory(prev => [
      ...prev.slice(-9), // Keep last 10 entries
      {
        timestamp: new Date(),
        state: connectionInfo.state,
        error: connectionInfo.error
      }
    ])
  }, [connectionInfo.state, connectionInfo.error])

  const getConnectionStats = () => ({
    currentState: connectionInfo.state,
    reconnectAttempts: connectionInfo.reconnectAttempts,
    lastConnected: connectionInfo.lastConnected,
    connectionHistory,
    uptime: connectionInfo.lastConnected 
      ? Date.now() - connectionInfo.lastConnected.getTime()
      : 0
  })

  return {
    connect,
    disconnect,
    reconnect,
    getConnectionStats,
    connectionHistory
  }
}
