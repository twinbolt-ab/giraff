import { useMemo } from 'react'
import { clsx } from 'clsx'
import type { HAEntity } from '@/types/ha'
import type { DomainOrderMap } from '@/types/ordering'
import { LightSlider } from '@/components/dashboard/LightSlider'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { SelectionCheckbox } from '@/components/ui/SelectionCheckbox'
import { useLongPress } from '@/lib/hooks/useLongPress'
import { sortEntitiesByOrder } from '@/lib/utils/entity-sort'
import { ReorderableList } from '@/components/dashboard/ReorderableList'
import { t } from '@/lib/i18n'
import type { EntityMeta } from '@/lib/hooks/useAllEntities'

interface LightsSectionProps {
  lights: HAEntity[]
  isInEditMode: boolean
  isSelected: (id: string) => boolean
  onToggleSelection: (id: string) => void
  onEnterEditModeWithSelection?: (deviceId: string) => void
  compact?: boolean
  singleColumn?: boolean
  entityMeta?: Map<string, EntityMeta>
  isEntityReordering?: boolean
  entityOrder?: DomainOrderMap
  onReorderEntities?: (entities: HAEntity[]) => Promise<void>
  onEnterSectionReorder?: () => void
  onExitSectionReorder?: () => void
}

function LightItem({
  light,
  isInEditMode,
  isSelected,
  onToggleSelection,
  onEnterEditModeWithSelection,
  compact,
  entityMeta,
  isReordering = false,
}: {
  light: HAEntity
  isInEditMode: boolean
  isSelected: boolean
  onToggleSelection: (id: string) => void
  onEnterEditModeWithSelection?: (deviceId: string) => void
  compact: boolean
  entityMeta?: EntityMeta
  isReordering?: boolean
}) {
  const longPress = useLongPress({
    duration: 500,
    disabled: isInEditMode || isReordering,
    onLongPress: () => onEnterEditModeWithSelection?.(light.entity_id),
  })

  if (isInEditMode) {
    return (
      <button
        data-entity-id={light.entity_id}
        onClick={() => {
          onToggleSelection(light.entity_id)
        }}
        className={clsx(
          'flex items-center bg-card rounded-lg touch-feedback w-full',
          compact ? 'gap-1 pl-1 pr-0.5' : 'gap-2 pl-2 pr-1'
        )}
      >
        <SelectionCheckbox isSelected={isSelected} />
        <div className="flex-1 min-w-0">
          <LightSlider light={light} disabled={true} compact={compact} entityMeta={entityMeta} />
        </div>
      </button>
    )
  }

  return (
    <div
      data-entity-id={light.entity_id}
      onPointerDown={longPress.onPointerDown}
      onPointerMove={longPress.onPointerMove}
      onPointerUp={longPress.onPointerUp}
      onPointerCancel={longPress.onPointerUp}
    >
      <LightSlider
        light={light}
        disabled={isReordering}
        compact={compact}
        entityMeta={entityMeta}
      />
    </div>
  )
}

export function LightsSection({
  lights,
  isInEditMode,
  isSelected,
  onToggleSelection,
  onEnterEditModeWithSelection,
  compact = false,
  singleColumn = false,
  entityMeta,
  isEntityReordering = false,
  entityOrder = {},
  onReorderEntities,
  onEnterSectionReorder,
  onExitSectionReorder,
}: LightsSectionProps) {
  // Long-press to enter reorder mode for this section
  const sectionLongPress = useLongPress({
    duration: 500,
    disabled: isInEditMode || isEntityReordering || lights.length < 2,
    onLongPress: () => onEnterSectionReorder?.(),
  })

  // Sort lights by order
  const sortedLights = useMemo(() => {
    return sortEntitiesByOrder(lights, entityOrder)
  }, [lights, entityOrder])

  if (lights.length === 0) return null

  const handleReorder = (reorderedLights: HAEntity[]) => {
    void onReorderEntities?.(reorderedLights)
  }

  // Use two columns for lights when there are more than 6 (unless explicitly set or forced single)
  const useTwoColumn = !singleColumn && (compact || lights.length > 6)

  return (
    <div className="mb-4">
      <SectionHeader>{t.devices.lights}</SectionHeader>
      {isEntityReordering ? (
        <ReorderableList
          items={sortedLights}
          getKey={(light) => light.entity_id}
          onReorder={handleReorder}
          onDragEnd={onExitSectionReorder}
          layout="vertical"
          renderItem={(light) => (
            <LightItem
              key={light.entity_id}
              light={light}
              isInEditMode={isInEditMode}
              isSelected={isSelected(light.entity_id)}
              onToggleSelection={onToggleSelection}
              onEnterEditModeWithSelection={onEnterEditModeWithSelection}
              compact={useTwoColumn}
              entityMeta={entityMeta?.get(light.entity_id)}
              isReordering
            />
          )}
        />
      ) : (
        <div
          className={clsx(useTwoColumn ? 'grid grid-cols-2 gap-x-2 gap-y-1' : 'space-y-1')}
          onPointerDown={sectionLongPress.onPointerDown}
          onPointerMove={sectionLongPress.onPointerMove}
          onPointerUp={sectionLongPress.onPointerUp}
          onPointerCancel={sectionLongPress.onPointerUp}
        >
          {sortedLights.map((light) => (
            <LightItem
              key={light.entity_id}
              light={light}
              isInEditMode={isInEditMode}
              isSelected={isSelected(light.entity_id)}
              onToggleSelection={onToggleSelection}
              onEnterEditModeWithSelection={onEnterEditModeWithSelection}
              compact={useTwoColumn}
              entityMeta={entityMeta?.get(light.entity_id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
