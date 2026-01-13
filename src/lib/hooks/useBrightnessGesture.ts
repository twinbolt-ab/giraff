import { useState, useRef, useCallback } from 'react'
import type { HAEntity } from '@/types/ha'

// Minimum drag distance to trigger brightness change (prevents accidental drags)
const DRAG_THRESHOLD = 10
// Margins for brightness slider (0% at left margin, 100% at right margin)
const SLIDER_MARGIN = 24

interface UseBrightnessGestureOptions {
  /** The lights to control */
  lights: HAEntity[]
  /** Whether gestures are disabled */
  disabled?: boolean
  /** Get current brightness for lights */
  getAverageBrightness: (lights: HAEntity[]) => number
  /** Get brightness map for all lights */
  getLightBrightnessMap: (lights: HAEntity[]) => Map<string, number>
  /** Calculate relative brightness values */
  calculateRelativeBrightness: (
    startingBrightnessMap: Map<string, number>,
    startingAverage: number,
    newAverage: number
  ) => Map<string, number>
  /** Set brightness for lights */
  setRoomBrightness: (
    lights: HAEntity[],
    brightnessValues: number | Map<string, number>,
    immediate?: boolean
  ) => void
}

interface DragState {
  x: number
  y: number
  brightness: number
  brightnessMap: Map<string, number>
}

interface UseBrightnessGestureReturn {
  /** Whether currently dragging brightness */
  isDragging: boolean
  /** Current local brightness value (0-100) */
  localBrightness: number
  /** Whether to show the brightness overlay */
  showOverlay: boolean
  /** Whether a drag occurred (use to prevent click handling) */
  didDrag: boolean
  /** Initialize drag state on pointer down */
  initDrag: (e: React.PointerEvent) => void
  /** Handle pointer move for drag */
  handleMove: (e: React.PointerEvent) => void
  /** Finalize drag on pointer up */
  finalizeDrag: (e: React.PointerEvent) => void
  /** Set local brightness directly (for optimistic updates) */
  setLocalBrightness: (value: number) => void
}

export function useBrightnessGesture({
  lights,
  disabled = false,
  getAverageBrightness,
  getLightBrightnessMap,
  calculateRelativeBrightness,
  setRoomBrightness,
}: UseBrightnessGestureOptions): UseBrightnessGestureReturn {
  const initialBrightness = getAverageBrightness(lights)

  const [isDragging, setIsDragging] = useState(false)
  const [localBrightness, setLocalBrightness] = useState(initialBrightness)
  const [showOverlay, setShowOverlay] = useState(false)

  const dragStartRef = useRef<DragState | null>(null)
  const didDragRef = useRef(false)

  const initDrag = useCallback((e: React.PointerEvent) => {
    didDragRef.current = false

    if (disabled || lights.length === 0) return

    const currentBrightness = getAverageBrightness(lights)
    const brightnessMap = getLightBrightnessMap(lights)

    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      brightness: currentBrightness,
      brightnessMap,
    }
    setLocalBrightness(currentBrightness)
  }, [disabled, lights, getAverageBrightness, getLightBrightnessMap])

  const handleMove = useCallback((e: React.PointerEvent) => {
    if (disabled || !dragStartRef.current || lights.length === 0) return

    const deltaX = e.clientX - dragStartRef.current.x
    const deltaY = e.clientY - dragStartRef.current.y

    // Not yet dragging - check if we should start
    if (!isDragging) {
      // If vertical movement exceeds threshold, cancel
      if (Math.abs(deltaY) > DRAG_THRESHOLD) {
        dragStartRef.current = null
        return
      }

      // If horizontal movement exceeds threshold and is dominant, start dragging
      if (Math.abs(deltaX) > DRAG_THRESHOLD) {
        if (Math.abs(deltaY) > Math.abs(deltaX)) {
          dragStartRef.current = null
          return
        }
        didDragRef.current = true
        setIsDragging(true)
        setShowOverlay(true)
        ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
      }
      return
    }

    // Calculate new brightness using stretched scale mapping
    const leftEdge = SLIDER_MARGIN
    const rightEdge = window.innerWidth - SLIDER_MARGIN
    const startX = dragStartRef.current.x
    const startBrightness = dragStartRef.current.brightness

    let newBrightness: number

    if (e.clientX <= startX) {
      // Dragging left: map [leftEdge, startX] to [0%, startBrightness%]
      const range = startX - leftEdge
      if (range > 0) {
        const ratio = (e.clientX - leftEdge) / range
        newBrightness = ratio * startBrightness
      } else {
        newBrightness = 0
      }
    } else {
      // Dragging right: map [startX, rightEdge] to [startBrightness%, 100%]
      const range = rightEdge - startX
      if (range > 0) {
        const ratio = (e.clientX - startX) / range
        newBrightness = startBrightness + ratio * (100 - startBrightness)
      } else {
        newBrightness = 100
      }
    }

    newBrightness = Math.max(0, Math.min(100, newBrightness))
    setLocalBrightness(Math.round(newBrightness))

    // Apply relative brightness to all lights
    const relativeBrightness = calculateRelativeBrightness(
      dragStartRef.current.brightnessMap,
      startBrightness,
      newBrightness
    )
    setRoomBrightness(lights, relativeBrightness)
  }, [disabled, lights, isDragging, calculateRelativeBrightness, setRoomBrightness])

  const finalizeDrag = useCallback((e: React.PointerEvent) => {
    if (isDragging && dragStartRef.current) {
      // Apply final brightness
      const relativeBrightness = calculateRelativeBrightness(
        dragStartRef.current.brightnessMap,
        dragStartRef.current.brightness,
        localBrightness
      )
      setRoomBrightness(lights, relativeBrightness, true)
      ;(e.target as HTMLElement).releasePointerCapture(e.pointerId)

      setTimeout(() => setShowOverlay(false), 300)
    }

    setIsDragging(false)
    dragStartRef.current = null
  }, [isDragging, lights, localBrightness, calculateRelativeBrightness, setRoomBrightness])

  return {
    isDragging,
    localBrightness,
    showOverlay,
    didDrag: didDragRef.current,
    initDrag,
    handleMove,
    finalizeDrag,
    setLocalBrightness,
  }
}
