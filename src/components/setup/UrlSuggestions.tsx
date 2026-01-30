import { Loader2, Check, X, Wifi } from 'lucide-react'
import { t } from '@/lib/i18n'
import { type UrlSuggestion } from './types'

interface Props {
  suggestions: UrlSuggestion[]
  selectedUrl: string
  isProbing: boolean
  onSelectUrl: (url: string, verified: boolean) => void
}

export function UrlSuggestions({ suggestions, selectedUrl, isProbing, onSelectUrl }: Props) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted uppercase tracking-wide">
        {isProbing ? t.setup.url.scanning : t.setup.url.commonUrls}
      </p>
      <div className="grid grid-cols-2 gap-2">
        {suggestions.map((suggestion) => (
          <button
            key={suggestion.url}
            onClick={() => {
              onSelectUrl(suggestion.url, suggestion.status === 'success')
            }}
            disabled={suggestion.status === 'checking'}
            className={`
              flex items-center gap-2 px-3 py-2 rounded-lg text-left text-sm transition-all
              ${
                selectedUrl === suggestion.url
                  ? 'bg-accent/20 ring-2 ring-accent'
                  : suggestion.status === 'success'
                    ? 'bg-green-500/10 hover:bg-green-500/20 ring-1 ring-green-500/30'
                    : suggestion.status === 'failed'
                      ? 'bg-border/30 text-muted'
                      : 'bg-border/50'
              }
            `}
          >
            {/* Status indicator */}
            <div className="flex-shrink-0">
              {suggestion.status === 'checking' ? (
                <Loader2 className="w-4 h-4 animate-spin text-muted" />
              ) : suggestion.status === 'success' ? (
                <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center">
                  <Check className="w-2.5 h-2.5 text-white" />
                </div>
              ) : suggestion.status === 'failed' ? (
                <div className="w-4 h-4 rounded-full bg-border flex items-center justify-center">
                  <X className="w-2.5 h-2.5 text-muted" />
                </div>
              ) : (
                <Wifi className="w-4 h-4 text-muted" />
              )}
            </div>
            <span
              className={`truncate ${suggestion.status === 'success' ? 'text-foreground font-medium' : ''}`}
            >
              {suggestion.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
