import type { HAWebSocketState, MessageHandler, ConnectionHandler, RegistryHandler } from './types'

const DEFAULT_TIMEOUT = 30000

/** Registers a callback with automatic timeout (default 30s). */
export function registerCallback(
  state: HAWebSocketState,
  msgId: number,
  callback: (success: boolean, result?: unknown, error?: { code: string; message: string }) => void,
  timeoutMs = DEFAULT_TIMEOUT
): void {
  const timeout = setTimeout(() => {
    if (state.pendingCallbacks.has(msgId)) {
      state.pendingCallbacks.delete(msgId)
      callback(false, undefined, { code: 'timeout', message: 'Request timed out' })
    }
  }, timeoutMs)
  state.pendingCallbacks.set(msgId, { callback, timeout })
}

export function handlePendingCallback(
  state: HAWebSocketState,
  msgId: number,
  success: boolean,
  result?: unknown,
  error?: { code: string; message: string }
): boolean {
  if (!state.pendingCallbacks.has(msgId)) return false

  const pending = state.pendingCallbacks.get(msgId)
  if (pending) {
    clearTimeout(pending.timeout)
    state.pendingCallbacks.delete(msgId)
    pending.callback(success, result, error)
    return true
  }
  return false
}

/** Called on disconnect to notify pending requests they won't complete. */
export function clearPendingCallbacks(state: HAWebSocketState): void {
  for (const [, { callback, timeout }] of state.pendingCallbacks) {
    clearTimeout(timeout)
    callback(false, undefined, { code: 'disconnected', message: 'WebSocket disconnected' })
  }
  state.pendingCallbacks.clear()
}

/** Subscribes to entity state changes. Calls handler immediately if entities exist. */
export function addMessageHandler(state: HAWebSocketState, handler: MessageHandler): () => void {
  state.messageHandlers.add(handler)
  if (state.entities.size > 0) {
    handler(state.entities)
  }
  return () => state.messageHandlers.delete(handler)
}

/** Subscribes to connection status. Calls handler immediately with current state. */
export function addConnectionHandler(state: HAWebSocketState, handler: ConnectionHandler): () => void {
  state.connectionHandlers.add(handler)
  handler(state.isAuthenticated)
  return () => state.connectionHandlers.delete(handler)
}

export function addRegistryHandler(state: HAWebSocketState, handler: RegistryHandler): () => void {
  state.registryHandlers.add(handler)
  return () => state.registryHandlers.delete(handler)
}

export function notifyMessageHandlers(state: HAWebSocketState): void {
  for (const handler of state.messageHandlers) {
    handler(state.entities)
  }
}

export function notifyConnectionHandlers(state: HAWebSocketState, connected: boolean): void {
  for (const handler of state.connectionHandlers) {
    handler(connected)
  }
}

export function notifyRegistryHandlers(state: HAWebSocketState): void {
  for (const handler of state.registryHandlers) {
    handler()
  }
}
