import { useMemo, useState, useEffect } from 'react'
import * as ws from '../ha-websocket'
import { useDevMode } from './useDevMode'
import type { HAEntity, RoomWithDevices } from '@/types/ha'
import { DEFAULT_ORDER } from '../constants'

interface UseFavoritesReturn {
  /** Whether any favorites exist (determines if tab should show) */
  hasFavorites: boolean
  /** Favorite scenes, sorted by order */
  favoriteScenes: HAEntity[]
  /** Favorite rooms, sorted by order */
  favoriteRooms: RoomWithDevices[]
  /** Favorite entities (non-scenes), sorted by order */
  favoriteEntities: HAEntity[]
}

/**
 * Hook that provides access to favorited items.
 * Subscribes to registry updates to stay in sync.
 */
export function useFavorites(
  rooms: RoomWithDevices[],
  entities: Map<string, HAEntity>
): UseFavoritesReturn {
  const { activeMockScenario } = useDevMode()
  const [registryVersion, setRegistryVersion] = useState(0)

  // Subscribe to registry updates
  useEffect(() => {
    const unsubscribe = ws.onRegistryUpdate(() => {
      setRegistryVersion((v) => v + 1)
    })
    return () => {
      unsubscribe()
    }
  }, [])

  const { hasFavorites, favoriteScenes, favoriteRooms, favoriteEntities } = useMemo(() => {
    // In mock mode, return empty (no favorites support for now)
    if (activeMockScenario !== 'none') {
      return {
        hasFavorites: false,
        favoriteScenes: [],
        favoriteRooms: [],
        favoriteEntities: [],
      }
    }

    // Check if favorites exist
    const favoritesExist = ws.hasFavorites()
    if (!favoritesExist) {
      return {
        hasFavorites: false,
        favoriteScenes: [],
        favoriteRooms: [],
        favoriteEntities: [],
      }
    }

    // Get favorite IDs
    const { scenes: sceneIds, entities: entityIds } = ws.getAllFavoriteEntityIds()
    const areaIds = ws.getAllFavoriteAreaIds()

    // Map scene IDs to HAEntity objects
    const scenes: HAEntity[] = []
    for (const entityId of sceneIds) {
      const entity = entities.get(entityId)
      if (entity) {
        scenes.push(entity)
      }
    }

    // Map area IDs to RoomWithDevices objects
    const favoriteRoomsList: RoomWithDevices[] = []
    for (const areaId of areaIds) {
      const room = rooms.find((r) => r.areaId === areaId)
      if (room) {
        favoriteRoomsList.push(room)
      }
    }

    // Map entity IDs to HAEntity objects
    const entitiesList: HAEntity[] = []
    for (const entityId of entityIds) {
      const entity = entities.get(entityId)
      if (entity) {
        entitiesList.push(entity)
      }
    }

    return {
      hasFavorites: true,
      favoriteScenes: scenes,
      favoriteRooms: favoriteRoomsList,
      favoriteEntities: entitiesList,
    }
    // registryVersion is used to trigger recalculation on registry changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rooms, entities, activeMockScenario, registryVersion])

  return {
    hasFavorites,
    favoriteScenes,
    favoriteRooms,
    favoriteEntities,
  }
}

/**
 * Check if an entity is a favorite.
 */
export function isEntityFavorite(entityId: string): boolean {
  return ws.getEntityFavoriteInfo(entityId) !== null
}

/**
 * Check if an area/room is a favorite.
 */
export function isAreaFavorite(areaId: string): boolean {
  return ws.getAreaFavoriteInfo(areaId) !== null
}

/**
 * Toggle favorite status for an entity.
 */
export async function toggleEntityFavorite(entityId: string, isScene: boolean): Promise<boolean> {
  const existingFavorite = ws.getEntityFavoriteInfo(entityId)

  if (existingFavorite) {
    await ws.removeEntityFromFavorites(entityId)
    return false
  } else {
    await ws.addEntityToFavorites(entityId, isScene ? 'scene' : 'entity')
    return true
  }
}

/**
 * Toggle favorite status for an area/room.
 */
export async function toggleAreaFavorite(areaId: string): Promise<boolean> {
  const existingFavorite = ws.getAreaFavoriteInfo(areaId)

  if (existingFavorite) {
    await ws.removeAreaFromFavorites(areaId)
    return false
  } else {
    await ws.addAreaToFavorites(areaId)
    return true
  }
}
