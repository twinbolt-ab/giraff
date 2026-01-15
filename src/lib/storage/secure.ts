import { SecureStoragePlugin } from 'capacitor-secure-storage-plugin'
import type { StorageAdapter } from './index'

/**
 * Secure storage adapter using iOS Keychain / Android KeyStore.
 * Use this for sensitive data like OAuth tokens.
 */
export class SecureStorage implements StorageAdapter {
  async getItem(key: string): Promise<string | null> {
    try {
      const result = await SecureStoragePlugin.get({ key })
      return result.value
    } catch {
      // Key doesn't exist
      return null
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    await SecureStoragePlugin.set({ key, value })
  }

  async removeItem(key: string): Promise<void> {
    try {
      await SecureStoragePlugin.remove({ key })
    } catch {
      // Key might not exist, ignore
    }
  }
}
