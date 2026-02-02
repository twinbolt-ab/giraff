import { Capacitor, registerPlugin } from '@capacitor/core'

interface GmsCheckerPlugin {
  isAvailable(): Promise<{ available: boolean }>
}

const GmsChecker = registerPlugin<GmsCheckerPlugin>('GmsChecker')

// Cache the result to avoid repeated native calls
let gmsAvailable: boolean | null = null

/**
 * Check if Google Mobile Services (GMS) is available.
 * Returns true on iOS (no GMS needed), web, and Android devices with GMS.
 * Returns false on Huawei and other non-GMS Android devices.
 */
export async function isGmsAvailable(): Promise<boolean> {
  // Return cached result if available
  if (gmsAvailable !== null) {
    return gmsAvailable
  }

  const platform = Capacitor.getPlatform()

  // iOS doesn't use GMS, so Firebase works fine
  if (platform === 'ios') {
    gmsAvailable = true
    return true
  }

  // Web doesn't use native Firebase
  if (platform === 'web') {
    gmsAvailable = true
    return true
  }

  // Android - check GMS availability
  try {
    const result = await GmsChecker.isAvailable()
    gmsAvailable = result.available
    console.log(`[GmsChecker] GMS available: ${gmsAvailable}`)
    return gmsAvailable
  } catch (error) {
    // If the plugin fails, assume GMS is not available
    console.warn('[GmsChecker] Failed to check GMS availability:', error)
    gmsAvailable = false
    return false
  }
}
