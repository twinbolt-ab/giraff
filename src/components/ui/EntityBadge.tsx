import { EyeOff, Home } from 'lucide-react'
import { t } from '@/lib/i18n'

interface EntityBadgeProps {
  type: 'hidden' | 'no-room'
  className?: string
}

export function EntityBadge({ type, className = '' }: EntityBadgeProps) {
  if (type === 'hidden') {
    return (
      <span
        className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-xs rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 ${className}`}
      >
        <EyeOff className="w-3 h-3" />
        {t.allDevices.hiddenBadge}
      </span>
    )
  }

  return (
    <span
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-xs rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 ${className}`}
    >
      <Home className="w-3 h-3" />
      {t.allDevices.noRoomBadge}
    </span>
  )
}

interface EntityBadgesProps {
  isHidden?: boolean
  hasRoom?: boolean
  className?: string
}

/**
 * Convenience component to render both badges when applicable
 */
export function EntityBadges({ isHidden, hasRoom, className = '' }: EntityBadgesProps) {
  if (!isHidden && hasRoom !== false) return null

  return (
    <div className={`flex gap-1 flex-wrap ${className}`}>
      {isHidden && <EntityBadge type="hidden" />}
      {hasRoom === false && <EntityBadge type="no-room" />}
    </div>
  )
}
