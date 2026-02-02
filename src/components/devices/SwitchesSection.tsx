import { useMemo } from 'react'
import { Power } from 'lucide-react'
import type { HAEntity } from '@/types/ha'
import type { DomainOrderMap } from '@/types/ordering'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { DeviceToggleButton } from '@/components/ui/DeviceToggleButton'
import { sortEntitiesByOrder } from '@/lib/utils/entity-sort'
import { ReorderableList } from '@/components/dashboard/ReorderableList'
import { useReorder } from '@/lib/contexts/ReorderContext'
import { useEditMode } from '@/lib/contexts/EditModeContext'
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
  entityOrder?: DomainOrderMap
  onReorderEntities?: (entities: HAEntity[]) => Promise<void>
}

export function SwitchesSection({
  switches,
  isInEditMode,
  isSelected,
  onToggle,
  onToggleSelection,
  onEnterEditModeWithSelection,
  entityMeta,
  entityOrder = {},
  onReorderEntities,
}: SwitchesSectionProps) {
  // Get reorder state from context
  const { isSectionReordering, enterReorder, selectedKeys, toggleSelection } = useReorder()
  const isEntityReordering = isSectionReordering('switch')

  // Check if any edit mode is active (to disable reorder)
  const { isDeviceEditMode, isAllDevicesEditMode } = useEditMode()
  const isAnyEditModeActive = isDeviceEditMode || isAllDevicesEditMode

  // Long-press to enter reorder mode for this section
  const sectionLongPress = useLongPress({
    duration: 500,
    disabled: isAnyEditModeActive || isEntityReordering || switches.length < 2,
    onLongPress: () => enterReorder('switch'),
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
          layout="vertical"
          selectedKeys={selectedKeys}
          onItemTap={toggleSelection}
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
