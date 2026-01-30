import { useState } from 'react'
import { motion } from 'framer-motion'
import { Loader2, Check, X, AlertCircle, ShieldOff, ServerOff, RefreshCw } from 'lucide-react'
import { t } from '@/lib/i18n'
import { EditModal } from '@/components/ui/EditModal'
import { type LiveDiagnosticState, type DiagnosticStatus } from './types'
import { getErrorMessage, getTroubleshootingTip } from './error-messages'
import { TroubleshootingHelpContent } from './TroubleshootingHelpContent'

interface Props {
  state: LiveDiagnosticState
  onRetry: () => void
}

export function DiagnosticDetails({ state, onRetry }: Props) {
  const [showHelp, setShowHelp] = useState(false)
  const { httpsStatus, websocketStatus, errorType } = state
  const isComplete = httpsStatus !== 'checking' && websocketStatus !== 'checking'
  const hasFailed = httpsStatus === 'failed' || websocketStatus === 'failed'

  const getIcon = () => {
    if (!isComplete) return <Loader2 className="w-6 h-6 animate-spin" />
    if (!hasFailed) return <Check className="w-6 h-6" />
    switch (errorType) {
      case 'network':
      case 'server-down':
      case 'dns-resolution':
        return <ServerOff className="w-6 h-6" />
      case 'websocket-blocked':
      case 'auth':
      case 'ssl-error':
      case 'ssl-hostname-mismatch':
        return <ShieldOff className="w-6 h-6" />
      default:
        return <AlertCircle className="w-6 h-6" />
    }
  }

  const getStatusDisplay = (status: DiagnosticStatus) => {
    switch (status) {
      case 'checking':
        return (
          <span className="flex items-center gap-1.5 text-muted">
            <Loader2 className="w-4 h-4 animate-spin" />
            Checking...
          </span>
        )
      case 'success':
        return (
          <span className="flex items-center gap-1.5 text-green-500">
            <Check className="w-4 h-4" />
            {t.connectionError?.statusOk || 'OK'}
          </span>
        )
      case 'failed':
        return (
          <span className="flex items-center gap-1.5 text-red-500">
            <X className="w-4 h-4" />
            {t.connectionError?.statusFailed || 'Failed'}
          </span>
        )
      default:
        return <span className="text-muted">—</span>
    }
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        {/* Error Header - only show when complete and failed */}
        {isComplete && hasFailed && errorType && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl"
          >
            <div className="text-red-500 flex-shrink-0">{getIcon()}</div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground">{getErrorMessage(errorType)}</p>
              <p className="text-sm text-muted mt-1">{getTroubleshootingTip(errorType)}</p>
              {/* Troubleshooting button */}
              <button
                onClick={() => setShowHelp(true)}
                className="text-xs text-muted hover:text-foreground underline underline-offset-2 transition-colors mt-2"
              >
                Troubleshooting
              </button>
            </div>
          </motion.div>
        )}

        {/* Diagnostic Details - show during checking and after */}
        <div className="p-4 bg-card border border-border rounded-xl space-y-3">
          <div className="flex items-center gap-2">
            {!isComplete && <Loader2 className="w-4 h-4 animate-spin text-accent" />}
            <p className="text-xs font-medium text-muted uppercase tracking-wide">
              {isComplete
                ? t.connectionError?.diagnosticDetails || 'Diagnostic Details'
                : 'Checking connection...'}
            </p>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-muted">
                {t.connectionError?.httpsStatus || 'Server reachable'}
              </span>
              {getStatusDisplay(httpsStatus)}
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted">
                {t.connectionError?.websocketStatus || 'WebSocket'}
              </span>
              {getStatusDisplay(websocketStatus)}
            </div>
          </div>
        </div>

        {/* Retry Button - only show when complete and failed */}
        {isComplete && hasFailed && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={onRetry}
            className="w-full py-3 px-4 bg-accent/10 text-accent hover:bg-accent/20 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            {t.connectionError?.retry || 'Retry'}
          </motion.button>
        )}
      </motion.div>

      {/* Troubleshooting Help Modal */}
      {errorType && (
        <EditModal
          isOpen={showHelp}
          onClose={() => setShowHelp(false)}
          title="Troubleshooting Help"
        >
          <TroubleshootingHelpContent errorType={errorType} />
        </EditModal>
      )}
    </>
  )
}
