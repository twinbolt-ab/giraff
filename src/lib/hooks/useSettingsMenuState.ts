import { useState, useCallback } from 'react'

type ModalKey =
  | 'connectionSettings'
  | 'domainConfig'
  | 'developerMenu'
  | 'editModeInfo'
  | 'enableCustomOrder'
  | 'disableCustomOrder'
  | 'news'
  | 'rateApp'

type DialogVariant = 'enable' | 'disable'

interface UseSettingsMenuStateReturn {
  // Modal visibility
  isModalOpen: (key: ModalKey) => boolean
  openModal: (key: ModalKey) => void
  closeModal: (key: ModalKey) => void

  // AlsoHideInHA dialog (special case with variant)
  alsoHideInHAVariant: DialogVariant | null
  openAlsoHideInHADialog: (variant: DialogVariant) => void
  closeAlsoHideInHADialog: () => void

  // Collapsible sections
  displayOptionsOpen: boolean
  advancedOpen: boolean
  toggleDisplayOptions: () => void
  toggleAdvanced: () => void
}

export function useSettingsMenuState(): UseSettingsMenuStateReturn {
  const [openModals, setOpenModals] = useState<Set<ModalKey>>(new Set())
  const [alsoHideInHAVariant, setAlsoHideInHAVariant] = useState<DialogVariant | null>(null)
  const [displayOptionsOpen, setDisplayOptionsOpen] = useState(false)
  const [advancedOpen, setAdvancedOpen] = useState(false)

  const isModalOpen = useCallback((key: ModalKey) => openModals.has(key), [openModals])

  const openModal = useCallback((key: ModalKey) => {
    setOpenModals((prev) => new Set(prev).add(key))
  }, [])

  const closeModal = useCallback((key: ModalKey) => {
    setOpenModals((prev) => {
      const next = new Set(prev)
      next.delete(key)
      return next
    })
  }, [])

  const openAlsoHideInHADialog = useCallback((variant: DialogVariant) => {
    setAlsoHideInHAVariant(variant)
  }, [])

  const closeAlsoHideInHADialog = useCallback(() => {
    setAlsoHideInHAVariant(null)
  }, [])

  const toggleDisplayOptions = useCallback(() => {
    setDisplayOptionsOpen((prev) => !prev)
  }, [])

  const toggleAdvanced = useCallback(() => {
    setAdvancedOpen((prev) => !prev)
  }, [])

  return {
    isModalOpen,
    openModal,
    closeModal,
    alsoHideInHAVariant,
    openAlsoHideInHADialog,
    closeAlsoHideInHADialog,
    displayOptionsOpen,
    advancedOpen,
    toggleDisplayOptions,
    toggleAdvanced,
  }
}
