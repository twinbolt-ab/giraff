import { useState, useCallback } from 'react'
import type { RoomWithDevices, HAEntity } from '@/types/ha'

interface UseModalStateReturn {
  /** Room being edited (single edit modal) */
  editingRoom: RoomWithDevices | null
  /** Device being edited (single edit modal) */
  editingDevice: HAEntity | null
  /** Whether bulk room edit modal is shown */
  showBulkEditRooms: boolean
  /** Whether bulk device edit modal is shown */
  showBulkEditDevices: boolean
  /** Open room edit modal */
  openRoomEdit: (room: RoomWithDevices) => void
  /** Open device edit modal */
  openDeviceEdit: (device: HAEntity) => void
  /** Open bulk room edit modal */
  openBulkRooms: () => void
  /** Open bulk device edit modal */
  openBulkDevices: () => void
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
  const [showBulkEditRooms, setShowBulkEditRooms] = useState(false)
  const [showBulkEditDevices, setShowBulkEditDevices] = useState(false)

  const openRoomEdit = useCallback((room: RoomWithDevices) => {
    setEditingRoom(room)
  }, [])

  const openDeviceEdit = useCallback((device: HAEntity) => {
    setEditingDevice(device)
  }, [])

  const openBulkRooms = useCallback(() => {
    setShowBulkEditRooms(true)
  }, [])

  const openBulkDevices = useCallback(() => {
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
  }, [])

  const closeBulkDevices = useCallback(() => {
    setShowBulkEditDevices(false)
  }, [])

  return {
    editingRoom,
    editingDevice,
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
