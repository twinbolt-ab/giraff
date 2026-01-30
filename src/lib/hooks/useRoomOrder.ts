import { useCallback, useEffect, useState } from 'react'
import * as ws from '../ha-websocket'
import * as orderStorage from '../services/order-storage'
import { ORDER_GAP, DEFAULT_ORDER } from '../constants'
import { logRoomReorder } from '../analytics'

export function useRoomOrder() {
  const [, forceUpdate] = useState({})
  const [orderCache, setOrderCache] = useState<Record<string, number>>({})

  // Subscribe to registry updates
  useEffect(() => {
    const unsubscribe = ws.onRegistryUpdate(() => {
      forceUpdate({})
    })
    return () => {
      unsubscribe()
    }
  }, [])

  // Load all room orders into cache on mount
  useEffect(() => {
    let mounted = true

    async function loadOrders() {
      try {
        const orders = await orderStorage.getAllRoomOrders()
        if (mounted) {
          setOrderCache(orders)
        }
      } catch (error) {
        console.error('Failed to load room orders:', error)
      }
    }

    void loadOrders()

    return () => {
      mounted = false
    }
  }, [])

  const getAreaOrder = useCallback(
    (areaId: string): number => {
      return orderCache[areaId] ?? DEFAULT_ORDER
    },
    [orderCache]
  )

  const setAreaOrder = useCallback(async (areaId: string, order: number): Promise<void> => {
    // Use storage service with optional HA sync
    await orderStorage.setRoomOrderWithSync(areaId, order)

    // Update cache
    setOrderCache((prev) => ({ ...prev, [areaId]: order }))
  }, [])

  // Calculate new order values when reordering
  const calculateNewOrders = useCallback(
    (
      items: { id: string; areaId: string }[],
      fromIndex: number,
      toIndex: number
    ): Map<string, number> => {
      const newOrders = new Map<string, number>()

      // Get current orders
      const itemsWithOrder = items.map((item) => ({
        ...item,
        order: orderCache[item.areaId] ?? DEFAULT_ORDER,
      }))

      // Move item from fromIndex to toIndex
      const [movedItem] = itemsWithOrder.splice(fromIndex, 1)
      itemsWithOrder.splice(toIndex, 0, movedItem)

      // Calculate new order for moved item based on neighbors
      if (toIndex === 0) {
        // First position: use half of first item's order
        const nextOrder = itemsWithOrder[1]?.order ?? ORDER_GAP
        newOrders.set(movedItem.areaId, Math.max(1, Math.floor(nextOrder / 2)))
      } else if (toIndex === itemsWithOrder.length - 1) {
        // Last position: use previous item's order + gap
        const prevOrder = itemsWithOrder[toIndex - 1]?.order ?? 0
        newOrders.set(movedItem.areaId, prevOrder + ORDER_GAP)
      } else {
        // Middle position: use midpoint between neighbors
        const prevOrder = itemsWithOrder[toIndex - 1]?.order ?? 0
        const nextOrder = itemsWithOrder[toIndex + 1]?.order ?? prevOrder + ORDER_GAP * 2
        const midpoint = Math.floor((prevOrder + nextOrder) / 2)

        // If orders are too close, renumber all items
        if (midpoint <= prevOrder || midpoint >= nextOrder) {
          itemsWithOrder.forEach((item, idx) => {
            newOrders.set(item.areaId, (idx + 1) * ORDER_GAP)
          })
        } else {
          newOrders.set(movedItem.areaId, midpoint)
        }
      }

      return newOrders
    },
    [orderCache]
  )

  // Apply reorder changes
  const reorderAreas = useCallback(
    async (
      items: { id: string; areaId: string }[],
      fromIndex: number,
      toIndex: number
    ): Promise<void> => {
      const newOrders = calculateNewOrders(items, fromIndex, toIndex)

      // Apply all order changes
      const updates = Array.from(newOrders.entries()).map(([areaId, order]) =>
        orderStorage.setRoomOrderWithSync(areaId, order)
      )

      await Promise.all(updates)

      // Update cache with new orders
      setOrderCache((prev) => {
        const updated = { ...prev }
        for (const [areaId, order] of newOrders) {
          updated[areaId] = order
        }
        return updated
      })

      void logRoomReorder()
    },
    [calculateNewOrders]
  )

  return {
    getAreaOrder,
    setAreaOrder,
    reorderAreas,
    calculateNewOrders,
  }
}
