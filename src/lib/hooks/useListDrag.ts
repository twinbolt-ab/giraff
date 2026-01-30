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
}

interface UseListDragReturn<T> {
  orderedItems: T[]
  draggedIndex: number | null
  dragOffset: Position
  handlePointerDown: (index: number) => (e: React.PointerEvent) => void
}

export function useListDrag<T>({
  items,
  getKey: _getKey,
  onReorder,
  onDragEnd,
  disabled = false,
  immediateMode = false,
}: UseListDragOptions<T>): UseListDragReturn<T> {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
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
  const dragStartPosRef = useRef<Position>({ x: 0, y: 0 })
  const orderedItemsRef = useRef<T[]>(items)

  // Keep refs in sync with state
  draggedIndexRef.current = draggedIndex
  dragStartPosRef.current = dragStartPos
  orderedItemsRef.current = orderedItems

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

      // Update refs immediately so handleMove sees the new values
      // before React re-renders (pointermove can fire before render)
      draggedIndexRef.current = index
      dragStartPosRef.current = { x: clientX, y: clientY }

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
      setDragStartPos({ x: clientX, y: clientY })
      setDragOffset({ x: 0, y: 0 })
      setPendingDragIndex(null)
      haptic.medium()
    },
    [disabled]
  )

  const handleMove = useCallback(
    (clientX: number, clientY: number) => {
      const currentDraggedIndex = draggedIndexRef.current

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

      const offsetX = clientX - currentDragStartPos.x
      const offsetY = clientY - currentDragStartPos.y
      setDragOffset({ x: offsetX, y: offsetY })

      // Calculate new index based on vertical position
      const ITEM_HEIGHT_ESTIMATE = 60 // Approximate item height
      const indexDelta = Math.round(offsetY / ITEM_HEIGHT_ESTIMATE)
      const newIndex = Math.max(
        0,
        Math.min(currentOrderedItems.length - 1, currentDraggedIndex + indexDelta)
      )

      if (newIndex !== currentDraggedIndex) {
        const newOrdered = [...currentOrderedItems]
        const [removed] = newOrdered.splice(currentDraggedIndex, 1)
        newOrdered.splice(newIndex, 0, removed)
        setOrderedItems(newOrdered)
        setDraggedIndex(newIndex)
        setDragStartPos({ x: clientX, y: clientY })
        setDragOffset({ x: 0, y: 0 })
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

    if (draggedIndexRef.current !== null) {
      // Commit reorder
      onReorder(orderedItemsRef.current)
      setDraggedIndex(null)
      setDragOffset({ x: 0, y: 0 })
      // Exit reorder mode after drag ends
      onDragEnd?.()
    }
  }, [onReorder, onDragEnd, cancelLongPress])

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
    dragOffset,
    handlePointerDown,
  }
}
