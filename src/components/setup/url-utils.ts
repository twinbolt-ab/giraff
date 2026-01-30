// Common HA URL patterns to try
export const COMMON_URLS = [
  { url: 'http://homeassistant.local:8123', label: 'homeassistant.local' },
  { url: 'http://homeassistant:8123', label: 'homeassistant' },
  { url: 'http://192.168.1.1:8123', label: '192.168.1.1' },
  { url: 'http://localhost:8123', label: 'localhost' },
]

// Generate URL variants to try (handles missing protocol, protocol switching, and port variations)
export function getUrlVariants(inputUrl: string): string[] {
  const trimmed = inputUrl.trim().replace(/\/+$/, '')

  // Check if URL has a protocol
  const hasHttp = trimmed.toLowerCase().startsWith('http://')
  const hasHttps = trimmed.toLowerCase().startsWith('https://')

  // Normalize to have a protocol for easier manipulation
  let baseUrl = trimmed
  let preferHttps = true

  if (!hasHttp && !hasHttps) {
    // No protocol - will try https first
    baseUrl = trimmed
  } else if (hasHttps) {
    baseUrl = trimmed.replace(/^https:\/\//i, '')
    preferHttps = true
  } else if (hasHttp) {
    baseUrl = trimmed.replace(/^http:\/\//i, '')
    preferHttps = false
  }

  // Check if URL has port 8123
  const hasPort8123 = /:8123(\/|$)/.test(baseUrl)
  const hasAnyPort = /:\d+(\/|$)/.test(baseUrl)

  // Generate port variants
  const portVariants: string[] = [baseUrl]
  if (hasPort8123) {
    // Has :8123 - also try without it
    portVariants.push(baseUrl.replace(/:8123/, ''))
  } else if (!hasAnyPort) {
    // No port - also try with :8123
    // Insert port before any path
    const slashIndex = baseUrl.indexOf('/')
    if (slashIndex > 0) {
      portVariants.push(baseUrl.slice(0, slashIndex) + ':8123' + baseUrl.slice(slashIndex))
    } else {
      portVariants.push(baseUrl + ':8123')
    }
  }

  // Generate protocol variants for each port variant
  const results: string[] = []
  for (const variant of portVariants) {
    if (preferHttps || (!hasHttp && !hasHttps)) {
      results.push(`https://${variant}`)
      results.push(`http://${variant}`)
    } else {
      results.push(`http://${variant}`)
      results.push(`https://${variant}`)
    }
  }

  // Remove duplicates while preserving order
  return [...new Set(results)]
}

// OAuth is always available - we handle HTTP via manual token exchange
export function isOAuthAvailable(_urlToCheck: string): boolean {
  return true
}
