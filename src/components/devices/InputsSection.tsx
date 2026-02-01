import { useState, useRef, useEffect, useMemo } from 'react'
import { ToggleLeft, SlidersHorizontal } from 'lucide-react'
import { clsx } from 'clsx'
import type { HAEntity } from '@/types/ha'
import type { DomainOrderMap } from '@/types/ordering'
import { MdiIcon } from '@/components/ui/MdiIcon'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { SelectionCheckbox } from '@/components/ui/SelectionCheckbox'
import { DeviceToggleButton } from '@/components/ui/DeviceToggleButton'
import { EntityBadges } from '@/components/ui/EntityBadge'
import { getEntityIcon } from '@/lib/ha-websocket'
import { useLongPress } from '@/lib/hooks/useLongPress'
import { sortEntitiesByOrder } from '@/lib/utils/entity-sort'
import { ReorderableList } from '@/components/dashboard/ReorderableList'
import { useReorder } from '@/lib/contexts/ReorderContext'
import { t } from '@/lib/i18n'
import type { EntityMeta } from '@/lib/hooks/useAllEntities'

function getEntityDisplayName(entity: HAEntity): string {
  return entity.attributes.friendly_name || entity.entity_id.split('.')[1]
}

interface InputsSectionProps {
  inputBooleans: HAEntity[]
  inputNumbers: HAEntity[]
  isInEditMode: boolean
  isSelected: (id: string) => boolean
  onBooleanToggle: (device: HAEntity) => void
  onNumberChange: (device: HAEntity, value: number) => void
  onToggleSelection: (id: string) => void
  onEnterEditModeWithSelection?: (deviceId: string) => void
  entityMeta?: Map<string, EntityMeta>
  entityOrder?: DomainOrderMap
  onReorderEntities?: (entities: HAEntity[]) => Promise<void>
}

