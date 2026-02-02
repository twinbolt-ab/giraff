import { Capacitor } from '@capacitor/core'
import { FirebaseAnalytics } from '@capacitor-firebase/analytics'
import { isGmsAvailable } from './gms-checker'

const isNative = Capacitor.isNativePlatform()

// Track if Analytics is enabled (GMS available and initialized)
let analyticsEnabled = false

export async function initAnalytics(): Promise<void> {
  if (!isNative) return

  // Check GMS availability before initializing Firebase
  const gmsAvailable = await isGmsAvailable()
  if (!gmsAvailable) {
    console.log('[Analytics] Skipping init - GMS not available (Huawei/non-GMS device)')
    return
  }

  try {
    await FirebaseAnalytics.setEnabled({ enabled: true })
    analyticsEnabled = true
    console.log('[Analytics] Initialized successfully')
  } catch (error) {
    console.error('[Analytics] Failed to initialize:', error)
  }
}

export async function setAnalyticsUserId(userId: string): Promise<void> {
  if (!isNative || !analyticsEnabled) return

  try {
    await FirebaseAnalytics.setUserId({ userId })
  } catch (e) {
    console.error('[Analytics] Failed to set user ID:', e)
  }
}

// Screen view tracking
export async function logScreenView(screenName: string): Promise<void> {
  if (!isNative || !analyticsEnabled) return

  try {
    await FirebaseAnalytics.logEvent({
      name: 'screen_view',
      params: {
        screen_name: screenName,
        screen_class: screenName,
      },
    })
  } catch (e) {
    console.error('[Analytics] Failed to log screen view:', e)
  }
}

// Connection events
export async function logConnectionAttempt(
  connectionType: 'local' | 'cloud',
  authMethod: 'oauth' | 'token'
): Promise<void> {
  if (!isNative || !analyticsEnabled) return

  try {
    await FirebaseAnalytics.logEvent({
      name: 'connection_attempt',
      params: {
        connection_type: connectionType,
        auth_method: authMethod,
      },
    })
  } catch (e) {
    console.error('[Analytics] Failed to log connection attempt:', e)
  }
}

export async function logConnectionSuccess(
  connectionType: 'local' | 'cloud',
  authMethod: 'oauth' | 'token',
  entityCount?: number,
  areaCount?: number
): Promise<void> {
  if (!isNative || !analyticsEnabled) return

  try {
    await FirebaseAnalytics.logEvent({
      name: 'connection_success',
      params: {
        connection_type: connectionType,
        auth_method: authMethod,
        entity_count: entityCount ?? 0,
        area_count: areaCount ?? 0,
      },
    })
  } catch (e) {
    console.error('[Analytics] Failed to log connection success:', e)
  }
}

export async function logConnectionFailure(
  connectionType: 'local' | 'cloud',
  authMethod: 'oauth' | 'token',
  errorType?: string
): Promise<void> {
  if (!isNative || !analyticsEnabled) return

  try {
    await FirebaseAnalytics.logEvent({
      name: 'connection_failure',
      params: {
        connection_type: connectionType,
        auth_method: authMethod,
        error_type: errorType ?? 'unknown',
      },
    })
  } catch (e) {
    console.error('[Analytics] Failed to log connection failure:', e)
  }
}

// Edit events
export async function logRoomEdit(): Promise<void> {
  if (!isNative || !analyticsEnabled) return

  try {
    await FirebaseAnalytics.logEvent({
      name: 'room_edit',
      params: {},
    })
  } catch (e) {
    console.error('[Analytics] Failed to log room edit:', e)
  }
}

export async function logFloorEdit(): Promise<void> {
  if (!isNative || !analyticsEnabled) return

  try {
    await FirebaseAnalytics.logEvent({
      name: 'floor_edit',
      params: {},
    })
  } catch (e) {
    console.error('[Analytics] Failed to log floor edit:', e)
  }
}

export async function logFloorCreate(): Promise<void> {
  if (!isNative || !analyticsEnabled) return

  try {
    await FirebaseAnalytics.logEvent({
      name: 'floor_create',
      params: {},
    })
  } catch (e) {
    console.error('[Analytics] Failed to log floor create:', e)
  }
}

export async function logDeviceEdit(): Promise<void> {
  if (!isNative || !analyticsEnabled) return

  try {
    await FirebaseAnalytics.logEvent({
      name: 'device_edit',
      params: {},
    })
  } catch (e) {
    console.error('[Analytics] Failed to log device edit:', e)
  }
}

export async function logRoomReorder(): Promise<void> {
  if (!isNative || !analyticsEnabled) return

  try {
    await FirebaseAnalytics.logEvent({
      name: 'room_reorder',
      params: {},
    })
  } catch (e) {
    console.error('[Analytics] Failed to log room reorder:', e)
  }
}

// Rate app events
export async function logRateAppAction(action: 'shown' | 'rated' | 'dismissed'): Promise<void> {
  if (!isNative || !analyticsEnabled) return

  try {
    await FirebaseAnalytics.logEvent({
      name: 'rate_app',
      params: {
        action,
      },
    })
  } catch (e) {
    console.error('[Analytics] Failed to log rate app action:', e)
  }
}

// Settings events
export async function logSettingChange(
  setting:
    | 'theme'
    | 'room_ordering'
    | 'show_temperature'
    | 'show_humidity'
    | 'grid_columns'
    | 'also_hide_in_ha'
    | 'domain_config'
    | 'room_order_sync_to_ha',
  value: string | number | boolean
): Promise<void> {
  if (!isNative || !analyticsEnabled) return

  try {
    await FirebaseAnalytics.logEvent({
      name: 'setting_change',
      params: {
        setting_name: setting,
        setting_value: String(value),
      },
    })
  } catch (e) {
    console.error('[Analytics] Failed to log setting change:', e)
  }
}
