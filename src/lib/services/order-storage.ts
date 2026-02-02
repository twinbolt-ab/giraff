/**
 * Unified Order Storage Service
 *
 * Handles both room and entity ordering with support for:
 * - Client-side storage (localStorage/Capacitor) - default
 * - Optional Home Assistant label sync for room ordering
 */

import type { RoomOrderMap, EntityOrderMap, DomainOrderMap } from '@/types/ordering'
import { getStorage } from '@/lib/storage'
import { STORAGE_KEYS, ROOM_ORDER_LABEL_PREFIX, DEFAULT_ORDER } from '@/lib/constants'
import * as ws from '@/lib/ha-websocket'
import { getState } from '@/lib/ha-websocket'

// ============================================================================
// Room Ordering - Client-side with optional HA sync
// ============================================================================

/**
 * Get room order from localStorage
 */
export async function getRoomOrder(areaId: string): Promise<number> {
  const storage = getStorage()
  const stored = await storage.getItem(STORAGE_KEYS.ROOM_ORDER)

  if (!stored) return DEFAULT_ORDER

  try {
    const orderMap: RoomOrderMap = JSON.parse(stored)
    return orderMap[areaId] ?? DEFAULT_ORDER
  } catch {
    return DEFAULT_ORDER
  }
}

/**
 * Set room order in localStorage
 */
export async function setRoomOrder(areaId: string, order: number): Promise<void> {
  const storage = getStorage()
  const stored = await storage.getItem(STORAGE_KEYS.ROOM_ORDER)

  let orderMap: RoomOrderMap = {}
  if (stored) {
    try {
      orderMap = JSON.parse(stored)
    } catch {
      orderMap = {}
    }
  }

  orderMap[areaId] = order
  await storage.setItem(STORAGE_KEYS.ROOM_ORDER, JSON.stringify(orderMap))
}

/**
 * Get all room orders from localStorage
 */
export async function getAllRoomOrders(): Promise<RoomOrderMap> {
  const storage = getStorage()
  const stored = await storage.getItem(STORAGE_KEYS.ROOM_ORDER)

  if (!stored) return {}

  try {
    return JSON.parse(stored)
  } catch {
    return {}
  }
}

/**
 * Set all room orders at once (useful for migration and bulk updates)
 */
export async function setAllRoomOrders(orderMap: RoomOrderMap): Promise<void> {
  const storage = getStorage()
  await storage.setItem(STORAGE_KEYS.ROOM_ORDER, JSON.stringify(orderMap))
}

/**
 * Check if room order migration from HA labels has been completed
 */
export async function isRoomOrderMigrated(): Promise<boolean> {
  const storage = getStorage()
  const migrated = await storage.getItem(STORAGE_KEYS.ROOM_ORDER_MIGRATED)
  return migrated === 'true'
}

/**
 * Mark room order migration as complete
 */
async function markRoomOrderMigrated(): Promise<void> {
  const storage = getStorage()
  await storage.setItem(STORAGE_KEYS.ROOM_ORDER_MIGRATED, 'true')
}

/**
 * One-time migration: Read room order from HA labels and save to localStorage.
 * If HA labels exist, also enables HA sync so future changes sync back.
 * Returns true if HA labels were found and sync was enabled.
 */
export async function migrateRoomOrderFromHA(): Promise<boolean> {
  // Check if already migrated
  if (await isRoomOrderMigrated()) {
    return false
  }

  const state = getState()
  if (!state) {
    console.warn('Cannot migrate room order: WebSocket not connected')
    return false
  }

  const orderMap: RoomOrderMap = {}

  // Read order from HA labels for each area
  for (const [areaId, area] of state.areaRegistry) {
    if (!area.labels) continue

    for (const labelId of area.labels) {
      const label = state.labels.get(labelId)
      if (label?.name.startsWith(ROOM_ORDER_LABEL_PREFIX)) {
        const orderStr = label.name.slice(ROOM_ORDER_LABEL_PREFIX.length)
        const order = parseInt(orderStr, 10)
        if (!isNaN(order)) {
          orderMap[areaId] = order
        }
      }
    }
  }

  const foundHALabels = Object.keys(orderMap).length > 0

  // Save to localStorage
  if (foundHALabels) {
    await setAllRoomOrders(orderMap)
    // Enable HA sync since labels already exist in HA
    const storage = getStorage()
    await storage.setItem(STORAGE_KEYS.ROOM_ORDER_SYNC_TO_HA, 'true')
    console.log(
      `Migrated room order for ${Object.keys(orderMap).length} rooms from HA labels to localStorage (sync enabled)`
    )
  }

  // Mark migration as complete
  await markRoomOrderMigrated()
  return foundHALabels
}

