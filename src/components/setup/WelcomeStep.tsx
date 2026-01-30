import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { t } from '@/lib/i18n'

interface Props {
  onNext: () => void
}

const slideVariants = {
  enter: { x: 50, opacity: 0 },
  center: { x: 0, opacity: 1 },
  exit: { x: -50, opacity: 0 },
}

export function WelcomeStep({ onNext }: Props) {
  return (
    <motion.div
      key="welcome"
      variants={slideVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ duration: 0.2 }}
      className="text-center"
    >
      <div className="mb-10">
        {/* Logo with subtle glow */}
        <div className="relative inline-block mb-8">
          <div className="absolute inset-0 blur-2xl bg-accent/20 scale-150" />
          <img
            src="/icon.png"
            alt="Stuga"
            width={120}
            height={180}
            className="relative mx-auto drop-shadow-lg"
          />
        </div>
        <h1 className="text-3xl font-bold text-foreground mb-3">{t.setup.welcome.title}</h1>
        <p className="text-muted text-lg">{t.setup.welcome.subtitle}</p>
      </div>

      <button
        onClick={onNext}
        className="w-full py-4 px-6 bg-accent text-warm-brown rounded-xl text-lg font-semibold flex items-center justify-center gap-2 hover:bg-brass-hover transition-colors touch-feedback btn-accent-glow"
      >
        {t.setup.welcome.getStarted}
        <ArrowRight className="w-5 h-5" />
      </button>
    </motion.div>
  )
}
