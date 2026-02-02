/**
 * ReorderableList - Generic reorderable list component for vertical/flex-wrap layouts
 *
 * Supports entity reordering with long-press activation, wiggle animations, and spring physics.
 * Simplified version of ReorderableGrid for 1D lists.
 */

import { useRef } from 'react'
import { motion } from 'framer-motion'
import { clsx } from 'clsx'
import { useListDrag } from '@/lib/hooks/useListDrag'

interface ReorderableListProps<T> {
  items: T[]
  renderItem: (item: T, index: number, isDragging: boolean, isSelected: boolean) => React.ReactNode
  onReorder: (items: T[]) => void
  getKey: (item: T) => string
  layout?: 'vertical' | 'flex-wrap'
  className?: string
  onDragEnd?: () => void
  /** Keys of selected items for multi-drag stacking */
  selectedKeys?: Set<string>
  /** Called when an item is tapped (for selection toggle) */
  onItemTap?: (key: string) => void
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
  selectedKeys,
  onItemTap,
}: ReorderableListProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null)

  const { orderedItems, draggedIndex, draggedIndices, dragOffset, handlePointerDown } = useListDrag(
    {
      items,
      getKey,
      onReorder,
      onDragEnd,
      immediateMode: true, // Drag starts immediately since we're already in reorder mode
      selectedKeys,
      onItemTap: onItemTap
        ? (index: number) => {
            const item = orderedItems[index]
            if (item) onItemTap(getKey(item))
          }
        : undefined,
      layout,
      containerRef,
    }
  )

  return (
    <div
      ref={containerRef}
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
        const isMultiDrag = draggedIndices.length > 1
        const isPrimaryDrag = draggedIndex === index
        const isSecondaryDrag = isMultiDrag && draggedIndices.includes(index) && !isPrimaryDrag
        const isDragging = isPrimaryDrag || isSecondaryDrag
        const shouldWiggle = draggedIndex !== null && !isDragging

        // Calculate stacking for secondary dragged items
        const stackPosition = isSecondaryDrag ? draggedIndices.indexOf(index) : 0
        const stackOffset = isSecondaryDrag
          ? { x: (stackPosition + 1) * 5, y: (stackPosition + 1) * 5 }
          : { x: 0, y: 0 }
        const stackScale = isSecondaryDrag ? 0.98 - stackPosition * 0.01 : 1
        const stackZIndex = isSecondaryDrag ? 45 - stackPosition : 0

        // Calculate target position and styling
        let targetX = 0
        let targetY = 0
        let targetScale = 1
        let targetShadow = '0 0 0 rgba(0, 0, 0, 0)'

        if (isPrimaryDrag) {
          targetX = dragOffset.x
          targetY = dragOffset.y
          targetScale = 1.05
          targetShadow = '0 20px 40px rgba(0, 0, 0, 0.2)'
        } else if (isSecondaryDrag) {
          // Secondary items follow primary with stacking offset
          targetX = dragOffset.x + stackOffset.x
          targetY = dragOffset.y + stackOffset.y
          targetScale = stackScale
          targetShadow = '0 10px 20px rgba(0, 0, 0, 0.15)'
        }

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
                x: targetX,
                y: targetY,
                scale: targetScale,
                boxShadow: targetShadow,
              }}
              transition={{
                x: isDragging ? { duration: 0 } : { type: 'spring', ...SPRING_CONFIG },
                y: isDragging ? { duration: 0 } : { type: 'spring', ...SPRING_CONFIG },
                scale: { duration: 0.15 },
                boxShadow: { duration: 0.15 },
              }}
              className={clsx('relative', isPrimaryDrag && 'z-50')}
              style={{
                cursor: draggedIndex === null ? 'grab' : isDragging ? 'grabbing' : 'grab',
                // Prevent Android from capturing touch events for scrolling
                touchAction: 'none',
                zIndex: isPrimaryDrag ? 50 : isSecondaryDrag ? stackZIndex : undefined,
              }}
              onPointerDown={handlePointerDown(index)}
            >
              {/* Disable pointer events on children so drag events go to motion.div */}
              {/* Wiggle animation on inner div to not conflict with framer-motion transforms */}
              <div
                style={{ pointerEvents: 'none' }}
                className={clsx(shouldWiggle && (index % 2 === 0 ? 'wiggle' : 'wiggle-alt'))}
              >
                {renderItem(item, index, isDragging, selectedKeys?.has(getKey(item)) ?? false)}
              </div>
            </motion.div>
          </div>
        )
      })}
    </div>
  )
}
