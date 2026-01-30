import { useMemo } from 'react'
import { Power } from 'lucide-react'
import type { HAEntity } from '@/types/ha'
import type { DomainOrderMap } from '@/types/ordering'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { DeviceToggleButton } from '@/components/ui/DeviceToggleButton'
import { sortEntitiesByOrder } from '@/lib/utils/entity-sort'
import { ReorderableList } from '@/components/dashboard/ReorderableList'
import { useLongPress } from '@/lib/hooks/useLongPress'
import { t } from '@/lib/i18n'
import type { EntityMeta } from '@/lib/hooks/useAllEntities'

interface SwitchesSectionProps {
  switches: HAEntity[]
  isInEditMode: boolean
  isSelected: (id: string) => boolean
  onToggle: (device: HAEntity) => void
  onToggleSelection: (id: string) => void
  onEnterEditModeWithSelection?: (deviceId: string) => void
  entityMeta?: Map<string, EntityMeta>
  isEntityReordering?: boolean
  entityOrder?: DomainOrderMap
  onReorderEntities?: (entities: HAEntity[]) => Promise<void>
  onEnterSectionReorder?: () => void
  onExitSectionReorder?: () => void
  reorderSelectedKeys?: Set<string>
  onToggleReorderSelection?: (key: string) => void
}

export function SwitchesSection({
  switches,
  isInEditMode,
  isSelected,
  onToggle,
  onToggleSelection,
  onEnterEditModeWithSelection,
  entityMeta,
  isEntityReordering = false,
  entityOrder = {},
  onReorderEntities,
  onEnterSectionReorder,
  onExitSectionReorder,
  reorderSelectedKeys,
  onToggleReorderSelection,
}: SwitchesSectionProps) {
  // Long-press to enter reorder mode for this section
  const sectionLongPress = useLongPress({
    duration: 500,
    disabled: isInEditMode || isEntityReordering || switches.length < 2,
    onLongPress: () => onEnterSectionReorder?.(),
  })

  // Sort switches by order
  const sortedSwitches = useMemo(() => {
    return sortEntitiesByOrder(switches, entityOrder)
  }, [switches, entityOrder])

  if (switches.length === 0) return null

  const handleReorder = (reorderedSwitches: HAEntity[]) => {
    void onReorderEntities?.(reorderedSwitches)
  }

  return (
    <div className="mb-4">
      <SectionHeader>{t.devices.switches}</SectionHeader>
      {isEntityReordering ? (
        <ReorderableList
          items={sortedSwitches}
          getKey={(sw) => sw.entity_id}
          onReorder={handleReorder}
          onDragEnd={onExitSectionReorder}
          layout="vertical"
          selectedKeys={reorderSelectedKeys}
          onItemTap={onToggleReorderSelection}
          renderItem={(sw, _index, _isDragging, isReorderSelected) => (
            <DeviceToggleButton
              key={sw.entity_id}
              entity={sw}
              isInEditMode={isInEditMode}
              isSelected={isSelected(sw.entity_id)}
              onToggle={() => {
                onToggle(sw)
              }}
              onToggleSelection={() => {
                onToggleSelection(sw.entity_id)
              }}
              onEnterEditModeWithSelection={() => onEnterEditModeWithSelection?.(sw.entity_id)}
              fallbackIcon={<Power className="w-5 h-5" />}
              entityMeta={entityMeta?.get(sw.entity_id)}
              isReordering
              isReorderSelected={isReorderSelected}
            />
          )}
        />
      ) : (
        <div
          className="space-y-1"
          onPointerDown={sectionLongPress.onPointerDown}
          onPointerMove={sectionLongPress.onPointerMove}
          onPointerUp={sectionLongPress.onPointerUp}
          onPointerCancel={sectionLongPress.onPointerUp}
        >
          {sortedSwitches.map((sw) => (
            <DeviceToggleButton
              key={sw.entity_id}
              entity={sw}
              isInEditMode={isInEditMode}
              isSelected={isSelected(sw.entity_id)}
              onToggle={() => {
                onToggle(sw)
              }}
              onToggleSelection={() => {
                onToggleSelection(sw.entity_id)
              }}
              onEnterEditModeWithSelection={() => onEnterEditModeWithSelection?.(sw.entity_id)}
              fallbackIcon={<Power className="w-5 h-5" />}
              entityMeta={entityMeta?.get(sw.entity_id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
