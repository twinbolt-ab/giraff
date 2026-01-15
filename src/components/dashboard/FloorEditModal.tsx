import { useState, useEffect } from 'react'
import { EditModal } from '@/components/ui/EditModal'
import { FormField } from '@/components/ui/FormField'
import { TextInput } from '@/components/ui/TextInput'
import { IconPickerField } from '@/components/ui/IconPickerField'
import { useToast } from '@/providers/ToastProvider'
import { t } from '@/lib/i18n'
import { haWebSocket } from '@/lib/ha-websocket'
import { logger } from '@/lib/logger'
import type { HAFloor } from '@/types/ha'

interface FloorEditModalProps {
  floor: HAFloor | null
  onClose: () => void
}

export function FloorEditModal({ floor, onClose }: FloorEditModalProps) {
  const [name, setName] = useState('')
  const [icon, setIcon] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const { showError } = useToast()

  // Reset form only when a different floor is selected
  const floorId = floor?.floor_id
  useEffect(() => {
    if (floor && floorId) {
      setName(floor.name)
      setIcon(floor.icon || '')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [floorId])

  const handleSave = async () => {
    if (!floor) return

    setIsSaving(true)
    try {
      await haWebSocket.updateFloor(floor.floor_id, {
        name: name.trim() || floor.name,
        icon: icon.trim() || null,
      })
      onClose()
    } catch (error) {
      logger.error('FloorEdit', 'Failed to update floor:', error)
      showError(t.errors.saveFailed)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <EditModal
      isOpen={!!floor}
      onClose={onClose}
      title={t.edit.floor.title}
    >
      <div className="space-y-4">
        <FormField label={t.edit.floor.name}>
          <TextInput
            value={name}
            onChange={setName}
            placeholder={floor?.name}
          />
        </FormField>

        <FormField label={t.edit.floor.icon}>
          <IconPickerField
            value={icon}
            onChange={setIcon}
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
