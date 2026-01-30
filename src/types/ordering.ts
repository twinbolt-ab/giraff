// Type definitions for client-side ordering system

/**
 * Map of entity IDs to their order values for a specific domain
 * Example: { "light.kitchen": 0, "light.living_room": 1 }
 */
export type DomainOrderMap = Record<string, number>

/**
 * Map of domains to their entity order maps
 * Example: { "light": { "light.kitchen": 0 }, "switch": { "switch.fan": 0 } }
 */
export type EntityOrderMap = Record<string, DomainOrderMap>

/**
 * Map of area IDs to their order values
 * Example: { "kitchen": 0, "living_room": 1, "bedroom": 2 }
 */
export type RoomOrderMap = Record<string, number>

/**
 * Storage backend type
 */
export type OrderStorage = 'localStorage' | 'homeAssistant'
