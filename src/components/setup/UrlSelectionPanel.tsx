import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import { t } from '@/lib/i18n'

interface Props {
  workingUrls: string[]
  selectedUrl: string | null
  onSelectUrl: (url: string) => void
  onTryAgain: () => void
  onConnect: () => void
}

export function UrlSelectionPanel({
  workingUrls,
  selectedUrl,
  onSelectUrl,
  onTryAgain,
  onConnect,
}: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2 }}
      className="overflow-hidden"
    >
      <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
            <Check className="w-4 h-4 text-green-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">
              {workingUrls.length === 1
                ? t.setup.url.foundAt || 'Found Home Assistant at:'
                : t.setup.url.foundMultiple || 'Found Home Assistant at multiple addresses:'}
            </p>
          </div>
        </div>

        {/* URL options */}
        <div className="space-y-2">
          {workingUrls.map((urlOption) => (
            <button
              key={urlOption}
              onClick={() => onSelectUrl(urlOption)}
              className={`w-full p-3 rounded-xl text-left transition-all ${
                selectedUrl === urlOption
                  ? 'bg-accent/20 border-2 border-accent'
                  : 'bg-card border border-border hover:border-accent/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    selectedUrl === urlOption ? 'border-accent bg-accent' : 'border-muted'
                  }`}
                >
                  {selectedUrl === urlOption && (
                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                  )}
                </div>
                <span className="font-mono text-sm text-foreground break-all">{urlOption}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Action buttons */}
        <div className="flex gap-3">
          <button
            onClick={onTryAgain}
            className="flex-1 py-3 px-4 bg-border/50 text-foreground rounded-xl font-medium hover:bg-border transition-colors text-sm"
          >
            {t.setup.url.tryAgain || 'Try again'}
          </button>
          <button
            onClick={onConnect}
            disabled={!selectedUrl}
            className="flex-1 py-3 px-4 bg-green-500 text-white rounded-xl font-medium hover:bg-green-600 transition-colors text-sm disabled:opacity-50"
          >
            {t.setup.url.selectAndConnect || 'Connect'}
          </button>
        </div>
      </div>
    </motion.div>
  )
}
