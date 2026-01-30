import { ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown } from 'lucide-react'

interface CollapsibleSectionProps {
  icon: ReactNode
  title: string
  description: string
  isOpen: boolean
  onToggle: () => void
  children: ReactNode
}

export function CollapsibleSection({
  icon,
  title,
  description,
  isOpen,
  onToggle,
  children,
}: CollapsibleSectionProps) {
  return (
    <div>
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-4 px-4 py-4 rounded-xl hover:bg-border/30 transition-colors touch-feedback"
      >
        <div className="p-2.5 rounded-xl bg-border/50">{icon}</div>
        <div className="flex-1 text-left">
          <p className="font-medium text-foreground">{title}</p>
          <p className="text-sm text-muted">{description}</p>
        </div>
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="w-5 h-5 text-muted" />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="pl-4 border-l-2 border-border/50 ml-7 space-y-1">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
