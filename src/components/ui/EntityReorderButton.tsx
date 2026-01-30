/**
 * EntityReorderButton - Toggle button for entering/exiting entity reorder mode
 *
 * Displays "Reorder" when not active, "Done" when active.
 * Uses Scandinavian minimal design with warm accent colors.
 */

import { GripVertical, Check } from 'lucide-react'
import { clsx } from 'clsx'

interface EntityReorderButtonProps {
  isReordering: boolean
  onClick: () => void
  className?: string
}

export function EntityReorderButton({
  isReordering,
  onClick,
  className,
}: EntityReorderButtonProps) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'flex items-center gap-2 px-3 py-1.5 rounded-lg',
        'text-sm font-medium transition-all',
        'touch-feedback',
        isReordering ? 'bg-accent text-white' : 'bg-border/50 text-foreground hover:bg-border',
        className
      )}
      aria-label={isReordering ? 'Done reordering' : 'Reorder entities'}
    >
      {isReordering ? (
        <>
          <Check className="w-4 h-4" />
          <span>Done</span>
        </>
      ) : (
        <>
          <GripVertical className="w-4 h-4" />
          <span>Reorder</span>
        </>
      )}
    </button>
  )
}
