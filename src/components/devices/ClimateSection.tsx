import { useMemo } from 'react'
import { Thermometer, Power } from 'lucide-react'
import { clsx } from 'clsx'
import type { HAEntity } from '@/types/ha'
import type { DomainOrderMap } from '@/types/ordering'
import { MdiIcon } from '@/components/ui/MdiIcon'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { SelectionCheckbox } from '@/components/ui/SelectionCheckbox'
import { EntityBadges } from '@/components/ui/EntityBadge'
import { getEntityIcon } from '@/lib/ha-websocket'
import { useLongPress } from '@/lib/hooks/useLongPress'
import { sortEntitiesByOrder } from '@/lib/utils/entity-sort'
import { ReorderableList } from '@/components/dashboard/ReorderableList'
import { useReorder } from '@/lib/contexts/ReorderContext'
import { t } from '@/lib/i18n'
import { formatTemperatureCompact } from '@/lib/temperature'
import type { EntityMeta } from '@/lib/hooks/useAllEntities'

function getEntityDisplayName(entity: HAEntity): string {
  return entity.attributes.friendly_name || entity.entity_id.split('.')[1]
}

interface ClimateSectionProps {
  climates: HAEntity[]
  isInEditMode: boolean
  isSelected: (id: string) => boolean
  onToggle: (device: HAEntity) => void
  onToggleSelection: (id: string) => void
  onEnterEditModeWithSelection?: (deviceId: string) => void
  entityMeta?: Map<string, EntityMeta>
  entityOrder?: DomainOrderMap
  onReorderEntities?: (entities: HAEntity[]) => Promise<void>
}

