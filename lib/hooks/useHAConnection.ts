'use client'

import { useEffect, useState, useCallback } from 'react'
import { haWebSocket } from '@/lib/ha-websocket'
import { getStoredCredentials } from '@/lib/config'
import type { HAEntity } from '@/types/ha'

export function useHAConnection() {
  const [isConnected, setIsConnected] = useState(() => haWebSocket.isConnected())
  const [entities, setEntities] = useState<Map<string, HAEntity>>(new Map())
  const [isConfigured, setIsConfigured] = useState(false)

  useEffect(() => {
    // Get credentials from localStorage
    const credentials = getStoredCredentials()

    if (!credentials) {
      console.log('[useHAConnection] No stored credentials')
      setIsConfigured(false)
      return
    }

    setIsConfigured(true)
    haWebSocket.configure(credentials.url, credentials.token)
    haWebSocket.connect()

    const unsubMessage = haWebSocket.onMessage((newEntities) => {
      setEntities(new Map(newEntities))
    })

    const unsubConnection = haWebSocket.onConnection((connected) => {
      setIsConnected(connected)
    })

    return () => {
      unsubMessage()
      unsubConnection()
    }
  }, [])

  const callService = useCallback(
    (domain: string, service: string, data?: Record<string, unknown>) => {
      haWebSocket.callService(domain, service, data)
    },
    []
  )

  const getEntity = useCallback(
    (entityId: string) => {
      return entities.get(entityId)
    },
    [entities]
  )

  const getEntitiesByDomain = useCallback(
    (domain: string) => {
      return Array.from(entities.values()).filter((e) =>
        e.entity_id.startsWith(`${domain}.`)
      )
    },
    [entities]
  )

  // Reconnect with new credentials
  const reconnect = useCallback(() => {
    const credentials = getStoredCredentials()
    if (!credentials) {
      setIsConfigured(false)
      return
    }

    setIsConfigured(true)
    haWebSocket.disconnect()
    haWebSocket.configure(credentials.url, credentials.token)
    haWebSocket.connect()
  }, [])

  // Disconnect and clear state
  const disconnect = useCallback(() => {
    haWebSocket.disconnect()
    setIsConnected(false)
    setIsConfigured(false)
    setEntities(new Map())
  }, [])

  return {
    isConnected,
    isConfigured,
    entities,
    callService,
    getEntity,
    getEntitiesByDomain,
    reconnect,
    disconnect,
  }
}
