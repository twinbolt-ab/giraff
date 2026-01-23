import { motion } from 'framer-motion'
import { X, Plus } from 'lucide-react'
import { useEditMode } from '@/lib/contexts/EditModeContext'
import { t, interpolate } from '@/lib/i18n'

interface EditModeHeaderProps {
  onEditClick: () => void
  onDone: () => void
  onAddFloor?: () => void
}

export function EditModeHeader({ onEditClick, onDone, onAddFloor }: EditModeHeaderProps) {
  const { isDeviceEditMode, isAllDevicesEditMode, isFloorEditMode, selectedCount } = useEditMode()

  // Floor edit mode has its own simpler UI
  if (isFloorEditMode) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
      >
        {/* Floating add button above the text card */}
        <motion.button
          initial={{ y: 60, scale: 0.8 }}
          animate={{ y: 0, scale: 1 }}
          exit={{ y: 60, scale: 0.8 }}
          transition={{ type: 'spring', damping: 25, stiffness: 400 }}
          onClick={onAddFloor}
          className="fixed right-4 z-20 floating-bar-above flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-accent text-white text-sm font-medium shadow-lg hover:bg-accent/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          {t.edit.createFloor}
        </motion.button>

        {/* Text card with close button and edit button */}
        <motion.div
          initial={{ y: 60 }}
          animate={{ y: 0 }}
          exit={{ y: 60 }}
          transition={{ type: 'spring', damping: 25, stiffness: 400 }}
          className="fixed left-4 right-4 z-20 floating-bar rounded-2xl shadow-lg glass"
        >
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2">
              <button
                onClick={onDone}
                className="p-1 rounded-full hover:bg-accent/20 transition-colors"
                aria-label="Exit floor edit mode"
              >
                <X className="w-4 h-4 text-accent" />
              </button>
              <span className="text-sm text-muted">{t.rooms.floorReorderHint}</span>
            </div>
            <button
              onClick={onEditClick}
              className="px-3 py-1.5 rounded-full bg-accent text-white text-sm font-medium hover:bg-accent/90 transition-colors"
            >
              {t.edit.editFloor}
            </button>
          </div>
        </motion.div>
      </motion.div>
    )
  }

  const isDeviceMode = isDeviceEditMode || isAllDevicesEditMode
  const editButtonLabel =
    selectedCount === 1
      ? isDeviceMode
        ? t.bulkEdit.editDevice
        : t.bulkEdit.editRoom
      : isDeviceMode
        ? t.bulkEdit.editDevices
        : t.bulkEdit.editRooms

  return (
    <motion.div
      initial={{ y: 60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 60, opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 400 }}
      className="fixed left-4 right-4 z-20 floating-bar rounded-2xl shadow-lg glass"
    >
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <button
            onClick={onDone}
            className="p-1 rounded-full hover:bg-accent/20 transition-colors"
            aria-label="Exit edit mode"
          >
            <X className="w-4 h-4 text-accent" />
          </button>
          {selectedCount > 0 && (
            <span className="text-sm font-semibold text-accent">
              {interpolate(t.bulkEdit.selected, { count: selectedCount })}
            </span>
          )}
        </div>

        {selectedCount > 0 && (
          <button
            onClick={onEditClick}
            className="px-3 py-1.5 rounded-full bg-accent text-white text-sm font-medium hover:bg-accent/90 transition-colors"
          >
            {editButtonLabel}
          </button>
        )}
      </div>
    </motion.div>
  )
}
