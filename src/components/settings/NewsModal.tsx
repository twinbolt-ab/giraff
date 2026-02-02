import { useRef, useEffect } from 'react'
import { motion, AnimatePresence, useMotionValue, useDragControls, PanInfo } from 'framer-motion'
import { X, Sparkles, Wrench, Bug, Cog } from 'lucide-react'
import { t } from '@/lib/i18n'
import { getRecentNews, ChangelogEntry } from '@/lib/changelog'

interface NewsModalProps {
  isOpen: boolean
  onClose: () => void
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function EntrySection({
  icon,
  title,
  items,
}: {
  icon: React.ReactNode
  title: string
  items: string[]
}) {
  if (items.length === 0) return null

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
        {icon}
        <span>{title}</span>
      </div>
      <ul className="space-y-1.5 pl-6">
        {items.map((item, idx) => (
          <li key={idx} className="text-sm text-muted list-disc">
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}

function ChangelogEntryCard({ entry }: { entry: ChangelogEntry }) {
  const hasContent =
    entry.newFeatures.length > 0 ||
    entry.improvements.length > 0 ||
    entry.bugFixes.length > 0 ||
    entry.technical.length > 0

  return (
    <div className="border border-border rounded-xl p-4 space-y-4 bg-card">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-accent bg-accent/10 px-2 py-1 rounded-full">
          v{entry.version}
        </span>
        <span className="text-xs text-muted">{formatDate(entry.date)}</span>
      </div>

      {entry.summary && <p className="text-sm text-foreground leading-relaxed">{entry.summary}</p>}

      {hasContent && (
        <div className="space-y-4 pt-2">
          <EntrySection
            icon={<Sparkles className="w-4 h-4 text-amber-500" />}
            title={t.news?.newFeatures || 'New Features'}
            items={entry.newFeatures}
          />
          <EntrySection
            icon={<Wrench className="w-4 h-4 text-blue-500" />}
            title={t.news?.improvements || 'Improvements'}
            items={entry.improvements}
          />
          <EntrySection
            icon={<Bug className="w-4 h-4 text-green-500" />}
            title={t.news?.bugFixes || 'Bug Fixes'}
            items={entry.bugFixes}
          />
          <EntrySection
            icon={<Cog className="w-4 h-4 text-muted" />}
            title={t.news?.technical || 'Technical'}
            items={entry.technical}
          />
        </div>
      )}
    </div>
  )
}

export function NewsModal({ isOpen, onClose }: NewsModalProps) {
  const recentNews = getRecentNews(30)
  const y = useMotionValue(0)
  const sheetRef = useRef<HTMLDivElement>(null)
  const dragControls = useDragControls()

  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur()
    }

    if (info.offset.y > 100 || info.velocity.y > 500) {
      onClose()
    } else {
      y.set(0)
    }
  }

  const startDrag = (event: React.PointerEvent) => {
    dragControls.start(event)
  }

  useEffect(() => {
    if (isOpen) {
      y.set(0)
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur()
      }
    }
  }, [isOpen, y])

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0, pointerEvents: 'none' as const }}
            animate={{ opacity: 1, pointerEvents: 'auto' as const }}
            exit={{ opacity: 0, pointerEvents: 'none' as const }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            ref={sheetRef}
            initial={{ y: '100%', pointerEvents: 'none' as const }}
            animate={{ y: 0, pointerEvents: 'auto' as const }}
            exit={{ y: '100%', pointerEvents: 'none' as const }}
            transition={{ type: 'spring', damping: 30, stiffness: 400 }}
            drag="y"
            dragControls={dragControls}
            dragListener={false}
            dragConstraints={{ top: 0 }}
            dragElastic={{ top: 0.1, bottom: 0.8 }}
            onDragEnd={handleDragEnd}
            style={{ y }}
            className="fixed bottom-0 left-0 right-0 z-[70] bg-card rounded-t-2xl shadow-warm-lg max-h-[85vh] flex flex-col"
          >
            {/* Handle bar */}
            <div
              onPointerDown={startDrag}
              className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing touch-none flex-shrink-0"
            >
              <div className="w-10 h-1 bg-border rounded-full" />
            </div>

            {/* Header */}
            <div
              onPointerDown={startDrag}
              className="flex items-center justify-between px-4 pb-4 cursor-grab active:cursor-grabbing touch-none flex-shrink-0"
            >
              <h2 className="text-lg font-semibold text-foreground">
                {t.news?.title || "What's New"}
              </h2>
              <button
                onClick={onClose}
                onPointerDown={(e) => e.stopPropagation()}
                className="p-2 -mr-2 rounded-full hover:bg-border/50 transition-colors"
              >
                <X className="w-5 h-5 text-muted" />
              </button>
            </div>

            {/* Content */}
            <div className="px-4 pb-safe overflow-y-auto flex-1 space-y-4">
              {recentNews.length === 0 ? (
                <p className="text-sm text-muted text-center py-8">
                  {t.news?.noRecent || 'No recent updates'}
                </p>
              ) : (
                recentNews.map((entry) => <ChangelogEntryCard key={entry.version} entry={entry} />)
              )}
              <div className="h-4" />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
