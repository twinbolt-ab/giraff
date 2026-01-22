/**
 * Pure geometry calculation functions for grid layouts.
 * These are stateless and can be reused across different grid contexts.
 */

export interface GridGeometry {
  cellSize: { width: number; height: number }
  columns: number
  gap: number
}

export interface Position {
  x: number
  y: number
}

/**
 * Calculate pixel position from grid index
 */
export function getPositionFromIndex(geometry: GridGeometry, index: number): Position {
  const { cellSize, columns, gap } = geometry
  const col = index % columns
  const row = Math.floor(index / columns)
  return {
    x: col * (cellSize.width + gap),
    y: row * (cellSize.height + gap),
  }
}

/**
 * Calculate grid index from relative position within container
 */
export function getIndexFromPosition(
  geometry: GridGeometry,
  x: number,
  y: number,
  itemCount: number
): number {
  const { cellSize, columns, gap } = geometry
  if (cellSize.width === 0) return 0

  const col = Math.min(columns - 1, Math.max(0, Math.floor(x / (cellSize.width + gap))))
  const row = Math.max(0, Math.floor(y / (cellSize.height + gap)))
  const index = row * columns + col

  return Math.min(itemCount - 1, Math.max(0, index))
}

/**
 * Calculate total container height for a given item count
 */
export function getContainerHeight(geometry: GridGeometry, itemCount: number): number {
  const { cellSize, columns, gap } = geometry
  const rows = Math.ceil(itemCount / columns)
  return rows * cellSize.height + (rows - 1) * gap
}

/**
 * Get cell width as number or CSS calc fallback (for before measurement)
 */
export function getCellWidthOrFallback(geometry: GridGeometry): number | string {
  const { cellSize, columns, gap } = geometry
  return cellSize.width > 0
    ? cellSize.width
    : `calc((100% - ${gap * (columns - 1)}px) / ${columns})`
}
