import { useRef, useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { motion, useMotionValue, animate, useDragControls, PanInfo } from 'framer-motion'
import { useIsClient } from '@/lib/hooks/useIsClient'
import { useModalKeyboard } from '@/lib/hooks/useModalKeyboard'
import { useBodyScrollLock } from '@/lib/hooks/useBodyScrollLock'

const DEFAULT_DRAG_THRESHOLD = 150

interface BottomSheetProps {
  isOpen: boolean
  onClose: () => void
  children: ReactNode
  zIndex?: 100 | 110
  dragThreshold?: number
  disableClose?: boolean
}

export function BottomSheet({
  isOpen,
  onClose,
  children,
  zIndex = 100,
  dragThreshold = DEFAULT_DRAG_THRESHOLD,
  disableClose = false,
}: BottomSheetProps) {
  const isClient = useIsClient()
  const y = useMotionValue(0)
  const sheetRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const dragControls = useDragControls()
  const isDraggingFromContent = useRef(false)

  // Shared hooks for keyboard and scroll lock
  useModalKeyboard(isOpen, onClose, { disabled: disableClose })
  useBodyScrollLock(isOpen)

  // Reset y when opening
  useEffect(() => {
    if (isOpen) {
      y.set(0)
    }
  }, [isOpen, y])

  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur()
    }

    if (!disableClose && (info.offset.y > dragThreshold || info.velocity.y > 500)) {
      onClose()
    } else {
      animate(y, 0, { type: 'spring', damping: 30, stiffness: 400 })
    }
  }

  const startDrag = (event: React.PointerEvent) => {
    dragControls.start(event, { snapToCursor: false })
  }

  // Handle content area drag - only allow when scrolled to top
  const handleContentPointerDown = (event: React.PointerEvent) => {
    const content = contentRef.current
    if (content && content.scrollTop <= 0) {
      isDraggingFromContent.current = true
      dragControls.start(event, { snapToCursor: false })
    }
  }

  // Prevent touchmove when dragging from content to stop scroll interference
  useEffect(() => {
    const content = contentRef.current
    if (!content || !isOpen) return

    const handleTouchMove = (e: TouchEvent) => {
      if (isDraggingFromContent.current && content.scrollTop <= 0) {
        e.preventDefault()
      }
    }

    const handleTouchEnd = () => {
      isDraggingFromContent.current = false
    }

    content.addEventListener('touchmove', handleTouchMove, { passive: false })
    content.addEventListener('touchend', handleTouchEnd)
    content.addEventListener('touchcancel', handleTouchEnd)

    return () => {
      content.removeEventListener('touchmove', handleTouchMove)
      content.removeEventListener('touchend', handleTouchEnd)
      content.removeEventListener('touchcancel', handleTouchEnd)
    }
  }, [isOpen])

  if (!isClient) return null

  return createPortal(
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: isOpen ? 1 : 0 }}
        transition={{ duration: 0.2 }}
        style={{ pointerEvents: isOpen ? 'auto' : 'none', zIndex }}
        className="fixed inset-0 bg-black/40 backdrop-blur-sm"
        onClick={isOpen && !disableClose ? onClose : undefined}
      />

      {/* Bottom Sheet */}
      <motion.div
        ref={sheetRef}
        data-bottom-sheet
        initial={{ y: '100%' }}
        animate={{ y: isOpen ? 0 : '100%' }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 400 }}
        drag={isOpen ? 'y' : false}
        dragControls={dragControls}
        dragListener={false}
        dragConstraints={{ top: 0 }}
        dragElastic={{ top: 0.1, bottom: 0.6 }}
        onDragEnd={handleDragEnd}
        style={{
          y,
          pointerEvents: isOpen ? 'auto' : 'none',
          zIndex,
        }}
        className="fixed bottom-0 left-0 right-0 bg-card rounded-t-2xl shadow-warm-lg flex flex-col max-h-[90vh]"
      >
        {/* Handle bar - always draggable */}
        <div
          onPointerDown={startDrag}
          className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing touch-none"
        >
          <div className="w-10 h-1 bg-border rounded-full" />
        </div>

        {/* Content area */}
        <div
          ref={contentRef}
          onPointerDown={handleContentPointerDown}
          className="flex-1 overflow-y-auto overscroll-contain"
        >
          {children}
        </div>
      </motion.div>
    </>,
    document.body
  )
}
