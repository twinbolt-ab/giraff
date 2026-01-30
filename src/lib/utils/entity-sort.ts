/**
 * Entity sorting utilities
 *
 * Sort entities based on saved order with fallback to alphabetical by entity_id.
 */

import type { HAEntity } from '@/types/ha'
import type { DomainOrderMap } from '@/types/ordering'

/**
 * Sort entities by their saved order
 *
 * @param entities - Array of entities to sort
 * @param orderMap - Map of entity_id to order value
 * @returns Sorted array of entities
 */
export function sortEntitiesByOrder(entities: HAEntity[], orderMap: DomainOrderMap): HAEntity[] {
  return [...entities].sort((a, b) => {
    const orderA = orderMap[a.entity_id] ?? 999
    const orderB = orderMap[b.entity_id] ?? 999

    // Sort by order first
    if (orderA !== orderB) {
      return orderA - orderB
    }

    // Fallback to alphabetical by entity_id
    return a.entity_id.localeCompare(b.entity_id)
  })
}
