'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'

/** Simulated scan duration when the real XPOD stack is not present (matches ScanScreen). */
export const SCANTOOL_SIMULATED_SCAN_MS = 4500
/** Dual-bay simulation is slightly longer — both feet in one pass. */
export const SCANTOOL_SIMULATED_BOTH_MS = 6500

const SCAN_REAL_TIMEOUT_MS = 180_000
const SCAN_BOTH_REAL_TIMEOUT_MS = 240_000
const SAVE_REAL_TIMEOUT_MS = 600_000
/** Brief pause so the user can see 100% before the overlay dismisses. */
const SAVE_COMPLETE_HOLD_MS = 450
/** Soft probe only — must never block the scan UI. */
const CHECK_SCANNER_TIMEOUT_MS = 45_000

type ScannerCallbackName =
  | 'setScanLeftFinished'
  | 'setScanRightFinished'
  | 'setScanBothFinished'
  | 'setSaveFinished'

export type ScanFootPhase = 'left' | 'right' | 'both'

type ScannerHash =
  | '#scanLeft'
  | '#scanRight'
  | '#scanBoth'
  | '#save'
  | '#checkScanner'
  | '#startScanner'
  | '#scannerExit'

declare global {
  interface Window {
    setScanLeftFinished?: (data?: string) => void
    setScanRightFinished?: (data?: string) => void
    setScanBothFinished?: (data?: string) => void
    setSaveFinished?: (data?: string) => void
    setScannerCheckResult?: (status?: string) => void
    setScannerReady?: (data?: string) => void
    /** Live multipart upload % pushed by shoes-recommendation-3d-scanner. */
    scantoolUploadProgress?: (percent: number) => void
    scantoolScreenerFileReady?: (fileId: string) => void
  }
}

function readScantoolShellFlag (): boolean {
  if (typeof window === 'undefined') return false
  return window.localStorage.getItem('startedFromScantool') === 'true'
}

/**
 * WebView2 host watches CoreWebView2.Source / SourceChanged.
 * Next.js router.push often does soft history updates that do NOT reliably
 * fire SourceChanged — assign location.hash instead (toggle if already set).
 */
function assignScannerHash (hash: ScannerHash): void {
  if (typeof window === 'undefined') return
  const base = window.location.pathname + window.location.search
  if (window.location.hash === hash) {
    window.history.replaceState(null, '', base)
  }
  window.location.hash = hash
}

function clearScannerHashInPlace (): void {
  if (typeof window === 'undefined') return
  const base = window.location.pathname + window.location.search
  if (window.location.hash) {
    window.history.replaceState(null, '', base)
  }
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
    clearScannerHashInPlace()
    // Keep Next.js router path in sync without re-pushing a hash.
    router.replace(pathname)
  }, [pathname, router])

  const pushScannerHash = useCallback((hash: ScannerHash) => {
    assignScannerHash(hash)
  }, [])

  return { clearScanHash, pushScannerHash }
}

/**
 * Background Rocket warm via #checkScanner.
 * NEVER blocks the scan UI — mode screen shows immediately; desktop also
 * warms on first #scan* via EnsureScanSessionReadyAsync.
 */
