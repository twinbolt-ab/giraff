import { useState, useEffect, useMemo } from 'react'
import { Trash2 } from 'lucide-react'
import { EditModal } from '@/components/ui/EditModal'
import { ModalActions } from '@/components/ui/ModalActions'
import { FormField } from '@/components/ui/FormField'
import { TextInput } from '@/components/ui/TextInput'
import { ComboBox } from '@/components/ui/ComboBox'
import { Toggle } from '@/components/ui/Toggle'
import { IconPickerField } from '@/components/ui/IconPickerField'
import { RoomDeleteDialog } from '@/components/dashboard/RoomDeleteDialog'
import { useToast } from '@/providers/ToastProvider'
import { t } from '@/lib/i18n'
import { updateArea, createFloor } from '@/lib/ha-websocket'
import { logRoomEdit, logFloorCreate } from '@/lib/analytics'
import { getAreaTemperatureSensor, setAreaTemperatureSensor } from '@/lib/metadata'
import { isAreaFavorite, toggleAreaFavorite } from '@/lib/hooks/useFavorites'
import { logger } from '@/lib/logger'
import type { RoomWithDevices, HAFloor } from '@/types/ha'

interface RoomEditModalProps {
  room: RoomWithDevices | null
  allRooms?: RoomWithDevices[]
  floors: HAFloor[]
  onClose: () => void
  onFloorCreated?: (floorId: string) => void
}

export function RoomEditModal({
  room,
  allRooms = [],
  floors,
  onClose,
  onFloorCreated,
}: RoomEditModalProps) {
  const [name, setName] = useState('')
  const [floorId, setFloorId] = useState('')
  const [icon, setIcon] = useState('')
  const [temperatureSensor, setTemperatureSensor] = useState('')
  const [favorite, setFavorite] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const { showError } = useToast()

  // Get temperature sensors for this room
  const temperatureSensors = useMemo(() => {
    if (!room) return []
    return room.devices
      .filter(
        (d) => d.entity_id.startsWith('sensor.') && d.attributes.device_class === 'temperature'
      )
      .filter((d) => !isNaN(parseFloat(d.state)))
      .sort((a, b) => a.entity_id.localeCompare(b.entity_id))
  }, [room])

  const temperatureSensorOptions = useMemo(() => {
    return [
      { value: '', label: t.edit.room.autoSensor },
      ...temperatureSensors.map((s) => ({
        value: s.entity_id,
        label: s.attributes.friendly_name || s.entity_id,
      })),
    ]
  }, [temperatureSensors])

  // Reset form only when a different room is selected
  const roomId = room?.areaId
  useEffect(() => {
    if (room && roomId) {
      setName(room.name)
      setFloorId(room.floorId || '')
      setIcon(room.icon || '')
      // Get current temperature sensor selection from HA
      const currentSensor = getAreaTemperatureSensor(roomId)
      setTemperatureSensor(currentSensor || '')
      // Get favorite status
      setFavorite(isAreaFavorite(roomId))
    }
    // Only re-run when roomId changes, not when room object reference changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId])

  const floorOptions = [
    { value: '', label: t.floors.none },
    ...floors.map((f) => ({ value: f.floor_id, label: f.name })),
  ]

  const handleSave = async () => {
    if (!room?.areaId) return

    setIsSaving(true)
    try {
      await updateArea(room.areaId, {
        name: name.trim() || room.name,
        floor_id: floorId || null,
        icon: icon.trim() || null,
      })
      // Save temperature sensor selection (empty string clears selection)
      await setAreaTemperatureSensor(room.areaId, temperatureSensor || null)
      // Update favorite status if changed
      const currentFavorite = isAreaFavorite(room.areaId)
      if (favorite !== currentFavorite) {
        await toggleAreaFavorite(room.areaId)
      }
      void logRoomEdit()
      onClose()
    } catch (error) {
      logger.error('RoomEdit', 'Failed to update room:', error)
      showError(t.errors.saveFailed)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <EditModal isOpen={!!room} onClose={onClose} title={t.edit.room.title}>
      <div className="space-y-4">
        <FormField label={t.edit.room.name}>
          <TextInput value={name} onChange={setName} placeholder={room?.name} />
        </FormField>

        <FormField label={t.edit.room.floor}>
          <ComboBox
            value={floorId}
            onChange={setFloorId}
            options={floorOptions}
            placeholder={t.floors.none}
            onCreate={async (name) => {
              const floorId = await createFloor(name)
              void logFloorCreate()
              onFloorCreated?.(floorId)
              return floorId
            }}
            createLabel={t.edit.createFloor}
          />
        </FormField>

        <FormField label={t.edit.room.icon}>
          <IconPickerField value={icon} onChange={setIcon} />
        </FormField>

        {temperatureSensors.length >= 2 && (
          <FormField label={t.edit.room.temperatureSensor}>
            <ComboBox
              value={temperatureSensor}
              onChange={setTemperatureSensor}
              options={temperatureSensorOptions}
              placeholder={t.edit.room.autoSensor}
            />
          </FormField>
        )}

        <FormField label={t.edit.room.favorite}>
          <Toggle checked={favorite} onChange={setFavorite} />
        </FormField>

        <div className="pt-4">
          <ModalActions
            onCancel={onClose}
            onConfirm={handleSave}
            cancelLabel={t.edit.cancel}
            confirmLabel={isSaving ? t.edit.saving : t.edit.save}
            isLoading={isSaving}
          />
        </div>

        {/* Delete button */}
        <button
          onClick={() => {
            setShowDeleteDialog(true)
          }}
          className="w-full mt-4 py-3 px-4 rounded-xl border border-red-500/30 text-red-500 font-medium hover:bg-red-500/10 transition-colors flex items-center justify-center gap-2"
        >
          <Trash2 className="w-4 h-4" />
          {t.delete.room.button}
        </button>
      </div>

      <RoomDeleteDialog
        room={showDeleteDialog ? room : null}
        allRooms={allRooms}
        floors={floors}
        onClose={() => {
          setShowDeleteDialog(false)
        }}
        onDeleted={onClose}
      />
    </EditModal>
  )
}