/**
 * Sync current room order from localStorage to HA labels
 * Used when user enables "Sync to Home Assistant" setting
 */
export async function syncRoomOrderToHA(): Promise<void> {
  const state = getState()
  if (!state) {
    throw new Error('Cannot sync to HA: WebSocket not connected')
  }

  const orderMap = await getAllRoomOrders()

  // Write each room's order to HA labels
  const promises = Object.entries(orderMap).map(([areaId, order]) => ws.setAreaOrder(areaId, order))

  await Promise.all(promises)
  console.log(`Synced room order for ${promises.length} rooms to HA labels`)
}

/**
 * Check if HA sync is enabled for room ordering
 */
export async function isRoomOrderHASyncEnabled(): Promise<boolean> {
  const storage = getStorage()
  const enabled = await storage.getItem(STORAGE_KEYS.ROOM_ORDER_SYNC_TO_HA)
  return enabled === 'true'
}

/**
 * Enable or disable HA sync for room ordering
 */
export async function setRoomOrderHASync(enabled: boolean): Promise<void> {
  const storage = getStorage()
  await storage.setItem(STORAGE_KEYS.ROOM_ORDER_SYNC_TO_HA, enabled ? 'true' : 'false')

  // If enabling, sync current localStorage order to HA
  if (enabled) {
    await syncRoomOrderToHA()
  }
}

/**
 * Set room order with optional HA sync
 * Checks if HA sync is enabled and writes to both localStorage and HA if needed
 */
export async function setRoomOrderWithSync(areaId: string, order: number): Promise<void> {
  // Always write to localStorage
  await setRoomOrder(areaId, order)

  // If HA sync is enabled, also write to HA
  if (await isRoomOrderHASyncEnabled()) {
    const state = getState()
    if (state) {
      await ws.setAreaOrder(areaId, order)
    }
  }
}

// ============================================================================
// Entity Ordering - Client-side only
// ============================================================================

/**
 * Get entity order for a specific room and domain
 */
export async function getEntityOrder(roomSlug: string, domain: string): Promise<DomainOrderMap> {
  const storage = getStorage()
  const key = `${STORAGE_KEYS.ENTITY_ORDER_PREFIX}${roomSlug}`
  const stored = await storage.getItem(key)

  if (!stored) return {}

  try {
    const entityOrderMap: EntityOrderMap = JSON.parse(stored)
    return entityOrderMap[domain] ?? {}
  } catch {
    return {}
  }
}

/**
 * Set entity order for a specific room, domain, and entity
 */
export async function setEntityOrder(
  roomSlug: string,
  domain: string,
  entityId: string,
  order: number
): Promise<void> {
  const storage = getStorage()
  const key = `${STORAGE_KEYS.ENTITY_ORDER_PREFIX}${roomSlug}`
  const stored = await storage.getItem(key)

  let entityOrderMap: EntityOrderMap = {}
  if (stored) {
    try {
      entityOrderMap = JSON.parse(stored)
    } catch {
      entityOrderMap = {}
    }
  }

  if (!entityOrderMap[domain]) {
    entityOrderMap[domain] = {}
  }

  entityOrderMap[domain][entityId] = order
  await storage.setItem(key, JSON.stringify(entityOrderMap))
}

/**
 * Set all entity orders for a specific room and domain
 * Used when reordering entities within a section
 */
export async function setDomainEntityOrders(
  roomSlug: string,
  domain: string,
  domainOrderMap: DomainOrderMap
): Promise<void> {
  const storage = getStorage()
  const key = `${STORAGE_KEYS.ENTITY_ORDER_PREFIX}${roomSlug}`
  const stored = await storage.getItem(key)

  let entityOrderMap: EntityOrderMap = {}
  if (stored) {
    try {
      entityOrderMap = JSON.parse(stored)
    } catch {
      entityOrderMap = {}
    }
  }

  entityOrderMap[domain] = domainOrderMap
  await storage.setItem(key, JSON.stringify(entityOrderMap))
}

/**
 * Get all entity orders for a specific room (all domains)
 */
export async function getAllEntityOrders(roomSlug: string): Promise<EntityOrderMap> {
  const storage = getStorage()
  const key = `${STORAGE_KEYS.ENTITY_ORDER_PREFIX}${roomSlug}`
  const stored = await storage.getItem(key)

  if (!stored) return {}

  try {
    return JSON.parse(stored)
  } catch {
    return {}
  }
}

/**
 * Clear entity ordering for a specific room
 * Useful when a room is deleted or user wants to reset
 */
export async function clearEntityOrders(roomSlug: string): Promise<void> {
  const storage = getStorage()
  const key = `${STORAGE_KEYS.ENTITY_ORDER_PREFIX}${roomSlug}`
  await storage.removeItem(key)
}
