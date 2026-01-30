import { useMemo, useCallback, useRef, useState, useLayoutEffect, useEffect } from 'react'
import { motion } from 'framer-motion'
import { clsx } from 'clsx'
import type { RoomWithDevices, HAEntity } from '@/types/ha'
import { useEditMode } from '@/lib/contexts/EditModeContext'
import { useEnabledDomains } from '@/lib/hooks/useEnabledDomains'
import { useDeviceHandlers } from '@/lib/hooks/useDeviceHandlers'
import { useEntityOrder } from '@/lib/hooks/useEntityOrder'
import { t } from '@/lib/i18n'
import { ROOM_EXPAND_DURATION } from '@/lib/constants'

import {
  ScenesSection,
  LightsSection,
  SwitchesSection,
  InputsSection,
  ClimateSection,
  CoversSection,
  FansSection,
  SensorsDisplay,
} from '@/components/devices'

function getEntityDisplayName(entity: HAEntity): string {
  return entity.attributes.friendly_name || entity.entity_id.split('.')[1]
}

interface RoomExpandedProps {
  room: RoomWithDevices
  allRooms: RoomWithDevices[]
  isExpanded: boolean
}

export function RoomExpanded({ room, allRooms: _allRooms, isExpanded }: RoomExpandedProps) {
  const { enabledDomains } = useEnabledDomains()
  const handlers = useDeviceHandlers()
  const contentRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [measuredHeight, setMeasuredHeight] = useState(0)

  // Get edit mode state from context
  const { isDeviceEditMode, isSelected, toggleSelection, enterDeviceEdit, initialSelection } =
    useEditMode()
  const isInEditMode = isDeviceEditMode

  // Scroll to the initially selected device when entering edit mode
  useEffect(() => {
    if (isDeviceEditMode && initialSelection) {
      // Small delay to let the UI update to edit mode first
      const timer = setTimeout(() => {
        const element = document.querySelector(`[data-entity-id="${initialSelection}"]`)
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }, 50)
      return () => clearTimeout(timer)
    }
  }, [isDeviceEditMode, initialSelection])

  // Entity reordering state - tracks which section is being reordered (null = none)
  const [activeReorderSection, setActiveReorderSection] = useState<string | null>(null)
  const [reorderSelectedKeys, setReorderSelectedKeys] = useState<Set<string>>(new Set())
  const { getDomainOrder, updateDomainOrder } = useEntityOrder(room.id)

  // Toggle selection for an item during reorder mode
  const toggleReorderSelection = useCallback((key: string) => {
    setReorderSelectedKeys((prev) => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }, [])

  // Handlers for section-specific reordering
  const handleEnterSectionReorder = useCallback(
    (section: string) => {
      if (!isInEditMode) {
        setActiveReorderSection(section)
      }
    },
    [isInEditMode]
  )

  const handleExitSectionReorder = useCallback(() => {
    setActiveReorderSection(null)
    setReorderSelectedKeys(new Set())
  }, [])

  // Enter device edit mode and select the device
  const handleEnterEditModeWithSelection = useCallback(
    (deviceId: string) => {
      enterDeviceEdit(room.id, deviceId)
    },
    [enterDeviceEdit, room.id]
  )

  // Filter devices by type (only show enabled domains)
  const lights = useMemo(
    () =>
      enabledDomains.includes('light')
        ? room.devices.filter((d) => d.entity_id.startsWith('light.'))
        : [],
    [room.devices, enabledDomains]
  )
  const switches = useMemo(
    () =>
      enabledDomains.includes('switch')
        ? room.devices.filter((d) => d.entity_id.startsWith('switch.'))
        : [],
    [room.devices, enabledDomains]
  )
  const scenes = useMemo(
    () =>
      enabledDomains.includes('scene')
        ? room.devices.filter((d) => d.entity_id.startsWith('scene.'))
        : [],
    [room.devices, enabledDomains]
  )
  const inputBooleans = useMemo(
    () =>
      enabledDomains.includes('input_boolean')
        ? room.devices.filter((d) => d.entity_id.startsWith('input_boolean.'))
        : [],
    [room.devices, enabledDomains]
  )
  const inputNumbers = useMemo(
    () =>
      enabledDomains.includes('input_number')
        ? room.devices.filter((d) => d.entity_id.startsWith('input_number.'))
        : [],
    [room.devices, enabledDomains]
  )
  const climates = useMemo(
    () =>
      enabledDomains.includes('climate')
        ? room.devices.filter((d) => d.entity_id.startsWith('climate.'))
        : [],
    [room.devices, enabledDomains]
  )
  const covers = useMemo(
    () =>
      enabledDomains.includes('cover')
        ? room.devices.filter((d) => d.entity_id.startsWith('cover.'))
        : [],
    [room.devices, enabledDomains]
  )
  const fans = useMemo(
    () =>
      enabledDomains.includes('fan')
        ? room.devices.filter((d) => d.entity_id.startsWith('fan.'))
        : [],
    [room.devices, enabledDomains]
  )

  // Temperature and humidity sensors for display
  const temperatureSensors = useMemo(
    () =>
      room.devices
        .filter(
          (d) => d.entity_id.startsWith('sensor.') && d.attributes.device_class === 'temperature'
        )
        .filter((d) => !isNaN(parseFloat(d.state))),
    [room.devices]
  )
  const humiditySensors = useMemo(
    () =>
      room.devices
        .filter(
          (d) => d.entity_id.startsWith('sensor.') && d.attributes.device_class === 'humidity'
        )
        .filter((d) => !isNaN(parseFloat(d.state))),
    [room.devices]
  )

  const hasDevices =
    lights.length > 0 ||
    switches.length > 0 ||
    scenes.length > 0 ||
    inputBooleans.length > 0 ||
    inputNumbers.length > 0 ||
    climates.length > 0 ||
    covers.length > 0 ||
    fans.length > 0

  // Click outside to exit reorder mode
  useEffect(() => {
    if (!activeReorderSection) return

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setActiveReorderSection(null)
      }
    }

    // Delay adding listener to avoid immediate trigger
    const timer = setTimeout(() => {
      document.addEventListener('click', handleClickOutside)
    }, 100)

    return () => {
      clearTimeout(timer)
      document.removeEventListener('click', handleClickOutside)
    }
  }, [activeReorderSection])

  // Measure content height whenever it might change
  useLayoutEffect(() => {
    const element = contentRef.current
    if (!element) return

    const measure = () => {
      // Include margin-top (mt-3 = 12px) in the height calculation
      // scrollHeight doesn't include margins
      const style = getComputedStyle(element)
      const marginTop = parseFloat(style.marginTop) || 0
      setMeasuredHeight(element.scrollHeight + marginTop)
    }

    // Initial measurement
    measure()

    // Re-measure after a frame to catch grid layout
    const rafId = requestAnimationFrame(measure)

    // Use ResizeObserver to catch layout changes (e.g., grid reflow)
    const resizeObserver = new ResizeObserver(measure)
    resizeObserver.observe(element)

    return () => {
      cancelAnimationFrame(rafId)
      resizeObserver.disconnect()
    }
  }, [
    lights,
    switches,
    scenes,
    inputBooleans,
    inputNumbers,
    climates,
    covers,
    fans,
    hasDevices,
    isExpanded,
  ])

  return (
    <div
      style={{
        height: isExpanded ? measuredHeight : 0,
        overflow: 'hidden',
        transition: `height ${ROOM_EXPAND_DURATION}s cubic-bezier(0.25, 0.1, 0.25, 1)`,
      }}
    >
      <motion.div
        ref={contentRef}
        initial={false}
        animate={{ opacity: isExpanded ? 1 : 0 }}
        transition={{
          duration: ROOM_EXPAND_DURATION * 0.5,
          ease: isExpanded ? 'easeOut' : 'easeIn',
        }}
        className="mt-3 pt-3 border-t border-border pb-1 px-0.5 -mx-0.5 [&>*:last-child]:mb-0"
        style={{
          // Disable touch scrolling when reorder mode is active
          touchAction: activeReorderSection !== null ? 'none' : 'auto',
        }}
        onPointerDown={(e) => {
          // Don't stop propagation during reorder - let events reach document listeners
          if (activeReorderSection === null) {
            e.stopPropagation()
          }
        }}
        onPointerMove={(e) => {
          // Don't stop propagation during reorder - let events reach document listeners
          if (activeReorderSection === null) {
            e.stopPropagation()
          }
        }}
        onTouchStart={(e) => {
          if (activeReorderSection === null) {
            e.stopPropagation()
          }
        }}
        onTouchMove={(e) => {
          // Prevent scrolling during reorder mode
          if (activeReorderSection !== null) {
            e.preventDefault()
          } else {
            e.stopPropagation()
          }
        }}
      >
        <div ref={containerRef}>
          <div
            className={clsx(
              'transition-opacity duration-200',
              activeReorderSection !== null && activeReorderSection !== 'scene' && 'opacity-50'
            )}
          >
            <ScenesSection
              scenes={scenes}
              isInEditMode={isInEditMode}
              isSelected={isSelected}
              onActivate={handlers.handleSceneActivate}
              onToggleSelection={toggleSelection}
              onEnterEditModeWithSelection={handleEnterEditModeWithSelection}
              getDisplayName={getEntityDisplayName}
              isEntityReordering={activeReorderSection === 'scene'}
              entityOrder={getDomainOrder('scene')}
              onReorderEntities={(entities) => updateDomainOrder('scene', entities)}
              onEnterSectionReorder={() => handleEnterSectionReorder('scene')}
              onExitSectionReorder={handleExitSectionReorder}
              reorderSelectedKeys={
                activeReorderSection === 'scene' ? reorderSelectedKeys : undefined
              }
              onToggleReorderSelection={toggleReorderSelection}
            />
          </div>

          <div
            className={clsx(
              'transition-opacity duration-200',
              activeReorderSection !== null && activeReorderSection !== 'light' && 'opacity-50'
            )}
          >
            <LightsSection
              lights={lights}
              isInEditMode={isInEditMode}
              isSelected={isSelected}
              onToggleSelection={toggleSelection}
              onEnterEditModeWithSelection={handleEnterEditModeWithSelection}
              isEntityReordering={activeReorderSection === 'light'}
              entityOrder={getDomainOrder('light')}
              onReorderEntities={(entities) => updateDomainOrder('light', entities)}
              onEnterSectionReorder={() => handleEnterSectionReorder('light')}
              onExitSectionReorder={handleExitSectionReorder}
              reorderSelectedKeys={
                activeReorderSection === 'light' ? reorderSelectedKeys : undefined
              }
              onToggleReorderSelection={toggleReorderSelection}
            />
          </div>

          <div
            className={clsx(
              'transition-opacity duration-200',
              activeReorderSection !== null && activeReorderSection !== 'switch' && 'opacity-50'
            )}
          >
            <SwitchesSection
              switches={switches}
              isInEditMode={isInEditMode}
              isSelected={isSelected}
              onToggle={handlers.handleSwitchToggle}
              onToggleSelection={toggleSelection}
              onEnterEditModeWithSelection={handleEnterEditModeWithSelection}
              isEntityReordering={activeReorderSection === 'switch'}
              entityOrder={getDomainOrder('switch')}
              onReorderEntities={(entities) => updateDomainOrder('switch', entities)}
              onEnterSectionReorder={() => handleEnterSectionReorder('switch')}
              onExitSectionReorder={handleExitSectionReorder}
              reorderSelectedKeys={
                activeReorderSection === 'switch' ? reorderSelectedKeys : undefined
              }
              onToggleReorderSelection={toggleReorderSelection}
            />
          </div>

          <div
            className={clsx(
              'transition-opacity duration-200',
              activeReorderSection !== null && activeReorderSection !== 'input' && 'opacity-50'
            )}
          >
            <InputsSection
              inputBooleans={inputBooleans}
              inputNumbers={inputNumbers}
              isInEditMode={isInEditMode}
              isSelected={isSelected}
              onBooleanToggle={handlers.handleInputBooleanToggle}
              onNumberChange={handlers.handleInputNumberChange}
              onToggleSelection={toggleSelection}
              onEnterEditModeWithSelection={handleEnterEditModeWithSelection}
              isEntityReordering={activeReorderSection === 'input'}
              entityOrder={getDomainOrder('input_boolean')}
              onReorderEntities={(entities) => updateDomainOrder('input_boolean', entities)}
              onEnterSectionReorder={() => handleEnterSectionReorder('input')}
              onExitSectionReorder={handleExitSectionReorder}
              reorderSelectedKeys={
                activeReorderSection === 'input' ? reorderSelectedKeys : undefined
              }
              onToggleReorderSelection={toggleReorderSelection}
            />
          </div>

          <div
            className={clsx(
              'transition-opacity duration-200',
              activeReorderSection !== null && activeReorderSection !== 'climate' && 'opacity-50'
            )}
          >
            <ClimateSection
              climates={climates}
              isInEditMode={isInEditMode}
              isSelected={isSelected}
              onToggle={handlers.handleClimateToggle}
              onToggleSelection={toggleSelection}
              onEnterEditModeWithSelection={handleEnterEditModeWithSelection}
              isEntityReordering={activeReorderSection === 'climate'}
              entityOrder={getDomainOrder('climate')}
              onReorderEntities={(entities) => updateDomainOrder('climate', entities)}
              onEnterSectionReorder={() => handleEnterSectionReorder('climate')}
              onExitSectionReorder={handleExitSectionReorder}
              reorderSelectedKeys={
                activeReorderSection === 'climate' ? reorderSelectedKeys : undefined
              }
              onToggleReorderSelection={toggleReorderSelection}
            />
          </div>

          <div
            className={clsx(
              'transition-opacity duration-200',
              activeReorderSection !== null && activeReorderSection !== 'cover' && 'opacity-50'
            )}
          >
            <CoversSection
              covers={covers}
              isInEditMode={isInEditMode}
              isSelected={isSelected}
              onOpen={handlers.handleCoverOpen}
              onClose={handlers.handleCoverClose}
              onStop={handlers.handleCoverStop}
              onToggleSelection={toggleSelection}
              onEnterEditModeWithSelection={handleEnterEditModeWithSelection}
              isEntityReordering={activeReorderSection === 'cover'}
              entityOrder={getDomainOrder('cover')}
              onReorderEntities={(entities) => updateDomainOrder('cover', entities)}
              onEnterSectionReorder={() => handleEnterSectionReorder('cover')}
              onExitSectionReorder={handleExitSectionReorder}
              reorderSelectedKeys={
                activeReorderSection === 'cover' ? reorderSelectedKeys : undefined
              }
              onToggleReorderSelection={toggleReorderSelection}
            />
          </div>

          <div
            className={clsx(
              'transition-opacity duration-200',
              activeReorderSection !== null && activeReorderSection !== 'fan' && 'opacity-50'
            )}
          >
            <FansSection
              fans={fans}
              isInEditMode={isInEditMode}
              isSelected={isSelected}
              onToggle={handlers.handleFanToggle}
              onToggleSelection={toggleSelection}
              onEnterEditModeWithSelection={handleEnterEditModeWithSelection}
              isEntityReordering={activeReorderSection === 'fan'}
              entityOrder={getDomainOrder('fan')}
              onReorderEntities={(entities) => updateDomainOrder('fan', entities)}
              onEnterSectionReorder={() => handleEnterSectionReorder('fan')}
              onExitSectionReorder={handleExitSectionReorder}
              reorderSelectedKeys={activeReorderSection === 'fan' ? reorderSelectedKeys : undefined}
              onToggleReorderSelection={toggleReorderSelection}
            />
          </div>

          <div
            className={clsx(
              'transition-opacity duration-200',
              activeReorderSection !== null && activeReorderSection !== 'sensor' && 'opacity-50'
            )}
          >
            <SensorsDisplay
              temperatureSensors={temperatureSensors}
              humiditySensors={humiditySensors}
              isInEditMode={isInEditMode}
              isSelected={isSelected}
              onToggleSelection={toggleSelection}
              onEnterEditModeWithSelection={handleEnterEditModeWithSelection}
              isEntityReordering={activeReorderSection === 'sensor'}
              entityOrder={getDomainOrder('sensor')}
              onReorderEntities={(entities) => updateDomainOrder('sensor', entities)}
              onEnterSectionReorder={() => handleEnterSectionReorder('sensor')}
              onExitSectionReorder={handleExitSectionReorder}
              reorderSelectedKeys={
                activeReorderSection === 'sensor' ? reorderSelectedKeys : undefined
              }
              onToggleReorderSelection={toggleReorderSelection}
            />
          </div>
        </div>

        {/* Empty state */}
        {!hasDevices && <p className="text-sm text-muted py-2">{t.rooms.noDevices}</p>}
      </motion.div>
    </div>
  )
}
