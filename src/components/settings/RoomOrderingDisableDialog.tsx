import { useState } from 'react'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { t } from '@/lib/i18n'
import { useSettings } from '@/lib/hooks/useSettings'
import { cleanupRoomOrderLabels } from '@/lib/metadata/cleanup'

interface RoomOrderingDisableDialogProps {
  isOpen: boolean
  onClose: () => void
  onDisabled: () => void
}

export function RoomOrderingDisableDialog({
  isOpen,
  onClose,
  onDisabled,
}: RoomOrderingDisableDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { setRoomOrderingEnabled } = useSettings()

  const handleConfirm = async () => {
    setIsLoading(true)
    try {
      // Clean up room order labels from Home Assistant
      await cleanupRoomOrderLabels()
      // Update setting
      setRoomOrderingEnabled(false)
      onDisabled()
    } catch (error) {
      console.error('Failed to disable room ordering:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <ConfirmDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={handleConfirm}
      title={t.roomOrdering?.disable?.title || 'Disable Room Ordering'}
      message={
        t.roomOrdering?.disable?.message ||
        "This will remove the hold-to-reorder feature and delete all room order data from Home Assistant. You can re-enable this later, but you'll need to set up your room order again."
      }
      confirmLabel={t.roomOrdering?.disable?.confirm || 'Disable'}
      cancelLabel={t.roomOrdering?.disable?.cancel || 'Cancel'}
      variant="destructive"
      isLoading={isLoading}
    />
  )
}
