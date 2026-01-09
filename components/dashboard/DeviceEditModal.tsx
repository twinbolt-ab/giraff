'use client'

import { useState, useEffect } from 'react'
import { EditModal } from '@/components/ui/EditModal'
import { FormField } from '@/components/ui/FormField'
import { TextInput } from '@/components/ui/TextInput'
import { Select } from '@/components/ui/Select'
import { Toggle } from '@/components/ui/Toggle'
import { t } from '@/lib/i18n'
import { haWebSocket } from '@/lib/ha-websocket'
import type { HAEntity, RoomWithDevices } from '@/types/ha'

interface DeviceEditModalProps {
  device: HAEntity | null
  rooms: RoomWithDevices[]
  onClose: () => void
}

export function DeviceEditModal({ device, rooms, onClose }: DeviceEditModalProps) {
  const [name, setName] = useState('')
  const [roomId, setRoomId] = useState('')
  const [hidden, setHidden] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Reset form only when a different device is selected
  const deviceId = device?.entity_id
  useEffect(() => {
    if (device && deviceId) {
      // Get current name from entity registry
      const entityRegistry = haWebSocket.getEntityRegistry()
      const entry = entityRegistry.get(deviceId)
      setName(entry?.name || '')

      // Get current area
      const currentArea = device.attributes.area as string | undefined
      const currentRoom = rooms.find(r => r.name === currentArea)
      setRoomId(currentRoom?.areaId || '')

      // Get hidden state
      setHidden(haWebSocket.isEntityHidden(deviceId))
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deviceId])

  const roomOptions = rooms.map(r => ({
    value: r.areaId || '',
    label: r.name
  })).filter(r => r.value)

  const handleSave = async () => {
    if (!device) return

    setIsSaving(true)
    try {
      // Update name and area
      await haWebSocket.updateEntity(device.entity_id, {
        name: name.trim() || null,
        area_id: roomId || null,
      })

      // Update hidden state
      await haWebSocket.setEntityHidden(device.entity_id, hidden)

      onClose()
    } catch (error) {
      console.error('Failed to update device:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const deviceName = device?.attributes.friendly_name || device?.entity_id || ''

  return (
    <EditModal
      isOpen={!!device}
      onClose={onClose}
      title={t.edit.device.title}
    >
      <div className="space-y-4">
        <FormField label={t.edit.device.name}>
          <TextInput
            value={name}
            onChange={setName}
            placeholder={deviceName}
          />
        </FormField>

        <FormField label={t.edit.device.room}>
          <Select
            value={roomId}
            onChange={setRoomId}
            options={roomOptions}
            placeholder="Select room..."
          />
        </FormField>

        <FormField label={t.edit.device.hidden} hint={t.edit.device.hiddenHint}>
          <Toggle
            checked={hidden}
            onChange={setHidden}
          />
        </FormField>

        <div className="flex gap-3 pt-4">
          <button
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-xl border border-border text-foreground font-medium hover:bg-border/30 transition-colors"
          >
            {t.edit.cancel}
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 py-3 px-4 rounded-xl bg-accent text-white font-medium hover:bg-accent/90 transition-colors disabled:opacity-50"
          >
            {isSaving ? t.edit.saving : t.edit.save}
          </button>
        </div>
      </div>
    </EditModal>
  )
}
