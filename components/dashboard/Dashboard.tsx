'use client'

import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import { LayoutGroup } from 'framer-motion'
import { Header } from '@/components/layout/Header'
import { RoomCard } from '@/components/dashboard/RoomCard'
import { FloorHeading } from '@/components/dashboard/FloorHeading'
import { ReorderableGrid } from '@/components/dashboard/ReorderableGrid'
import { useRooms } from '@/lib/hooks/useRooms'
import { useRoomOrder } from '@/lib/hooks/useRoomOrder'
import { useSettings } from '@/lib/hooks/useSettings'
import { t } from '@/lib/i18n'
import type { RoomWithDevices } from '@/types/ha'

export function Dashboard() {
  const { rooms, floors, isConnected } = useRooms()
  const { reorderAreas } = useRoomOrder()
  const { groupByFloors, setGroupByFloors } = useSettings()
  const [expandedRoomId, setExpandedRoomId] = useState<string | null>(null)
  const [isRoomReorderMode, setIsRoomReorderMode] = useState(false)
  const [isDeviceReorderMode, setIsDeviceReorderMode] = useState(false)
  const [orderedRooms, setOrderedRooms] = useState<RoomWithDevices[]>([])

  const hasFloors = floors.length > 0
  const shouldGroupByFloors = hasFloors && groupByFloors

  // Group rooms by floor
  const roomsByFloor = useMemo(() => {
    if (!shouldGroupByFloors) return null

    const grouped = new Map<string | null, RoomWithDevices[]>()

    // Initialize with floor order
    for (const floor of floors) {
      grouped.set(floor.floor_id, [])
    }
    grouped.set(null, []) // For rooms without a floor

    // Group rooms
    for (const room of rooms) {
      const floorId = room.floorId || null
      const floorRooms = grouped.get(floorId) || []
      floorRooms.push(room)
      grouped.set(floorId, floorRooms)
    }

    return grouped
  }, [rooms, floors, shouldGroupByFloors])

  const handleToggleGroupByFloors = useCallback(() => {
    setGroupByFloors(!groupByFloors)
  }, [groupByFloors, setGroupByFloors])

  // Keep orderedRooms in sync with rooms when not in reorder mode
  const displayRooms = isRoomReorderMode ? orderedRooms : rooms

  const handleToggleExpand = useCallback((roomId: string) => {
    if (isRoomReorderMode) return // Disable expand in room reorder mode
    setExpandedRoomId((current) => (current === roomId ? null : roomId))
  }, [isRoomReorderMode])

  const handleEnterReorderMode = useCallback(() => {
    if (expandedRoomId) {
      // Room is expanded - enable device reordering
      setIsDeviceReorderMode(true)
    } else {
      // No room expanded - enable room reordering
      setIsRoomReorderMode(true)
      setOrderedRooms([...rooms])
    }
  }, [expandedRoomId, rooms])

  const handleExitReorderMode = useCallback(async () => {
    if (isDeviceReorderMode) {
      // Just exit device reorder mode (saving happens in RoomExpanded)
      setIsDeviceReorderMode(false)
      return
    }

    // Save all room order changes to HA
    const items = orderedRooms
      .map((r, idx) => ({ id: r.id, areaId: r.areaId || '', newIndex: idx }))
      .filter(item => item.areaId)

    // Find items that moved and save their new positions
    for (let i = 0; i < orderedRooms.length; i++) {
      const room = orderedRooms[i]
      const originalIndex = rooms.findIndex(r => r.id === room.id)
      if (originalIndex !== i && room.areaId) {
        await reorderAreas(items, originalIndex, i)
      }
    }

    setIsRoomReorderMode(false)
  }, [isDeviceReorderMode, rooms, orderedRooms, reorderAreas])

  const handleReorder = useCallback((newOrder: RoomWithDevices[]) => {
    setOrderedRooms(newOrder)
  }, [])

  // Handle click outside for device reorder mode
  const gridRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isDeviceReorderMode) return

    const handleClickOutside = (e: MouseEvent) => {
      if (gridRef.current && !gridRef.current.contains(e.target as Node)) {
        handleExitReorderMode()
      }
    }

    // Add listener with a small delay to prevent immediate trigger
    const timeoutId = setTimeout(() => {
      document.addEventListener('click', handleClickOutside)
    }, 100)

    return () => {
      clearTimeout(timeoutId)
      document.removeEventListener('click', handleClickOutside)
    }
  }, [isDeviceReorderMode, handleExitReorderMode])

  const isAnyReorderMode = isRoomReorderMode || isDeviceReorderMode

  return (
    <div className="min-h-screen bg-background">
      <Header
        isConnected={isConnected}
        onEnterReorderMode={handleEnterReorderMode}
        hasFloors={hasFloors}
        groupByFloors={groupByFloors}
        onToggleGroupByFloors={handleToggleGroupByFloors}
      />

      <div className="px-4 py-6">
        {/* Rooms grid */}
        <section>
          {isAnyReorderMode && (
            <p className="text-xs text-muted mb-4 text-right">{t.rooms.reorderHint}</p>
          )}

          {displayRooms.length === 0 ? (
            <div className="card p-8 text-center">
              <p className="text-muted">
                {isConnected
                  ? t.rooms.loading
                  : t.rooms.connectingToHA}
              </p>
            </div>
          ) : isRoomReorderMode ? (
            <ReorderableGrid
              items={orderedRooms}
              onReorder={handleReorder}
              onClickOutside={handleExitReorderMode}
              getKey={(room) => room.id}
              columns={2}
              gap={12}
              renderItem={(room, index, isDraggingAny, isActive) => (
                <RoomCard
                  room={room}
                  index={index}
                  isExpanded={false}
                  isReorderMode={true}
                  isDragging={isActive}
                  onToggleExpand={() => {}}
                />
              )}
            />
          ) : (
            <LayoutGroup>
              <div ref={gridRef} className="grid grid-cols-2 gap-3">
                {shouldGroupByFloors && roomsByFloor ? (
                  // Grouped by floors
                  <>
                    {floors.map((floor) => {
                      const floorRooms = roomsByFloor.get(floor.floor_id) || []
                      if (floorRooms.length === 0) return null
                      return (
                        <React.Fragment key={floor.floor_id}>
                          <FloorHeading floor={floor} />
                          {floorRooms.map((room, index) => (
                            <RoomCard
                              key={room.id}
                              room={room}
                              index={index}
                              isExpanded={expandedRoomId === room.id}
                              isReorderMode={false}
                              isDeviceReorderMode={isDeviceReorderMode && expandedRoomId === room.id}
                              onToggleExpand={() => handleToggleExpand(room.id)}
                              onExitDeviceReorderMode={handleExitReorderMode}
                            />
                          ))}
                        </React.Fragment>
                      )
                    })}
                    {/* Other rooms (no floor assigned) */}
                    {(roomsByFloor.get(null) || []).length > 0 && (
                      <>
                        <FloorHeading floor={null} label={t.floors.other} />
                        {(roomsByFloor.get(null) || []).map((room, index) => (
                          <RoomCard
                            key={room.id}
                            room={room}
                            index={index}
                            isExpanded={expandedRoomId === room.id}
                            isReorderMode={false}
                            isDeviceReorderMode={isDeviceReorderMode && expandedRoomId === room.id}
                            onToggleExpand={() => handleToggleExpand(room.id)}
                            onExitDeviceReorderMode={handleExitReorderMode}
                          />
                        ))}
                      </>
                    )}
                  </>
                ) : (
                  // Flat list (no grouping)
                  displayRooms.map((room, index) => (
                    <RoomCard
                      key={room.id}
                      room={room}
                      index={index}
                      isExpanded={expandedRoomId === room.id}
                      isReorderMode={false}
                      isDeviceReorderMode={isDeviceReorderMode && expandedRoomId === room.id}
                      onToggleExpand={() => handleToggleExpand(room.id)}
                      onExitDeviceReorderMode={handleExitReorderMode}
                    />
                  ))
                )}
              </div>
            </LayoutGroup>
          )}
        </section>
      </div>
    </div>
  )
}
