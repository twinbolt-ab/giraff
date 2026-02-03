import { motion } from 'framer-motion'
import { useExitEditModeOnClickOutside } from '@/lib/hooks/useExitEditModeOnClickOutside'

interface EditModeContainerProps {
  isInEditMode: boolean
  onExitEditMode: () => void
  children: React.ReactNode
  excludeSelectors?: string[]
}

export function EditModeContainer({
  isInEditMode,
  onExitEditMode,
  children,
  excludeSelectors = [],
}: EditModeContainerProps) {
  useExitEditModeOnClickOutside({
    isActive: isInEditMode,
    onExit: onExitEditMode,
    excludeSelectors: [
      '[data-entity-id]',
      '[data-edit-mode-header]',
      '[data-edit-modal]',
      '[data-edit-backdrop]',
      ...excludeSelectors,
    ],
  })

  return (
    <div className="relative">
      {isInEditMode && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="absolute inset-0 bg-card/60 backdrop-blur-[2px] z-10 cursor-pointer"
          onClick={onExitEditMode}
          data-edit-backdrop
        />
      )}
      {children}
    </div>
  )
}
