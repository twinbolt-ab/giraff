import { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { clsx } from 'clsx'
import { Lightbulb, LightbulbOff, Thermometer, ChevronDown, Home, Check, GripVertical, Sparkles } from 'lucide-react'
import type { RoomWithDevices, HAEntity } from '@/types/ha'
import { RoomExpanded } from './RoomExpanded'
import { MdiIcon } from '@/components/ui/MdiIcon'
import { useLightControl } from '@/lib/hooks/useLightControl'
import { useEditMode } from '@/lib/contexts/EditModeContext'
import { useLongPress } from '@/lib/hooks/useLongPress'
import { useOptimisticState } from '@/lib/hooks/useOptimisticState'
import { useHAConnection } from '@/lib/hooks/useHAConnection'
import { haWebSocket } from '@/lib/ha-websocket'
import { t, interpolate } from '@/lib/i18n'

// Constants
const LONG_PRESS_DURATION = 500
const DRAG_THRESHOLD = 10
const SLIDER_MARGIN = 24
const OPTIMISTIC_DURATION = 5000

interface RoomCardProps {
  room: RoomWithDevices
  allRooms?: RoomWithDevices[]
  index: number
  isExpanded: boolean
  isDragging?: boolean
  isDragOver?: boolean
  shouldShowScenes?: boolean
  onToggleExpand: () => void
  onEdit?: () => void
  onDragStart?: () => void
  onDragOver?: () => void
  onDrop?: () => void
  onDragEnd?: () => void
}

export function RoomCard({
  room,
  allRooms = [],
  index,
  isExpanded,
  isDragging = false,
  isDragOver = false,
  shouldShowScenes = false,
  onToggleExpand,
  onEdit,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}: RoomCardProps) {
  const { setRoomBrightness, getAverageBrightness, toggleRoomLights, getLightBrightnessMap, calculateRelativeBrightness } = useLightControl()
  const { callService } = useHAConnection()

  // Get edit mode state from context
  const {
    mode,
    isRoomEditMode,
    isDeviceEditMode,
    isSelected,
    toggleSelection,
    exitEditMode,
    enterRoomEdit,
  } = useEditMode()

  // Derive edit mode states
  const isInEditMode = isRoomEditMode
  const isThisRoomSelected = isSelected(room.id)
  const isDeviceInEditMode = isDeviceEditMode && mode.type === 'edit-devices' && mode.roomId === room.id

  // Room data
  const lights = room.devices.filter((d) => d.entity_id.startsWith('light.'))
  const hasLights = lights.length > 0
  const hasLightsOn = room.lightsOn > 0
  const initialBrightness = getAverageBrightness(lights)

  // Scenes for collapsed card view
  const scenes = useMemo(
    () => room.devices.filter((d) => d.entity_id.startsWith('scene.')),
    [room.devices]
  )
  // Show scenes row when shouldShowScenes is enabled, not expanded, and not in edit mode
  const showScenesRow = shouldShowScenes && !isExpanded && !isInEditMode
  const hasScenes = scenes.length > 0

  // Scene activation handler
  const handleSceneActivate = useCallback((scene: HAEntity, e: React.MouseEvent) => {
    e.stopPropagation()
    callService('scene', 'turn_on', { entity_id: scene.entity_id })
  }, [callService])

  // Get scene display name (strip room name prefix if present)
  const getSceneDisplayName = useCallback((scene: HAEntity) => {
    const name = scene.attributes.friendly_name || scene.entity_id.split('.')[1]
    const nameLower = name.toLowerCase()
    const roomNameLower = room.name.toLowerCase()
    if (nameLower.startsWith(roomNameLower)) {
      return name.slice(room.name.length).trim() || name
    }
    return name
  }, [room.name])

  // Refs
  const cardRef = useRef<HTMLDivElement>(null)
  const dragStartRef = useRef<{ x: number; y: number; brightness: number; brightnessMap: Map<string, number> } | null>(null)
  const didDragRef = useRef(false)

  // Brightness drag state
  const [isBrightnessDragging, setIsBrightnessDragging] = useState(false)
  const [showBrightnessOverlay, setShowBrightnessOverlay] = useState(false)

  // Optimistic states
  const brightnessState = useOptimisticState<number>({
    actualValue: initialBrightness,
    duration: OPTIMISTIC_DURATION,
  })

  const lightsOnState = useOptimisticState<boolean>({
    actualValue: hasLightsOn,
    duration: OPTIMISTIC_DURATION,
  })

  // Long press for entering edit mode and selecting this room
  const handleLongPress = useCallback(() => {
    enterRoomEdit()
    toggleSelection(room.id)
  }, [enterRoomEdit, toggleSelection, room.id])

  const longPress = useLongPress({
    duration: LONG_PRESS_DURATION,
    disabled: isInEditMode || isExpanded,
    onLongPress: handleLongPress,
  })

  // Scroll when expanded if card would extend below visible area
  useEffect(() => {
    if (isExpanded && cardRef.current) {
      const initialRect = cardRef.current.getBoundingClientRect()
      const initialCardTop = window.scrollY + initialRect.top

      setTimeout(() => {
        const card = cardRef.current
        if (!card) return

        const rect = card.getBoundingClientRect()
        const visibleHeight = window.innerHeight - 80 // Account for bottom nav

        if (rect.bottom > visibleHeight) {
          window.scrollTo({
            top: Math.max(0, initialCardTop - 16),
            behavior: 'smooth',
          })
        }
      }, 300)
    }
  }, [isExpanded])

  // Pointer handlers for brightness gesture
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    didDragRef.current = false
    longPress.onPointerDown(e)

    if (!hasLights || isInEditMode || isExpanded) return

    const currentBrightness = brightnessState.isOptimistic ? brightnessState.displayValue : getAverageBrightness(lights)
    const brightnessMap = getLightBrightnessMap(lights)
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      brightness: currentBrightness,
      brightnessMap,
    }
  }, [hasLights, isInEditMode, isExpanded, brightnessState, getAverageBrightness, getLightBrightnessMap, lights, longPress])

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    longPress.onPointerMove(e)

    if (isInEditMode || !dragStartRef.current || !hasLights) return

    const deltaX = e.clientX - dragStartRef.current.x
    const deltaY = e.clientY - dragStartRef.current.y

    if (!isBrightnessDragging) {
      if (Math.abs(deltaY) > DRAG_THRESHOLD) {
        dragStartRef.current = null
        return
      }

      if (Math.abs(deltaX) > DRAG_THRESHOLD) {
        if (Math.abs(deltaY) > Math.abs(deltaX)) {
          dragStartRef.current = null
          return
        }
        didDragRef.current = true
        setIsBrightnessDragging(true)
        setShowBrightnessOverlay(true)
        ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
      }
    }

    if (isBrightnessDragging && dragStartRef.current) {
      const leftEdge = SLIDER_MARGIN
      const rightEdge = window.innerWidth - SLIDER_MARGIN
      const startX = dragStartRef.current.x
      const startBrightness = dragStartRef.current.brightness

      let newBrightness: number

      if (e.clientX <= startX) {
        const range = startX - leftEdge
        newBrightness = range > 0 ? ((e.clientX - leftEdge) / range) * startBrightness : 0
      } else {
        const range = rightEdge - startX
        newBrightness = range > 0
          ? startBrightness + ((e.clientX - startX) / range) * (100 - startBrightness)
          : 100
      }

      newBrightness = Math.round(Math.max(0, Math.min(100, newBrightness)))
      brightnessState.setOptimistic(newBrightness)

      const relativeBrightness = calculateRelativeBrightness(
        dragStartRef.current.brightnessMap,
        startBrightness,
        newBrightness
      )
      setRoomBrightness(lights, relativeBrightness)
    }
  }, [hasLights, isBrightnessDragging, lights, isInEditMode, brightnessState, calculateRelativeBrightness, setRoomBrightness, longPress])

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    longPress.onPointerUp()

    if (longPress.didLongPress) return

    if (isBrightnessDragging && dragStartRef.current) {
      const relativeBrightness = calculateRelativeBrightness(
        dragStartRef.current.brightnessMap,
        dragStartRef.current.brightness,
        brightnessState.displayValue
      )
      setRoomBrightness(lights, relativeBrightness, true)
      ;(e.target as HTMLElement).releasePointerCapture(e.pointerId)

      setTimeout(() => setShowBrightnessOverlay(false), 300)
    }

    setIsBrightnessDragging(false)
    dragStartRef.current = null
  }, [isBrightnessDragging, lights, brightnessState.displayValue, calculateRelativeBrightness, setRoomBrightness, longPress])

  // Card click - toggle lights
  const handleCardClick = useCallback(() => {
    if (isInEditMode || didDragRef.current || isExpanded || !hasLights) return

    const willTurnOn = !lightsOnState.displayValue
    lightsOnState.setOptimistic(willTurnOn)
    brightnessState.setOptimistic(willTurnOn ? 100 : 0)
    toggleRoomLights(lights)
  }, [hasLights, isInEditMode, isExpanded, lightsOnState, brightnessState, toggleRoomLights, lights])

  // Header click - collapse when expanded
  const handleHeaderClick = useCallback((e: React.MouseEvent) => {
    if (isInEditMode || didDragRef.current) return
    if (isExpanded) {
      e.stopPropagation()
      if (isDeviceInEditMode) exitEditMode()
      onToggleExpand()
    }
  }, [isInEditMode, isExpanded, isDeviceInEditMode, exitEditMode, onToggleExpand])

  const handleToggleSelection = useCallback(() => {
    toggleSelection(room.id)
  }, [toggleSelection, room.id])

  // Display values
  const displayBrightness = brightnessState.displayValue
  const displayLightsOn = lightsOnState.displayValue

  const cardClassName = clsx(
    'card w-full text-left relative overflow-hidden',
    !isInEditMode && 'transition-all duration-200',
    isExpanded ? 'p-4 col-span-2' : 'px-4 py-1.5',
    isInEditMode && 'cursor-grab active:cursor-grabbing',
    isDragging && 'opacity-50 scale-95',
    isDragOver && 'ring-2 ring-accent scale-105',
    isThisRoomSelected && 'ring-2 ring-accent'
  )

  const cardContent = (
    <>
      {/* Brightness fill background */}
      {hasLights && displayLightsOn && !isExpanded && (
        <motion.div
          className="absolute inset-0 origin-left pointer-events-none rounded-card"
          style={{ backgroundColor: 'var(--brightness-fill)' }}
          initial={false}
          animate={{ scaleX: displayBrightness / 100 }}
          transition={{ duration: isBrightnessDragging ? 0 : 0.3 }}
        />
      )}

      {/* Brightness percentage overlay */}
      <AnimatePresence>
        {showBrightnessOverlay && !isExpanded && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute inset-0 flex items-center justify-center bg-card/80 backdrop-blur-sm z-10 pointer-events-none"
          >
            <span className="text-4xl font-bold text-accent">{displayBrightness}%</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Card content */}
      <div className="relative z-0">
        {/* Header row */}
        <div
          className={clsx('flex items-center -ml-2', isExpanded ? 'mb-2 cursor-pointer' : 'mb-1')}
          onClick={handleHeaderClick}
        >
          {/* Edit mode controls */}
          {isInEditMode && (
            <div className="flex items-center gap-1 mr-1">
              <button
                onClick={(e) => { e.stopPropagation(); handleToggleSelection() }}
                onMouseDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
                className={clsx(
                  'w-5 h-5 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors',
                  isThisRoomSelected ? 'bg-accent text-white' : 'bg-accent/20 ring-1 ring-inset ring-accent/40'
                )}
              >
                {isThisRoomSelected && <Check className="w-3 h-3" />}
              </button>
              <GripVertical className="w-4 h-4 text-muted flex-shrink-0" />
            </div>
          )}

          {/* Room icon */}
          <div
            className={clsx(
              'rounded-xl transition-colors flex-shrink-0 z-10',
              isExpanded ? 'p-2.5' : 'p-1.5',
              displayLightsOn ? 'bg-accent/20 text-accent' : 'bg-border/50 text-muted'
            )}
          >
            {room.icon ? (
              <MdiIcon icon={room.icon} className={isExpanded ? 'w-6 h-6' : 'w-7 h-7'} />
            ) : (
              <Home className={isExpanded ? 'w-6 h-6' : 'w-7 h-7'} />
            )}
          </div>

          {/* Room name */}
          <h3 className="font-semibold text-foreground truncate flex-1 text-center pl-2 pr-1">
            {room.name}
          </h3>
        </div>

        {/* Scenes row - shows for all cards when enabled to maintain consistent height */}
        {showScenesRow && (
          <div className="flex gap-1.5 mb-1 min-h-[32px] items-center">
            {hasScenes && scenes.map((scene) => {
              const sceneIcon = haWebSocket.getEntityIcon(scene.entity_id)
              return (
                <button
                  key={scene.entity_id}
                  onClick={(e) => handleSceneActivate(scene, e)}
                  className="p-1.5 rounded-lg bg-border/50 hover:bg-accent/20 hover:text-accent transition-colors text-muted touch-feedback"
                  title={getSceneDisplayName(scene)}
                >
                  {sceneIcon ? (
                    <MdiIcon icon={sceneIcon} className="w-5 h-5" />
                  ) : (
                    <Sparkles className="w-5 h-5" />
                  )}
                </button>
              )
            })}
          </div>
        )}

        {/* Status row */}
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-3 text-sm text-muted pointer-events-none">
            {room.temperature !== undefined ? (
              <span className="flex items-center gap-1">
                <Thermometer className="w-3.5 h-3.5" />
                <span>{room.temperature.toFixed(1)}°</span>
              </span>
            ) : room.totalLights > 0 && (
              <span className="flex items-center gap-1">
                {displayLightsOn ? (
                  <Lightbulb className="w-3.5 h-3.5 text-accent" />
                ) : (
                  <LightbulbOff className="w-3.5 h-3.5 text-muted" />
                )}
                <span>
                  {displayLightsOn
                    ? interpolate(t.devices.lightsOn, { count: lightsOnState.isOptimistic ? room.totalLights : room.lightsOn })
                    : t.devices.lightsOff}
                </span>
              </span>
            )}
          </div>

          {/* Expand/collapse button */}
          {!isInEditMode && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                if (isExpanded && isDeviceInEditMode) exitEditMode()
                onToggleExpand()
              }}
              className="absolute inset-0 -mx-4 -my-2 px-4 py-2 flex items-center justify-end hover:bg-border/30 transition-colors touch-feedback"
              aria-label={isExpanded ? 'Collapse' : 'Expand'}
            >
              <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
                <ChevronDown className="w-4 h-4 text-muted" />
              </motion.div>
            </button>
          )}
        </div>

        {/* Expanded content */}
        <AnimatePresence>
          {isExpanded && !isInEditMode && <RoomExpanded room={room} allRooms={allRooms} />}
        </AnimatePresence>
      </div>
    </>
  )

  // Edit mode: use regular div with drag handlers
  if (isInEditMode) {
    return (
      <div
        draggable
        onClick={handleToggleSelection}
        onDragStart={(e) => {
          e.dataTransfer.effectAllowed = 'move'
          e.dataTransfer.setData('text/plain', String(index))
          onDragStart?.()
        }}
        onDragOver={(e) => {
          e.preventDefault()
          e.dataTransfer.dropEffect = 'move'
          onDragOver?.()
        }}
        onDrop={(e) => {
          e.preventDefault()
          onDrop?.()
        }}
        onDragEnd={() => onDragEnd?.()}
        className={cardClassName}
      >
        {cardContent}
      </div>
    )
  }

  // Normal mode: use motion.div with gesture handlers
  return (
    <motion.div
      ref={cardRef}
      layout="position"
      initial={false}
      transition={{ layout: { duration: 0.25, ease: [0.25, 0.1, 0.25, 1] } }}
      className={clsx(cardClassName, hasLights && !isExpanded && 'cursor-pointer')}
      onClick={handleCardClick}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      style={{ touchAction: 'pan-y' }}
    >
      {cardContent}
    </motion.div>
  )
}
