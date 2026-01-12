'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { SetupWizard } from '@/components/setup/SetupWizard'
import { isSetupComplete } from '@/lib/config'

export default function SetupPage() {
  const router = useRouter()
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    // If already set up, redirect to dashboard
    if (isSetupComplete()) {
      router.replace('/')
    } else {
      setIsReady(true)
    }
  }, [router])

  if (!isReady) {
    return <div className="min-h-screen bg-background" />
  }

  return <SetupWizard />
}
