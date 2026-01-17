import { useNavigate } from 'react-router-dom'
import { useDevMode } from '@/lib/hooks/useDevMode'
import { t } from '@/lib/i18n'

interface DemoBannerProps {
  isVisible: boolean
}

export function DemoBanner({ isVisible }: DemoBannerProps) {
  const navigate = useNavigate()
  const { disableDevMode } = useDevMode()

  if (!isVisible) return null

  const handleConnect = () => {
    // Exit demo mode and go to setup
    disableDevMode()
    void navigate('/setup', { replace: true })
  }

  return (
    <div className="fixed bottom-20 left-0 right-0 flex justify-center pointer-events-none z-10">
      <button
        onClick={handleConnect}
        className="pointer-events-auto text-sm text-muted hover:text-accent transition-colors underline underline-offset-2"
      >
        {t.demo?.connect || 'Connect to Home Assistant'}
      </button>
    </div>
  )
}
