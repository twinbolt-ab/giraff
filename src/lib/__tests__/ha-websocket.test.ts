import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// We need to test the WebSocket class behavior
// Since it's a singleton, we'll test the key behaviors

describe('HAWebSocket', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('callService', () => {
    it('should return a Promise', async () => {
      // Import fresh instance
      const { haWebSocket } = await import('../ha-websocket')

      // Mock the send method
      const sendSpy = vi.spyOn(haWebSocket as any, 'send').mockImplementation(() => {})

      // Call the service
      const promise = haWebSocket.callService('light', 'turn_on', { entity_id: 'light.test' })

      // Verify it returns a Promise
      expect(promise).toBeInstanceOf(Promise)

      // Clean up
      sendSpy.mockRestore()
    })

    it('should send correct message format', async () => {
      const { haWebSocket } = await import('../ha-websocket')

      let sentMessage: any = null
      const sendSpy = vi.spyOn(haWebSocket as any, 'send').mockImplementation((msg: any) => {
        sentMessage = msg
      })

      haWebSocket.callService('light', 'turn_on', { entity_id: 'light.living_room' })

      expect(sentMessage).toMatchObject({
        type: 'call_service',
        domain: 'light',
        service: 'turn_on',
        service_data: { entity_id: 'light.living_room' },
      })
      expect(sentMessage.id).toBeDefined()

      sendSpy.mockRestore()
    })
  })

  describe('registerCallback', () => {
    it('should timeout after specified duration', async () => {
      const { haWebSocket } = await import('../ha-websocket')

      const callback = vi.fn()

      // Access private method
      ;(haWebSocket as any).registerCallback(999, callback, 5000)

      // Callback should not be called immediately
      expect(callback).not.toHaveBeenCalled()

      // Advance timer past timeout
      vi.advanceTimersByTime(5001)

      // Callback should be called with timeout error
      expect(callback).toHaveBeenCalledWith(
        false,
        undefined,
        { code: 'timeout', message: 'Request timed out' }
      )
    })
  })

  describe('disconnect', () => {
    it('should clear pending callbacks on disconnect', async () => {
      const { haWebSocket } = await import('../ha-websocket')

      const callback = vi.fn()

      // Register a callback
      ;(haWebSocket as any).registerCallback(888, callback, 30000)

      // Disconnect
      haWebSocket.disconnect()

      // Callback should be called with disconnected error
      expect(callback).toHaveBeenCalledWith(
        false,
        undefined,
        { code: 'disconnected', message: 'WebSocket disconnected' }
      )
    })
  })
})
