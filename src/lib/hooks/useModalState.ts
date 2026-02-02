import { useState, useCallback } from 'react'
import type { RoomWithDevices, HAEntity } from '@/types/ha'

interface UseModalStateReturn {
  /** Room being edited (single edit modal) */
  editingRoom: RoomWithDevices | null
  /** Device being edited (single edit modal) */
  editingDevice: HAEntity | null
  /** Rooms for bulk edit (captured at open time) */
  bulkEditRooms: RoomWithDevices[]
  /** Devices for bulk edit (captured at open time) */
  bulkEditDevices: HAEntity[]
  /** Whether bulk room edit modal is shown */
  showBulkEditRooms: boolean
  /** Whether bulk device edit modal is shown */
  showBulkEditDevices: boolean
  /** Open room edit modal */
  openRoomEdit: (room: RoomWithDevices) => void
  /** Open device edit modal */
  openDeviceEdit: (device: HAEntity) => void
  /** Open bulk room edit modal with the rooms to edit */
  openBulkRooms: (rooms: RoomWithDevices[]) => void
  /** Open bulk device edit modal with the devices to edit */
  openBulkDevices: (devices: HAEntity[]) => void
  /** Close room edit modal */
  closeRoomEdit: () => void
  /** Close device edit modal */
  closeDeviceEdit: () => void
  /** Close bulk room edit modal */
  closeBulkRooms: () => void
  /** Close bulk device edit modal */
  closeBulkDevices: () => void
}

export function useModalState(): UseModalStateReturn {
  const [editingRoom, setEditingRoom] = useState<RoomWithDevices | null>(null)
  const [editingDevice, setEditingDevice] = useState<HAEntity | null>(null)
  const [bulkEditRooms, setBulkEditRooms] = useState<RoomWithDevices[]>([])
  const [bulkEditDevices, setBulkEditDevices] = useState<HAEntity[]>([])
  const [showBulkEditRooms, setShowBulkEditRooms] = useState(false)
  const [showBulkEditDevices, setShowBulkEditDevices] = useState(false)

  const openRoomEdit = useCallback((room: RoomWithDevices) => {
    setEditingRoom(room)
  }, [])

  const openDeviceEdit = useCallback((device: HAEntity) => {
    setEditingDevice(device)
  }, [])

  const openBulkRooms = useCallback((rooms: RoomWithDevices[]) => {
    setBulkEditRooms(rooms)
    setShowBulkEditRooms(true)
  }, [])

  const openBulkDevices = useCallback((devices: HAEntity[]) => {
    setBulkEditDevices(devices)
    setShowBulkEditDevices(true)
  }, [])

  const closeRoomEdit = useCallback(() => {
    setEditingRoom(null)
  }, [])

  const closeDeviceEdit = useCallback(() => {
    setEditingDevice(null)
  }, [])

  const closeBulkRooms = useCallback(() => {
    setShowBulkEditRooms(false)
    setBulkEditRooms([])
  }, [])

  const closeBulkDevices = useCallback(() => {
    setShowBulkEditDevices(false)
    setBulkEditDevices([])
  }, [])

  return {
    editingRoom,
    editingDevice,
    bulkEditRooms,
    bulkEditDevices,
    showBulkEditRooms,
    showBulkEditDevices,
    openRoomEdit,
    openDeviceEdit,
    openBulkRooms,
    openBulkDevices,
    closeRoomEdit,
    closeDeviceEdit,
    closeBulkRooms,
    closeBulkDevices,
  }
}
