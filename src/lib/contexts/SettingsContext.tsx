import { createContext, useContext, useEffect, useCallback, useState, ReactNode } from 'react'
import { logSettingChange } from '../analytics'
import * as orderStorage from '../services/order-storage'
import { getStorage } from '../storage'
import { STORAGE_KEYS } from '../constants'

export interface SyncResult {
  rooms: number
  devices: number
}

interface SettingsContextValue {
  // Custom order feature (replaces reorderingDisabled + roomOrderSyncToHA)
  customOrderEnabled: boolean
  setCustomOrderEnabled: (value: boolean) => Promise<SyncResult | void>
}

const SettingsContext = createContext<SettingsContextValue | null>(null)

interface SettingsProviderProps {
  children: ReactNode
}

export function SettingsProvider({ children }: SettingsProviderProps) {
  // Custom order enabled setting (default true)
  const [customOrderEnabled, setCustomOrderEnabledState] = useState(true)

  // Load settings on mount
  useEffect(() => {
    let mounted = true

    async function loadSettings() {
      const storage = getStorage()

      // Load custom order enabled setting (default true)
      const customOrderValue = await storage.getItem(STORAGE_KEYS.CUSTOM_ORDER_ENABLED)
      if (mounted) {
        // Default to true, only false if explicitly set to 'false'
        setCustomOrderEnabledState(customOrderValue !== 'false')
      }
    }

    void loadSettings()

    return () => {
      mounted = false
    }
  }, [])

  const setCustomOrderEnabled = useCallback(
    async (value: boolean): Promise<SyncResult | void> => {
      const storage = getStorage()

      if (value) {
        // Enabling custom order: enable HA sync
        await storage.setItem(STORAGE_KEYS.CUSTOM_ORDER_ENABLED, 'true')
        const result = await orderStorage.setRoomOrderHASync(true)
        setCustomOrderEnabledState(value)
        void logSettingChange('custom_order_enabled', value)
        return result ?? { rooms: 0, devices: 0 }
      } else {
        // Disabling custom order: clean up all order labels from HA, then disable sync
        const { cleanupAllOrderLabels } = await import('../metadata/cleanup')
        await cleanupAllOrderLabels()
        await orderStorage.setRoomOrderHASync(false)
        await storage.setItem(STORAGE_KEYS.CUSTOM_ORDER_ENABLED, 'false')
        setCustomOrderEnabledState(value)
        void logSettingChange('custom_order_enabled', value)
      }
    },
    []
  )

  return (
    <SettingsContext.Provider
      value={{
        customOrderEnabled,
        setCustomOrderEnabled,
      }}
    >
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettingsContext(): SettingsContextValue {
  const context = useContext(SettingsContext)
  if (!context) {
    throw new Error('useSettingsContext must be used within a SettingsProvider')
  }
  return context
}
