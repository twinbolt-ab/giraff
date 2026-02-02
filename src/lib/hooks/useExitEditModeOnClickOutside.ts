import { useEffect, useCallback } from 'react'

interface UseExitEditModeOnClickOutsideOptions {
  /** Whether edit mode is currently active */
  isActive: boolean
  /** Callback to exit edit mode */
  onExit: () => void
  /** CSS selectors for elements that should NOT trigger exit when clicked */
  excludeSelectors?: string[]
  /** Delay in ms before attaching listener (prevents immediate exit when entering edit mode) */
  delay?: number
}

/**
 * Hook to exit edit mode when clicking outside specified elements.
 *
 * Attaches a document-level pointerdown listener that calls onExit when
 * the user clicks outside any element matching the exclude selectors.
 */
export function useExitEditModeOnClickOutside({
  isActive,
  onExit,
  excludeSelectors = [],
  delay = 100,
}: UseExitEditModeOnClickOutsideOptions) {
  const handlePointerDown = useCallback(
    (e: PointerEvent) => {
      const target = e.target as HTMLElement

      // Check if click is on any excluded element
      for (const selector of excludeSelectors) {
        if (target.closest(selector)) {
          return
        }
      }

      // Clicked outside all excluded elements - exit edit mode
      onExit()
    },
    [excludeSelectors, onExit]
  )

  useEffect(() => {
    if (!isActive) return

    // Use a small delay to avoid immediately exiting when entering edit mode
    const timer = setTimeout(() => {
      document.addEventListener('pointerdown', handlePointerDown)
    }, delay)

    return () => {
      clearTimeout(timer)
      document.removeEventListener('pointerdown', handlePointerDown)
    }
  }, [isActive, handlePointerDown, delay])
}
