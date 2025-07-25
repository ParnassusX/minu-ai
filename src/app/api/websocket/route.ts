import { NextRequest } from 'next/server'
import { WebSocketServer, WebSocket } from 'ws'
import { IncomingMessage } from 'http'
import { parse } from 'url'
import { verify } from 'jsonwebtoken'
import {
  WebSocketMessage,
  WebSocketMessageType,
  isWebSocketMessage,
  createWebSocketMessage
} from '@/types/websocket'

// Global WebSocket server instance
let wss: WebSocketServer | null = null

// Connection management
interface ClientConnection {
  ws: WebSocket
  userId: string
  connectionId: string
  lastPing: Date
  subscriptions: Set<string>
}

const connections = new Map<string, ClientConnection>()
const userConnections = new Map<string, Set<string>>() // userId -> Set of connectionIds

// Initialize WebSocket server
function initializeWebSocketServer() {
  if (wss) return wss

  // Only initialize WebSocket server in development mode
  if (process.env.NODE_ENV !== 'development') {
    console.log('WebSocket server disabled in production mode')
    return null
  }

  try {
    wss = new WebSocketServer({
      port: 8081, // Changed from 8080 to avoid conflicts
      path: '/api/websocket'
    })

    wss.on('connection', handleConnection)
    wss.on('error', (error) => {
      console.error('WebSocket server error:', error)
    })

    console.log('WebSocket server initialized on port 8081')
    return wss
  } catch (error) {
    console.warn('Failed to initialize WebSocket server:', error)
    return null
  }
}

function handleConnection(ws: WebSocket, request: IncomingMessage) {
  const url = parse(request.url || '', true)
  const userId = url.query.userId as string
  const token = url.query.token as string

  if (!userId) {
    ws.close(1008, 'User ID required')
    return
  }

  // Verify authentication token if provided
  if (token) {
    try {
      const decoded = verify(token, process.env.JWT_SECRET || 'fallback-secret')
      // Additional token validation can be added here
    } catch (error) {
      ws.close(1008, 'Invalid authentication token')
      return
    }
  }

  const connectionId = crypto.randomUUID()
  const connection: ClientConnection = {
    ws,
    userId,
    connectionId,
    lastPing: new Date(),
    subscriptions: new Set()
  }

  // Store connection
  connections.set(connectionId, connection)
  
  if (!userConnections.has(userId)) {
    userConnections.set(userId, new Set())
  }
  userConnections.get(userId)!.add(connectionId)

  console.log(`WebSocket connected: ${userId} (${connectionId})`)

  // Send connection acknowledgment
  sendToConnection(connectionId, 'connection_ack', {
    connectionId,
    userId,
    serverTime: new Date().toISOString(),
    features: ['generation_progress', 'gallery_updates', 'notifications', 'user_presence']
  })

  // Set up event handlers
  ws.on('message', (data) => handleMessage(connectionId, data))
  ws.on('close', () => handleDisconnection(connectionId))
  ws.on('error', (error) => handleConnectionError(connectionId, error))

  // Start heartbeat
  startHeartbeat(connectionId)
}

function handleMessage(connectionId: string, data: any) {
  const connection = connections.get(connectionId)
  if (!connection) return

  try {
    const message = JSON.parse(data.toString())
    
    if (!isWebSocketMessage(message)) {
      console.error('Invalid message format:', message)
      return
    }

    console.log(`Message from ${connection.userId}:`, message.type)

    switch (message.type) {
      case 'ping':
        connection.lastPing = new Date()
        sendToConnection(connectionId, 'pong', { timestamp: Date.now() })
        break

      case 'generation_progress':
        handleGenerationProgressMessage(connectionId, message.data)
        break

      case 'user_presence':
        handleUserPresenceMessage(connectionId, message.data)
        break

      default:
        console.log('Unhandled message type:', message.type)
    }
  } catch (error) {
    console.error('Error handling message:', error)
  }
}

function handleGenerationProgressMessage(connectionId: string, data: any) {
  const connection = connections.get(connectionId)
  if (!connection) return

  switch (data.action) {
    case 'subscribe':
      if (data.generationId) {
        connection.subscriptions.add(`generation:${data.generationId}`)
        console.log(`${connection.userId} subscribed to generation ${data.generationId}`)
      }
      break

    case 'unsubscribe':
      if (data.generationId) {
        connection.subscriptions.delete(`generation:${data.generationId}`)
        console.log(`${connection.userId} unsubscribed from generation ${data.generationId}`)
      }
      break

    case 'cancel':
      if (data.generationId) {
        // Implement generation cancellation logic here
        broadcastToSubscribers(`generation:${data.generationId}`, 'generation_progress', {
          generationId: data.generationId,
          status: 'cancelled',
          progress: 0
        })
      }
      break
  }
}

