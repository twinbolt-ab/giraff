import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { t } from '@/lib/i18n'

interface CustomOrderDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  isLoading?: boolean
}

/**
 * Dialog shown when enabling custom order.
 * Informs that stuga- prefixed labels will be added to HA.
 */
export function EnableCustomOrderDialog({
  isOpen,
  onClose,
  onConfirm,
}: CustomOrderDialogProps) {
  return (
    <ConfirmDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title={t.settings.advanced?.customOrder?.enableTitle || 'Enable custom order?'}
      message={
        t.settings.advanced?.customOrder?.enableMessage ||
        'Room and device order will be saved as labels in Home Assistant, prefixed with stuga-. This allows your order to sync across devices.'
      }
      confirmLabel={t.settings.advanced?.customOrder?.enableButton || 'Enable'}
      cancelLabel={t.common.cancel}
    />
  )
}

/**
 * Dialog shown when disabling custom order.
 * Warns that order data will be permanently deleted from HA.
 */
export function DisableCustomOrderDialog({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
}: CustomOrderDialogProps) {
  return (
    <ConfirmDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title={t.settings.advanced?.customOrder?.disableTitle || 'Disable custom order?'}
      message={
        t.settings.advanced?.customOrder?.disableMessage ||
        'This will permanently delete all saved room and device order from Home Assistant. This cannot be undone.'
      }
      confirmLabel={t.settings.advanced?.customOrder?.disableButton || 'Disable'}
      cancelLabel={t.common.cancel}
      variant="destructive"
      isLoading={isLoading}
    />
  )
}
