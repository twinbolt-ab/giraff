import { useEffect, useCallback, useSyncExternalStore, useState } from 'react'
import { logSettingChange } from '../analytics'
import * as orderStorage from '../services/order-storage'

const SETTINGS_KEY = 'stuga-settings'

export type GridColumnsOption = 1 | 2 | 3

interface Settings {
  groupByFloors: boolean
  roomOrderingEnabled: boolean
  showTemperature: boolean
  showHumidity: boolean
  gridColumns: GridColumnsOption
  alsoHideInHA: boolean
}

const defaultSettings: Settings = {
  groupByFloors: true,
  roomOrderingEnabled: true,
  showTemperature: true,
  showHumidity: false,
  gridColumns: 2,
  alsoHideInHA: false,
}

// Shared settings store
let currentSettings: Settings = defaultSettings
const listeners = new Set<() => void>()

function loadSettings(): Settings {
  if (typeof window === 'undefined') return defaultSettings

  try {
    const stored = localStorage.getItem(SETTINGS_KEY)
    if (stored) {
      const parsed: unknown = JSON.parse(stored)
      if (typeof parsed === 'object' && parsed !== null) {
        return { ...defaultSettings, ...(parsed as Partial<Settings>) }
      }
    }
  } catch {
    // Ignore parse errors
  }
  return defaultSettings
}

function saveSettings(settings: Settings) {
  if (typeof window === 'undefined') return

  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
  } catch {
    // Ignore storage errors
  }
}

function notifyListeners() {
  listeners.forEach((listener) => {
    listener()
  })
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function getSnapshot() {
  return currentSettings
}

function getServerSnapshot() {
  return defaultSettings
}

function updateSettingsStore(updates: Partial<Settings>) {
  currentSettings = { ...currentSettings, ...updates }
  saveSettings(currentSettings)
  notifyListeners()
}

// Initialize on first load
let initialized = false
function initializeSettings() {
  if (!initialized && typeof window !== 'undefined') {
    currentSettings = loadSettings()
    initialized = true
  }
}

export function useSettings() {
  // Initialize settings store
  useEffect(() => {
    initializeSettings()
  }, [])

  // Subscribe to settings changes
  const settings = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  const setGroupByFloors = useCallback((value: boolean) => {
    updateSettingsStore({ groupByFloors: value })
  }, [])

  const setRoomOrderingEnabled = useCallback((value: boolean) => {
    updateSettingsStore({ roomOrderingEnabled: value })
    void logSettingChange('room_ordering', value)
  }, [])

  const setShowTemperature = useCallback((value: boolean) => {
    updateSettingsStore({ showTemperature: value })
    void logSettingChange('show_temperature', value)
  }, [])

  const setShowHumidity = useCallback((value: boolean) => {
    updateSettingsStore({ showHumidity: value })
    void logSettingChange('show_humidity', value)
  }, [])

  const setGridColumns = useCallback((value: GridColumnsOption) => {
    updateSettingsStore({ gridColumns: value })
    void logSettingChange('grid_columns', value)
  }, [])

  const setAlsoHideInHA = useCallback((value: boolean) => {
    updateSettingsStore({ alsoHideInHA: value })
    void logSettingChange('also_hide_in_ha', value)
  }, [])

  // Room Order HA Sync setting (stored separately in order-storage service)
  const [roomOrderSyncToHA, setRoomOrderSyncToHAState] = useState(false)

  // Load room order HA sync setting on mount
  useEffect(() => {
    let mounted = true

    async function loadHASync() {
      const enabled = await orderStorage.isRoomOrderHASyncEnabled()
      if (mounted) {
        setRoomOrderSyncToHAState(enabled)
      }
    }

    void loadHASync()

    return () => {
      mounted = false
    }
  }, [])

  const setRoomOrderSyncToHA = useCallback(async (value: boolean) => {
    await orderStorage.setRoomOrderHASync(value)
    setRoomOrderSyncToHAState(value)
    void logSettingChange('room_order_sync_to_ha', value)
  }, [])

  return {
    groupByFloors: settings.groupByFloors,
    setGroupByFloors,
    roomOrderingEnabled: settings.roomOrderingEnabled,
    setRoomOrderingEnabled,
    showTemperature: settings.showTemperature,
    setShowTemperature,
    showHumidity: settings.showHumidity,
    setShowHumidity,
    gridColumns: settings.gridColumns,
    setGridColumns,
    alsoHideInHA: settings.alsoHideInHA,
    setAlsoHideInHA,
    roomOrderSyncToHA,
    setRoomOrderSyncToHA,
    isLoaded: initialized,
  }
}
