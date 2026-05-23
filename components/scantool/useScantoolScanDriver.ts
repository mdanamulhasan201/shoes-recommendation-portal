'use client'

import { useCallback, useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'

/** Simulated scan duration when the real XPOD stack is not present (matches ScanScreen). */
export const SCANTOOL_SIMULATED_SCAN_MS = 4500

const SCAN_REAL_TIMEOUT_MS = 180_000
const SAVE_REAL_TIMEOUT_MS = 240_000

type ScannerCallbackName =
  | 'setScanLeftFinished'
  | 'setScanRightFinished'
  | 'setSaveFinished'

declare global {
  interface Window {
    setScanLeftFinished?: (data?: string) => void
    setScanRightFinished?: (data?: string) => void
    setSaveFinished?: (data?: string) => void
  }
}

function readScantoolShellFlag (): boolean {
  if (typeof window === 'undefined') return false
  return window.localStorage.getItem('startedFromScantool') === 'true'
}

export function useScantoolShellActive (): boolean {
  const [active, setActive] = useState(readScantoolShellFlag)
  useEffect(() => {
    setActive(readScantoolShellFlag())
  }, [])
  return active
}

export function useScantoolHashNav () {
  const router = useRouter()
  const pathname = usePathname()

  const clearScanHash = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', pathname)
    }
    router.replace(pathname)
  }, [pathname, router])

  const pushScannerHash = useCallback(
    (hash: '#scanLeft' | '#scanRight' | '#save') => {
      router.push(`${pathname}${hash}`)
    },
    [pathname, router]
  )

  return { clearScanHash, pushScannerHash }
}

/**
 * Drives left/right foot capture via URL hashes + WebView callbacks when
 * `startedFromScantool` is set; otherwise runs a timed simulation.
 */
export function useScantoolFootScan ({
  scanningPhase,
  reportError,
  onFinished
}: {
  scanningPhase: 'left' | 'right' | null
  reportError: (message: string | null) => void
  onFinished: (ok: boolean) => void
}): { progress: number } {
  const { clearScanHash, pushScannerHash } = useScantoolHashNav()
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (scanningPhase === null) return

    const isScannerMode = readScantoolShellFlag()
    reportError(null)

    if (!isScannerMode) {
      setProgress(0)
      const start = performance.now()
      let frame = 0
      const tick = (now: number) => {
        const elapsed = now - start
        const p = Math.min(elapsed / SCANTOOL_SIMULATED_SCAN_MS, 1)
        setProgress(1 - Math.pow(1 - p, 2.5))
        if (p < 1) {
          frame = requestAnimationFrame(tick)
        } else {
          onFinished(true)
        }
      }
      frame = requestAnimationFrame(tick)
      return () => cancelAnimationFrame(frame)
    }

    const isLeft = scanningPhase === 'left'
    const callbackName: ScannerCallbackName = isLeft
      ? 'setScanLeftFinished'
      : 'setScanRightFinished'
    const hash: '#scanLeft' | '#scanRight' = isLeft ? '#scanLeft' : '#scanRight'

    setProgress(0)

    let resolved = false
    let frame = 0
    const start = performance.now()

    const tick = (now: number) => {
      if (resolved) return
      const elapsed = (now - start) / 1000
      const p = Math.min(elapsed / 30, 0.9)
      setProgress(1 - Math.pow(1 - p, 2))
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)

    const timeout = window.setTimeout(() => {
      if (resolved) return
      resolved = true
      cancelAnimationFrame(frame)
      reportError('Scanner-Zeitueberschreitung. Bitte erneut versuchen.')
      setProgress(0)
      onFinished(false)
      clearScanHash()
    }, SCAN_REAL_TIMEOUT_MS)

    window[callbackName] = (data?: string) => {
      if (resolved) return
      resolved = true
      cancelAnimationFrame(frame)
      clearTimeout(timeout)
      if (data === 'true') {
        setProgress(1)
        onFinished(true)
      } else {
        reportError('Scan fehlgeschlagen. Bitte erneut versuchen.')
        setProgress(0)
        onFinished(false)
      }
      clearScanHash()
    }

    

    pushScannerHash(hash)

    return () => {
      cancelAnimationFrame(frame)
      clearTimeout(timeout)
      window[callbackName] = undefined
    }
  }, [scanningPhase, clearScanHash, pushScannerHash, reportError, onFinished])

  return { progress }
}

/**
 * Runs XPOD `#save` + desktop multipart upload when in the Scantool shell.
 * In a normal browser, returns true immediately.
 */
export function useScantoolSaveAfterScan (): {
  saveScan: () => Promise<boolean>
  isSaving: boolean
} {
  const { clearScanHash } = useScantoolHashNav()
  const router = useRouter()
  const pathname = usePathname()
  const [isSaving, setIsSaving] = useState(false)

  const saveScan = useCallback(async () => {
    if (typeof window === 'undefined') return true
    if (!readScantoolShellFlag()) return true

    setIsSaving(true)
    const ok = await new Promise<boolean>((resolve) => {
      const timeout = window.setTimeout(() => resolve(false), SAVE_REAL_TIMEOUT_MS)
      window.setSaveFinished = (data?: string) => {
        window.clearTimeout(timeout)
        resolve(data === 'true')
      }
      router.push(`${pathname}#save`)
    })
    window.setSaveFinished = undefined
    clearScanHash()
    setIsSaving(false)
    return ok
  }, [clearScanHash, pathname, router])

  return { saveScan, isSaving }
}
