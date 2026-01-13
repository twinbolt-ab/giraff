import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { App, type URLOpenListenerEvent } from '@capacitor/app'

/**
 * Hook to handle deep links on native platforms
 * Listens for giraff://auth/callback URLs and navigates to the auth callback route
 */
export function useDeepLinks() {
  const navigate = useNavigate()

  useEffect(() => {
    // Only set up listener on native platforms
    const isNative = (window as any).Capacitor?.isNativePlatform?.()
    if (!isNative) return

    const handleDeepLink = (event: URLOpenListenerEvent) => {
      // Parse the deep link URL
      // Format: giraff://auth/callback?code=xxx&state=xxx
      const url = new URL(event.url)

      if (url.host === 'auth' && url.pathname === '/callback') {
        // Navigate to auth callback with the query params
        navigate(`/auth/callback${url.search}`, { replace: true })
      }
    }

    // Add listener for app URL open events
    App.addListener('appUrlOpen', handleDeepLink)

    return () => {
      App.removeAllListeners()
    }
  }, [navigate])
}
