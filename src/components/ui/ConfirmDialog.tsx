import { useEffect } from 'react'
import { AnimatePresence } from 'framer-motion'
import { AlertTriangle } from 'lucide-react'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { ModalActions } from '@/components/ui/ModalActions'
import { haptic } from '@/lib/haptics'

interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'default' | 'destructive'
  isLoading?: boolean
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel,
  cancelLabel,
  variant = 'default',
  isLoading = false,
}: ConfirmDialogProps) {
  const isDestructive = variant === 'destructive'

  // Haptic feedback when destructive dialog opens
  useEffect(() => {
    if (isOpen && isDestructive) {
      haptic.warning()
    }
  }, [isOpen, isDestructive])

  return (
    <AnimatePresence>
      {isOpen && (
        <BottomSheet isOpen={isOpen} onClose={onClose} zIndex={110} disableClose={isLoading}>
          {/* Content */}
          <div className="px-4 py-4 pb-safe">
            {/* Icon for destructive actions */}
            {isDestructive && (
              <div className="flex justify-center mb-4">
                <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-500" />
                </div>
              </div>
            )}

            {/* Title */}
            <h2 className="text-lg font-semibold text-foreground text-center mb-2">{title}</h2>

            {/* Message */}
            <p className="text-sm text-muted text-center mb-6">{message}</p>

            {/* Buttons */}
            <ModalActions
              onCancel={onClose}
              onConfirm={onConfirm}
              cancelLabel={cancelLabel}
              confirmLabel={confirmLabel}
              isLoading={isLoading}
              variant={variant}
            />
          </div>
        </BottomSheet>
      )}
    </AnimatePresence>
  )
}
