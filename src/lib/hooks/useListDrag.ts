/**
 * useListDrag - Simplified drag logic for 1D vertical/flex-wrap lists
 *
 * Adapted from useGridDrag but optimized for single-column and flex-wrap layouts.
 * Supports long-press activation, reordering during drag, and haptic feedback.
 *
 * Uses PointerEvent API for consistent behavior across touch, mouse, and pen.
 */

import { useState, useRef, useCallback, useEffect } from 'react'
import { haptic } from '@/lib/haptics'
import { LONG_PRESS_DURATION } from '@/lib/constants'

const MOVE_THRESHOLD = 10

interface Position {
  x: number
  y: number
}

interface UseListDragOptions<T> {
  items: T[]
  getKey: (item: T) => string
  onReorder: (items: T[]) => void
  onDragEnd?: () => void
  disabled?: boolean
  /** When true, drag starts immediately on pointer down without requiring a long-press */
  immediateMode?: boolean
  /** Keys of selected items for multi-drag */
  selectedKeys?: Set<string>
  /** Called when an item is tapped (pointer up without significant movement) */
  onItemTap?: (index: number) => void
}

interface UseListDragReturn<T> {
  orderedItems: T[]
  draggedIndex: number | null
  draggedIndices: number[]
  dragOffset: Position
  handlePointerDown: (index: number) => (e: React.PointerEvent) => void
}