export function useScantoolEnsureReady (): {
  ready: boolean
  checking: boolean
  error: string | null
} {
  const { clearScanHash, pushScannerHash } = useScantoolHashNav()
  // Always allow the scan UI — warm-up is best-effort in the background.
  const [ready, setReady] = useState(true)
  const [checking, setChecking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const startedRef = useRef(false)

  useEffect(() => {
    if (!readScantoolShellFlag()) {
      setReady(true)
      setChecking(false)
      return
    }
    if (startedRef.current) return
    startedRef.current = true

    let resolved = false
    setChecking(true)
    setError(null)

    const timeout = window.setTimeout(() => {
      if (resolved) return
      resolved = true
      setChecking(false)
      // Still ready — first foot scan will warm Rocket itself.
      setReady(true)
      clearScannerHashInPlace()
    }, CHECK_SCANNER_TIMEOUT_MS)

    ;(window as Window).setScannerCheckResult = (status?: string) => {
      if (resolved) return
      resolved = true
      window.clearTimeout(timeout)
      window.setScannerCheckResult = undefined
      clearScannerHashInPlace()
      setChecking(false)
      if (status === 'connected') {
        setReady(true)
        setError(null)
      } else if (status === 'no-device') {
        setReady(true)
        setError('Scanner-Hardware nicht gefunden (Strom/USB/Treiber).')
      } else if (status === 'no-software') {
        setReady(true)
        setError('XPOD_Rocket.exe nicht gefunden.')
      } else {
        setReady(true)
        setError('Scanner-Hinweis: Verbindung unsicher — Scan trotzdem versuchen.')
      }
    }

    const pushTimer = window.setTimeout(() => {
      if (!resolved) pushScannerHash('#checkScanner')
    }, 80)

    return () => {
      window.clearTimeout(timeout)
      window.clearTimeout(pushTimer)
    }
  }, [clearScanHash, pushScannerHash])

  return { ready, checking, error }
}

/**
 * Drives left / right / both-foot capture via URL hashes + WebView callbacks
 * when `startedFromScantool` is set; otherwise runs a timed simulation.
 *
 * - left/right → XPOD_S (single bay)
 * - both → XPOD_SS (double bay, one Rocket pass)
 */
export function useScantoolFootScan ({
  scanningPhase,
  reportError,
  onFinished
}: {
  scanningPhase: ScanFootPhase | null
  reportError: (message: string | null) => void
  onFinished: (ok: boolean) => void
}): { progress: number } {
  const { clearScanHash, pushScannerHash } = useScantoolHashNav()
  const [progress, setProgress] = useState(0)
  // Stable refs — parent re-renders must not cancel an in-flight scan.
  const reportErrorRef = useRef(reportError)
  const onFinishedRef = useRef(onFinished)
  reportErrorRef.current = reportError
  onFinishedRef.current = onFinished

  useEffect(() => {
    if (scanningPhase === null) return

    const isScannerMode = readScantoolShellFlag()
    reportErrorRef.current(null)

    const simulatedMs =
      scanningPhase === 'both'
        ? SCANTOOL_SIMULATED_BOTH_MS
        : SCANTOOL_SIMULATED_SCAN_MS

    if (!isScannerMode) {
      setProgress(0)
      const start = performance.now()
      let frame = 0
      const tick = (now: number) => {
        const elapsed = now - start
        const p = Math.min(elapsed / simulatedMs, 1)
        setProgress(1 - Math.pow(1 - p, 2.5))
        if (p < 1) {
          frame = requestAnimationFrame(tick)
        } else {
          onFinishedRef.current(true)
        }
      }
      frame = requestAnimationFrame(tick)
      return () => cancelAnimationFrame(frame)
    }

    const callbackName: ScannerCallbackName =
      scanningPhase === 'both'
        ? 'setScanBothFinished'
        : scanningPhase === 'left'
          ? 'setScanLeftFinished'
          : 'setScanRightFinished'

    const hash: '#scanLeft' | '#scanRight' | '#scanBoth' =
      scanningPhase === 'both'
        ? '#scanBoth'
        : scanningPhase === 'left'
          ? '#scanLeft'
          : '#scanRight'

    const timeoutMs =
      scanningPhase === 'both' ? SCAN_BOTH_REAL_TIMEOUT_MS : SCAN_REAL_TIMEOUT_MS

    setProgress(0)

    let resolved = false
    let frame = 0
    const start = performance.now()
    const softCapSec = scanningPhase === 'both' ? 45 : 30

    const tick = (now: number) => {
      if (resolved) return
      const elapsed = (now - start) / 1000
      const p = Math.min(elapsed / softCapSec, 0.9)
      setProgress(1 - Math.pow(1 - p, 2))
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)

    const timeout = window.setTimeout(() => {
      if (resolved) return
      resolved = true
      cancelAnimationFrame(frame)
      reportErrorRef.current('Scanner-Zeitueberschreitung. Bitte erneut versuchen.')
      setProgress(0)
      onFinishedRef.current(false)
      clearScanHash()
    }, timeoutMs)

    window[callbackName] = (data?: string) => {
      if (resolved) return
      resolved = true
      cancelAnimationFrame(frame)
      clearTimeout(timeout)
      if (data === 'true') {
        setProgress(1)
        onFinishedRef.current(true)
      } else {
        reportErrorRef.current('Scan fehlgeschlagen. Bitte erneut versuchen.')
        setProgress(0)
        onFinishedRef.current(false)
      }
      clearScanHash()
    }

    pushScannerHash(hash)

    return () => {
      cancelAnimationFrame(frame)
      clearTimeout(timeout)
    }
  }, [scanningPhase, clearScanHash, pushScannerHash])

  return { progress }
}

/**
 * Runs XPOD `#save` + desktop multipart upload when in the Scantool shell.
 * Exposes live upload % from `window.scantoolUploadProgress` (desktop app).
 * In a normal browser, returns true immediately.
 */
export function useScantoolSaveAfterScan (): {
  saveScan: () => Promise<boolean>
  isSaving: boolean
  /** 0–100 while uploading; null when idle. */
  uploadProgress: number | null
} {
  const { clearScanHash } = useScantoolHashNav()
  const [isSaving, setIsSaving] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<number | null>(null)
  const hasRealProgressRef = useRef(false)
  const saveInFlightRef = useRef(false)

  const saveScan = useCallback(async () => {
    if (typeof window === 'undefined') return true
    if (!readScantoolShellFlag()) return true
    // Prevent double-tap starting two uploads.
    if (saveInFlightRef.current) return false
    saveInFlightRef.current = true

    setIsSaving(true)
    setUploadProgress(0)
    hasRealProgressRef.current = false

    // Soft floor only until the desktop app reports the first real byte %.
    const start = performance.now()
    const softFloor = window.setInterval(() => {
      if (hasRealProgressRef.current) return
      const elapsedSec = (performance.now() - start) / 1000
      const floor = Math.round(6 * (1 - Math.exp(-elapsedSec / 5)))
      setUploadProgress(prev => Math.max(prev ?? 0, floor))
    }, 300)

    window.scantoolUploadProgress = (pct: number) => {
      if (typeof pct !== 'number' || !Number.isFinite(pct)) return
      hasRealProgressRef.current = true
      setUploadProgress(prev =>
        Math.max(prev ?? 0, Math.min(100, Math.round(pct)))
      )
    }

    let ok = false
    try {
      ok = await new Promise<boolean>(resolve => {
        const timeout = window.setTimeout(
          () => resolve(false),
          SAVE_REAL_TIMEOUT_MS
        )
        window.setSaveFinished = (data?: string) => {
          window.clearTimeout(timeout)
          resolve(data === 'true')
        }
        assignScannerHash('#save')
      })
    } finally {
      window.clearInterval(softFloor)
      window.setSaveFinished = undefined
      window.scantoolUploadProgress = undefined
    }

    if (ok) {
      setUploadProgress(100)
      await new Promise(r => window.setTimeout(r, SAVE_COMPLETE_HOLD_MS))
    } else {
      setUploadProgress(null)
    }

    clearScanHash()
    setIsSaving(false)
    saveInFlightRef.current = false
    return ok
  }, [clearScanHash])

  return { saveScan, isSaving, uploadProgress }
}
