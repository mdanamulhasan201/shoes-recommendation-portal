'use client'

import { useEffect, useState } from 'react'
import {
  getScannerAdminData,
  resolveExclusiveXpodMode,
  type ExclusiveXpodMode
} from '@/api/foot-scanners/scannerAdminData'

/**
 * Hardware mode from GET /v3/foot-scanners/admin/get-scanner-data.
 *
 * Invariant (backend + UI): exactly ONE of these is true — never both:
 * - XPOD_S  → single bay (left then right)
 * - XPOD_SS → double bay (one pass for both feet)
 */
export type ScannerHardwareMode = ExclusiveXpodMode

export function useScannerHardwareMode (): {
  mode: ScannerHardwareMode | null
  loading: boolean
  error: string | null
  refresh: () => void
} {
  const [mode, setMode] = useState<ScannerHardwareMode | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    void (async () => {
      try {
        const data = await getScannerAdminData()
        if (cancelled) return

        const resolved = resolveExclusiveXpodMode(data.XPOD_S, data.XPOD_SS)
        if (!resolved) {
          setMode(null)
          setError(
            'Ungültiger Scannermodus: genau eines von XPOD_S oder XPOD_SS muss true sein.'
          )
          return
        }

        setMode(resolved)
      } catch (err) {
        if (cancelled) return
        setMode(null)
        setError(
          err instanceof Error
            ? err.message
            : 'Scannermodus konnte nicht geladen werden.'
        )
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [tick])

  return {
    mode,
    loading,
    error,
    refresh: () => setTick(t => t + 1)
  }
}
