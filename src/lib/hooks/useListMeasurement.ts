import { useState, useRef, useLayoutEffect, useCallback, RefObject } from 'react'

interface ItemSize {
  width: number
  height: number
}

interface UseListMeasurementOptions {
  itemCount: number
  gap: number
  layout: 'vertical' | 'flex-wrap'
}

interface UseListMeasurementReturn {
  containerRef: RefObject<HTMLDivElement>
  measureRef: RefObject<HTMLDivElement>
  itemSize: ItemSize
  isReady: boolean
  containerHeight: number
  containerWidth: number
  getPositionFromIndex: (index: number) => { x: number; y: number }
  getIndexFromPointer: (clientX: number, clientY: number) => number
}

export function useListMeasurement({
  itemCount,
  gap,
  layout,
}: UseListMeasurementOptions): UseListMeasurementReturn {
  const containerRef = useRef<HTMLDivElement>(null!)
  const measureRef = useRef<HTMLDivElement>(null!)
  const [itemSize, setItemSize] = useState<ItemSize>({ width: 0, height: 0 })
  const [containerWidth, setContainerWidth] = useState(0)

  // Measure container width and item size
  useLayoutEffect(() => {
    const measure = () => {
      if (!containerRef.current) return
      const width = containerRef.current.offsetWidth
      if (width === 0) return
      setContainerWidth(width)
    }

    measure()
    const rafId = requestAnimationFrame(measure)
    window.addEventListener('resize', measure)
    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('resize', measure)
    }
  }, [])

  // Measure item size from first rendered item
  useLayoutEffect(() => {
    if (!measureRef.current || containerWidth === 0) return

    const measureItem = () => {
      if (!measureRef.current) return
      const width = measureRef.current.offsetWidth
      const height = measureRef.current.offsetHeight
      if (width > 0 && height > 0) {
        setItemSize((prev) => {
          if (prev.width !== width || prev.height !== height) {
            return { width, height }
          }
          return prev
        })
      }
    }

    measureItem()

    const resizeObserver = new ResizeObserver(() => {
      measureItem()
    })
    resizeObserver.observe(measureRef.current)

    return () => {
      resizeObserver.disconnect()
    }
  }, [containerWidth])

  // Calculate position for an item at a given index
  const getPositionFromIndex = useCallback(
    (index: number): { x: number; y: number } => {
      if (layout === 'vertical') {
        // Vertical stack: items go down
        return {
          x: 0,
          y: index * (itemSize.height + gap),
        }
      } else {
        // Flex-wrap: items wrap to next row when they don't fit
        if (itemSize.width === 0 || containerWidth === 0) {
          return { x: 0, y: 0 }
        }

        // Calculate how many items fit per row
        const itemsPerRow = Math.floor((containerWidth + gap) / (itemSize.width + gap))
        const row = Math.floor(index / Math.max(1, itemsPerRow))
        const col = index % Math.max(1, itemsPerRow)

        return {
          x: col * (itemSize.width + gap),
          y: row * (itemSize.height + gap),
        }
      }
    },
    [layout, itemSize, gap, containerWidth]
  )

  // Calculate index from pointer position
  const getIndexFromPointer = useCallback(
    (clientX: number, clientY: number): number => {
      if (!containerRef.current || itemSize.width === 0 || itemSize.height === 0) return 0

      const rect = containerRef.current.getBoundingClientRect()
      const x = clientX - rect.left
      const y = clientY - rect.top

      if (layout === 'vertical') {
        const index = Math.round(y / (itemSize.height + gap))
        return Math.max(0, Math.min(itemCount - 1, index))
      } else {
        // Flex-wrap
        const itemsPerRow = Math.floor((containerWidth + gap) / (itemSize.width + gap))
        const row = Math.floor(y / (itemSize.height + gap))
        const col = Math.round(x / (itemSize.width + gap))
        const clampedCol = Math.max(0, Math.min(itemsPerRow - 1, col))
        const index = row * itemsPerRow + clampedCol
        return Math.max(0, Math.min(itemCount - 1, index))
      }
    },
    [layout, itemSize, gap, containerWidth, itemCount]
  )

  // Calculate container dimensions
  let containerHeight = 0
  if (itemSize.height > 0) {
    if (layout === 'vertical') {
      containerHeight = itemCount * itemSize.height + Math.max(0, itemCount - 1) * gap
    } else {
      // Flex-wrap
      const itemsPerRow = Math.max(1, Math.floor((containerWidth + gap) / (itemSize.width + gap)))
      const rows = Math.ceil(itemCount / itemsPerRow)
      containerHeight = rows * itemSize.height + Math.max(0, rows - 1) * gap
    }
  }

  const isReady = itemSize.width > 0 && itemSize.height > 0

  return {
    containerRef,
    measureRef,
    itemSize,
    isReady,
    containerHeight,
    containerWidth,
    getPositionFromIndex,
    getIndexFromPointer,
  }
}
