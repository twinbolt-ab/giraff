import { useState, useMemo } from 'react'
import { AnimatePresence } from 'framer-motion'
import { AlertTriangle } from 'lucide-react'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { ModalActions } from '@/components/ui/ModalActions'
import { FormField } from '@/components/ui/FormField'
import { Select } from '@/components/ui/Select'
import { useToast } from '@/providers/ToastProvider'
import { t, interpolate } from '@/lib/i18n'
import { updateEntity, deleteArea } from '@/lib/ha-websocket'
import { logger } from '@/lib/logger'
import type { RoomWithDevices, HAFloor } from '@/types/ha'

interface RoomDeleteDialogProps {
  room: RoomWithDevices | null
  allRooms: RoomWithDevices[]
  floors: HAFloor[]
  onClose: () => void
  onDeleted: () => void
}

export function RoomDeleteDialog({
  room,
  allRooms,
  floors: _floors,
  onClose,
  onDeleted,
}: RoomDeleteDialogProps) {
  const { showError } = useToast()

  // Use room.areaId as key to reset state when room changes
  const roomKey = room?.areaId ?? ''

  return (
    <RoomDeleteDialogContent
      key={roomKey}
      room={room}
      allRooms={allRooms}
      onClose={onClose}
      onDeleted={onDeleted}
      showError={showError}
    />
  )
}

interface RoomDeleteDialogContentProps {
  room: RoomWithDevices | null
  allRooms: RoomWithDevices[]
  onClose: () => void
  onDeleted: () => void
  showError: (msg: string) => void
}

function RoomDeleteDialogContent({
  room,
  allRooms,
  onClose,
  onDeleted,
  showError,
}: RoomDeleteDialogContentProps) {
  const [targetRoomId, setTargetRoomId] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)

  // Get other rooms for the dropdown
  const otherRooms = useMemo(() => {
    if (!room) return []
    return allRooms.filter((r) => r.areaId !== room.areaId && r.areaId)
  }, [room, allRooms])

  // Room options for select
  const roomOptions = useMemo(() => {
    const options = [
      { value: '', label: t.delete.room.uncategorized },
      ...otherRooms.map((r) => ({ value: r.areaId!, label: r.name })),
    ]
    return options
  }, [otherRooms])

  // Get controllable devices count
  const controllableDevices = useMemo(() => {
    if (!room) return []
    return room.devices.filter(
      (d) =>
        d.entity_id.startsWith('light.') ||
        d.entity_id.startsWith('switch.') ||
        d.entity_id.startsWith('scene.') ||
        d.entity_id.startsWith('input_boolean.') ||
        d.entity_id.startsWith('input_number.')
    )
  }, [room])

  const hasDevices = controllableDevices.length > 0

  // Get destination label for confirmation message
  const destinationLabel = useMemo(() => {
    if (!targetRoomId) return t.delete.room.uncategorized.toLowerCase()
    const targetRoom = otherRooms.find((r) => r.areaId === targetRoomId)
    return targetRoom?.name || ''
  }, [targetRoomId, otherRooms])

  const handleDelete = async () => {
    if (!room?.areaId) return

    setIsDeleting(true)
    try {
      // Move devices to new area if needed
      if (hasDevices) {
        const newAreaId = targetRoomId || null
        await Promise.all(
          controllableDevices.map((device) =>
            updateEntity(device.entity_id, { area_id: newAreaId })
          )
        )
      }

      // Delete the room
      await deleteArea(room.areaId)

      onDeleted()
      onClose()
    } catch (error) {
      logger.error('RoomDelete', 'Failed to delete room:', error)
      showError(t.errors.deleteFailed)
      setIsDeleting(false)
    }
  }

  return (
    <AnimatePresence>
      {room && (
        <BottomSheet isOpen={!!room} onClose={onClose} zIndex={110} disableClose={isDeleting}>
          {/* Content */}
          <div className="px-4 py-4 pb-safe">
            {/* Warning icon */}
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-500" />
              </div>
            </div>

            {/* Title */}
            <h2 className="text-lg font-semibold text-foreground text-center mb-2">
              {t.delete.room.title}
            </h2>

            {/* Message/Form */}
            {hasDevices ? (
              <div className="space-y-4 mb-6">
                <p className="text-sm text-muted text-center">
                  {interpolate(t.delete.room.hasDevices, { count: controllableDevices.length })}
                </p>

                <FormField label={t.delete.room.moveToRoom}>
                  <Select value={targetRoomId} onChange={setTargetRoomId} options={roomOptions} />
                </FormField>

                <p className="text-xs text-muted text-center">
                  {interpolate(t.delete.room.willMove, {
                    count: controllableDevices.length,
                    destination: destinationLabel,
                  })}
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted text-center mb-6">
                {interpolate(t.delete.room.confirm, { name: room.name })}
              </p>
            )}

            {/* Buttons */}
            <ModalActions
              onCancel={onClose}
              onConfirm={handleDelete}
              confirmLabel={isDeleting ? t.delete.room.deleting : t.delete.room.button}
              isLoading={isDeleting}
              variant="destructive"
            />
          </div>
        </BottomSheet>
      )}
    </AnimatePresence>
  )
}
