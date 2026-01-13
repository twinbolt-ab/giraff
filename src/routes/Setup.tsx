import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SetupWizard } from '@/components/setup/SetupWizard'
import { isSetupComplete } from '@/lib/config'

export default function Setup() {
  const navigate = useNavigate()
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    async function checkSetup() {
      const setupComplete = await isSetupComplete()
      if (setupComplete) {
        navigate('/', { replace: true })
      } else {
        setIsReady(true)
      }
    }
    checkSetup()
  }, [navigate])

  if (!isReady) {
    return <div className="min-h-screen bg-background" />
  }

  return <SetupWizard />
}
