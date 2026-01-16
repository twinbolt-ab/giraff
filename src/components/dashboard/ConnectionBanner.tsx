import { motion, AnimatePresence } from 'framer-motion'
import { WifiOff } from 'lucide-react'
import { t } from '@/lib/i18n'

interface ConnectionBannerProps {
  isConnected: boolean
}

export function ConnectionBanner({ isConnected }: ConnectionBannerProps) {
  return (
    <AnimatePresence>
      {!isConnected && (
        <motion.div
          initial={{ opacity: 0, y: -40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -40 }}
          transition={{ duration: 0.2 }}
          className="fixed top-0 left-0 right-0 z-50 bg-warning/90 backdrop-blur-sm text-background px-4 py-2 pt-safe"
        >
          <div className="flex items-center justify-center gap-2 text-sm font-medium">
            <WifiOff className="w-4 h-4" />
            <span>{t.connection.reconnecting}</span>
            <motion.span
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              ...
            </motion.span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
