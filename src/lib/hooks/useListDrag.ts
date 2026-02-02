/**
 * useListDrag - Simplified drag logic for 1D vertical/flex-wrap lists
 *
 * Adapted from useGridDrag but optimized for single-column and flex-wrap layouts.
 * Supports long-press activation, reordering during drag, and haptic feedback.
 *
 * Uses PointerEvent API for consistent behavior across touch, mouse, and pen.
 */

import { useState, useRef, useCallback, useEffect, RefObject } from 'react'
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
  /** Layout mode - affects how drop position is calculated */
  layout?: 'vertical' | 'flex-wrap'
  /** Ref to the container element */
  containerRef?: RefObject<HTMLElement | null>
}

interface UseListDragReturn<T> {
  orderedItems: T[]
  draggedIndex: number | null
  draggedIndices: number[]
  dragOffset: Position
  /** Offset from each item's position to the primary dragged item's position */
  itemOffsetsToPrimary: Map<number, Position>
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
  layout: _layout = 'vertical',
  containerRef,
}: UseListDragOptions<T>): UseListDragReturn<T> {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [draggedIndices, setDraggedIndices] = useState<number[]>([])
  const [dragOffset, setDragOffset] = useState<Position>({ x: 0, y: 0 })
  const [orderedItems, setOrderedItems] = useState<T[]>(items)
  const [itemOffsetsToPrimary, setItemOffsetsToPrimary] = useState<Map<number, Position>>(new Map())

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

  // Track initial grid position for visual offset calculation
  const initialGridPosRef = useRef<Position>({ x: 0, y: 0 })

  // Cache item positions measured from DOM
  const itemRectsRef = useRef<
    { index: number; x: number; y: number; width: number; height: number }[]
  >([])

  // Track if drag actually started (movement beyond threshold)
  const hasDraggedRef = useRef(false)
  const tapIndexRef = useRef<number | null>(null)

  // Sync refs with state changes using effects
  useEffect(() => {
    draggedIndexRef.current = draggedIndex
  }, [draggedIndex])

  useEffect(() => {
    draggedIndicesRef.current = draggedIndices
  }, [draggedIndices])

  useEffect(() => {
    orderedItemsRef.current = orderedItems
  }, [orderedItems])

  useEffect(() => {
    selectedKeysRef.current = selectedKeys
  }, [selectedKeys])

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

  // Measure positions of all items in the container
  const measureItemPositions = useCallback(() => {
    if (!containerRef?.current) return

    const container = containerRef.current
    const children = Array.from(container.children) as HTMLElement[]
    const containerRect = container.getBoundingClientRect()

    itemRectsRef.current = children
      .filter((child) => child.hasAttribute('data-list-item'))
      .map((child, index) => {
        const rect = child.getBoundingClientRect()
        return {
          index,
          x: rect.left - containerRect.left,
          y: rect.top - containerRect.top,
          width: rect.width,
          height: rect.height,
        }
      })
  }, [containerRef])

  // Find the insertion index based on pointer position
  const findInsertionIndex = useCallback(
    (clientX: number, clientY: number, draggedIdx: number): number => {
      const rects = itemRectsRef.current
      if (rects.length === 0 || !containerRef?.current) return draggedIdx

      const containerRect = containerRef.current.getBoundingClientRect()
      const x = clientX - containerRect.left
      const y = clientY - containerRect.top

      // Find closest item
      let closestIdx = draggedIdx
      let closestDistance = Infinity

      for (const rect of rects) {
        const centerX = rect.x + rect.width / 2
        const centerY = rect.y + rect.height / 2
        const dx = x - centerX
        const dy = y - centerY
        const distance = Math.sqrt(dx * dx + dy * dy)

        if (distance < closestDistance) {
          closestDistance = distance
          closestIdx = rect.index
        }
      }

      return closestIdx
    },
    [containerRef]
  )

  // Get position for an item from cached measurements
  const getItemPosition = useCallback((index: number): Position => {
    const rect = itemRectsRef.current.find((r) => r.index === index)
    return rect ? { x: rect.x, y: rect.y } : { x: 0, y: 0 }
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

      // Check if this item is selected
      const itemKey = getKey(currentItems[index])
      const isItemSelected = currentSelectedKeys?.has(itemKey)
      const hasSelection = currentSelectedKeys && currentSelectedKeys.size > 0

      // If there's a selection but this item isn't part of it, don't start drag
      // but still allow tap to toggle selection
      if (hasSelection && !isItemSelected) {
        hasDraggedRef.current = false
        tapIndexRef.current = index
        draggedIndexRef.current = null
        setPendingDragIndex(index)

        if (pointerId !== undefined && element) {
          pointerIdRef.current = pointerId
          targetElementRef.current = element
          try {
            element.setPointerCapture(pointerId)
          } catch {
            // Pointer capture may fail if pointer was already released
          }
        }
        return
      }

      // Detect multi-selection
      const isPartOfMultiSelection = isItemSelected && currentSelectedKeys!.size > 1

      let indices: number[]
      if (isPartOfMultiSelection) {
        indices = currentItems
          .map((item, i) => ({ key: getKey(item), index: i }))
          .filter(({ key }) => currentSelectedKeys!.has(key))
          .map(({ index: i }) => i)
          .sort((a, b) => a - b)
      } else {
        indices = [index]
      }

      // Measure item positions before starting drag
      measureItemPositions()

      // Calculate offsets from each dragged item to the primary item
      const offsets = new Map<number, Position>()
      const primaryPos = getItemPosition(index)
      if (indices.length > 1) {
        for (const idx of indices) {
          if (idx === index) {
            offsets.set(idx, { x: 0, y: 0 })
          } else {
            const itemPos = getItemPosition(idx)
            offsets.set(idx, {
              x: primaryPos.x - itemPos.x,
              y: primaryPos.y - itemPos.y,
            })
          }
        }
      }

      // Store drag info in refs
      draggedIndexRef.current = index
      draggedIndicesRef.current = indices
      dragStartPosRef.current = { x: clientX, y: clientY }
      initialGridPosRef.current = primaryPos
      hasDraggedRef.current = false
      tapIndexRef.current = index

      // Capture pointer for gesture ownership
      if (pointerId !== undefined && element) {
        pointerIdRef.current = pointerId
        targetElementRef.current = element
        try {
          element.setPointerCapture(pointerId)
        } catch {
          // Pointer capture may fail if pointer was already released
        }
      }

      // Set drag state
      setDraggedIndex(index)
      setDraggedIndices(indices)
      setItemOffsetsToPrimary(offsets)
      setDragOffset({ x: 0, y: 0 })
      setPendingDragIndex(null)
    },
    [disabled, getKey, measureItemPositions, getItemPosition]
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

      // Calculate touch delta from original drag start
      const touchDelta = {
        x: clientX - dragStartPosRef.current.x,
        y: clientY - dragStartPosRef.current.y,
      }

      // Track if user has moved enough to consider this a drag (not a tap)
      const totalMovement = Math.sqrt(touchDelta.x ** 2 + touchDelta.y ** 2)
      if (totalMovement > MOVE_THRESHOLD) {
        if (!hasDraggedRef.current) {
          hasDraggedRef.current = true
          haptic.medium()
        }
      }

      // Only update visual offset if drag has actually started
      if (!hasDraggedRef.current) {
        return
      }

      const currentOrderedItems = orderedItemsRef.current
      const isMultiDrag = currentDraggedIndices.length > 1

      // Find new target index
      const newTargetIndex = findInsertionIndex(clientX, clientY, currentDraggedIndex)

      if (isMultiDrag) {
        // Multi-drag: move entire block together
        const primaryPositionInSelection = currentDraggedIndices.indexOf(currentDraggedIndex)
        const blockSize = currentDraggedIndices.length

        // Calculate where the block should start
        const blockStartIndex = Math.max(
          0,
          Math.min(
            currentOrderedItems.length - blockSize,
            newTargetIndex - primaryPositionInSelection
          )
        )

        const currentBlockStart = Math.min(...currentDraggedIndices)
        if (blockStartIndex !== currentBlockStart) {
          // Extract dragged items in their selection order
          const draggedItems = currentDraggedIndices.map((i) => currentOrderedItems[i])
          const newOrdered = currentOrderedItems.filter(
            (_, i) => !currentDraggedIndices.includes(i)
          )
          newOrdered.splice(blockStartIndex, 0, ...draggedItems)

          // Update indices to reflect new positions
          const newIndices = draggedItems.map((_, i) => blockStartIndex + i)
          const newPrimaryIndex = newIndices[primaryPositionInSelection]

          setOrderedItems(newOrdered)
          setDraggedIndex(newPrimaryIndex)
          setDraggedIndices(newIndices)
          draggedIndexRef.current = newPrimaryIndex
          draggedIndicesRef.current = newIndices
          orderedItemsRef.current = newOrdered

          // Re-measure after reorder
          requestAnimationFrame(() => measureItemPositions())
        }
      } else if (newTargetIndex !== currentDraggedIndex) {
        // Single item drag
        const newOrdered = [...currentOrderedItems]
        const [removed] = newOrdered.splice(currentDraggedIndex, 1)
        newOrdered.splice(newTargetIndex, 0, removed)

        setOrderedItems(newOrdered)
        setDraggedIndex(newTargetIndex)
        setDraggedIndices([newTargetIndex])
        draggedIndexRef.current = newTargetIndex
        draggedIndicesRef.current = [newTargetIndex]
        orderedItemsRef.current = newOrdered

        // Re-measure after reorder
        requestAnimationFrame(() => measureItemPositions())
      }

      // Calculate visual position from initial grid position + touch delta
      const visualPos = {
        x: initialGridPosRef.current.x + touchDelta.x,
        y: initialGridPosRef.current.y + touchDelta.y,
      }

      // Compute dragOffset so that: currentGridPos + dragOffset = visualPos
      const currentGridPos = getItemPosition(draggedIndexRef.current!)
      setDragOffset({
        x: visualPos.x - currentGridPos.x,
        y: visualPos.y - currentGridPos.y,
      })
    },
    [cancelLongPress, findInsertionIndex, measureItemPositions, getItemPosition]
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
    if (!hasDraggedRef.current && tapIndexRef.current !== null) {
      onItemTap?.(tapIndexRef.current)
      draggedIndexRef.current = null
      draggedIndicesRef.current = []
      setDraggedIndex(null)
      setDraggedIndices([])
      setDragOffset({ x: 0, y: 0 })
      setItemOffsetsToPrimary(new Map())
      setPendingDragIndex(null)
      tapIndexRef.current = null
      return
    }

    if (draggedIndexRef.current !== null) {
      onReorder(orderedItemsRef.current)
      draggedIndexRef.current = null
      draggedIndicesRef.current = []
      setDraggedIndex(null)
      setDraggedIndices([])
      setDragOffset({ x: 0, y: 0 })
      setItemOffsetsToPrimary(new Map())
      setPendingDragIndex(null)
      onDragEnd?.()
    }

    tapIndexRef.current = null
  }, [onReorder, onDragEnd, cancelLongPress, onItemTap])

  // Unified pointer handler
  const handlePointerDown = useCallback(
    (index: number) => (e: React.PointerEvent) => {
      if (disabled) return

      e.stopPropagation()

      const clientX = e.clientX
      const clientY = e.clientY
      const pointerId = e.pointerId
      const element = e.currentTarget as HTMLElement

      pointerIdRef.current = pointerId
      targetElementRef.current = element

      setPendingDragIndex(index)
      pendingDragPosRef.current = { x: clientX, y: clientY }

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

  // Document event listeners
  useEffect(() => {
    if (draggedIndex === null && pendingDragIndex === null) return

    const onPointerMove = (e: PointerEvent) => {
      if (pointerIdRef.current !== null && e.pointerId !== pointerIdRef.current) return
      handleMove(e.clientX, e.clientY)
    }

    const onPointerUp = (e: PointerEvent) => {
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
    itemOffsetsToPrimary,
    handlePointerDown,
  }
}