function handleUserPresenceMessage(connectionId: string, data: any) {
  const connection = connections.get(connectionId)
  if (!connection) return

  const presenceData = {
    userId: connection.userId,
    username: data.username || connection.userId,
    status: data.status || 'online',
    currentPage: data.currentPage,
    lastSeen: new Date().toISOString()
  }

  // Broadcast presence update to all connected users
  broadcastToAllUsers('user_presence', presenceData, connection.userId)
}

function handleDisconnection(connectionId: string) {
  const connection = connections.get(connectionId)
  if (!connection) return

  console.log(`WebSocket disconnected: ${connection.userId} (${connectionId})`)

  // Remove from user connections
  const userConns = userConnections.get(connection.userId)
  if (userConns) {
    userConns.delete(connectionId)
    if (userConns.size === 0) {
      userConnections.delete(connection.userId)
      
      // Broadcast user offline status
      broadcastToAllUsers('user_presence', {
        userId: connection.userId,
        status: 'offline',
        lastSeen: new Date().toISOString()
      })
    }
  }

  // Remove connection
  connections.delete(connectionId)
}

function handleConnectionError(connectionId: string, error: Error) {
  console.error(`WebSocket error for ${connectionId}:`, error)
  handleDisconnection(connectionId)
}

function startHeartbeat(connectionId: string) {
  const interval = setInterval(() => {
    const connection = connections.get(connectionId)
    if (!connection) {
      clearInterval(interval)
      return
    }

    const timeSinceLastPing = Date.now() - connection.lastPing.getTime()
    if (timeSinceLastPing > 60000) { // 60 seconds timeout
      console.log(`Heartbeat timeout for ${connectionId}`)
      connection.ws.close(1000, 'Heartbeat timeout')
      clearInterval(interval)
    }
  }, 30000) // Check every 30 seconds
}

// Broadcasting functions
function sendToConnection(connectionId: string, type: WebSocketMessageType, data: any) {
  const connection = connections.get(connectionId)
  if (!connection || connection.ws.readyState !== WebSocket.OPEN) return

  const message = createWebSocketMessage(type, connection.userId, data)
  
  try {
    connection.ws.send(JSON.stringify(message))
  } catch (error) {
    console.error(`Error sending to ${connectionId}:`, error)
    handleDisconnection(connectionId)
  }
}

function sendToUser(userId: string, type: WebSocketMessageType, data: any) {
  const userConns = userConnections.get(userId)
  if (!userConns) return

  userConns.forEach(connectionId => {
    sendToConnection(connectionId, type, data)
  })
}

function broadcastToAllUsers(type: WebSocketMessageType, data: any, excludeUserId?: string) {
  connections.forEach(connection => {
    if (excludeUserId && connection.userId === excludeUserId) return
    sendToConnection(connection.connectionId, type, data)
  })
}

function broadcastToSubscribers(subscription: string, type: WebSocketMessageType, data: any) {
  connections.forEach(connection => {
    if (connection.subscriptions.has(subscription)) {
      sendToConnection(connection.connectionId, type, data)
    }
  })
}

// Internal API functions for this route
const WebSocketAPI = {
  // Send generation progress update
  sendGenerationProgress: (generationId: string, progressData: any) => {
    broadcastToSubscribers(`generation:${generationId}`, 'generation_progress', {
      generationId,
      ...progressData
    })
  },

  // Send gallery update
  sendGalleryUpdate: (userId: string, updateData: any) => {
    sendToUser(userId, 'gallery_update', updateData)
  },

  // Send notification
  sendNotification: (userId: string, notificationData: any) => {
    sendToUser(userId, 'notification', notificationData)
  },

  // Broadcast system status
  broadcastSystemStatus: (statusData: any) => {
    broadcastToAllUsers('system_status', statusData)
  },

  // Get connection stats
  getStats: () => ({
    totalConnections: connections.size,
    totalUsers: userConnections.size,
    connections: Array.from(connections.values()).map(conn => ({
      connectionId: conn.connectionId,
      userId: conn.userId,
      subscriptions: Array.from(conn.subscriptions)
    }))
  })
}

// HTTP endpoint for WebSocket server management
export async function GET(request: NextRequest) {
  // Initialize WebSocket server if not already done
  if (!wss) {
    initializeWebSocketServer()
  }

  const stats = WebSocketAPI.getStats()
  
  return Response.json({
    status: 'WebSocket server running',
    port: 8080,
    stats
  })
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { action, ...data } = body

  switch (action) {
    case 'broadcast_notification':
      if (data.userId && data.notification) {
        WebSocketAPI.sendNotification(data.userId, data.notification)
        return Response.json({ success: true })
      }
      break

    case 'broadcast_system_status':
      if (data.status) {
        WebSocketAPI.broadcastSystemStatus(data.status)
        return Response.json({ success: true })
      }
      break

    default:
      return Response.json({ error: 'Unknown action' }, { status: 400 })
  }

  return Response.json({ error: 'Invalid request' }, { status: 400 })
}

// Initialize WebSocket server on module load
if (process.env.NODE_ENV !== 'test') {
  initializeWebSocketServer()
}
