import { ReactNode } from 'react'
import { clsx } from 'clsx'

interface SubMenuItemProps {
  icon: ReactNode
  title: string
  description?: string
  onClick?: () => void
  rightElement?: ReactNode
}

export function SubMenuItem({ icon, title, description, onClick, rightElement }: SubMenuItemProps) {
  const content = (
    <>
      <div className="p-2 rounded-lg bg-border/50">{icon}</div>
      <div className="flex-1 text-left">
        <p className="text-sm font-medium text-foreground">{title}</p>
        {description && <p className="text-xs text-muted">{description}</p>}
      </div>
      {rightElement}
    </>
  )

  if (onClick) {
    return (
      <button
        onClick={onClick}
        className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-border/30 transition-colors touch-feedback"
      >
        {content}
      </button>
    )
  }

  return <div className="flex items-center gap-3 px-3 py-3 rounded-xl">{content}</div>
}

interface StatusBadgeProps {
  enabled: boolean
  enabledLabel: string
  disabledLabel: string
}

export function StatusBadge({ enabled, enabledLabel, disabledLabel }: StatusBadgeProps) {
  return (
    <div
      className={clsx(
        'px-2 py-0.5 text-xs font-medium rounded-full transition-colors',
        enabled ? 'bg-accent/15 text-accent' : 'bg-border/50 text-muted'
      )}
    >
      {enabled ? enabledLabel : disabledLabel}
    </div>
  )
}

interface ToggleSwitchProps {
  checked: boolean
}

export function ToggleSwitch({ checked }: ToggleSwitchProps) {
  return (
    <div
      className={clsx(
        'w-10 h-6 rounded-full transition-colors relative',
        checked ? 'bg-accent' : 'bg-border'
      )}
    >
      <div
        className={clsx(
          'absolute top-1 w-4 h-4 rounded-full bg-white transition-transform',
          checked ? 'translate-x-5' : 'translate-x-1'
        )}
      />
    </div>
  )
}
