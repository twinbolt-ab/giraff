import type { Metadata, Viewport } from 'next'
import { Providers } from './providers'
import './globals.css'

export const metadata: Metadata = {
  title: 'Giraff',
  description: 'A beautiful Home Assistant dashboard',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Giraff',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover', // Enable safe area insets on iOS
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FAFAF9' },
    { media: '(prefers-color-scheme: dark)', color: '#0D0D0C' },
  ],
}

// Check if running as a Home Assistant add-on
const isHAAddon = !!process.env.SUPERVISOR_TOKEN

// Script to inject add-on credentials into the page
const addonScript = isHAAddon
  ? `window.__HA_ADDON__=true;window.__HA_URL__="http://supervisor/core";window.__HA_TOKEN__="${process.env.SUPERVISOR_TOKEN}";`
  : ''

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {isHAAddon && (
          <script dangerouslySetInnerHTML={{ __html: addonScript }} />
        )}
      </head>
      <body className="min-h-screen">
        <Providers>
          <main className="min-h-screen">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  )
}
