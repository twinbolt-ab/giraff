import { motion } from 'framer-motion'
import { X } from 'lucide-react'
import { useTheme } from '@/providers/ThemeProvider'
import { useEditMode } from '@/lib/contexts/EditModeContext'
import { t, interpolate } from '@/lib/i18n'

interface EditModeHeaderProps {
  onEditClick: () => void
  onDone: () => void
}

export function EditModeHeader({ onEditClick, onDone }: EditModeHeaderProps) {
  const { resolvedTheme } = useTheme()
  const {
    isDeviceEditMode,
    isUncategorizedEditMode,
    selectedCount,
    clearSelection,
  } = useEditMode()

  const isDark = resolvedTheme === 'dark'

  return (
    <motion.div
      initial={{ y: 60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 60, opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 400 }}
      className="fixed left-4 right-4 z-20 rounded-2xl shadow-lg"
      style={{
        bottom: 'calc(5rem + env(safe-area-inset-bottom, 0px) + 10px)',
        background: isDark ? 'rgba(38, 38, 36, 0.75)' : 'rgba(255, 255, 255, 0.75)',
        backdropFilter: 'saturate(180%) blur(20px)',
        WebkitBackdropFilter: 'saturate(180%) blur(20px)',
        border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
      }}
    >
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          {/* Selection count */}
          {selectedCount > 0 && (
            <>
              <button
                onClick={clearSelection}
                className="p-1 rounded-full hover:bg-accent/20 transition-colors"
                aria-label="Clear selection"
              >
                <X className="w-4 h-4 text-accent" />
              </button>
              <span className="text-sm font-semibold text-accent">
                {interpolate(t.bulkEdit.selected, { count: selectedCount })}
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          {selectedCount > 0 && (
            <button
              onClick={onEditClick}
              className="px-3 py-1.5 rounded-full bg-accent text-white text-sm font-medium hover:bg-accent/90 transition-colors"
            >
              {selectedCount === 1
                ? (isDeviceEditMode || isUncategorizedEditMode)
                  ? t.bulkEdit.editDevice
                  : t.bulkEdit.editRoom
                : t.bulkEdit.editSelected}
            </button>
          )}
          <button
            onClick={onDone}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full text-foreground text-sm font-medium transition-colors"
            style={{
              background: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)',
            }}
          >
            {t.editMode.done}
          </button>
        </div>
      </div>
    </motion.div>
  )
}
