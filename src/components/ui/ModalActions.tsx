import { t } from '@/lib/i18n'

interface ModalActionsProps {
  onCancel: () => void
  onConfirm: () => void
  cancelLabel?: string
  confirmLabel?: string
  isLoading?: boolean
  variant?: 'default' | 'destructive'
}

export function ModalActions({
  onCancel,
  onConfirm,
  cancelLabel,
  confirmLabel,
  isLoading = false,
  variant = 'default',
}: ModalActionsProps) {
  const isDestructive = variant === 'destructive'

  return (
    <div className="flex gap-3">
      <button
        onClick={onCancel}
        disabled={isLoading}
        className="flex-1 px-4 py-3 rounded-xl bg-border/50 text-foreground font-medium hover:bg-border transition-colors disabled:opacity-50"
      >
        {cancelLabel || t.common.cancel}
      </button>
      <button
        onClick={onConfirm}
        disabled={isLoading}
        className={`flex-1 px-4 py-3 rounded-xl font-medium transition-colors disabled:opacity-50 ${
          isDestructive
            ? 'bg-red-500 text-white hover:bg-red-600'
            : 'bg-accent text-white hover:bg-accent/90'
        }`}
      >
        {isLoading ? t.common.loading : confirmLabel || t.common.confirm}
      </button>
    </div>
  )
}
