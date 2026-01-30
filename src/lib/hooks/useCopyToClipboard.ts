import { useState, useCallback } from 'react'

interface UseCopyToClipboardReturn {
  copied: boolean
  copy: (text: string) => Promise<void>
}

export function useCopyToClipboard(resetDelay = 2000): UseCopyToClipboardReturn {
  const [copied, setCopied] = useState(false)

  const copy = useCallback(
    async (text: string) => {
      try {
        await navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), resetDelay)
      } catch {
        // Modern browsers should support clipboard API
        // If it fails, we simply don't copy
        console.warn('Clipboard API not available')
      }
    },
    [resetDelay]
  )

  return { copied, copy }
}
