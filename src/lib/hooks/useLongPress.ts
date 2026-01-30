import { useRef, useCallback, useEffect } from 'react'
import { haptic } from '@/lib/haptics'

interface LongPressEvent {
  /** Pointer X position when long-press triggered */
  clientX: number
  /** Pointer Y position when long-press triggered */
  clientY: number
  /** The original target element */
  target: EventTarget | null
}

interface UseLongPressOptions {
  /** Duration in ms before long-press triggers (default: 500) */
  duration?: number
  /** Movement threshold in px that cancels the long-press (default: 10) */
  moveThreshold?: number
  /** Whether the long-press is disabled */
  disabled?: boolean
  /** Callback when long-press triggers - receives position info */
  onLongPress: (event?: LongPressEvent) => void
}

interface UseLongPressReturn {
  /** Whether a long-press was triggered (use to prevent click handling) - access .current */
  didLongPress: boolean
  /** Ref for checking if long-press triggered in callbacks */
  didLongPressRef: React.RefObject<boolean>
  /** Call on pointer down to start detecting */
  onPointerDown: (e: React.PointerEvent) => void
  /** Call on pointer move to check for cancellation */
  onPointerMove: (e: React.PointerEvent) => void
  /** Call on pointer up to clean up */
  onPointerUp: () => void
}

export function useLongPress({
  duration = 500,
  moveThreshold = 10,
  disabled = false,
  onLongPress,
}: UseLongPressOptions): UseLongPressReturn {
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const didLongPressRef = useRef(false)
  const startPosRef = useRef<{ x: number; y: number } | null>(null)
  const targetRef = useRef<EventTarget | null>(null)

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      didLongPressRef.current = false
      startPosRef.current = { x: e.clientX, y: e.clientY }
      targetRef.current = e.target
      clearTimer()

      if (disabled) return

      timerRef.current = setTimeout(() => {
        didLongPressRef.current = true
        haptic.medium()
        onLongPress({
          clientX: startPosRef.current?.x ?? 0,
          clientY: startPosRef.current?.y ?? 0,
          target: targetRef.current,
        })
      }, duration)
    },
    [disabled, duration, onLongPress, clearTimer]
  )

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!timerRef.current || !startPosRef.current) return

      const dx = Math.abs(e.clientX - startPosRef.current.x)
      const dy = Math.abs(e.clientY - startPosRef.current.y)

      if (dx > moveThreshold || dy > moveThreshold) {
        clearTimer()
      }
    },
    [moveThreshold, clearTimer]
  )

  const handlePointerUp = useCallback(() => {
    clearTimer()
    startPosRef.current = null
  }, [clearTimer])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTimer()
    }
  }, [clearTimer])

  return {
    get didLongPress() {
      return didLongPressRef.current
    },
    didLongPressRef,
    onPointerDown: handlePointerDown,
    onPointerMove: handlePointerMove,
    onPointerUp: handlePointerUp,
  }
}
