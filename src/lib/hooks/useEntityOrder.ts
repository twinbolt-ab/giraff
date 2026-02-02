/**
 * Hook for managing entity ordering within a room
 *
 * Loads entity order from storage and provides functions to update ordering.
 * Entity order is stored per-room, per-domain in localStorage.
 */

import { useState, useEffect, useCallback } from 'react'
import type { HAEntity } from '@/types/ha'
import type { EntityOrderMap, DomainOrderMap } from '@/types/ordering'
import * as orderStorage from '@/lib/services/order-storage'

interface UseEntityOrderReturn {
  /**
   * Full entity order map for the room (all domains)
   */
  entityOrderMap: EntityOrderMap

  /**
   * Get order map for a specific domain
   */
  getDomainOrder: (domain: string) => DomainOrderMap

  /**
   * Update entity order for a specific domain after reordering
   */
  updateDomainOrder: (domain: string, entities: HAEntity[]) => Promise<void>

  /**
   * Loading state
   */
  loading: boolean
}

/**
 * Hook for managing entity ordering within a room
 *
 * @param roomId - Area ID of the room
 * @returns Entity order state and update functions
 */
export function useEntityOrder(roomId: string): UseEntityOrderReturn {
  const [entityOrderMap, setEntityOrderMap] = useState<EntityOrderMap>({})
  const [loading, setLoading] = useState(true)

  // Load entity order from storage on mount
  useEffect(() => {
    let mounted = true

    async function loadEntityOrder() {
      try {
        const orderMap = await orderStorage.getAllEntityOrders(roomId)
        if (mounted) {
          setEntityOrderMap(orderMap)
          setLoading(false)
        }
      } catch (error) {
        console.error('Failed to load entity order:', error)
        if (mounted) {
          setLoading(false)
        }
      }
    }

    void loadEntityOrder()

    return () => {
      mounted = false
    }
  }, [roomId])

  /**
   * Get order map for a specific domain
   */
  const getDomainOrder = useCallback(
    (domain: string): DomainOrderMap => {
      return entityOrderMap[domain] ?? {}
    },
    [entityOrderMap]
  )

  /**
   * Update entity order for a specific domain after reordering
   *
   * @param domain - Entity domain (e.g., "light", "switch", "scene")
   * @param entities - Ordered array of entities (in new order)
   */
  const updateDomainOrder = useCallback(
    async (domain: string, entities: HAEntity[]): Promise<void> => {
      // Create new order map with index as order value
      const newDomainOrder: DomainOrderMap = {}
      entities.forEach((entity, index) => {
        newDomainOrder[entity.entity_id] = index
      })

      // Save to storage
      await orderStorage.setDomainEntityOrders(roomId, domain, newDomainOrder)

      // Update local state
      setEntityOrderMap((prev) => ({
        ...prev,
        [domain]: newDomainOrder,
      }))

      // Notify useRooms to refresh entity orders (for collapsed card sensor display)
      window.dispatchEvent(new CustomEvent('stuga:entity-order-changed'))
    },
    [roomId]
  )

  return {
    entityOrderMap,
    getDomainOrder,
    updateDomainOrder,
    loading,
  }
}
