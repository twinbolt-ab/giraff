import { motion } from 'framer-motion'
import { Check, ArrowRight } from 'lucide-react'
import { t } from '@/lib/i18n'

interface Props {
  onComplete: () => void
}

const slideVariants = {
  enter: { x: 50, opacity: 0 },
  center: { x: 0, opacity: 1 },
  exit: { x: -50, opacity: 0 },
}

export function CompleteStep({ onComplete }: Props) {
  return (
    <motion.div
      key="complete"
      variants={slideVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ duration: 0.2 }}
      className="text-center"
    >
      <div className="mb-8">
        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <Check className="w-8 h-8 text-green-500" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">{t.setup.complete.title}</h2>
        <p className="text-muted">{t.setup.complete.subtitle}</p>
      </div>

      <button
        onClick={onComplete}
        className="w-full py-4 px-6 bg-accent text-warm-brown rounded-xl text-lg font-semibold flex items-center justify-center gap-2 hover:bg-brass-hover transition-colors touch-feedback btn-accent-glow"
      >
        {t.setup.complete.goToDashboard}
        <ArrowRight className="w-5 h-5" />
      </button>
    </motion.div>
  )
}
