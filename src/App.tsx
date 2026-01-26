import { useEffect } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { ThemeProvider } from './providers/ThemeProvider'
import { ToastProvider } from './providers/ToastProvider'
import { ErrorBoundary } from './components/ui/ErrorBoundary'
import { useDeepLinks } from './lib/hooks/useDeepLinks'
import { logScreenView } from './lib/analytics'
import Home from './routes/Home'
import Setup from './routes/Setup'
import AuthCallback from './routes/AuthCallback'

// Map routes to screen names for analytics
function getScreenName(pathname: string): string {
  switch (pathname) {
    case '/':
      return 'home'
    case '/setup':
      return 'setup'
    case '/auth/callback':
      return 'auth_callback'
    default:
      return 'unknown'
  }
}

function useScreenTracking() {
  const location = useLocation()

  useEffect(() => {
    void logScreenView(getScreenName(location.pathname))
  }, [location.pathname])
}

function App() {
  // Handle deep links on native platforms
  useDeepLinks()

  // Track screen views for analytics
  useScreenTracking()

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <ToastProvider>
          <main className="h-full bg-background flex flex-col overflow-hidden">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/setup" element={<Setup />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </ToastProvider>
      </ThemeProvider>
    </ErrorBoundary>
  )
}

export default App
