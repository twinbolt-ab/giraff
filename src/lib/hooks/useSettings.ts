import { useState, useEffect, useCallback } from 'react'

const SETTINGS_KEY = 'giraff-settings'

export type ShowScenesOption = 'auto' | 'on' | 'off'

interface Settings {
  groupByFloors: boolean
  showScenes: ShowScenesOption
}

const defaultSettings: Settings = {
  groupByFloors: true,
  showScenes: 'auto',
}

function loadSettings(): Settings {
  if (typeof window === 'undefined') return defaultSettings

  try {
    const stored = localStorage.getItem(SETTINGS_KEY)
    if (stored) {
      return { ...defaultSettings, ...JSON.parse(stored) }
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

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(defaultSettings)
  const [isLoaded, setIsLoaded] = useState(false)

  // Load settings on mount (client-side only)
  useEffect(() => {
    setSettings(loadSettings())
    setIsLoaded(true)
  }, [])

  const updateSettings = useCallback((updates: Partial<Settings>) => {
    setSettings(prev => {
      const newSettings = { ...prev, ...updates }
      saveSettings(newSettings)
      return newSettings
    })
  }, [])

  const setGroupByFloors = useCallback((value: boolean) => {
    updateSettings({ groupByFloors: value })
  }, [updateSettings])

  const setShowScenes = useCallback((value: ShowScenesOption) => {
    updateSettings({ showScenes: value })
  }, [updateSettings])

  return {
    groupByFloors: settings.groupByFloors,
    setGroupByFloors,
    showScenes: settings.showScenes,
    setShowScenes,
    isLoaded,
  }
}
