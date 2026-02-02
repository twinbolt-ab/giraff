import { useState } from 'react'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { t } from '@/lib/i18n'
import { cleanupRoomOrderLabels } from '@/lib/metadata/cleanup'

interface RoomOrderSyncDisableDialogProps {
  isOpen: boolean
  onClose: () => void
  onDisabled: () => void
}

export function RoomOrderSyncDisableDialog({
  isOpen,
  onClose,
  onDisabled,
}: RoomOrderSyncDisableDialogProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleConfirm = async () => {
    setIsLoading(true)
    try {
      await cleanupRoomOrderLabels()
      onDisabled()
    } catch (error) {
      console.error('Failed to disable room order sync:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <ConfirmDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={handleConfirm}
      title={t.settings.advanced?.roomOrderSync?.disableTitle || 'Stop syncing room order?'}
      message={
        t.settings.advanced?.roomOrderSync?.disableMessage ||
        'This will remove room order labels from Home Assistant. Your room order will be kept locally on this device.'
      }
      confirmLabel={t.settings.advanced?.roomOrderSync?.disableConfirm || 'Stop syncing'}
      cancelLabel={t.common.cancel}
      variant="destructive"
      isLoading={isLoading}
    />
  )
}