function ClimateItem({
  climate,
  isInEditMode,
  isSelected,
  onToggle,
  onToggleSelection,
  onEnterEditModeWithSelection,
  entityMeta,
  isReordering = false,
  isReorderSelected = false,
}: {
  climate: HAEntity
  isInEditMode: boolean
  isSelected: boolean
  onToggle: (device: HAEntity) => void
  onToggleSelection: (id: string) => void
  onEnterEditModeWithSelection?: (deviceId: string) => void
  entityMeta?: EntityMeta
  isReordering?: boolean
  isReorderSelected?: boolean
}) {
  const currentTemp = climate.attributes.current_temperature as number | undefined
  const targetTemp = climate.attributes.temperature as number | undefined
  const hvacMode = climate.state
  const isOff = hvacMode === 'off'
  const climateIcon = getEntityIcon(climate.entity_id)

  const longPress = useLongPress({
    duration: 500,
    disabled: isInEditMode || isReordering,
    onLongPress: () => onEnterEditModeWithSelection?.(climate.entity_id),
  })

  if (isInEditMode) {
    return (
      <button
        data-entity-id={climate.entity_id}
        onClick={() => {
          onToggleSelection(climate.entity_id)
        }}
        className="w-full px-3 py-3 rounded-xl bg-border/30 touch-feedback"
      >
        <div className="flex items-center gap-2">
          <SelectionCheckbox isSelected={isSelected} />
          <div
            className={clsx(
              'p-2 rounded-lg transition-colors flex-shrink-0',
              isOff ? 'bg-border/50 text-muted' : 'bg-accent/20 text-accent'
            )}
          >
            {climateIcon ? (
              <MdiIcon icon={climateIcon} className="w-5 h-5" />
            ) : (
              <Thermometer className="w-5 h-5" />
            )}
          </div>
          <div className="flex-1 flex items-center gap-1.5 min-w-0">
            <span className="text-sm font-medium text-foreground truncate text-left">
              {getEntityDisplayName(climate)}
            </span>
            {entityMeta && (
              <EntityBadges
                isHiddenInStuga={entityMeta.isHiddenInStuga}
                isHiddenInHA={entityMeta.isHiddenInHA}
                hasRoom={entityMeta.hasRoom}
                className="flex-shrink-0"
              />
            )}
          </div>
        </div>
      </button>
    )
  }

  return (
    <div
      data-entity-id={climate.entity_id}
      className={clsx(
        'px-3 py-3 rounded-xl transition-all',
        isOff ? 'bg-border/30' : 'bg-accent/10',
        isReorderSelected && 'ring-2 ring-accent ring-offset-1 ring-offset-bg-primary'
      )}
      onPointerDown={longPress.onPointerDown}
      onPointerMove={longPress.onPointerMove}
      onPointerUp={longPress.onPointerUp}
      onPointerCancel={longPress.onPointerUp}
    >
      <div className="flex items-center gap-3">
        {/* Icon */}
        <div
          className={clsx(
            'p-2 rounded-lg transition-colors flex-shrink-0',
            isOff ? 'bg-border/50 text-muted' : 'bg-accent/20 text-accent'
          )}
        >
          {climateIcon ? (
            <MdiIcon icon={climateIcon} className="w-5 h-5" />
          ) : (
            <Thermometer className="w-5 h-5" />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground truncate">
              {getEntityDisplayName(climate)}
            </span>
            {entityMeta && (
              <EntityBadges
                isHiddenInStuga={entityMeta.isHiddenInStuga}
                isHiddenInHA={entityMeta.isHiddenInHA}
                hasRoom={entityMeta.hasRoom}
                className="flex-shrink-0"
              />
            )}
            {!isOff && (
              <span
                className={clsx(
                  'px-2 py-0.5 rounded-full text-xs font-medium capitalize flex-shrink-0',
                  hvacMode === 'heat' && 'bg-orange-500/20 text-orange-500',
                  hvacMode === 'cool' && 'bg-blue-500/20 text-blue-500',
                  hvacMode === 'heat_cool' && 'bg-purple-500/20 text-purple-500',
                  hvacMode === 'auto' && 'bg-green-500/20 text-green-500',
                  !['heat', 'cool', 'heat_cool', 'auto'].includes(hvacMode) &&
                    'bg-accent/20 text-accent'
                )}
              >
                {hvacMode}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-0.5 text-xs text-muted">
            {currentTemp !== undefined && (
              <span>Current: {formatTemperatureCompact(currentTemp)}</span>
            )}
            {targetTemp !== undefined && !isOff && (
              <span>Target: {formatTemperatureCompact(targetTemp, { decimals: 0 })}</span>
            )}
          </div>
        </div>

        {/* Power toggle */}
        <button
          onClick={() => {
            onToggle(climate)
          }}
          className={clsx(
            'p-2 rounded-lg transition-colors touch-feedback',
            isOff ? 'bg-border/50 text-muted' : 'bg-accent text-white'
          )}
        >
          <Power className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

export function ClimateSection({
  climates,
  isInEditMode,
  isSelected,
  onToggle,
  onToggleSelection,
  onEnterEditModeWithSelection,
  entityMeta,
  entityOrder = {},
  onReorderEntities,
}: ClimateSectionProps) {
  // Get reorder state from context
  const { isSectionReordering, enterReorder, selectedKeys, toggleSelection } = useReorder()
  const isEntityReordering = isSectionReordering('climate')

  // Long-press to enter reorder mode for this section
  const sectionLongPress = useLongPress({
    duration: 500,
    disabled: isInEditMode || isEntityReordering || climates.length < 2,
    onLongPress: () => enterReorder('climate'),
  })

  // Sort climates by order
  const sortedClimates = useMemo(() => {
    return sortEntitiesByOrder(climates, entityOrder)
  }, [climates, entityOrder])

  if (climates.length === 0) return null

  const handleReorder = (reorderedClimates: HAEntity[]) => {
    void onReorderEntities?.(reorderedClimates)
  }

  return (
    <div className="mb-4">
      <SectionHeader>{t.domains.climate}</SectionHeader>
      {isEntityReordering ? (
        <ReorderableList
          items={sortedClimates}
          getKey={(climate) => climate.entity_id}
          onReorder={handleReorder}
          layout="vertical"
          selectedKeys={selectedKeys}
          onItemTap={toggleSelection}
          renderItem={(climate, _index, _isDragging, isReorderSelected) => (
            <ClimateItem
              key={climate.entity_id}
              climate={climate}
              isInEditMode={isInEditMode}
              isSelected={isSelected(climate.entity_id)}
              onToggle={onToggle}
              onToggleSelection={onToggleSelection}
              onEnterEditModeWithSelection={onEnterEditModeWithSelection}
              entityMeta={entityMeta?.get(climate.entity_id)}
              isReordering
              isReorderSelected={isReorderSelected}
            />
          )}
        />
      ) : (
        <div
          className="space-y-2"
          onPointerDown={sectionLongPress.onPointerDown}
          onPointerMove={sectionLongPress.onPointerMove}
          onPointerUp={sectionLongPress.onPointerUp}
          onPointerCancel={sectionLongPress.onPointerUp}
        >
          {sortedClimates.map((climate) => (
            <ClimateItem
              key={climate.entity_id}
              climate={climate}
              isInEditMode={isInEditMode}
              isSelected={isSelected(climate.entity_id)}
              onToggle={onToggle}
              onToggleSelection={onToggleSelection}
              onEnterEditModeWithSelection={onEnterEditModeWithSelection}
              entityMeta={entityMeta?.get(climate.entity_id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
