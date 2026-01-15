import type { HAFloor } from '@/types/ha'
import { isHAFloor } from '@/types/ha'
import type { HAWebSocketState } from './types'
import { send, getNextMessageId } from './connection'
import { registerCallback, notifyRegistryHandlers } from './message-router'
import { DEFAULT_ORDER } from '@/lib/constants'

/**
 * Get all floors
 */
export function getFloors(state: HAWebSocketState): Map<string, HAFloor> {
  return state.floors
}

/**
 * Get a specific floor by ID
 */
export function getFloor(state: HAWebSocketState, floorId: string): HAFloor | undefined {
  return state.floors.get(floorId)
}

/**
 * Get floor order from level
 */
export function getFloorOrder(state: HAWebSocketState, floorId: string): number {
  const floor = state.floors.get(floorId)
  return floor?.level ?? DEFAULT_ORDER
}

/**
 * Update floor properties (name, icon)
 */
export async function updateFloor(
  state: HAWebSocketState,
  floorId: string,
  updates: { name?: string; icon?: string | null }
): Promise<void> {
  const floor = state.floors.get(floorId)
  if (!floor) throw new Error('Floor not found')

  return new Promise((resolve, reject) => {
    const msgId = getNextMessageId(state)
    registerCallback(state, msgId, (success, result) => {
      if (success) {
        // Update local registry - merge our updates with existing floor
        const updatedFloor: HAFloor = {
          ...floor,
          ...(result as Partial<HAFloor> || {}),
        }
        // Explicitly apply our updates in case they're not in the result
        if (updates.name !== undefined) updatedFloor.name = updates.name
        if (updates.icon !== undefined) updatedFloor.icon = updates.icon || undefined

        state.floors.set(floorId, updatedFloor)
        notifyRegistryHandlers(state)
        resolve()
      } else {
        reject(new Error('Failed to update floor'))
      }
    })

    const payload: Record<string, unknown> = {
      id: msgId,
      type: 'config/floor_registry/update',
      floor_id: floorId,
    }

    if (updates.name !== undefined) payload.name = updates.name
    if (updates.icon !== undefined) payload.icon = updates.icon

    send(state, payload)
  })
}

/**
 * Set floor order using the built-in level field
 */
export async function setFloorOrder(
  state: HAWebSocketState,
  floorId: string,
  order: number
): Promise<void> {
  const floor = state.floors.get(floorId)
  if (!floor) return

  return new Promise((resolve, reject) => {
    const msgId = getNextMessageId(state)
    registerCallback(state, msgId, (success, _result, error) => {
      if (success) {
        // Update local registry
        floor.level = order
        notifyRegistryHandlers(state)
        resolve()
      } else {
        reject(new Error(`Failed to update floor level: ${error?.message || 'Unknown error'}`))
      }
    })
    send(state, {
      id: msgId,
      type: 'config/floor_registry/update',
      floor_id: floorId,
      level: order,
    })
  })
}

/**
 * Create a new floor
 */
export async function createFloor(state: HAWebSocketState, name: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const msgId = getNextMessageId(state)
    registerCallback(state, msgId, (success, result) => {
      if (success && isHAFloor(result)) {
        // Add to local registry
        state.floors.set(result.floor_id, result)
        notifyRegistryHandlers(state)
        resolve(result.floor_id)
      } else {
        reject(new Error('Failed to create floor'))
      }
    })

    send(state, {
      id: msgId,
      type: 'config/floor_registry/create',
      name,
    })
  })
}
