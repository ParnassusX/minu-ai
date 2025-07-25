export type WebSocketMessageType = 
  | 'generation_progress'
  | 'gallery_update'
  | 'notification'
  | 'user_presence'
  | 'system_status'
  | 'connection_ack'
  | 'ping'
  | 'pong'

export type GenerationStatus = 
  | 'queued'
  | 'initializing'
  | 'processing'
  | 'post_processing'
  | 'completed'
  | 'failed'
  | 'cancelled'

export type NotificationLevel = 'info' | 'success' | 'warning' | 'error'

export type GalleryUpdateAction = 
  | 'image_added'
  | 'image_deleted'
  | 'image_updated'
  | 'folder_created'
  | 'folder_updated'
  | 'folder_deleted'
  | 'batch_operation_completed'

export interface WebSocketMessage {
  id: string
  type: WebSocketMessageType
  userId: string
  timestamp: string
  data: any
}

export interface GenerationProgressData {
  generationId: string
  status: GenerationStatus
  progress: number // 0-100
  estimatedTime?: number
  currentStep?: string
  queuePosition?: number
  totalInQueue?: number
  error?: string
  cost?: number
  model?: string
  prompt?: string
}

export interface GalleryUpdateData {
  action: GalleryUpdateAction
  imageId?: string
  folderId?: string
  batchOperationId?: string
  affectedCount?: number
  data: any
}

export interface NotificationData {
  id: string
  title: string
  message: string
  level: NotificationLevel
  persistent?: boolean
  actionUrl?: string
  actionText?: string
  metadata?: Record<string, any>
}

export interface UserPresenceData {
  userId: string
  username: string
  avatar?: string
  status: 'online' | 'away' | 'busy' | 'offline'
  currentPage?: string
  lastSeen: string
}

export interface SystemStatusData {
  status: 'operational' | 'degraded' | 'maintenance' | 'outage'
  message?: string
  affectedServices?: string[]
  estimatedResolution?: string
}

export interface ConnectionAckData {
  connectionId: string
  userId: string
  serverTime: string
  features: string[]
}

// WebSocket connection states
export type WebSocketConnectionState = 
  | 'connecting'
  | 'connected'
  | 'disconnected'
  | 'reconnecting'
  | 'error'

export interface WebSocketConnectionInfo {
  state: WebSocketConnectionState
  connectionId?: string
  lastConnected?: Date
  reconnectAttempts: number
  error?: string
}

// Client-side WebSocket configuration
export interface WebSocketConfig {
  url: string
  reconnectInterval: number
  maxReconnectAttempts: number
  heartbeatInterval: number
  messageTimeout: number
  enableLogging: boolean
}

// WebSocket event handlers
export interface WebSocketEventHandlers {
  onGenerationProgress?: (data: GenerationProgressData) => void
  onGalleryUpdate?: (data: GalleryUpdateData) => void
  onNotification?: (data: NotificationData) => void
  onUserPresence?: (data: UserPresenceData) => void
  onSystemStatus?: (data: SystemStatusData) => void
  onConnectionChange?: (info: WebSocketConnectionInfo) => void
  onError?: (error: Error) => void
}

// Generation tracking
export interface GenerationTracker {
  id: string
  status: GenerationStatus
  progress: number
  startTime: Date
  estimatedTime?: number
  currentStep?: string
  queuePosition?: number
  error?: string
  metadata?: Record<string, any>
}

// Real-time gallery state
export interface RealTimeGalleryState {
  isConnected: boolean
  pendingUpdates: GalleryUpdateData[]
  lastUpdateTime?: Date
  syncStatus: 'synced' | 'syncing' | 'error'
}

// Notification state
export interface NotificationState {
  notifications: NotificationData[]
  unreadCount: number
  lastNotificationTime?: Date
}

// User presence state
export interface PresenceState {
  currentUser?: UserPresenceData
  otherUsers: UserPresenceData[]
  totalOnlineUsers: number
}

// System status state
export interface SystemState {
  status: SystemStatusData
  lastStatusUpdate?: Date
  maintenanceMode: boolean
}

// Utility functions
export const createWebSocketMessage = (
  type: WebSocketMessageType,
  userId: string,
  data: any
): WebSocketMessage => ({
  id: crypto.randomUUID(),
  type,
  userId,
  timestamp: new Date().toISOString(),
  data
})

export const isWebSocketMessage = (obj: any): obj is WebSocketMessage => {
  return obj && 
    typeof obj.id === 'string' &&
    typeof obj.type === 'string' &&
    typeof obj.userId === 'string' &&
    typeof obj.timestamp === 'string' &&
    obj.data !== undefined
}

export const getDefaultWebSocketConfig = (): WebSocketConfig => ({
  url: process.env.NODE_ENV === 'production' 
    ? 'wss://your-domain.com/api/websocket'
    : 'ws://localhost:3000/api/websocket',
  reconnectInterval: 1000,
  maxReconnectAttempts: 10,
  heartbeatInterval: 30000,
  messageTimeout: 5000,
  enableLogging: process.env.NODE_ENV === 'development'
})

export const formatGenerationProgress = (data: GenerationProgressData): string => {
  if (data.status === 'queued') {
    return `Queued (${data.queuePosition}/${data.totalInQueue})`
  }
  if (data.status === 'processing') {
    return `${data.currentStep || 'Processing'} (${data.progress}%)`
  }
  if (data.status === 'completed') {
    return 'Completed'
  }
  if (data.status === 'failed') {
    return `Failed: ${data.error || 'Unknown error'}`
  }
  if (data.status === 'cancelled') {
    return 'Cancelled'
  }
  return data.status
}

export const formatEstimatedTime = (seconds: number): string => {
  if (seconds < 60) {
    return `${Math.round(seconds)}s`
  }
  if (seconds < 3600) {
    return `${Math.round(seconds / 60)}m`
  }
  return `${Math.round(seconds / 3600)}h`
}

export const getNotificationIcon = (level: NotificationLevel): string => {
  switch (level) {
    case 'info': return 'ℹ️'
    case 'success': return '✅'
    case 'warning': return '⚠️'
    case 'error': return '❌'
    default: return 'ℹ️'
  }
}

export const shouldReconnect = (
  state: WebSocketConnectionState,
  attempts: number,
  maxAttempts: number
): boolean => {
  return (
    (state === 'disconnected' || state === 'error') &&
    attempts < maxAttempts
  )
}
