import { useEffect, useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '@/providers/ThemeProvider'
import {
  Moon,
  Sun,
  Pencil,
  X,
  Wifi,
  Layers,
  Beaker,
  ChevronDown,
  Palette,
  Settings2,
  Thermometer,
  Droplet,
  LayoutGrid,
  Copy,
  Check,
  Hash,
  EyeOff,
} from 'lucide-react'
import { t } from '@/lib/i18n'
import { ConnectionSettingsModal } from '@/components/settings/ConnectionSettingsModal'
import { DomainConfigModal } from '@/components/settings/DomainConfigModal'
import { DeveloperMenuModal } from '@/components/settings/DeveloperMenuModal'
import { EditModeInfoModal } from '@/components/settings/EditModeInfoModal'
import { RoomOrderingDisableDialog } from '@/components/settings/RoomOrderingDisableDialog'
import { AlsoHideInHADialog } from '@/components/settings/AlsoHideInHADialog'
import { useDevMode } from '@/lib/hooks/useDevMode'
import { useSettings } from '@/lib/hooks/useSettings'
import { getDebugId } from '@/lib/crashlytics'
import { logSettingChange } from '@/lib/analytics'
import { clsx } from 'clsx'

interface SettingsMenuProps {
  isOpen: boolean
  onClose: () => void
  onEnterEditMode: () => void
  onViewAllDevices?: () => void
}

export function SettingsMenu({
  isOpen,
  onClose,
  onEnterEditMode,
  onViewAllDevices,
}: SettingsMenuProps) {
  const { resolvedTheme, setTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'
  const [showConnectionSettings, setShowConnectionSettings] = useState(false)
  const [showDomainConfig, setShowDomainConfig] = useState(false)
  const [showDeveloperMenu, setShowDeveloperMenu] = useState(false)
  const [showEditModeInfo, setShowEditModeInfo] = useState(false)
  const [showRoomOrderingDisable, setShowRoomOrderingDisable] = useState(false)
  const [showAlsoHideInHADialog, setShowAlsoHideInHADialog] = useState<'enable' | 'disable' | null>(
    null
  )
  const [displayOptionsOpen, setDisplayOptionsOpen] = useState(false)
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const [debugId, setDebugId] = useState<string | null>(null)
  const [debugIdCopied, setDebugIdCopied] = useState(false)
  const { isDevMode, enableDevMode } = useDevMode()
  const {
    roomOrderingEnabled,
    setRoomOrderingEnabled,
    showTemperature,
    setShowTemperature,
    showHumidity,
    setShowHumidity,
    gridColumns,
    setGridColumns,
    alsoHideInHA,
    setAlsoHideInHA,
  } = useSettings()
  const sheetRef = useRef<HTMLDivElement>(null)

  // Swipe detection state
  const touchStartRef = useRef<{ x: number; y: number } | null>(null)
  const isSwipingRef = useRef(false)

  // Dev mode activation via click counter
  const [devModeClickCount, setDevModeClickCount] = useState(0)
  const [showDevModeToast, setShowDevModeToast] = useState(false)
  const devModeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Load debug ID when advanced section opens
  useEffect(() => {
    if (advancedOpen && !debugId) {
      void getDebugId().then(setDebugId)
    }
  }, [advancedOpen, debugId])

  const handleCopyDebugId = useCallback(async () => {
    if (!debugId) return
    try {
      await navigator.clipboard.writeText(debugId)
      setDebugIdCopied(true)
      setTimeout(() => setDebugIdCopied(false), 2000)
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = debugId
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setDebugIdCopied(true)
      setTimeout(() => setDebugIdCopied(false), 2000)
    }
  }, [debugId])

  const handleSettingsHeaderClick = useCallback(() => {
    if (isDevMode) return // Already in dev mode

    if (devModeTimeoutRef.current) {
      clearTimeout(devModeTimeoutRef.current)
    }

    const newCount = devModeClickCount + 1
    setDevModeClickCount(newCount)

    if (newCount >= 10) {
      enableDevMode()
      setDevModeClickCount(0)
      setShowDevModeToast(true)
      setTimeout(() => {
        setShowDevModeToast(false)
      }, 2000)
    } else {
      // Reset counter after 2s of inactivity
      devModeTimeoutRef.current = setTimeout(() => {
        setDevModeClickCount(0)
      }, 2000)
    }
  }, [devModeClickCount, isDevMode, enableDevMode])

  // Handle touch swipe to close
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0]
    touchStartRef.current = { x: touch.clientX, y: touch.clientY }
    isSwipingRef.current = false
  }, [])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current) return

    const touch = e.touches[0]
    const deltaX = touch.clientX - touchStartRef.current.x
    const deltaY = touch.clientY - touchStartRef.current.y

    // If horizontal movement is dominant and moving right, mark as swiping
    if (Math.abs(deltaX) > Math.abs(deltaY) && deltaX > 10) {
      isSwipingRef.current = true
    }
  }, [])

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current) return

    const touch = e.changedTouches[0]
    const deltaX = touch.clientX - touchStartRef.current.x
    const deltaY = touch.clientY - touchStartRef.current.y

    // Close if swiped right with enough distance and horizontal dominance
    if (deltaX > 80 && Math.abs(deltaX) > Math.abs(deltaY) * 1.5) {
      onClose()
    }

    touchStartRef.current = null
    isSwipingRef.current = false
  }, [onClose])

  // Blur focused element when modal opens
  useEffect(() => {
    if (isOpen) {
      // Blur the button that opened the menu to prevent stuck focus/hover state
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur()
      }
    }
  }, [isOpen])

  // Close on escape key and manage body scroll
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      // Prevent body scroll when menu is open
      document.body.style.overflow = 'hidden'
    } else {
      // Immediately restore scroll when closing (don't wait for cleanup)
      document.body.style.overflow = ''
    }
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  const handleEditClick = () => {
    setShowEditModeInfo(true)
  }

  const handleEditConfirm = () => {
    setShowEditModeInfo(false)
    onClose()
    onEnterEditMode()
  }

  const handleViewAllDevices = () => {
    onClose()
    onViewAllDevices?.()
  }

  const handleThemeToggle = () => {
    const newTheme = isDark ? 'light' : 'dark'
    setTheme(newTheme)
    void logSettingChange('theme', newTheme)
  }

  const handleRoomOrderingToggle = () => {
    if (roomOrderingEnabled) {
      // Show confirmation dialog before disabling
      setShowRoomOrderingDisable(true)
    } else {
      // Enable immediately
      setRoomOrderingEnabled(true)
    }
  }

  const handleRoomOrderingDisabled = () => {
    setShowRoomOrderingDisable(false)
  }

  const handleAlsoHideInHAToggle = () => {
    if (alsoHideInHA) {
      // Currently enabled, show disable confirmation
      setShowAlsoHideInHADialog('disable')
    } else {
      // Currently disabled, show enable confirmation
      setShowAlsoHideInHADialog('enable')
    }
  }

  const handleAlsoHideInHAConfirmed = () => {
    if (showAlsoHideInHADialog === 'enable') {
      setAlsoHideInHA(true)
    } else {
      setAlsoHideInHA(false)
    }
    setShowAlsoHideInHADialog(null)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0, pointerEvents: 'none' as const }}
            animate={{ opacity: 1, pointerEvents: 'auto' as const }}
            exit={{ opacity: 0, pointerEvents: 'none' as const }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            onClick={onClose}
          />

          {/* Side Panel */}
          <motion.div
            ref={sheetRef}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className="fixed inset-0 z-50 bg-background"
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-4 pt-safe"
              style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 0.75rem)' }}
            >
              <h2
                className="text-lg font-semibold text-foreground cursor-default select-none"
                onClick={handleSettingsHeaderClick}
              >
                {t.settings.title}
              </h2>
              <button
                onClick={onClose}
                onPointerDown={(e) => e.stopPropagation()}
                className="p-2 -mr-2 rounded-full hover:bg-border/50 transition-colors touch-feedback"
                aria-label={t.settings.close}
              >
                <X className="w-5 h-5 text-muted" />
              </button>
            </div>

            {/* Menu Items */}
            <div className="px-2 pb-safe overflow-y-auto" style={{ height: 'calc(100% - 60px - env(safe-area-inset-top, 0px))' }}>
              {/* Advanced - Collapsible Section */}
              <div>
                <button
                  onClick={() => {
                    setAdvancedOpen(!advancedOpen)
                  }}
                  className="w-full flex items-center gap-4 px-4 py-4 rounded-xl hover:bg-border/30 transition-colors touch-feedback"
                >
                  <div className="p-2.5 rounded-xl bg-border/50">
                    <Settings2 className="w-5 h-5 text-foreground" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-medium text-foreground">
                      {t.settings.advanced?.title || 'Advanced'}
                    </p>
                    <p className="text-sm text-muted">
                      {t.settings.advanced?.description || 'Room ordering settings'}
                    </p>
                  </div>
                  <motion.div
                    animate={{ rotate: advancedOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown className="w-5 h-5 text-muted" />
                  </motion.div>
                </button>

                <AnimatePresence initial={false}>
                  {advancedOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="pl-4 border-l-2 border-border/50 ml-7 space-y-1">
                        {/* Room Ordering Toggle */}
                        <button
                          onClick={handleRoomOrderingToggle}
                          className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-border/30 transition-colors touch-feedback"
                        >
                          <div className="p-2 rounded-lg bg-border/50">
                            <Layers className="w-4 h-4 text-foreground" />
                          </div>
                          <div className="flex-1 text-left">
                            <p className="text-sm font-medium text-foreground">
                              {t.settings.advanced?.roomOrdering?.title || 'Room ordering'}
                            </p>
                            <p className="text-xs text-muted">
                              {t.settings.advanced?.roomOrdering?.description ||
                                'Hold and drag to reorder rooms'}
                            </p>
                          </div>
                          <div
                            className={clsx(
                              'px-2 py-0.5 text-xs font-medium rounded-full transition-colors',
                              roomOrderingEnabled
                                ? 'bg-accent/15 text-accent'
                                : 'bg-border/50 text-muted'
                            )}
                          >
                            {roomOrderingEnabled
                              ? t.settings.advanced?.roomOrdering?.enabled || 'Enabled'
                              : t.settings.advanced?.roomOrdering?.disabled || 'Disabled'}
                          </div>
                        </button>

                        {/* Also Hide in HA Toggle */}
                        <button
                          onClick={handleAlsoHideInHAToggle}
                          className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-border/30 transition-colors touch-feedback"
                        >
                          <div className="p-2 rounded-lg bg-border/50">
                            <EyeOff className="w-4 h-4 text-foreground" />
                          </div>
                          <div className="flex-1 text-left">
                            <p className="text-sm font-medium text-foreground">
                              {t.settings.alsoHideInHA?.title || 'Also hide in Home Assistant'}
                            </p>
                            <p className="text-xs text-muted">
                              {t.settings.alsoHideInHA?.description ||
                                'Hidden devices are also hidden in HA'}
                            </p>
                          </div>
                          <div
                            className={clsx(
                              'px-2 py-0.5 text-xs font-medium rounded-full transition-colors',
                              alsoHideInHA
                                ? 'bg-accent/15 text-accent'
                                : 'bg-border/50 text-muted'
                            )}
                          >
                            {alsoHideInHA
                              ? t.settings.alsoHideInHA?.enabled || 'Enabled'
                              : t.settings.alsoHideInHA?.disabled || 'Disabled'}
                          </div>
                        </button>

                        {/* Debug ID */}
                        <div className="flex items-center gap-3 px-3 py-3 rounded-xl">
                          <div className="p-2 rounded-lg bg-border/50">
                            <Hash className="w-4 h-4 text-foreground" />
                          </div>
                          <div className="flex-1 text-left">
                            <p className="text-sm font-medium text-foreground">
                              {t.settings.advanced?.debugId?.title || 'Debug ID'}
                            </p>
                            <p className="text-xs text-muted font-mono">
                              {debugId || '...'}
                            </p>
                          </div>
                          <button
                            onClick={handleCopyDebugId}
                            className="p-2 rounded-lg bg-border/50 hover:bg-border transition-colors"
                            aria-label="Copy debug ID"
                          >
                            {debugIdCopied ? (
                              <Check className="w-4 h-4 text-success" />
                            ) : (
                              <Copy className="w-4 h-4 text-muted" />
                            )}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Display Options - Collapsible Section */}
              <div>
                <button
                  onClick={() => {
                    setDisplayOptionsOpen(!displayOptionsOpen)
                  }}
                  className="w-full flex items-center gap-4 px-4 py-4 rounded-xl hover:bg-border/30 transition-colors touch-feedback"
                >
                  <div className="p-2.5 rounded-xl bg-border/50">
                    <Palette className="w-5 h-5 text-foreground" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-medium text-foreground">{t.settings.display.title}</p>
                    <p className="text-sm text-muted">{t.settings.display.description}</p>
                  </div>
                  <motion.div
                    animate={{ rotate: displayOptionsOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown className="w-5 h-5 text-muted" />
                  </motion.div>
                </button>

                <AnimatePresence initial={false}>
                  {displayOptionsOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="pl-4 border-l-2 border-border/50 ml-7 space-y-1">
                        {/* Theme Toggle */}
                        <button
                          onClick={handleThemeToggle}
                          className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-border/30 transition-colors touch-feedback"
                        >
                          <div className="p-2 rounded-lg bg-border/50">
                            {isDark ? (
                              <Sun className="w-4 h-4 text-foreground" />
                            ) : (
                              <Moon className="w-4 h-4 text-foreground" />
                            )}
                          </div>
                          <div className="flex-1 text-left">
                            <p className="text-sm font-medium text-foreground">
                              {t.settings.theme.title}
                            </p>
                            <p className="text-xs text-muted">
                              {isDark ? t.settings.theme.dark : t.settings.theme.light}
                            </p>
                          </div>
                        </button>

                        {/* Temperature Toggle */}
                        <button
                          onClick={() => setShowTemperature(!showTemperature)}
                          className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-border/30 transition-colors touch-feedback"
                        >
                          <div className="p-2 rounded-lg bg-border/50">
                            <Thermometer className="w-4 h-4 text-foreground" />
                          </div>
                          <div className="flex-1 text-left">
                            <p className="text-sm font-medium text-foreground">
                              {t.settings.display.temperature}
                            </p>
                          </div>
                          <div
                            className={clsx(
                              'w-10 h-6 rounded-full transition-colors relative',
                              showTemperature ? 'bg-accent' : 'bg-border'
                            )}
                          >
                            <div
                              className={clsx(
                                'absolute top-1 w-4 h-4 rounded-full bg-white transition-transform',
                                showTemperature ? 'translate-x-5' : 'translate-x-1'
                              )}
                            />
                          </div>
                        </button>

                        {/* Humidity Toggle */}
                        <button
                          onClick={() => setShowHumidity(!showHumidity)}
                          className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-border/30 transition-colors touch-feedback"
                        >
                          <div className="p-2 rounded-lg bg-border/50">
                            <Droplet className="w-4 h-4 text-foreground" />
                          </div>
                          <div className="flex-1 text-left">
                            <p className="text-sm font-medium text-foreground">
                              {t.settings.display.humidity}
                            </p>
                          </div>
                          <div
                            className={clsx(
                              'w-10 h-6 rounded-full transition-colors relative',
                              showHumidity ? 'bg-accent' : 'bg-border'
                            )}
                          >
                            <div
                              className={clsx(
                                'absolute top-1 w-4 h-4 rounded-full bg-white transition-transform',
                                showHumidity ? 'translate-x-5' : 'translate-x-1'
                              )}
                            />
                          </div>
                        </button>

                        {/* Grid Columns */}
                        <div className="flex items-center gap-3 px-3 py-3 rounded-xl">
                          <div className="p-2 rounded-lg bg-border/50">
                            <LayoutGrid className="w-4 h-4 text-foreground" />
                          </div>
                          <div className="flex-1 text-left">
                            <p className="text-sm font-medium text-foreground">
                              {t.settings.display.columns}
                            </p>
                          </div>
                          <div className="flex rounded-lg overflow-hidden border border-border">
                            {([1, 2, 3] as const).map((col) => (
                              <button
                                key={col}
                                onClick={() => setGridColumns(col)}
                                className={clsx(
                                  'w-8 h-7 text-sm font-medium transition-colors',
                                  gridColumns === col
                                    ? 'bg-accent text-white'
                                    : 'bg-transparent text-foreground hover:bg-border/50'
                                )}
                              >
                                {col}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Device Types */}
                        <button
                          onClick={() => {
                            setShowDomainConfig(true)
                          }}
                          className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-border/30 transition-colors touch-feedback"
                        >
                          <div className="p-2 rounded-lg bg-border/50">
                            <Layers className="w-4 h-4 text-foreground" />
                          </div>
                          <div className="flex-1 text-left">
                            <p className="text-sm font-medium text-foreground">
                              {t.settings.domains.title}
                            </p>
                            <p className="text-xs text-muted">{t.settings.domains.description}</p>
                          </div>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* All Devices */}
              <button
                onClick={handleViewAllDevices}
                className="w-full flex items-center gap-4 px-4 py-4 rounded-xl hover:bg-border/30 transition-colors touch-feedback"
              >
                <div className="p-2.5 rounded-xl bg-border/50">
                  <Layers className="w-5 h-5 text-foreground" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium text-foreground">{t.allDevices.menuTitle}</p>
                  <p className="text-sm text-muted">{t.allDevices.menuDescription}</p>
                </div>
              </button>

              {/* Connection Settings */}
              <button
                onClick={() => {
                  setShowConnectionSettings(true)
                }}
                className="w-full flex items-center gap-4 px-4 py-4 rounded-xl hover:bg-border/30 transition-colors touch-feedback"
              >
                <div className="p-2.5 rounded-xl bg-border/50">
                  <Wifi className="w-5 h-5 text-foreground" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium text-foreground">{t.settings.connection.title}</p>
                  <p className="text-sm text-muted">{t.settings.connection.description}</p>
                </div>
              </button>

              {/* Developer Menu - only shown when dev mode is active */}
              {isDevMode && (
                <button
                  onClick={() => {
                    setShowDeveloperMenu(true)
                  }}
                  className="w-full flex items-center gap-4 px-4 py-4 rounded-xl hover:bg-border/30 transition-colors touch-feedback"
                >
                  <div className="p-2.5 rounded-xl bg-amber-500/20">
                    <Beaker className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-medium text-foreground">
                      {t.settings.developer?.title || 'Developer'}
                    </p>
                    <p className="text-sm text-muted">
                      {t.settings.developer?.description || 'Test with mock data'}
                    </p>
                  </div>
                </button>
              )}

              {/* Edit Mode */}
              <button
                onClick={handleEditClick}
                className="w-full flex items-center gap-4 px-4 py-4 rounded-xl hover:bg-border/30 transition-colors touch-feedback"
              >
                <div className="p-2.5 rounded-xl bg-border/50">
                  <Pencil className="w-5 h-5 text-foreground" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium text-foreground">{t.settings.editMode.title}</p>
                  <p className="text-sm text-muted">{t.settings.editMode.description}</p>
                </div>
              </button>

              {/* Bottom padding for safe area */}
              <div className="h-4" />
            </div>
          </motion.div>

          {/* Connection Settings Modal */}
          <ConnectionSettingsModal
            isOpen={showConnectionSettings}
            onClose={() => {
              setShowConnectionSettings(false)
            }}
          />

          {/* Domain Config Modal */}
          <DomainConfigModal
            isOpen={showDomainConfig}
            onClose={() => {
              setShowDomainConfig(false)
            }}
          />

          {/* Developer Menu Modal */}
          <DeveloperMenuModal
            isOpen={showDeveloperMenu}
            onClose={() => {
              setShowDeveloperMenu(false)
            }}
          />

          {/* Edit Mode Info Modal */}
          <EditModeInfoModal
            isOpen={showEditModeInfo}
            onClose={() => {
              setShowEditModeInfo(false)
            }}
            onConfirm={handleEditConfirm}
          />

          {/* Room Ordering Disable Dialog */}
          <RoomOrderingDisableDialog
            isOpen={showRoomOrderingDisable}
            onClose={() => {
              setShowRoomOrderingDisable(false)
            }}
            onDisabled={handleRoomOrderingDisabled}
          />

          {/* Also Hide in HA Dialog */}
          {showAlsoHideInHADialog && (
            <AlsoHideInHADialog
              isOpen={true}
              onClose={() => setShowAlsoHideInHADialog(null)}
              onConfirm={handleAlsoHideInHAConfirmed}
              variant={showAlsoHideInHADialog}
            />
          )}

          {/* Dev Mode Activation Toast */}
          <AnimatePresence>
            {showDevModeToast && (
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 50 }}
                className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] px-4 py-2 bg-amber-500 text-white rounded-full text-sm font-medium shadow-lg"
              >
                Dev mode enabled
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </AnimatePresence>
  )
}
