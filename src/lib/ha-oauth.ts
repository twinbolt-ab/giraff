// Home Assistant OAuth2 Authentication
// Implements the authorization code flow per https://developers.home-assistant.io/docs/auth_api/

import { STORAGE_KEYS } from './constants'
import { getStorage } from './storage'

// OAuth tokens from HA
export interface OAuthTokens {
  access_token: string
  refresh_token: string
  expires_in: number // seconds until expiry
  token_type: string
}

// Stored credentials include expiry timestamp
export interface StoredOAuthCredentials {
  access_token: string
  refresh_token: string
  expires_at: number // Unix timestamp (ms)
  ha_url: string
}

// Check if running as a native Capacitor app
export function isNativeApp(): boolean {
  if (typeof window === 'undefined') return false
  return !!(window as any).Capacitor?.isNativePlatform?.()
}

// Client ID for the app - must be a URL
// For native apps: We use twinbolt.se/giraff which has the redirect_uri link tag
// For web: We use the current origin
export function getClientId(haUrl?: string): string {
  // On native, use the website that has <link rel="redirect_uri" href="com.twinbolt.giraff:/">
  if (isNativeApp()) {
    return 'https://twinbolt.se/giraff'
  }

  // For web, use current origin
  if (typeof window !== 'undefined') {
    return window.location.origin
  }

  return 'https://twinbolt.se/giraff'
}

// Get the redirect URI for OAuth callback
export function getRedirectUri(haUrl?: string): string {
  // For native apps, use custom URL scheme
  if (isNativeApp()) {
    return 'com.twinbolt.giraff:/'
  }

  // For web, redirect back to our app
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/auth/callback`
  }

  return 'https://giraff.app/auth/callback'
}

// Exchange authorization code for tokens
export async function exchangeCodeForTokens(
  haUrl: string,
  code: string,
  codeVerifier?: string
): Promise<OAuthTokens> {
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    client_id: getClientId(haUrl),
  })

  // Add PKCE verifier if we used it
  if (codeVerifier) {
    body.set('code_verifier', codeVerifier)
  }

  const response = await fetch(`${haUrl}/auth/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Token exchange failed: ${error}`)
  }

  return response.json()
}

// Refresh the access token using refresh token
export async function refreshAccessToken(
  haUrl: string,
  refreshToken: string
): Promise<OAuthTokens> {
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: getClientId(haUrl),
  })

  const response = await fetch(`${haUrl}/auth/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  })

  if (!response.ok) {
    throw new Error('Token refresh failed')
  }

  return response.json()
}

// Revoke a refresh token (for logout)
export async function revokeToken(haUrl: string, token: string): Promise<void> {
  const body = new URLSearchParams({
    token,
    action: 'revoke',
  })

  await fetch(`${haUrl}/auth/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  })
  // Response is always 200 regardless of success
}

// Storage keys for OAuth
const OAUTH_STORAGE_KEYS = {
  CREDENTIALS: 'giraff-oauth-credentials',
  PENDING_STATE: 'giraff-oauth-state',
  PENDING_VERIFIER: 'giraff-oauth-verifier',
  PENDING_URL: 'giraff-oauth-pending-url',
} as const

// Store OAuth credentials
export async function storeOAuthCredentials(
  haUrl: string,
  tokens: OAuthTokens
): Promise<void> {
  const storage = getStorage()
  const credentials: StoredOAuthCredentials = {
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expires_at: Date.now() + tokens.expires_in * 1000,
    ha_url: haUrl,
  }
  await storage.setItem(OAUTH_STORAGE_KEYS.CREDENTIALS, JSON.stringify(credentials))
  // Mark setup as complete
  await storage.setItem(STORAGE_KEYS.SETUP_COMPLETE, 'true')
  // Also store URL in standard location for compatibility
  await storage.setItem(STORAGE_KEYS.HA_URL, haUrl)
}

// Get stored OAuth credentials
export async function getOAuthCredentials(): Promise<StoredOAuthCredentials | null> {
  const storage = getStorage()
  const stored = await storage.getItem(OAUTH_STORAGE_KEYS.CREDENTIALS)
  if (!stored) return null
  try {
    return JSON.parse(stored) as StoredOAuthCredentials
  } catch {
    return null
  }
}

// Check if OAuth credentials exist
export async function hasOAuthCredentials(): Promise<boolean> {
  const creds = await getOAuthCredentials()
  return creds !== null
}

// Clear OAuth credentials
export async function clearOAuthCredentials(): Promise<void> {
  const storage = getStorage()
  await storage.removeItem(OAUTH_STORAGE_KEYS.CREDENTIALS)
}

// Store pending OAuth state (for validation after redirect)
export async function storePendingOAuth(
  state: string,
  verifier: string | undefined,
  haUrl: string
): Promise<void> {
  const storage = getStorage()
  await storage.setItem(OAUTH_STORAGE_KEYS.PENDING_STATE, state)
  if (verifier) {
    await storage.setItem(OAUTH_STORAGE_KEYS.PENDING_VERIFIER, verifier)
  }
  await storage.setItem(OAUTH_STORAGE_KEYS.PENDING_URL, haUrl)
}

// Get and clear pending OAuth state
export async function getPendingOAuth(): Promise<{
  state: string | null
  verifier: string | null
  haUrl: string | null
}> {
  const storage = getStorage()
  const state = await storage.getItem(OAUTH_STORAGE_KEYS.PENDING_STATE)
  const verifier = await storage.getItem(OAUTH_STORAGE_KEYS.PENDING_VERIFIER)
  const haUrl = await storage.getItem(OAUTH_STORAGE_KEYS.PENDING_URL)
  return { state, verifier, haUrl }
}

// Clear pending OAuth state
export async function clearPendingOAuth(): Promise<void> {
  const storage = getStorage()
  await storage.removeItem(OAUTH_STORAGE_KEYS.PENDING_STATE)
  await storage.removeItem(OAUTH_STORAGE_KEYS.PENDING_VERIFIER)
  await storage.removeItem(OAUTH_STORAGE_KEYS.PENDING_URL)
}

// Get a valid access token, refreshing if needed
export async function getValidAccessToken(): Promise<{
  token: string
  haUrl: string
} | null> {
  const creds = await getOAuthCredentials()
  if (!creds) return null

  // Check if token is expired (with 60s buffer)
  const isExpired = Date.now() >= creds.expires_at - 60000

  if (!isExpired) {
    return { token: creds.access_token, haUrl: creds.ha_url }
  }

  // Token is expired, try to refresh
  try {
    const newTokens = await refreshAccessToken(creds.ha_url, creds.refresh_token)
    await storeOAuthCredentials(creds.ha_url, newTokens)
    return { token: newTokens.access_token, haUrl: creds.ha_url }
  } catch (error) {
    console.error('[OAuth] Token refresh failed:', error)
    // Clear invalid credentials
    await clearOAuthCredentials()
    return null
  }
}

// Check if using OAuth or long-lived token auth
export async function isUsingOAuth(): Promise<boolean> {
  return await hasOAuthCredentials()
}
