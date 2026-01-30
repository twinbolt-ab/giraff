import { type ConnectionErrorType } from '@/lib/connection-diagnostics'
import { getTroubleshootingTip, getTroubleshootingSteps } from './error-messages'

interface Props {
  errorType: ConnectionErrorType
}

export function TroubleshootingHelpContent({ errorType }: Props) {
  const steps = getTroubleshootingSteps(errorType)

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">{getTroubleshootingTip(errorType)}</p>

      <div className="space-y-3">
        <p className="text-xs font-medium text-muted uppercase tracking-wide">Things to try:</p>
        <ul className="space-y-3">
          {steps.map((step, index) => (
            <li key={index} className="flex gap-3 text-sm">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-accent/10 text-accent text-xs font-medium flex items-center justify-center">
                {index + 1}
              </span>
              <span className="text-foreground/90 whitespace-pre-wrap">{step}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
