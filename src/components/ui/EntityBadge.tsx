import { EyeOff, Eye, Home } from 'lucide-react'
import { t } from '@/lib/i18n'

interface EntityBadgeProps {
  type: 'hidden-stuga' | 'hidden-ha' | 'no-room'
  className?: string
}

export function EntityBadge({ type, className = '' }: EntityBadgeProps) {
  if (type === 'hidden-stuga') {
    return (
      <span
        className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-xs rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 ${className}`}
      >
        <EyeOff className="w-3 h-3" />
        {t.allDevices.hiddenInStugaBadge}
      </span>
    )
  }

  if (type === 'hidden-ha') {
    return (
      <span
        className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-xs rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 ${className}`}
      >
        <Eye className="w-3 h-3" />
        {t.allDevices.hiddenInHABadge}
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
  isHiddenInStuga?: boolean
  isHiddenInHA?: boolean
  hasRoom?: boolean
  className?: string
}

/**
 * Convenience component to render all badges when applicable
 */
export function EntityBadges({
  isHiddenInStuga,
  isHiddenInHA,
  hasRoom,
  className = '',
}: EntityBadgesProps) {
  if (!isHiddenInStuga && !isHiddenInHA && hasRoom !== false) return null

  return (
    <div className={`flex gap-1 flex-wrap ${className}`}>
      {isHiddenInStuga && <EntityBadge type="hidden-stuga" />}
      {isHiddenInHA && <EntityBadge type="hidden-ha" />}
      {hasRoom === false && <EntityBadge type="no-room" />}
    </div>
  )
}
