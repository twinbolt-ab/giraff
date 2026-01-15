/**
 * Simple event system for same-tab communication
 * Used to notify components when settings change without polling
 */

type SettingsEventCallback = (value: unknown) => void

const listeners = new Map<string, Set<SettingsEventCallback>>()

export const settingsEvents = {
  /**
   * Emit an event to all subscribers
   */
  emit: (key: string, value: unknown) => {
    listeners.get(key)?.forEach(cb => cb(value))
  },

  /**
   * Subscribe to an event
   * @returns Unsubscribe function
   */
  subscribe: (key: string, callback: SettingsEventCallback) => {
    if (!listeners.has(key)) {
      listeners.set(key, new Set())
    }
    listeners.get(key)!.add(callback)
    return () => {
      listeners.get(key)?.delete(callback)
    }
  },
}