function InputNumberItem({
  input,
  isInEditMode,
  isSelected,
  onNumberChange,
  onToggleSelection,
  onEnterEditModeWithSelection,
  entityMeta,
  isReordering = false,
  isReorderSelected = false,
}: {
  input: HAEntity
  isInEditMode: boolean
  isSelected: boolean
  onNumberChange: (device: HAEntity, value: number) => void
  onToggleSelection: (id: string) => void
  onEnterEditModeWithSelection?: (deviceId: string) => void
  entityMeta?: EntityMeta
  isReordering?: boolean
  isReorderSelected?: boolean
}) {
  const entityValue = parseFloat(input.state) || 0
  const min = typeof input.attributes.min === 'number' ? input.attributes.min : 0
  const max = typeof input.attributes.max === 'number' ? input.attributes.max : 100
  const step = typeof input.attributes.step === 'number' ? input.attributes.step : 1
  const unit =
    typeof input.attributes.unit_of_measurement === 'string'
      ? input.attributes.unit_of_measurement
      : ''
  const inputIcon = getEntityIcon(input.entity_id)

  // Use local state while dragging to prevent flickering from HA state updates
  const [localValue, setLocalValue] = useState(entityValue)
  const isDraggingRef = useRef(false)

  // Sync local value with entity value when not dragging
  useEffect(() => {
    if (!isDraggingRef.current) {
      setLocalValue(entityValue)
    }
  }, [entityValue])

  const longPress = useLongPress({
    duration: 500,
    disabled: isInEditMode || isReordering,
    onLongPress: () => onEnterEditModeWithSelection?.(input.entity_id),
  })

  const handleSliderStart = () => {
    isDraggingRef.current = true
  }

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value)
    setLocalValue(newValue)
  }

  const handleSliderEnd = () => {
    isDraggingRef.current = false
    // Only call onNumberChange when drag ends
    if (localValue !== entityValue) {
      onNumberChange(input, localValue)
    }
  }

  if (isInEditMode) {
    return (
      <button
        data-entity-id={input.entity_id}
        onClick={() => {
          onToggleSelection(input.entity_id)
        }}
        className="w-full px-2 py-2 rounded-lg bg-border/30 touch-feedback"
      >
        <div className="flex items-center gap-2">
          <SelectionCheckbox isSelected={isSelected} />
          <div className="p-2 rounded-lg bg-border/50 text-muted flex-shrink-0">
            {inputIcon ? (
              <MdiIcon icon={inputIcon} className="w-5 h-5" />
            ) : (
              <SlidersHorizontal className="w-5 h-5" />
            )}
          </div>
          <div className="flex-1 flex items-center gap-1.5 min-w-0">
            <span className="text-sm font-medium text-foreground truncate text-left">
              {getEntityDisplayName(input)}
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
      data-entity-id={input.entity_id}
      className={clsx(
        'px-2 py-2 rounded-lg bg-border/30 transition-all',
        isReorderSelected && 'ring-2 ring-accent ring-offset-1 ring-offset-bg-primary'
      )}
      onPointerDown={longPress.onPointerDown}
      onPointerMove={longPress.onPointerMove}
      onPointerUp={longPress.onPointerUp}
      onPointerCancel={longPress.onPointerUp}
    >
      <div className="flex items-center gap-2">
        <div className="p-2 rounded-lg bg-border/50 text-muted flex-shrink-0">
          {inputIcon ? (
            <MdiIcon icon={inputIcon} className="w-5 h-5" />
          ) : (
            <SlidersHorizontal className="w-5 h-5" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1 gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-sm font-medium text-foreground truncate">
                {getEntityDisplayName(input)}
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
            <span className="text-xs text-muted tabular-nums flex-shrink-0">
              {localValue}
              {unit}
            </span>
          </div>
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={localValue}
            onPointerDown={handleSliderStart}
            onTouchStart={handleSliderStart}
            onChange={handleSliderChange}
            onPointerUp={handleSliderEnd}
            onTouchEnd={handleSliderEnd}
            className="w-full h-1.5 bg-border rounded-full appearance-none cursor-pointer accent-accent"
          />
        </div>
      </div>
    </div>
  )
}

export function InputsSection({
  inputBooleans,
  inputNumbers,
  isInEditMode,
  isSelected,
  onBooleanToggle,
  onNumberChange,
  onToggleSelection,
  onEnterEditModeWithSelection,
  entityMeta,
  entityOrder = {},
  onReorderEntities,
}: InputsSectionProps) {
  // Get reorder state from context
  const { isSectionReordering, enterReorder, exitReorder, selectedKeys, toggleSelection } =
    useReorder()
  const isEntityReordering = isSectionReordering('input')

  // Combine and sort all inputs by order
  const sortedInputs = useMemo(() => {
    const allInputs = [...inputBooleans, ...inputNumbers]
    return sortEntitiesByOrder(allInputs, entityOrder)
  }, [inputBooleans, inputNumbers, entityOrder])

  // Long-press to enter reorder mode for this section
  const sectionLongPress = useLongPress({
    duration: 500,
    disabled: isInEditMode || isEntityReordering || sortedInputs.length < 2,
    onLongPress: () => enterReorder('input'),
  })

  if (inputBooleans.length === 0 && inputNumbers.length === 0) return null

  const handleReorder = (reorderedInputs: HAEntity[]) => {
    void onReorderEntities?.(reorderedInputs)
  }

  const renderInput = (input: HAEntity, reordering = false, isReorderSelected = false) => {
    if (input.entity_id.startsWith('input_boolean.')) {
      return (
        <DeviceToggleButton
          key={input.entity_id}
          entity={input}
          isInEditMode={isInEditMode}
          isSelected={isSelected(input.entity_id)}
          onToggle={() => {
            onBooleanToggle(input)
          }}
          onToggleSelection={() => {
            onToggleSelection(input.entity_id)
          }}
          onEnterEditModeWithSelection={() => onEnterEditModeWithSelection?.(input.entity_id)}
          fallbackIcon={<ToggleLeft className="w-5 h-5" />}
          entityMeta={entityMeta?.get(input.entity_id)}
          isReordering={reordering}
          isReorderSelected={isReorderSelected}
        />
      )
    } else {
      return (
        <InputNumberItem
          key={input.entity_id}
          input={input}
          isInEditMode={isInEditMode}
          isSelected={isSelected(input.entity_id)}
          onNumberChange={onNumberChange}
          onToggleSelection={onToggleSelection}
          onEnterEditModeWithSelection={onEnterEditModeWithSelection}
          entityMeta={entityMeta?.get(input.entity_id)}
          isReordering={reordering}
          isReorderSelected={isReorderSelected}
        />
      )
    }
  }

  return (
    <div className="mb-4">
      <SectionHeader>{t.devices.inputs}</SectionHeader>
      {isEntityReordering ? (
        <ReorderableList
          items={sortedInputs}
          getKey={(input) => input.entity_id}
          onReorder={handleReorder}
          onDragEnd={exitReorder}
          layout="vertical"
          selectedKeys={selectedKeys}
          onItemTap={toggleSelection}
          renderItem={(input, _index, _isDragging, isReorderSelected) =>
            renderInput(input, true, isReorderSelected)
          }
        />
      ) : (
        <div
          className="space-y-1"
          onPointerDown={sectionLongPress.onPointerDown}
          onPointerMove={sectionLongPress.onPointerMove}
          onPointerUp={sectionLongPress.onPointerUp}
          onPointerCancel={sectionLongPress.onPointerUp}
        >
          {sortedInputs.map((input) => renderInput(input))}
        </div>
      )}
    </div>
  )
}
