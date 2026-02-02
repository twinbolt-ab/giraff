import { useEffect } from 'react'

/**
 * Handles keyboard events for modals (escape to close)
 */
export function useModalKeyboard(
  isOpen: boolean,
  onClose: () => void,
  options?: { disabled?: boolean }
): void {
  useEffect(() => {
    if (!isOpen || options?.disabled) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose, options?.disabled])
}
