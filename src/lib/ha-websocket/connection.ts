import type { WebSocketMessage } from '@/types/ha'
import type { HAWebSocketState } from './types'
import { RECONNECT_DELAY } from '@/lib/constants'
import { getValidAccessToken } from '@/lib/ha-oauth'
import { logger } from '@/lib/logger'
import { notifyConnectionHandlers, clearPendingCallbacks } from './message-router'

type MessageCallback = (message: WebSocketMessage) => void

/**
 * Configure the WebSocket connection parameters
 */
export function configure(state: HAWebSocketState, url: string, token: string, useOAuth = false): void {
  state.url = url.replace('http', 'ws') + '/api/websocket'
  state.token = token
  state.useOAuth = useOAuth
}

/**
 * Connect to Home Assistant WebSocket
 */
export function connect(state: HAWebSocketState, onMessage: MessageCallback): void {
  if (state.ws?.readyState === WebSocket.OPEN) return

  try {
    state.ws = new WebSocket(state.url)

    state.ws.onopen = () => {
      logger.debug('HA WS', 'Connected')
    }

    state.ws.onmessage = (event) => {
      onMessage(JSON.parse(event.data))
    }

    state.ws.onclose = () => {
      logger.debug('HA WS', 'Disconnected')
      state.isAuthenticated = false
      notifyConnectionHandlers(state, false)
      scheduleReconnect(state, onMessage)
    }

    state.ws.onerror = (error) => {
      logger.error('HA WS', 'Error:', error)
    }
  } catch (error) {
    logger.error('HA WS', 'Connection failed:', error)
    scheduleReconnect(state, onMessage)
  }
}

/**
 * Disconnect from WebSocket
 */
export function disconnect(state: HAWebSocketState): void {
  if (state.reconnectTimeout) {
    clearTimeout(state.reconnectTimeout)
    state.reconnectTimeout = null
  }
  clearPendingCallbacks(state)
  state.ws?.close()
  state.ws = null
  state.isAuthenticated = false
}

/**
 * Schedule a reconnection attempt
 */
function scheduleReconnect(state: HAWebSocketState, onMessage: MessageCallback): void {
  if (state.reconnectTimeout) return

  state.reconnectTimeout = setTimeout(() => {
    state.reconnectTimeout = null
    logger.debug('HA WS', 'Attempting reconnect...')
    connect(state, onMessage)
  }, RECONNECT_DELAY)
}

/**
 * Authenticate with Home Assistant
 */
export async function authenticate(state: HAWebSocketState): Promise<boolean> {
  // If using OAuth, get a fresh token (handles refresh automatically)
  if (state.useOAuth) {
    const result = await getValidAccessToken()
    if (result.status === 'valid') {
      state.token = result.token
    } else if (result.status === 'network-error') {
      // Network error - keep trying to reconnect, credentials are still valid
      logger.warn('HA WS', 'Network error getting token, will retry on reconnect')
      disconnect(state)
      return false
    } else {
      // Auth error or no credentials - stop trying
      logger.error('HA WS', 'OAuth token unavailable:', result.status)
      disconnect(state)
      return false
    }
  }

  send(state, {
    type: 'auth',
    access_token: state.token,
  })
  return true
}

/**
 * Send a message via WebSocket
 */
export function send(state: HAWebSocketState, message: Record<string, unknown>): void {
  if (state.ws?.readyState === WebSocket.OPEN) {
    state.ws.send(JSON.stringify(message))
  }
}

/**
 * Get next message ID
 */
export function getNextMessageId(state: HAWebSocketState): number {
  return state.messageId++
}

/**
 * Check if authenticated
 */
export function isConnected(state: HAWebSocketState): boolean {
  return state.isAuthenticated
}
