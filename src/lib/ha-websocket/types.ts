import type { HAEntity, HALabel, HAFloor, AreaRegistryEntry, EntityRegistryEntry } from '@/types/ha'

// Handler types
export type MessageHandler = (entities: Map<string, HAEntity>) => void
export type ConnectionHandler = (connected: boolean) => void
export type RegistryHandler = () => void

// Callback for pending WebSocket requests
export interface PendingCallback {
  callback: (success: boolean, result?: unknown, error?: { code: string; message: string }) => void
  timeout: NodeJS.Timeout
}

// Shared state interface - internal state accessible by all modules
export interface HAWebSocketState {
  // Connection
  ws: WebSocket | null
  url: string
  token: string
  useOAuth: boolean
  messageId: number
  isAuthenticated: boolean
  reconnectTimeout: NodeJS.Timeout | null

  // Message IDs for registry fetches
  statesMessageId: number
  entityRegistryMessageId: number
  areaRegistryMessageId: number
  labelRegistryMessageId: number
  floorRegistryMessageId: number
  deviceRegistryMessageId: number

  // Entities
  entities: Map<string, HAEntity>
  entityAreas: Map<string, string>

  // Registries
  areas: Map<string, string>
  areaRegistry: Map<string, AreaRegistryEntry>
  entityRegistry: Map<string, EntityRegistryEntry>
  deviceRegistry: Map<string, { id: string; area_id?: string }>
  labels: Map<string, HALabel>
  floors: Map<string, HAFloor>

  // Handlers
  messageHandlers: Set<MessageHandler>
  connectionHandlers: Set<ConnectionHandler>
  registryHandlers: Set<RegistryHandler>
  pendingCallbacks: Map<number, PendingCallback>
}

// Create initial state
export function createInitialState(): HAWebSocketState {
  return {
    ws: null,
    url: '',
    token: '',
    useOAuth: false,
    messageId: 1,
    isAuthenticated: false,
    reconnectTimeout: null,

    statesMessageId: 0,
    entityRegistryMessageId: 0,
    areaRegistryMessageId: 0,
    labelRegistryMessageId: 0,
    floorRegistryMessageId: 0,
    deviceRegistryMessageId: 0,

    entities: new Map(),
    entityAreas: new Map(),

    areas: new Map(),
    areaRegistry: new Map(),
    entityRegistry: new Map(),
    deviceRegistry: new Map(),
    labels: new Map(),
    floors: new Map(),

    messageHandlers: new Set(),
    connectionHandlers: new Set(),
    registryHandlers: new Set(),
    pendingCallbacks: new Map(),
  }
}
