/**
 * Metadata storage abstraction types
 *
 * Stuga stores room ordering and preferences in Home Assistant labels.
 */

export interface MetadataBackend {
  // Room/Area ordering
  getAreaOrder(areaId: string): number
  setAreaOrder(areaId: string, order: number): Promise<void>

  // Temperature sensor selection per area
  getAreaTemperatureSensor(areaId: string): string | undefined
  setAreaTemperatureSensor(areaId: string, sensorEntityId: string | null): Promise<void>

  // Device/Entity ordering
  getEntityOrder(entityId: string): number
  setEntityOrder(entityId: string, order: number): Promise<void>
}
