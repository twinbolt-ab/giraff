import { useCallback, Fragment } from 'react'
import { motion, LayoutGroup } from 'framer-motion'
import { RoomCard, MemoizedRoomCard } from './RoomCard'
import { ReorderableGrid } from './ReorderableGrid'
import { AllDevicesView } from './AllDevicesView'
import { t } from '@/lib/i18n'
import { ROOM_EXPAND_DURATION } from '@/lib/constants'
import type { RoomWithDevices } from '@/types/ha'

interface RoomsGridProps {
  selectedFloorId: string | null
  displayRooms: RoomWithDevices[]
  orderedRooms: RoomWithDevices[]
  allRooms: RoomWithDevices[]
  expandedRoomId: string | null
  isConnected: boolean
  isRoomEditMode: boolean
  shouldShowScenes: boolean
  onReorder: (rooms: RoomWithDevices[]) => void
  onToggleExpand: (roomId: string) => void
  onClickOutside?: () => void
  onEnterEditModeWithSelection?: (roomId: string) => void
}

export function RoomsGrid({
  selectedFloorId,
  displayRooms,
  orderedRooms,
  allRooms,
  expandedRoomId,
  isConnected,
  isRoomEditMode,
  shouldShowScenes,
  onReorder,
  onToggleExpand,
  onClickOutside,
  onEnterEditModeWithSelection,
}: RoomsGridProps) {
  // Layout follows expanded state directly (no sequencing - animations happen together)
  const layoutExpandedId = expandedRoomId

  // Stable callback that delegates to onToggleExpand - avoids new function refs per card
  // Must be defined before any conditional returns to follow React hooks rules
  const handleToggleExpand = useCallback(
    (roomId: string) => {
      onToggleExpand(roomId)
    },
    [onToggleExpand]
  )

  // All devices view
  if (selectedFloorId === '__all_devices__') {
    return <AllDevicesView />
  }

  // Empty state
  if (displayRooms.length === 0) {
    // Determine the appropriate message
    let emptyMessage: string
    if (!isConnected) {
      emptyMessage = t.rooms.connectingToHA
    } else if (allRooms.length === 0) {
      emptyMessage = t.rooms.loading
    } else if (selectedFloorId) {
      // Connected, has rooms elsewhere, but this floor is empty
      emptyMessage = t.rooms.emptyFloor
    } else {
      emptyMessage = t.rooms.noRoomsOnFloor
    }

    return (
      <div className="card p-8 text-center">
        <p className="text-muted">{emptyMessage}</p>
      </div>
    )
  }

  // Edit mode with reorderable grid
  if (isRoomEditMode) {
    return (
      <ReorderableGrid
        items={orderedRooms}
        onReorder={onReorder}
        onClickOutside={onClickOutside}
        getKey={(room) => room.id}
        columns={2}
        gap={12}
        renderItem={(room) => (
          <RoomCard
            room={room}
            isExpanded={false}
            shouldShowScenes={shouldShowScenes}
            onToggleExpand={() => {}} // no-op in edit mode
          />
        )}
      />
    )
  }

  // Find layout-expanded card index for col-span (delayed on collapse)
  const layoutExpandedIndex = layoutExpandedId
    ? displayRooms.findIndex((r) => r.id === layoutExpandedId)
    : -1
  const layoutExpandedInRightColumn = layoutExpandedIndex !== -1 && layoutExpandedIndex % 2 === 1

  // Normal grid view with layout animations
  return (
    <LayoutGroup>
      <div className="grid grid-cols-2 gap-[12px]">
        {displayRooms.map((room, index) => {
          // isExpanded controls the card's internal state (height, content)
          const isExpanded = room.id === expandedRoomId
          // isLayoutExpanded controls the grid layout (col-span, position)
          const isLayoutExpanded = room.id === layoutExpandedId
          // Card to the left of a layout-expanded right-column card needs a placeholder
          const needsPlaceholder = layoutExpandedInRightColumn && index === layoutExpandedIndex - 1

          return (
            <Fragment key={room.id}>
              <motion.div
                layout
                transition={{
                  layout: {
                    duration: ROOM_EXPAND_DURATION,
                    ease: [0.25, 0.1, 0.25, 1],
                  },
                }}
                className={isLayoutExpanded ? 'col-span-2' : ''}
              >
                <MemoizedRoomCard
                  room={room}
                  allRooms={allRooms}
                  isExpanded={isExpanded}
                  shouldShowScenes={shouldShowScenes}
                  onToggleExpand={handleToggleExpand}
                  onEnterEditModeWithSelection={onEnterEditModeWithSelection}
                />
              </motion.div>
              {/* Invisible placeholder to preserve gap when right-column card expands */}
              {needsPlaceholder && <div className="invisible" />}
            </Fragment>
          )
        })}
      </div>
    </LayoutGroup>
  )
}
