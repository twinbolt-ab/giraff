import { type ConnectionErrorType } from '@/lib/connection-diagnostics'
import { t } from '@/lib/i18n'

// Map error types to user-friendly messages
export function getErrorMessage(errorType: ConnectionErrorType): string {
  const messages: Record<ConnectionErrorType, string> = {
    network: t.connectionError?.errorNetwork || 'Unable to reach Home Assistant',
    'ssl-error': t.connectionError?.errorSsl || 'SSL/TLS certificate error',
    'ssl-hostname-mismatch':
      t.connectionError?.errorSslHostname || "Certificate doesn't match hostname",
    'dns-resolution': t.connectionError?.errorDns || 'Could not resolve hostname',
    'websocket-blocked': t.connectionError?.errorWebsocket || 'WebSocket connection blocked',
    auth: t.connectionError?.errorAuth || 'Authentication failed',
    'server-down': t.connectionError?.errorServerDown || 'Home Assistant is not responding',
    unknown: t.setup.url.error,
  }
  return messages[errorType]
}

export function getTroubleshootingTip(errorType: ConnectionErrorType): string {
  const tips: Record<ConnectionErrorType, string> = {
    network:
      t.connectionError?.troubleshootNetwork ||
      'Check your network connection and verify the Home Assistant URL is correct.',
    'ssl-error':
      t.connectionError?.troubleshootSsl ||
      'The SSL certificate could not be verified. This may happen with self-signed certificates or expired certificates.',
    'ssl-hostname-mismatch':
      t.connectionError?.troubleshootSslHostname ||
      "The SSL certificate doesn't match the server address. If you use DNS rebinding (local DNS override), check if your phone has Private DNS enabled in Settings → Network → Private DNS and try disabling it.",
    'dns-resolution':
      t.connectionError?.troubleshootDns ||
      'The hostname could not be resolved. Check that the address is correct and that you have internet connectivity.',
    'websocket-blocked':
      t.connectionError?.troubleshootWebsocket ||
      'WebSocket connections may be blocked by your network or proxy. Try connecting from a different network.',
    auth:
      t.connectionError?.troubleshootAuth ||
      'Your access token may have expired or is invalid. Try reconnecting with a new token.',
    'server-down':
      t.connectionError?.troubleshootServerDown ||
      'Home Assistant may be restarting or offline. Check that it is running and try again.',
    unknown:
      t.connectionError?.troubleshootUnknown ||
      'An unexpected error occurred. Check your connection settings and try again.',
  }
  return tips[errorType]
}

// Detailed troubleshooting steps for each error type
export function getTroubleshootingSteps(errorType: ConnectionErrorType): string[] {
  const steps: Record<ConnectionErrorType, string[]> = {
    network: [
      'Check that your device is connected to the internet or local network',
      'Verify the Home Assistant URL is correct (e.g., http://homeassistant.local:8123)',
      'Make sure Home Assistant is running and accessible',
      "If using a local address, ensure you're on the same network as Home Assistant",
      'Try accessing the URL directly in a web browser to verify it works',
    ],
    'ssl-error': [
      'The SSL/TLS certificate could not be verified',
      'If using a self-signed certificate, try accessing the URL in a browser first and accept the certificate warning',
      'Check if your certificate has expired and needs renewal',
      "If using Let's Encrypt, verify the certificate is properly configured",
      'Try using HTTP instead of HTTPS if your server supports it',
    ],
    'ssl-hostname-mismatch': [
      "The SSL certificate doesn't match the server address you're connecting to",
      "If you're using DNS rebinding (router maps your domain to a local IP), your phone may be using a different DNS server",
      'On Android: Go to Settings → Network & Internet → Private DNS and set it to "Off" to use your router\'s DNS',
      'On Samsung: Settings → Connections → More → Private DNS → Off',
      'Alternatively, try connecting via the local IP address with HTTP instead',
      "If using Nabu Casa or similar, ensure you're using the correct external URL",
    ],
    'dns-resolution': [
      'The hostname could not be resolved to an IP address',
      'Check that you typed the address correctly',
      'If using a local hostname (like homeassistant.local), ensure mDNS is working on your network',
      'Try using the IP address directly instead of the hostname',
      'Check your internet connection',
      'If using custom DNS, verify it can resolve the hostname',
    ],
    'websocket-blocked': [
      'WebSocket connections are being blocked by your network or a proxy',
      "If you're on a corporate or public WiFi, try using mobile data instead",
      'Check if you have a VPN running that might block WebSocket connections',
      'If using a reverse proxy (like nginx), ensure WebSocket upgrade is enabled',
      'Add these lines to your nginx config:\n  proxy_http_version 1.1;\n  proxy_set_header Upgrade $http_upgrade;\n  proxy_set_header Connection "upgrade";',
      'If using Cloudflare, ensure WebSockets are enabled in your dashboard',
    ],
    auth: [
      'Your access token may have expired or is invalid',
      'Go to Home Assistant → Profile → Security → Long-Lived Access Tokens',
      'Create a new token and try connecting again',
      'Make sure you copied the entire token without any extra spaces',
    ],
    'server-down': [
      'Home Assistant appears to be offline or not responding',
      'Check if Home Assistant is running on your server',
      'Try restarting Home Assistant from the command line or web interface',
      'Check the Home Assistant logs for any errors',
      'Verify the port number is correct (default is 8123)',
    ],
    unknown: [
      'An unexpected error occurred during connection',
      'Try the connection again - it may be a temporary issue',
      'Check the Home Assistant logs for more details',
      'Restart Home Assistant and try again',
      'If the problem persists, check the Home Assistant community forums',
    ],
  }
  return steps[errorType]
}
