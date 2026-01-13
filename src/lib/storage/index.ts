export interface StorageAdapter {
  getItem(key: string): Promise<string | null>
  setItem(key: string, value: string): Promise<void>
  removeItem(key: string): Promise<void>
}

let adapter: StorageAdapter | null = null

export async function initStorage(): Promise<void> {
  // Check if running in Capacitor native app
  if (typeof window !== 'undefined' && (window as any).Capacitor?.isNativePlatform()) {
    const { NativeStorage } = await import('./native')
    adapter = new NativeStorage()
  } else {
    const { WebStorage } = await import('./web')
    adapter = new WebStorage()
  }
}

export function getStorage(): StorageAdapter {
  if (!adapter) {
    throw new Error('Storage not initialized. Call initStorage() first.')
  }
  return adapter
}

export function isStorageInitialized(): boolean {
  return adapter !== null
}
