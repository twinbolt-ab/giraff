import { useSettingsContext } from '../contexts/SettingsContext'

/**
 * Hook for managing configurable entity domains and visibility settings.
 * Delegates to SettingsContext so all consumers share the same state.
 */
export function useEnabledDomains() {
  const {
    enabledDomains,
    setEnabledDomains,
    isEntityVisible,
    toggleDomain,
    resetDomainsToDefaults: resetToDefaults,
  } = useSettingsContext()

  return {
    enabledDomains,
    setEnabledDomains,
    isEntityVisible,
    toggleDomain,
    resetToDefaults,
  }
}
