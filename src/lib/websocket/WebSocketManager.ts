import {
  WebSocketMessage,
  WebSocketMessageType,
  WebSocketConnectionState,
  WebSocketConnectionInfo,
  WebSocketConfig,
  WebSocketEventHandlers,
  getDefaultWebSocketConfig,
  createWebSocketMessage,
  isWebSocketMessage,
  shouldReconnect
} from '@/types/websocket'

export class WebSocketManager {
  private ws: WebSocket | null = null
  private config: WebSocketConfig
  private handlers: WebSocketEventHandlers
  private connectionInfo: WebSocketConnectionInfo
  private reconnectTimer: NodeJS.Timeout | null = null
  private heartbeatTimer: NodeJS.Timeout | null = null
  private messageQueue: WebSocketMessage[] = []
  private userId: string | null = null

  constructor(config?: Partial<WebSocketConfig>, handlers?: WebSocketEventHandlers) {
    this.config = { ...getDefaultWebSocketConfig(), ...config }
    this.handlers = handlers || {}
    this.connectionInfo = {
      state: 'disconnected',
      reconnectAttempts: 0
    }
  }

  public connect(userId: string, authToken?: string): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.log('Already connected')
      return
    }

    this.userId = userId
    this.updateConnectionState('connecting')

    try {
      const url = new URL(this.config.url)
      if (authToken) {
        url.searchParams.set('token', authToken)
      }
      url.searchParams.set('userId', userId)

      this.ws = new WebSocket(url.toString())
      this.setupEventListeners()
    } catch (error) {
      this.log('Connection error:', error)
      this.handleConnectionError(error as Error)
    }
  }

  public disconnect(): void {
    this.clearTimers()
    
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect')
      this.ws = null
    }
    
    this.updateConnectionState('disconnected')
    this.messageQueue = []
  }

  public send(type: WebSocketMessageType, data: any): boolean {
    if (!this.userId) {
      this.log('Cannot send message: no user ID')
      return false
    }

    const message = createWebSocketMessage(type, this.userId, data)
    
    if (this.ws?.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(message))
        this.log('Sent message:', message)
        return true
      } catch (error) {
        this.log('Send error:', error)
        this.queueMessage(message)
        return false
      }
    } else {
      this.queueMessage(message)
      return false
    }
  }

  public getConnectionInfo(): WebSocketConnectionInfo {
    return { ...this.connectionInfo }
  }

  public updateHandlers(handlers: Partial<WebSocketEventHandlers>): void {
    this.handlers = { ...this.handlers, ...handlers }
  }

  private setupEventListeners(): void {
    if (!this.ws) return

    this.ws.onopen = () => {
      this.log('WebSocket connected')
      this.updateConnectionState('connected')
      this.connectionInfo.lastConnected = new Date()
      this.connectionInfo.reconnectAttempts = 0
      
      this.startHeartbeat()
      this.flushMessageQueue()
    }

    this.ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data)
        if (isWebSocketMessage(message)) {
          this.handleMessage(message)
        } else {
          this.log('Invalid message format:', message)
        }
      } catch (error) {
        this.log('Message parse error:', error)
      }
    }

    this.ws.onclose = (event) => {
      this.log('WebSocket closed:', event.code, event.reason)
      this.clearTimers()
      
      if (event.code !== 1000) { // Not a normal closure
        this.handleConnectionError(new Error(`Connection closed: ${event.reason}`))
      } else {
        this.updateConnectionState('disconnected')
      }
    }

    this.ws.onerror = (error) => {
      this.log('WebSocket error:', error)
      this.handleConnectionError(new Error('WebSocket error'))
    }
  }

  private handleMessage(message: WebSocketMessage): void {
    this.log('Received message:', message)

    switch (message.type) {
      case 'connection_ack':
        this.connectionInfo.connectionId = message.data.connectionId
        break
      
      case 'ping':
        this.send('pong', { timestamp: Date.now() })
        break
      
      case 'pong':
        // Heartbeat response received
        break
      
      case 'generation_progress':
        this.handlers.onGenerationProgress?.(message.data)
        break
      
      case 'gallery_update':
        this.handlers.onGalleryUpdate?.(message.data)
        break
      
      case 'notification':
        this.handlers.onNotification?.(message.data)
        break
      
      case 'user_presence':
        this.handlers.onUserPresence?.(message.data)
        break
      
      case 'system_status':
        this.handlers.onSystemStatus?.(message.data)
        break
      
      default:
        this.log('Unknown message type:', message.type)
    }
  }

  private handleConnectionError(error: Error): void {
    this.updateConnectionState('error', error.message)
    this.handlers.onError?.(error)
    
    if (shouldReconnect(
      this.connectionInfo.state,
      this.connectionInfo.reconnectAttempts,
      this.config.maxReconnectAttempts
    )) {
      this.scheduleReconnect()
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) return

    this.updateConnectionState('reconnecting')
    
    const delay = Math.min(
      this.config.reconnectInterval * Math.pow(2, this.connectionInfo.reconnectAttempts),
      30000 // Max 30 seconds
    )

    this.log(`Reconnecting in ${delay}ms (attempt ${this.connectionInfo.reconnectAttempts + 1})`)

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null
      this.connectionInfo.reconnectAttempts++
      
      if (this.userId) {
        this.connect(this.userId)
      }
    }, delay)
  }

  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.send('ping', { timestamp: Date.now() })
      }
    }, this.config.heartbeatInterval)
  }

  private clearTimers(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
    
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = null
    }
  }

  private queueMessage(message: WebSocketMessage): void {
    this.messageQueue.push(message)
    
    // Limit queue size
    if (this.messageQueue.length > 100) {
      this.messageQueue.shift()
    }
  }

  private flushMessageQueue(): void {
    while (this.messageQueue.length > 0 && this.ws?.readyState === WebSocket.OPEN) {
      const message = this.messageQueue.shift()
      if (message) {
        try {
          this.ws.send(JSON.stringify(message))
          this.log('Sent queued message:', message)
        } catch (error) {
          this.log('Error sending queued message:', error)
          this.messageQueue.unshift(message) // Put it back
          break
        }
      }
    }
  }

  private updateConnectionState(state: WebSocketConnectionState, error?: string): void {
    this.connectionInfo.state = state
    this.connectionInfo.error = error
    this.handlers.onConnectionChange?.(this.connectionInfo)
  }

  private log(...args: any[]): void {
    if (this.config.enableLogging) {
      console.log('[WebSocketManager]', ...args)
    }
  }
}
