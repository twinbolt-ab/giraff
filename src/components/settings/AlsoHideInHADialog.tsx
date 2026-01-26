import { useState } from 'react'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { syncStugaHiddenToHA } from '@/lib/ha-websocket'
import { t } from '@/lib/i18n'

interface AlsoHideInHADialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  variant: 'enable' | 'disable'
}

export function AlsoHideInHADialog({
  isOpen,
  onClose,
  onConfirm,
  variant,
}: AlsoHideInHADialogProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleConfirm = async () => {
    setIsLoading(true)
    try {
      if (variant === 'enable') {
        // Sync all Stuga-hidden entities to also be hidden in HA
        await syncStugaHiddenToHA(true)
      } else {
        // Unhide all Stuga-hidden entities from HA
        await syncStugaHiddenToHA(false)
      }
      onConfirm()
    } catch (error) {
      console.error('Failed to sync hidden state:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const isEnable = variant === 'enable'

  return (
    <ConfirmDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={handleConfirm}
      title={isEnable ? t.settings.alsoHideInHA.enableTitle : t.settings.alsoHideInHA.disableTitle}
      message={
        isEnable ? t.settings.alsoHideInHA.enableMessage : t.settings.alsoHideInHA.disableMessage
      }
      confirmLabel={
        isEnable ? t.settings.alsoHideInHA.enableConfirm : t.settings.alsoHideInHA.disableConfirm
      }
      variant={isEnable ? 'default' : 'destructive'}
      isLoading={isLoading}
    />
  )
}
