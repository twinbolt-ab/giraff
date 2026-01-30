import { useState, useRef, useCallback } from 'react'
import { useDevMode } from './useDevMode'

interface UseDevModeActivationReturn {
  /** Call this on each click of the activation target */
  handleClick: () => void
  /** Whether the toast should be shown */
  showToast: boolean
}

/**
 * Hook for enabling dev mode via repeated clicks.
 * Requires 10 clicks within 2 seconds of each other.
 */
export function useDevModeActivation(): UseDevModeActivationReturn {
  const { isDevMode, enableDevMode } = useDevMode()
  const [clickCount, setClickCount] = useState(0)
  const [showToast, setShowToast] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleClick = useCallback(() => {
    if (isDevMode) return // Already in dev mode

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    const newCount = clickCount + 1
    setClickCount(newCount)

    if (newCount >= 10) {
      enableDevMode()
      setClickCount(0)
      setShowToast(true)
      setTimeout(() => {
        setShowToast(false)
      }, 2000)
    } else {
      // Reset counter after 2s of inactivity
      timeoutRef.current = setTimeout(() => {
        setClickCount(0)
      }, 2000)
    }
  }, [clickCount, isDevMode, enableDevMode])

  return {
    handleClick,
    showToast,
  }
}
