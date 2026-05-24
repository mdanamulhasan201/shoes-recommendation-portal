'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from 'react'
import {
  featureAccessByTitle,
  fetchPartnerFeatureAccess
} from '@/api/partnerFeatureAccess'
import type { KioskSlideFeatureKey } from '@/app/lib/kioskFeatureAccess'
import { isFeatureAllowed } from '@/app/lib/kioskFeatureAccess'
import { useScannerAuth } from './ScannerAuthProvider'

type PartnerFeatureAccessContextValue = {
  ready: boolean
  loading: boolean
  error: string | null
  accessByTitle: Map<string, boolean> | null
  canAccessSlide: (key: KioskSlideFeatureKey) => boolean
  refreshFeatures: () => Promise<void>
}

const PartnerFeatureAccessContext =
  createContext<PartnerFeatureAccessContextValue | null>(null)

export function PartnerFeatureAccessProvider ({ children }: { children: ReactNode }) {
  const { status } = useScannerAuth()
  const [ready, setReady] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [accessByTitle, setAccessByTitle] = useState<Map<string, boolean> | null>(
    null
  )

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const items = await fetchPartnerFeatureAccess()
      setAccessByTitle(featureAccessByTitle(items))
    } catch (e) {
      setAccessByTitle(new Map())
      setError(e instanceof Error ? e.message : 'Feature-Zugriff fehlgeschlagen.')
    } finally {
      setLoading(false)
      setReady(true)
    }
  }, [])

  useEffect(() => {
    if (status !== 'authenticated') {
      setAccessByTitle(null)
      setReady(false)
      setLoading(false)
      setError(null)
      return
    }
    void load()
  }, [status, load])

  const canAccessSlide = useCallback(
    (key: KioskSlideFeatureKey) => isFeatureAllowed(accessByTitle, key),
    [accessByTitle]
  )

  const value = useMemo(
    () => ({
      ready,
      loading,
      error,
      accessByTitle,
      canAccessSlide,
      refreshFeatures: load
    }),
    [ready, loading, error, accessByTitle, canAccessSlide, load]
  )

  return (
    <PartnerFeatureAccessContext.Provider value={value}>
      {children}
    </PartnerFeatureAccessContext.Provider>
  )
}

export function usePartnerFeatureAccess (): PartnerFeatureAccessContextValue {
  const ctx = useContext(PartnerFeatureAccessContext)
  if (!ctx) {
    throw new Error(
      'usePartnerFeatureAccess must be used within PartnerFeatureAccessProvider'
    )
  }
  return ctx
}