export function useListDrag<T>({
  items,
  getKey,
  onReorder,
  onDragEnd,
  disabled = false,
  immediateMode = false,
  selectedKeys,
  onItemTap,
}: UseListDragOptions<T>): UseListDragReturn<T> {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [draggedIndices, setDraggedIndices] = useState<number[]>([])
  const [dragOffset, setDragOffset] = useState<Position>({ x: 0, y: 0 })
  const [dragStartPos, setDragStartPos] = useState<Position>({ x: 0, y: 0 })
  const [orderedItems, setOrderedItems] = useState<T[]>(items)

  // Long-press state
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [pendingDragIndex, setPendingDragIndex] = useState<number | null>(null)
  const pendingDragPosRef = useRef<Position>({ x: 0, y: 0 })

  // Pointer tracking for gesture ownership
  const pointerIdRef = useRef<number | null>(null)
  const targetElementRef = useRef<HTMLElement | null>(null)

  // Refs to always have current values in event handlers (avoids stale closures)
  const draggedIndexRef = useRef<number | null>(null)
  const draggedIndicesRef = useRef<number[]>([])
  const dragStartPosRef = useRef<Position>({ x: 0, y: 0 })
  const orderedItemsRef = useRef<T[]>(items)
  const selectedKeysRef = useRef<Set<string> | undefined>(selectedKeys)

  // Track cumulative position shift from reordering - keeps item under finger
  const reorderShiftRef = useRef<Position>({ x: 0, y: 0 })

  // Track if drag actually started (movement beyond threshold)
  const hasDraggedRef = useRef(false)
  const tapIndexRef = useRef<number | null>(null)

  // Keep refs in sync with state
  draggedIndexRef.current = draggedIndex
  draggedIndicesRef.current = draggedIndices
  dragStartPosRef.current = dragStartPos
  orderedItemsRef.current = orderedItems
  selectedKeysRef.current = selectedKeys

  // Track previous items for change detection
  const [prevItems, setPrevItems] = useState(items)

  // Sync items when they change externally
  if (prevItems !== items) {
    setPrevItems(items)
    if (draggedIndex === null && pendingDragIndex === null) {
      setOrderedItems(items)
    }
  }

  // Cleanup long-press timer on unmount
  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current)
      }
    }
  }, [])

  const cancelLongPress = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }
    setPendingDragIndex(null)
  }, [])

  const startDrag = useCallback(
    (
      index: number,
      clientX: number,
      clientY: number,
      pointerId?: number,
      element?: HTMLElement
    ) => {
      if (disabled) return

      const currentItems = orderedItemsRef.current
      const currentSelectedKeys = selectedKeysRef.current

      // Detect multi-selection
      const itemKey = getKey(currentItems[index])
      const isPartOfMultiSelection =
        currentSelectedKeys?.has(itemKey) && currentSelectedKeys.size > 1

      let indices: number[]
      if (isPartOfMultiSelection) {
        // Collect all selected indices, sorted
        indices = currentItems
          .map((item, i) => ({ key: getKey(item), index: i }))
          .filter(({ key }) => currentSelectedKeys!.has(key))
          .map(({ index: i }) => i)
          .sort((a, b) => a - b)
      } else {
        indices = [index]
      }

      // Update refs immediately so handleMove sees the new values
      // before React re-renders (pointermove can fire before render)
      draggedIndexRef.current = index
      draggedIndicesRef.current = indices
      dragStartPosRef.current = { x: clientX, y: clientY }
      reorderShiftRef.current = { x: 0, y: 0 }
      hasDraggedRef.current = false
      tapIndexRef.current = index

      // Capture pointer for gesture ownership - ensures all subsequent events
      // go to this element, preventing other handlers from interfering
      if (pointerId !== undefined && element) {
        pointerIdRef.current = pointerId
        targetElementRef.current = element
        try {
          element.setPointerCapture(pointerId)
        } catch {
          // Pointer capture may fail if pointer was already released
        }
      }

      setDraggedIndex(index)
      setDraggedIndices(indices)
      setDragStartPos({ x: clientX, y: clientY })
      setDragOffset({ x: 0, y: 0 })
      setPendingDragIndex(null)
      haptic.medium()
    },
    [disabled, getKey]
  )

  const handleMove = useCallback(
    (clientX: number, clientY: number) => {
      const currentDraggedIndex = draggedIndexRef.current
      const currentDraggedIndices = draggedIndicesRef.current

      // If not dragging, check if we should cancel long-press due to movement
      if (currentDraggedIndex === null) {
        const dx = clientX - pendingDragPosRef.current.x
        const dy = clientY - pendingDragPosRef.current.y
        const distance = Math.sqrt(dx * dx + dy * dy)

        if (distance > MOVE_THRESHOLD) {
          cancelLongPress()
        }
        return
      }

      // If dragging, update offset and reorder
      const currentDragStartPos = dragStartPosRef.current
      const currentOrderedItems = orderedItemsRef.current

      // Calculate touch delta from original drag start (never changes during drag)
      const touchDelta = {
        x: clientX - currentDragStartPos.x,
        y: clientY - currentDragStartPos.y,
      }

      // Visual offset = touch movement + accumulated reorder shift
      // This keeps the item under the finger even when it reorders
      const visualOffset = {
        x: touchDelta.x + reorderShiftRef.current.x,
        y: touchDelta.y + reorderShiftRef.current.y,
      }
      setDragOffset(visualOffset)

      // Track if user has moved enough to consider this a drag (not a tap)
      const totalMovement = Math.sqrt(touchDelta.x ** 2 + touchDelta.y ** 2)
      if (totalMovement > MOVE_THRESHOLD) {
        hasDraggedRef.current = true
      }

      const ITEM_HEIGHT_ESTIMATE = 60 // Approximate item height
      const isMultiDrag = currentDraggedIndices.length > 1

      if (isMultiDrag) {
        // Multi-drag: move entire block together
        const primaryPositionInSelection = currentDraggedIndices.indexOf(currentDraggedIndex)
        const indexDelta = Math.round(visualOffset.y / ITEM_HEIGHT_ESTIMATE)
        const targetPrimaryIndex = Math.max(
          0,
          Math.min(currentOrderedItems.length - 1, currentDraggedIndex + indexDelta)
        )

        // Calculate where the block should start
        const blockSize = currentDraggedIndices.length
        const blockStartIndex = Math.max(
          0,
          Math.min(
            currentOrderedItems.length - blockSize,
            targetPrimaryIndex - primaryPositionInSelection
          )
        )

        // Check if current block start differs from where we want it
        const currentBlockStart = Math.min(...currentDraggedIndices)
        if (blockStartIndex !== currentBlockStart) {
          // Extract dragged items in their selection order
          const draggedItems = currentDraggedIndices.map((i) => currentOrderedItems[i])

          // Remove dragged items from array
          const newOrdered = currentOrderedItems.filter(
            (_, i) => !currentDraggedIndices.includes(i)
          )

          // Insert block at new position
          newOrdered.splice(blockStartIndex, 0, ...draggedItems)

          // Update indices to reflect new positions
          const newIndices = draggedItems.map((_, i) => blockStartIndex + i)
          const newPrimaryIndex = newIndices[primaryPositionInSelection]

          // Adjust shift to compensate
          const indexDiff = newPrimaryIndex - currentDraggedIndex
          reorderShiftRef.current = {
            x: reorderShiftRef.current.x,
            y: reorderShiftRef.current.y - indexDiff * ITEM_HEIGHT_ESTIMATE,
          }

          setOrderedItems(newOrdered)
          setDraggedIndex(newPrimaryIndex)
          setDraggedIndices(newIndices)
          draggedIndexRef.current = newPrimaryIndex
          draggedIndicesRef.current = newIndices
          orderedItemsRef.current = newOrdered
        }
      } else {
        // Single item drag
        const indexDelta = Math.round(visualOffset.y / ITEM_HEIGHT_ESTIMATE)
        const newIndex = Math.max(
          0,
          Math.min(currentOrderedItems.length - 1, currentDraggedIndex + indexDelta)
        )

        if (newIndex !== currentDraggedIndex) {
          // Adjust shift to compensate for the reorder
          const indexDiff = newIndex - currentDraggedIndex
          reorderShiftRef.current = {
            x: reorderShiftRef.current.x,
            y: reorderShiftRef.current.y - indexDiff * ITEM_HEIGHT_ESTIMATE,
          }

          const newOrdered = [...currentOrderedItems]
          const [removed] = newOrdered.splice(currentDraggedIndex, 1)
          newOrdered.splice(newIndex, 0, removed)
          setOrderedItems(newOrdered)
          setDraggedIndex(newIndex)
          setDraggedIndices([newIndex])
          draggedIndexRef.current = newIndex
          draggedIndicesRef.current = [newIndex]
          orderedItemsRef.current = newOrdered
        }
      }
    },
    [cancelLongPress]
  )

  const handleEnd = useCallback(() => {
    cancelLongPress()

    // Release pointer capture
    if (pointerIdRef.current !== null && targetElementRef.current) {
      try {
        targetElementRef.current.releasePointerCapture(pointerIdRef.current)
      } catch {
        // Pointer may already be released
      }
      pointerIdRef.current = null
      targetElementRef.current = null
    }

    // Check if this was a tap (no significant movement)
    if (
      draggedIndexRef.current !== null &&
      !hasDraggedRef.current &&
      tapIndexRef.current !== null
    ) {
      // This was a tap, not a drag - call onItemTap
      onItemTap?.(tapIndexRef.current)
      setDraggedIndex(null)
      setDraggedIndices([])
      setDragOffset({ x: 0, y: 0 })
      tapIndexRef.current = null
      return
    }

    if (draggedIndexRef.current !== null) {
      // Commit reorder
      onReorder(orderedItemsRef.current)
      setDraggedIndex(null)
      setDraggedIndices([])
      setDragOffset({ x: 0, y: 0 })
      // Exit reorder mode after drag ends
      onDragEnd?.()
    }

    tapIndexRef.current = null
  }, [onReorder, onDragEnd, cancelLongPress, onItemTap])

  // Unified pointer handler - works for touch, mouse, and pen
  const handlePointerDown = useCallback(
    (index: number) => (e: React.PointerEvent) => {
      if (disabled) return

      // Stop propagation to prevent child components (like LightSlider) from receiving this event
      e.stopPropagation()

      const clientX = e.clientX
      const clientY = e.clientY
      const pointerId = e.pointerId
      const element = e.currentTarget as HTMLElement

      // Store pointer info for later capture
      pointerIdRef.current = pointerId
      targetElementRef.current = element

      setPendingDragIndex(index)
      pendingDragPosRef.current = { x: clientX, y: clientY }

      // In immediate mode, start drag right away; otherwise use long-press timer
      if (immediateMode) {
        startDrag(index, clientX, clientY, pointerId, element)
      } else {
        longPressTimerRef.current = setTimeout(() => {
          startDrag(index, clientX, clientY, pointerId, element)
        }, LONG_PRESS_DURATION)
      }
    },
    [disabled, immediateMode, startDrag]
  )

  // Document event listeners - attached when drag or pending drag is active
  // Using refs for state values means handlers always see current values
  useEffect(() => {
    if (draggedIndex === null && pendingDragIndex === null) return

    const onPointerMove = (e: PointerEvent) => {
      // Only handle events from our tracked pointer
      if (pointerIdRef.current !== null && e.pointerId !== pointerIdRef.current) return

      handleMove(e.clientX, e.clientY)
    }

    const onPointerUp = (e: PointerEvent) => {
      // Only handle events from our tracked pointer
      if (pointerIdRef.current !== null && e.pointerId !== pointerIdRef.current) return

      handleEnd()
    }

    document.addEventListener('pointermove', onPointerMove)
    document.addEventListener('pointerup', onPointerUp)
    document.addEventListener('pointercancel', onPointerUp)

    return () => {
      document.removeEventListener('pointermove', onPointerMove)
      document.removeEventListener('pointerup', onPointerUp)
      document.removeEventListener('pointercancel', onPointerUp)
    }
  }, [draggedIndex, pendingDragIndex, handleMove, handleEnd])

  return {
    orderedItems,
    draggedIndex,
    draggedIndices,
    dragOffset,
    handlePointerDown,
  }
}
