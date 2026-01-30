/**
 * ReorderableList - Generic reorderable list component for vertical/flex-wrap layouts
 *
 * Supports entity reordering with long-press activation, wiggle animations, and spring physics.
 * Simplified version of ReorderableGrid for 1D lists.
 */

import { motion } from 'framer-motion'
import { clsx } from 'clsx'
import { useListDrag } from '@/lib/hooks/useListDrag'

interface ReorderableListProps<T> {
  items: T[]
  renderItem: (item: T, index: number, isDragging: boolean) => React.ReactNode
  onReorder: (items: T[]) => void
  getKey: (item: T) => string
  layout?: 'vertical' | 'flex-wrap'
  className?: string
  onDragEnd?: () => void
}

// Animation spring config
const SPRING_CONFIG = { stiffness: 500, damping: 30, mass: 0.8 }

export function ReorderableList<T>({
  items,
  renderItem,
  onReorder,
  getKey,
  layout = 'vertical',
  className,
  onDragEnd,
}: ReorderableListProps<T>) {
  const { orderedItems, draggedIndex, dragOffset, handlePointerDown } = useListDrag({
    items,
    getKey,
    onReorder,
    onDragEnd,
    immediateMode: true, // Drag starts immediately since we're already in reorder mode
  })

  return (
    <div
      className={clsx(
        layout === 'flex-wrap' ? 'flex flex-wrap gap-2' : 'flex flex-col gap-3',
        className
      )}
      style={{
        // Disable touch scrolling when dragging to prevent Android from intercepting touch events
        touchAction: draggedIndex !== null ? 'none' : 'auto',
      }}
    >
      {orderedItems.map((item, index) => {
        const isDragging = draggedIndex === index
        const shouldWiggle = draggedIndex !== null && !isDragging

        return (
          // Outer wrapper maintains position in flex flow for ghost placeholder
          <div key={getKey(item)} className="relative">
            {/* Ghost placeholder showing original position during drag */}
            {isDragging && (
              <motion.div
                className="absolute inset-0 rounded-lg border-2 border-dashed border-accent/40 bg-accent/5"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.6 }}
                transition={{ duration: 0.15 }}
              />
            )}

            <motion.div
              initial={false}
              animate={{
                x: isDragging ? dragOffset.x : 0,
                y: isDragging ? dragOffset.y : 0,
                scale: isDragging ? 1.05 : 1,
                boxShadow: isDragging ? '0 8px 24px rgba(0, 0, 0, 0.15)' : '0 0 0 rgba(0, 0, 0, 0)',
              }}
              transition={{
                x: isDragging ? { duration: 0 } : { type: 'spring', ...SPRING_CONFIG },
                y: isDragging ? { duration: 0 } : { type: 'spring', ...SPRING_CONFIG },
                scale: { duration: 0.15 },
                boxShadow: { duration: 0.15 },
              }}
              className={clsx('relative', isDragging && 'z-50')}
              style={{
                cursor: draggedIndex === null ? 'grab' : isDragging ? 'grabbing' : 'grab',
                // Prevent Android from capturing touch events for scrolling
                touchAction: 'none',
              }}
              onPointerDown={handlePointerDown(index)}
            >
              {/* Disable pointer events on children so drag events go to motion.div */}
              {/* Wiggle animation on inner div to not conflict with framer-motion transforms */}
              <div
                style={{ pointerEvents: 'none' }}
                className={clsx(shouldWiggle && (index % 2 === 0 ? 'wiggle' : 'wiggle-alt'))}
              >
                {renderItem(item, index, isDragging)}
              </div>
            </motion.div>
          </div>
        )
      })}
    </div>
  )
}
