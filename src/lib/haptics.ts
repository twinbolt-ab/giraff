/**
 * Haptic Feedback Service
 *
 * Provides unified haptic feedback across platforms:
 * - Native (iOS/Android): Uses @capacitor/haptics for rich haptic types
 * - Web: Falls back to navigator.vibrate() where supported
 *
 * Best practices for haptic types:
 * - selection: Tab changes, item selection (subtle, informational)
 * - light: Button taps, toggles (responsive but not fatiguing)
 * - medium: Drag start, long-press (clear confirmation)
 * - heavy: Destructive actions, major state changes
 * - success/warning/error: Semantic feedback for action results
 */

import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics'
import { Capacitor } from '@capacitor/core'

// Cache platform check at module load time
const isNative = Capacitor.isNativePlatform()
const isIOS = isNative && Capacitor.getPlatform() === 'ios'
const canVibrate = typeof navigator !== 'undefined' && 'vibrate' in navigator

// On Android, warm up the vibrator on first user interaction
// This ensures subsequent haptic calls are instant
let vibratorWarmedUp = isIOS // iOS doesn't need warmup
if (!vibratorWarmedUp && canVibrate && typeof document !== 'undefined') {
  const warmup = () => {
    if (!vibratorWarmedUp) {
      navigator.vibrate(1)
      vibratorWarmedUp = true
    }
    document.removeEventListener('touchstart', warmup)
    document.removeEventListener('pointerdown', warmup)
  }
  document.addEventListener('touchstart', warmup, { once: true, passive: true })
  document.addEventListener('pointerdown', warmup, { once: true, passive: true })
}

export const haptic = {
  /**
   * Selection feedback - use when selecting/deselecting items, tab changes
   * iOS: UISelectionFeedbackGenerator
   * Android/Web: 10ms vibration via navigator.vibrate (faster than Capacitor plugin)
   */
  selection: (): void => {
    try {
      if (isIOS) {
        Haptics.selectionChanged()
      } else if (canVibrate) {
        navigator.vibrate(10)
      }
    } catch {
      // Haptics should never throw - fail silently
    }
  },

  /**
   * Light impact - use for button taps, toggle switches
   * iOS: UIImpactFeedbackGenerator.light
   * Android/Web: 15ms vibration via navigator.vibrate (faster than Capacitor plugin)
   */
  light: (): void => {
    try {
      if (isIOS) {
        Haptics.impact({ style: ImpactStyle.Light })
      } else if (canVibrate) {
        navigator.vibrate(15)
      }
    } catch {
      // Haptics should never throw
    }
  },

  /**
   * Medium impact - use for drag start, long-press activation
   * iOS: UIImpactFeedbackGenerator.medium
   * Android/Web: 30ms vibration via navigator.vibrate (faster than Capacitor plugin)
   */
  medium: (): void => {
    try {
      if (isIOS) {
        Haptics.impact({ style: ImpactStyle.Medium })
      } else if (canVibrate) {
        navigator.vibrate(30)
      }
    } catch {
      // Haptics should never throw
    }
  },

  /**
   * Heavy impact - use for destructive actions, major state changes
   * iOS: UIImpactFeedbackGenerator.heavy
   * Android/Web: 50ms vibration via navigator.vibrate (faster than Capacitor plugin)
   */
  heavy: (): void => {
    try {
      if (isIOS) {
        Haptics.impact({ style: ImpactStyle.Heavy })
      } else if (canVibrate) {
        navigator.vibrate(50)
      }
    } catch {
      // Haptics should never throw
    }
  },

  /**
   * Success notification - use when action completes successfully
   * iOS: UINotificationFeedbackGenerator.success
   * Android/Web: Double pulse pattern
   */
  success: (): void => {
    try {
      if (isIOS) {
        Haptics.notification({ type: NotificationType.Success })
      } else if (canVibrate) {
        navigator.vibrate([15, 50, 15])
      }
    } catch {
      // Haptics should never throw
    }
  },

  /**
   * Warning notification - use when attention is needed
   * iOS: UINotificationFeedbackGenerator.warning
   * Android/Web: Warning pattern
   */
  warning: (): void => {
    try {
      if (isIOS) {
        Haptics.notification({ type: NotificationType.Warning })
      } else if (canVibrate) {
        navigator.vibrate([20, 30, 20])
      }
    } catch {
      // Haptics should never throw
    }
  },

  /**
   * Error notification - use when action fails
   * iOS: UINotificationFeedbackGenerator.error
   * Android/Web: Sharp error pattern
   */
  error: (): void => {
    try {
      if (isIOS) {
        Haptics.notification({ type: NotificationType.Error })
      } else if (canVibrate) {
        navigator.vibrate([30, 20, 30, 20, 30])
      }
    } catch {
      // Haptics should never throw
    }
  },
}
