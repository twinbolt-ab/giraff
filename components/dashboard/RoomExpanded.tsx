'use client'

import { useState, useCallback, useEffect, useMemo } from 'react'
import { motion, Reorder } from 'framer-motion'
import { Thermometer, Droplets, Sparkles, GripVertical, Power, Pencil, ToggleLeft, SlidersHorizontal } from 'lucide-react'
import { clsx } from 'clsx'
import type { RoomWithDevices, HAEntity } from '@/types/ha'
import { LightSlider } from './LightSlider'
import { MdiIcon } from '@/components/ui/MdiIcon'
import { DeviceEditModal } from './DeviceEditModal'
import { useHAConnection } from '@/lib/hooks/useHAConnection'
import { useDeviceOrder } from '@/lib/hooks/useDeviceOrder'
import { haWebSocket } from '@/lib/ha-websocket'
import { t } from '@/lib/i18n'

interface RoomExpandedProps {
  room: RoomWithDevices
  allRooms: RoomWithDevices[]
  isReorderMode?: boolean
  onExitReorderMode?: () => void
}

export function RoomExpanded({ room, allRooms, isReorderMode = false, onExitReorderMode }: RoomExpandedProps) {
  const { callService } = useHAConnection()
  const { sortDevicesByOrder, reorderDevices } = useDeviceOrder()

  // Filter and sort devices by type and order - memoize to prevent infinite loops
  const lights = useMemo(
    () => sortDevicesByOrder(room.devices.filter((d) => d.entity_id.startsWith('light.'))),
    [room.devices, sortDevicesByOrder]
  )
  const switches = useMemo(
    () => room.devices.filter((d) => d.entity_id.startsWith('switch.')),
    [room.devices]
  )
  const scenes = useMemo(
    () => room.devices.filter((d) => d.entity_id.startsWith('scene.')),
    [room.devices]
  )
  const inputBooleans = useMemo(
    () => room.devices.filter((d) => d.entity_id.startsWith('input_boolean.')),
    [room.devices]
  )
  const inputNumbers = useMemo(
    () => room.devices.filter((d) => d.entity_id.startsWith('input_number.')),
    [room.devices]
  )

  const [orderedLights, setOrderedLights] = useState<HAEntity[]>(lights)
  const [editingDevice, setEditingDevice] = useState<HAEntity | null>(null)

  // Sync orderedLights when lights change or reorder mode changes
  useEffect(() => {
    setOrderedLights(lights)
  }, [lights, isReorderMode])

  const handleDeviceEdit = (device: HAEntity) => {
    if (isReorderMode) {
      setEditingDevice(device)
    }
  }

  // Save order when reorder mode exits
  const handleReorder = useCallback(async (newOrder: HAEntity[]) => {
    setOrderedLights(newOrder)

    // Find which item moved and save
    const originalOrder = lights.map((l, i) => ({ entity_id: l.entity_id, index: i }))
    for (let i = 0; i < newOrder.length; i++) {
      const original = originalOrder.find(o => o.entity_id === newOrder[i].entity_id)
      if (original && original.index !== i) {
        await reorderDevices(lights, original.index, i)
        break
      }
    }
  }, [lights, reorderDevices])

  const handleSceneActivate = (scene: HAEntity) => {
    callService('scene', 'turn_on', { entity_id: scene.entity_id })
  }

  const handleSwitchToggle = (sw: HAEntity) => {
    const service = sw.state === 'on' ? 'turn_off' : 'turn_on'
    callService('switch', service, { entity_id: sw.entity_id })
  }

  const handleInputBooleanToggle = (input: HAEntity) => {
    const service = input.state === 'on' ? 'turn_off' : 'turn_on'
    callService('input_boolean', service, { entity_id: input.entity_id })
  }

  const handleInputNumberChange = (input: HAEntity, value: number) => {
    callService('input_number', 'set_value', { entity_id: input.entity_id, value })
  }

  // Remove room name from scene name if present
  const getSceneDisplayName = (scene: HAEntity) => {
    const name = scene.attributes.friendly_name || scene.entity_id.split('.')[1]
    const roomNameLower = room.name.toLowerCase()
    const nameLower = name.toLowerCase()

    if (nameLower.startsWith(roomNameLower)) {
      return name.slice(room.name.length).trim() || name
    }
    return name
  }

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="overflow-hidden"
    >
      <div
        className="pt-3 mt-3 border-t border-border max-h-[60vh] overflow-y-auto scroll-smooth pb-1 overscroll-contain"
        style={{ touchAction: 'pan-y', WebkitOverflowScrolling: 'touch' }}
        onPointerDown={(e) => e.stopPropagation()}
        onPointerMove={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
      >
        {/* Scenes */}
        {scenes.length > 0 && (
          <div className="mb-4">
            <h4 className="text-xs font-medium text-muted uppercase tracking-wide mb-2">
              {t.devices.scenes}
            </h4>
            <div className="flex flex-wrap gap-2">
              {scenes.map((scene) => {
                const sceneIcon = haWebSocket.getEntityIcon(scene.entity_id)
                return (
                  <button
                    key={scene.entity_id}
                    onClick={() => isReorderMode ? handleDeviceEdit(scene) : handleSceneActivate(scene)}
                    className={clsx(
                      'px-3 py-1.5 rounded-full text-sm font-medium',
                      'bg-border/50 hover:bg-accent/20 hover:text-accent',
                      'transition-colors touch-feedback',
                      'flex items-center gap-1.5',
                      isReorderMode && 'ring-1 ring-accent/30'
                    )}
                  >
                    {isReorderMode ? (
                      <Pencil className="w-3.5 h-3.5" />
                    ) : sceneIcon ? (
                      <MdiIcon icon={sceneIcon} className="w-3.5 h-3.5" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5" />
                    )}
                    {getSceneDisplayName(scene)}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Lights */}
        {lights.length > 0 && (
          <div className="mb-4">
            <h4 className="text-xs font-medium text-muted uppercase tracking-wide mb-2">
              {t.devices.lights}
            </h4>
            {isReorderMode ? (
              <Reorder.Group
                axis="y"
                values={orderedLights}
                onReorder={handleReorder}
                className="space-y-1"
              >
                {orderedLights.map((light) => (
                  <Reorder.Item
                    key={light.entity_id}
                    value={light}
                    className="flex items-center gap-2 cursor-grab active:cursor-grabbing bg-card rounded-lg pl-2 ring-1 ring-accent/30"
                    whileDrag={{ scale: 1.02, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  >
                    <GripVertical className="w-4 h-4 text-muted flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <LightSlider light={light} disabled />
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeviceEdit(light)
                      }}
                      className="p-2 mr-1 rounded-lg hover:bg-border/50 transition-colors"
                    >
                      <Pencil className="w-4 h-4 text-muted" />
                    </button>
                  </Reorder.Item>
                ))}
              </Reorder.Group>
            ) : (
              <div className="space-y-1">
                {lights.map((light) => (
                  <LightSlider key={light.entity_id} light={light} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Switches */}
        {switches.length > 0 && (
          <div className="mb-4">
            <h4 className="text-xs font-medium text-muted uppercase tracking-wide mb-2">
              {t.devices.switches}
            </h4>
            <div className="space-y-1">
              {switches.map((sw) => {
                const isOn = sw.state === 'on'
                const switchIcon = haWebSocket.getEntityIcon(sw.entity_id)
                return (
                  <button
                    key={sw.entity_id}
                    onClick={() => isReorderMode ? handleDeviceEdit(sw) : handleSwitchToggle(sw)}
                    className={clsx(
                      'w-full flex items-center justify-between px-3 py-2 rounded-lg',
                      'transition-colors touch-feedback',
                      isOn ? 'bg-accent/20' : 'bg-border/30',
                      isReorderMode && 'ring-1 ring-accent/30'
                    )}
                  >
                    <span className={clsx(
                      'text-sm font-medium truncate',
                      isOn ? 'text-foreground' : 'text-muted'
                    )}>
                      {sw.attributes.friendly_name || sw.entity_id.split('.')[1]}
                    </span>
                    {isReorderMode ? (
                      <div className="p-1.5 rounded-full bg-border/50 text-muted">
                        <Pencil className="w-4 h-4" />
                      </div>
                    ) : (
                      <div className={clsx(
                        'p-1.5 rounded-full transition-colors',
                        isOn ? 'bg-accent text-white' : 'bg-border text-muted'
                      )}>
                        {switchIcon ? (
                          <MdiIcon icon={switchIcon} className="w-4 h-4" />
                        ) : (
                          <Power className="w-4 h-4" />
                        )}
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Input Booleans & Numbers */}
        {(inputBooleans.length > 0 || inputNumbers.length > 0) && (
          <div className="mb-4">
            <h4 className="text-xs font-medium text-muted uppercase tracking-wide mb-2">
              {t.devices.inputs}
            </h4>
            <div className="space-y-1">
              {/* Input Booleans (toggles) */}
              {inputBooleans.map((input) => {
                const isOn = input.state === 'on'
                const inputIcon = haWebSocket.getEntityIcon(input.entity_id)
                return (
                  <button
                    key={input.entity_id}
                    onClick={() => isReorderMode ? handleDeviceEdit(input) : handleInputBooleanToggle(input)}
                    className={clsx(
                      'w-full flex items-center justify-between px-3 py-2 rounded-lg',
                      'transition-colors touch-feedback',
                      isOn ? 'bg-accent/20' : 'bg-border/30',
                      isReorderMode && 'ring-1 ring-accent/30'
                    )}
                  >
                    <span className={clsx(
                      'text-sm font-medium truncate',
                      isOn ? 'text-foreground' : 'text-muted'
                    )}>
                      {input.attributes.friendly_name || input.entity_id.split('.')[1]}
                    </span>
                    {isReorderMode ? (
                      <div className="p-1.5 rounded-full bg-border/50 text-muted">
                        <Pencil className="w-4 h-4" />
                      </div>
                    ) : (
                      <div className={clsx(
                        'p-1.5 rounded-full transition-colors',
                        isOn ? 'bg-accent text-white' : 'bg-border text-muted'
                      )}>
                        {inputIcon ? (
                          <MdiIcon icon={inputIcon} className="w-4 h-4" />
                        ) : (
                          <ToggleLeft className="w-4 h-4" />
                        )}
                      </div>
                    )}
                  </button>
                )
              })}

              {/* Input Numbers (sliders) */}
              {inputNumbers.map((input) => {
                const value = parseFloat(input.state) || 0
                const min = typeof input.attributes.min === 'number' ? input.attributes.min : 0
                const max = typeof input.attributes.max === 'number' ? input.attributes.max : 100
                const step = typeof input.attributes.step === 'number' ? input.attributes.step : 1
                const unit = typeof input.attributes.unit_of_measurement === 'string' ? input.attributes.unit_of_measurement : ''
                const inputIcon = haWebSocket.getEntityIcon(input.entity_id)
                return (
                  <div
                    key={input.entity_id}
                    className={clsx(
                      'px-3 py-2 rounded-lg bg-border/30',
                      isReorderMode && 'ring-1 ring-accent/30'
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-foreground truncate">
                        {input.attributes.friendly_name || input.entity_id.split('.')[1]}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted tabular-nums">
                          {value}{unit}
                        </span>
                        {isReorderMode ? (
                          <button
                            onClick={() => handleDeviceEdit(input)}
                            className="p-1 rounded-full bg-border/50 text-muted"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        ) : inputIcon ? (
                          <MdiIcon icon={inputIcon} className="w-4 h-4 text-muted" />
                        ) : (
                          <SlidersHorizontal className="w-4 h-4 text-muted" />
                        )}
                      </div>
                    </div>
                    {!isReorderMode && (
                      <input
                        type="range"
                        min={min}
                        max={max}
                        step={step}
                        value={value}
                        onChange={(e) => handleInputNumberChange(input, parseFloat(e.target.value))}
                        className="w-full h-1.5 bg-border rounded-full appearance-none cursor-pointer accent-accent"
                      />
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Sensors */}
        {(room.temperature !== undefined || room.humidity !== undefined) && (
          <div className="flex items-center gap-4 text-sm text-muted pt-2">
            {room.temperature !== undefined && (
              <span className="flex items-center gap-1.5">
                <Thermometer className="w-4 h-4" />
                {room.temperature.toFixed(1)}°C
              </span>
            )}
            {room.humidity !== undefined && (
              <span className="flex items-center gap-1.5">
                <Droplets className="w-4 h-4" />
                {room.humidity}%
              </span>
            )}
          </div>
        )}

        {/* Empty state */}
        {lights.length === 0 && switches.length === 0 && scenes.length === 0 && inputBooleans.length === 0 && inputNumbers.length === 0 && (
          <p className="text-sm text-muted py-2">
            {t.rooms.noDevices}
          </p>
        )}
      </div>

      <DeviceEditModal
        device={editingDevice}
        rooms={allRooms}
        onClose={() => setEditingDevice(null)}
      />
    </motion.div>
  )
}
