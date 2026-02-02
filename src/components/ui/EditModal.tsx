import { useEffect, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { t } from '@/lib/i18n'
import { haptic } from '@/lib/haptics'

interface EditModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: ReactNode
  zIndex?: 100 | 110
}

export function EditModal({ isOpen, onClose, title, children, zIndex }: EditModalProps) {
  // Haptic feedback when opening
  useEffect(() => {
    if (isOpen) {
      haptic.light()
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur()
      }
    }
  }, [isOpen])

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} zIndex={zIndex}>
      {/* Header - draggable via BottomSheet's handle */}
      <div className="flex items-center justify-between px-4 pb-4 border-b border-border">
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        <button
          onClick={onClose}
          className="p-2 -mr-2 rounded-full hover:bg-border/50 transition-colors touch-feedback"
          aria-label={t.settings.close}
        >
          <X className="w-5 h-5 text-muted" />
        </button>
      </div>

      {/* Content */}
      <div className="px-4 py-4 pb-safe">{children}</div>
    </BottomSheet>
  )
}
