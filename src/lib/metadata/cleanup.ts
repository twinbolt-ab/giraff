/**
 * Metadata Cleanup
 *
 * Handles cleanup of Home Assistant labels when ordering sync is disabled.
 */

import * as ws from '@/lib/ha-websocket'
import { logger } from '@/lib/logger'
import { ROOM_ORDER_LABEL_PREFIX, DEVICE_ORDER_LABEL_PREFIX } from '@/lib/constants'

/**
 * Clean up all room order labels from Home Assistant.
 * Called when user disables room ordering.
 */
export async function cleanupRoomOrderLabels(): Promise<{ deletedCount: number }> {
  const labels = ws.getLabels()
  const roomOrderLabels = Array.from(labels.values()).filter((label) =>
    label.name.startsWith(ROOM_ORDER_LABEL_PREFIX)
  )

  if (roomOrderLabels.length === 0) {
    return { deletedCount: 0 }
  }

  const roomOrderLabelIds = new Set(roomOrderLabels.map((l) => l.label_id))

  // Remove room order labels from areas
  const areaRegistry = ws.getAreaRegistry()
  for (const [areaId, area] of areaRegistry) {
    const areaLabels = area.labels || []
    if (areaLabels.some((labelId) => roomOrderLabelIds.has(labelId))) {
      const filteredLabels = areaLabels.filter((id) => !roomOrderLabelIds.has(id))
      try {
        await ws.updateAreaLabels(areaId, filteredLabels)
      } catch (error) {
        logger.error('Metadata', `Failed to update area ${areaId} labels:`, error)
      }
    }
  }

  // Delete the labels themselves
  for (const label of roomOrderLabels) {
    try {
      await ws.deleteLabel(label.label_id)
    } catch (error) {
      logger.error('Metadata', `Failed to delete label ${label.name}:`, error)
    }
  }

  logger.debug(
    'Metadata',
    `Cleaned up ${roomOrderLabels.length} room order labels from Home Assistant`
  )
  return { deletedCount: roomOrderLabels.length }
}

/**
 * Clean up all entity/device order labels from Home Assistant.
 * Called when user disables ordering sync.
 */
export async function cleanupEntityOrderLabels(): Promise<{ deletedCount: number }> {
  const labels = ws.getLabels()
  const entityOrderLabels = Array.from(labels.values()).filter((label) =>
    label.name.startsWith(DEVICE_ORDER_LABEL_PREFIX)
  )

  if (entityOrderLabels.length === 0) {
    return { deletedCount: 0 }
  }

  const entityOrderLabelIds = new Set(entityOrderLabels.map((l) => l.label_id))

  // Remove entity order labels from entities
  const entityRegistry = ws.getEntityRegistry()
  for (const [entityId, entity] of entityRegistry) {
    const entityLabels = entity.labels || []
    if (entityLabels.some((labelId) => entityOrderLabelIds.has(labelId))) {
      const filteredLabels = entityLabels.filter((id) => !entityOrderLabelIds.has(id))
      try {
        await ws.updateEntityLabels(entityId, filteredLabels)
      } catch (error) {
        logger.error('Metadata', `Failed to update entity ${entityId} labels:`, error)
      }
    }
  }

  // Delete the labels themselves
  for (const label of entityOrderLabels) {
    try {
      await ws.deleteLabel(label.label_id)
    } catch (error) {
      logger.error('Metadata', `Failed to delete label ${label.name}:`, error)
    }
  }

  logger.debug(
    'Metadata',
    `Cleaned up ${entityOrderLabels.length} entity order labels from Home Assistant`
  )
  return { deletedCount: entityOrderLabels.length }
}

/**
 * Clean up all order labels (both room and entity) from Home Assistant.
 * Called when user disables ordering sync.
 */
export async function cleanupAllOrderLabels(): Promise<{ roomCount: number; entityCount: number }> {
  const roomResult = await cleanupRoomOrderLabels()
  const entityResult = await cleanupEntityOrderLabels()

  return {
    roomCount: roomResult.deletedCount,
    entityCount: entityResult.deletedCount,
  }
}
