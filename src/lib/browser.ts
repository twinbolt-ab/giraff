import { Browser } from '@capacitor/browser'
import { isNativeApp } from './ha-oauth'

/**
 * Opens a URL in the system browser.
 * Uses Capacitor Browser plugin on native (iOS/Android),
 * falls back to window.open on web.
 */
export async function openExternalUrl(url: string): Promise<void> {
  if (isNativeApp()) {
    await Browser.open({ url })
  } else {
    window.open(url, '_blank')
  }
}
