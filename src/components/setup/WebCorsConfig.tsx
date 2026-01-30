import { useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { t } from '@/lib/i18n'

export function WebCorsConfig() {
  const [copied, setCopied] = useState(false)
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://stuga.app'

  const configCode = `http:
  cors_allowed_origins:
    - ${origin}`

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(configCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback for older browsers that don't support navigator.clipboard
      const textarea = document.createElement('textarea')
      textarea.value = configCode
      document.body.appendChild(textarea)
      textarea.select()
      // eslint-disable-next-line @typescript-eslint/no-deprecated
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="p-4 bg-card border border-border rounded-xl space-y-3">
      <p className="text-sm font-medium text-foreground">{t.setup.url.webSetupTitle}</p>
      <p className="text-sm text-muted">{t.setup.url.webSetupNote}</p>
      <div className="relative">
        <pre className="text-xs bg-background p-3 pr-10 rounded-lg overflow-x-auto font-mono text-foreground/80">
          {configCode}
        </pre>
        <button
          onClick={handleCopy}
          className="absolute top-2 right-2 p-1.5 rounded-md hover:bg-border/50 transition-colors text-muted hover:text-foreground"
          title="Copy to clipboard"
        >
          {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
        </button>
      </div>
    </div>
  )
}
