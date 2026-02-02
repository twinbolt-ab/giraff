import { useMemo } from 'react'
import { Thermometer, Droplets } from 'lucide-react'
import { clsx } from 'clsx'
import type { HAEntity } from '@/types/ha'
import type { DomainOrderMap } from '@/types/ordering'
import { MdiIcon } from '@/components/ui/MdiIcon'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { SelectionCheckbox } from '@/components/ui/SelectionCheckbox'
import { getEntityIcon } from '@/lib/ha-websocket'
import { useLongPress } from '@/lib/hooks/useLongPress'
import { sortEntitiesByOrder } from '@/lib/utils/entity-sort'
import { ReorderableList } from '@/components/dashboard/ReorderableList'
import { useReorder } from '@/lib/contexts/ReorderContext'
import { useEditMode } from '@/lib/contexts/EditModeContext'
import { t } from '@/lib/i18n'
import { formatTemperature } from '@/lib/temperature'

function getEntityDisplayName(entity: HAEntity): string {
  return entity.attributes.friendly_name || entity.entity_id.split('.')[1]
}

interface SensorItemProps {
  sensor: HAEntity
  fallbackIcon: React.ReactNode
  value: string
  isInEditMode: boolean
  isSelected: boolean
  onToggleSelection: (id: string) => void
  onEnterEditModeWithSelection?: (deviceId: string) => void
  isReordering?: boolean
  isReorderSelected?: boolean
}

function SensorItem({
  sensor,
  fallbackIcon,
  value,
  isInEditMode,
  isSelected,
  onToggleSelection,
  onEnterEditModeWithSelection,
  isReordering = false,
  isReorderSelected = false,
}: SensorItemProps) {
  const customIcon = getEntityIcon(sensor.entity_id)

  const longPress = useLongPress({
    duration: 500,
    disabled: isInEditMode || isReordering,
    onLongPress: () => onEnterEditModeWithSelection?.(sensor.entity_id),
  })

  const iconElement = customIcon ? <MdiIcon icon={customIcon} className="w-4 h-4" /> : fallbackIcon

  if (isInEditMode) {
    return (
      <button
        data-entity-id={sensor.entity_id}
        onClick={() => {
          onToggleSelection(sensor.entity_id)
        }}
        className="w-full px-3 py-2.5 rounded-xl bg-border/30 touch-feedback"
      >
        <div className="flex items-center gap-2">
          <SelectionCheckbox isSelected={isSelected} />
          <div className="p-1.5 rounded-lg bg-border/50 text-muted flex-shrink-0">
            {iconElement}
          </div>
          <span className="flex-1 text-sm font-medium text-foreground truncate text-left">
            {getEntityDisplayName(sensor)}
          </span>
          <span className="text-sm text-muted tabular-nums">{value}</span>
        </div>
      </button>
    )
  }

  return (
    <div
      data-entity-id={sensor.entity_id}
      className={clsx(
        'px-3 py-2.5 rounded-xl bg-border/30 transition-all',
        isReorderSelected && 'ring-2 ring-accent ring-offset-1 ring-offset-bg-primary'
      )}
      onPointerDown={longPress.onPointerDown}
      onPointerMove={longPress.onPointerMove}
      onPointerUp={longPress.onPointerUp}
      onPointerCancel={longPress.onPointerUp}
    >
      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded-lg bg-border/50 text-muted flex-shrink-0">{iconElement}</div>
        <span className="flex-1 text-sm font-medium text-foreground truncate">
          {getEntityDisplayName(sensor)}
        </span>
        <span className="text-sm text-muted tabular-nums">{value}</span>
      </div>
    </div>
  )
}

interface SensorsDisplayProps {
  temperatureSensors: HAEntity[]
  humiditySensors: HAEntity[]
  isInEditMode: boolean
  isSelected: (id: string) => boolean
  onToggleSelection: (id: string) => void
  onEnterEditModeWithSelection?: (deviceId: string) => void
  entityOrder?: DomainOrderMap
  onReorderEntities?: (entities: HAEntity[]) => Promise<void>
}

export function SensorsDisplay({
  temperatureSensors,
  humiditySensors,
  isInEditMode,
  isSelected,
  onToggleSelection,
  onEnterEditModeWithSelection,
  entityOrder = {},
  onReorderEntities,
}: SensorsDisplayProps) {
  // Get reorder state from context
  const { isSectionReordering, enterReorder, selectedKeys, toggleSelection } = useReorder()
  const isEntityReordering = isSectionReordering('sensor')

  // Check if any edit mode is active (to disable reorder)
  const { isDeviceEditMode, isAllDevicesEditMode } = useEditMode()
  const isAnyEditModeActive = isDeviceEditMode || isAllDevicesEditMode

  // Combine and sort all sensors by order
  const sortedSensors = useMemo(() => {
    const allSensors = [...temperatureSensors, ...humiditySensors]
    return sortEntitiesByOrder(allSensors, entityOrder)
  }, [temperatureSensors, humiditySensors, entityOrder])

  // Long-press to enter reorder mode for this section
  const sectionLongPress = useLongPress({
    duration: 500,
    disabled: isAnyEditModeActive || isEntityReordering || sortedSensors.length < 2,
    onLongPress: () => enterReorder('sensor'),
  })

  if (temperatureSensors.length === 0 && humiditySensors.length === 0) {
    return null
  }

  const handleReorder = (reorderedSensors: HAEntity[]) => {
    void onReorderEntities?.(reorderedSensors)
  }

  const renderSensor = (sensor: HAEntity, reordering = false, isReorderSelected = false) => {
    const isTemperature = sensor.attributes.device_class === 'temperature'
    return (
      <SensorItem
        key={sensor.entity_id}
        sensor={sensor}
        fallbackIcon={
          isTemperature ? <Thermometer className="w-4 h-4" /> : <Droplets className="w-4 h-4" />
        }
        value={
          isTemperature
            ? formatTemperature(parseFloat(sensor.state))
            : `${Math.round(parseFloat(sensor.state))}%`
        }
        isInEditMode={isInEditMode}
        isSelected={isSelected(sensor.entity_id)}
        onToggleSelection={onToggleSelection}
        onEnterEditModeWithSelection={onEnterEditModeWithSelection}
        isReordering={reordering}
        isReorderSelected={isReorderSelected}
      />
    )
  }

  return (
    <div className="mb-4">
      <SectionHeader>{t.domains.sensor}</SectionHeader>
      {isEntityReordering ? (
        <ReorderableList
          items={sortedSensors}
          getKey={(sensor) => sensor.entity_id}
          onReorder={handleReorder}
          layout="vertical"
          selectedKeys={selectedKeys}
          onItemTap={toggleSelection}
          renderItem={(sensor, _index, _isDragging, isReorderSelected) =>
            renderSensor(sensor, true, isReorderSelected)
          }
        />
      ) : (
        <div
          className="space-y-2"
          onPointerDown={sectionLongPress.onPointerDown}
          onPointerMove={sectionLongPress.onPointerMove}
          onPointerUp={sectionLongPress.onPointerUp}
          onPointerCancel={sectionLongPress.onPointerUp}
        >
          {sortedSensors.map((sensor) => renderSensor(sensor))}
        </div>
      )}
    </div>
  )
}
