import { useMemo } from 'react'
import { Sparkles } from 'lucide-react'
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
import { t } from '@/lib/i18n'
import type { EntityMeta } from '@/lib/hooks/useAllEntities'

function getEntityDisplayName(entity: HAEntity): string {
  return entity.attributes.friendly_name || entity.entity_id.split('.')[1]
}

interface ScenesSectionProps {
  scenes: HAEntity[]
  isInEditMode: boolean
  isSelected: (id: string) => boolean
  onActivate: (scene: HAEntity) => void
  onToggleSelection: (id: string) => void
  onEnterEditModeWithSelection?: (deviceId: string) => void
  getDisplayName?: (scene: HAEntity) => string
  entityMeta?: Map<string, EntityMeta>
  isEntityReordering?: boolean
  entityOrder?: DomainOrderMap
  onReorderEntities?: (entities: HAEntity[]) => Promise<void>
  onEnterSectionReorder?: () => void
  onExitSectionReorder?: () => void
  reorderSelectedKeys?: Set<string>
  onToggleReorderSelection?: (key: string) => void
}

function SceneItem({
  scene,
  isInEditMode,
  isSelected,
  onActivate,
  onToggleSelection,
  onEnterEditModeWithSelection,
  displayName,
  entityMeta,
  isReordering = false,
  isReorderSelected = false,
}: {
  scene: HAEntity
  isInEditMode: boolean
  isSelected: boolean
  onActivate: (scene: HAEntity) => void
  onToggleSelection: (id: string) => void
  onEnterEditModeWithSelection?: (deviceId: string) => void
  displayName: (scene: HAEntity) => string
  entityMeta?: EntityMeta
  isReordering?: boolean
  isReorderSelected?: boolean
}) {
  const sceneIcon = getEntityIcon(scene.entity_id)

  const longPress = useLongPress({
    duration: 500,
    disabled: isInEditMode || isReordering,
    onLongPress: () => onEnterEditModeWithSelection?.(scene.entity_id),
  })

  if (isInEditMode) {
    return (
      <button
        data-entity-id={scene.entity_id}
        onClick={() => {
          onToggleSelection(scene.entity_id)
        }}
        className={clsx(
          'px-3 py-1.5 rounded-full text-sm font-medium',
          'bg-border/50 hover:bg-accent/20 hover:text-accent',
          'transition-colors touch-feedback',
          'flex items-center gap-1.5'
        )}
      >
        <SelectionCheckbox isSelected={isSelected} />
        {sceneIcon ? (
          <MdiIcon icon={sceneIcon} className="w-3.5 h-3.5" />
        ) : (
          <Sparkles className="w-3.5 h-3.5" />
        )}
        {displayName(scene)}
        {entityMeta && (
          <EntityBadges
            isHiddenInStuga={entityMeta.isHiddenInStuga}
            isHiddenInHA={entityMeta.isHiddenInHA}
            hasRoom={entityMeta.hasRoom}
          />
        )}
      </button>
    )
  }

  return (
    <button
      data-entity-id={scene.entity_id}
      onClick={() => {
        onActivate(scene)
      }}
      className={clsx(
        'px-3 py-1.5 rounded-full text-sm font-medium',
        'bg-border/50 hover:bg-accent/20 hover:text-accent',
        'transition-all touch-feedback',
        'flex items-center gap-1.5',
        isReorderSelected && 'ring-2 ring-accent ring-offset-1 ring-offset-bg-primary'
      )}
      onPointerDown={longPress.onPointerDown}
      onPointerMove={longPress.onPointerMove}
      onPointerUp={longPress.onPointerUp}
      onPointerCancel={longPress.onPointerUp}
    >
      {sceneIcon ? (
        <MdiIcon icon={sceneIcon} className="w-3.5 h-3.5" />
      ) : (
        <Sparkles className="w-3.5 h-3.5" />
      )}
      {displayName(scene)}
      {entityMeta && (
        <EntityBadges
          isHiddenInStuga={entityMeta.isHiddenInStuga}
          isHiddenInHA={entityMeta.isHiddenInHA}
          hasRoom={entityMeta.hasRoom}
        />
      )}
    </button>
  )
}

export function ScenesSection({
  scenes,
  isInEditMode,
  isSelected,
  onActivate,
  onToggleSelection,
  onEnterEditModeWithSelection,
  getDisplayName,
  entityMeta,
  isEntityReordering = false,
  entityOrder = {},
  onReorderEntities,
  onEnterSectionReorder,
  onExitSectionReorder,
  reorderSelectedKeys,
  onToggleReorderSelection,
}: ScenesSectionProps) {
  const displayName = getDisplayName || getEntityDisplayName

  // Long-press to enter reorder mode for this section
  const sectionLongPress = useLongPress({
    duration: 500,
    disabled: isInEditMode || isEntityReordering || scenes.length < 2,
    onLongPress: () => onEnterSectionReorder?.(),
  })

  // Sort scenes by order
  const sortedScenes = useMemo(() => {
    return sortEntitiesByOrder(scenes, entityOrder)
  }, [scenes, entityOrder])

  if (scenes.length === 0) return null

  const handleReorder = (reorderedScenes: HAEntity[]) => {
    void onReorderEntities?.(reorderedScenes)
  }

  return (
    <div className="mb-4">
      <SectionHeader>{t.devices.scenes}</SectionHeader>
      {isEntityReordering ? (
        <ReorderableList
          items={sortedScenes}
          getKey={(scene) => scene.entity_id}
          onReorder={handleReorder}
          onDragEnd={onExitSectionReorder}
          layout="flex-wrap"
          selectedKeys={reorderSelectedKeys}
          onItemTap={onToggleReorderSelection}
          renderItem={(scene, _index, _isDragging, isReorderSelected) => (
            <SceneItem
              key={scene.entity_id}
              scene={scene}
              isInEditMode={isInEditMode}
              isSelected={isSelected(scene.entity_id)}
              onActivate={onActivate}
              onToggleSelection={onToggleSelection}
              onEnterEditModeWithSelection={onEnterEditModeWithSelection}
              displayName={displayName}
              entityMeta={entityMeta?.get(scene.entity_id)}
              isReordering
              isReorderSelected={isReorderSelected}
            />
          )}
        />
      ) : (
        <div
          className="flex flex-wrap gap-2"
          onPointerDown={sectionLongPress.onPointerDown}
          onPointerMove={sectionLongPress.onPointerMove}
          onPointerUp={sectionLongPress.onPointerUp}
          onPointerCancel={sectionLongPress.onPointerUp}
        >
          {sortedScenes.map((scene) => (
            <SceneItem
              key={scene.entity_id}
              scene={scene}
              isInEditMode={isInEditMode}
              isSelected={isSelected(scene.entity_id)}
              onActivate={onActivate}
              onToggleSelection={onToggleSelection}
              onEnterEditModeWithSelection={onEnterEditModeWithSelection}
              displayName={displayName}
              entityMeta={entityMeta?.get(scene.entity_id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
