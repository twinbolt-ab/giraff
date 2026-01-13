import { Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import { ThemeProvider } from './providers/ThemeProvider'
import { useDeepLinks } from './lib/hooks/useDeepLinks'
import Home from './routes/Home'
import Setup from './routes/Setup'
import AuthCallback from './routes/AuthCallback'

function App() {
  // Handle deep links on native platforms
  useDeepLinks()

  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 1000,
            refetchOnWindowFocus: false,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <main className="min-h-screen">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/setup" element={<Setup />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </ThemeProvider>
    </QueryClientProvider>
  )
}

export default App
