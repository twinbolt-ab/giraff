import { useRef, useCallback } from 'react'

interface UseSwipeRightToCloseOptions {
  onClose: () => void
  /** Minimum horizontal distance to trigger (default: 80) */
  threshold?: number
  /** Horizontal/vertical ratio required (default: 1.5) */
  directionRatio?: number
}

interface TouchHandlers {
  onTouchStart: (e: React.TouchEvent) => void
  onTouchMove: (e: React.TouchEvent) => void
  onTouchEnd: (e: React.TouchEvent) => void
}

/**
 * Detects right swipe gestures to close panels that slide in from the right.
 */
export function useSwipeRightToClose({
  onClose,
  threshold = 80,
  directionRatio = 1.5,
}: UseSwipeRightToCloseOptions): TouchHandlers {
  const touchStartRef = useRef<{ x: number; y: number } | null>(null)

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0]
    touchStartRef.current = { x: touch.clientX, y: touch.clientY }
  }, [])

  const onTouchMove = useCallback(() => {
    // Could add visual feedback here if needed
  }, [])

  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!touchStartRef.current) return

      const touch = e.changedTouches[0]
      const deltaX = touch.clientX - touchStartRef.current.x
      const deltaY = touch.clientY - touchStartRef.current.y

      // Close if swiped right with enough distance and horizontal dominance
      if (deltaX > threshold && Math.abs(deltaX) > Math.abs(deltaY) * directionRatio) {
        onClose()
      }

      touchStartRef.current = null
    },
    [onClose, threshold, directionRatio]
  )

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd,
  }
}
