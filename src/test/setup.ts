import '@testing-library/jest-dom/vitest'
import { vi } from 'vitest'

// Mock WebSocket for tests
class MockWebSocket {
  static CONNECTING = 0
  static OPEN = 1
  static CLOSING = 2
  static CLOSED = 3

  readyState = MockWebSocket.OPEN
  onopen: (() => void) | null = null
  onclose: (() => void) | null = null
  onmessage: ((event: { data: string }) => void) | null = null
  onerror: ((event: Event) => void) | null = null

  constructor(_url: string) {
    // Simulate connection
    setTimeout(() => this.onopen?.(), 0)
  }

  send(_data: string) {
    // Mock send
  }

  close() {
    this.readyState = MockWebSocket.CLOSED
    this.onclose?.()
  }
}

// @ts-expect-error - Mock WebSocket for testing
global.WebSocket = MockWebSocket

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
})

// Mock storage module to prevent initialization errors in tests
vi.mock('@/lib/storage', () => ({
  initStorage: vi.fn().mockResolvedValue(undefined),
  getStorage: vi.fn().mockReturnValue({
    getItem: vi.fn().mockResolvedValue(null),
    setItem: vi.fn().mockResolvedValue(undefined),
    removeItem: vi.fn().mockResolvedValue(undefined),
  }),
  getSecureStorage: vi.fn().mockReturnValue({
    getItem: vi.fn().mockResolvedValue(null),
    setItem: vi.fn().mockResolvedValue(undefined),
    removeItem: vi.fn().mockResolvedValue(undefined),
  }),
  isStorageInitialized: vi.fn().mockReturnValue(true),
}))
