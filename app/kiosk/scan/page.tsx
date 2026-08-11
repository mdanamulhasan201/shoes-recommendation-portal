'use client'

import { useEffect, useMemo, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import ScanScreen from '@/components/ScanScreen'
import {
  readKioskFlowState,
  writeKioskFlowState,
  type ScannerFileData
} from '../flow-state'
import { kioskFlowBackOrKiosk } from '../kiosk-flow-navigation'
import {
  fetchLatestScreenerFile,
  fetchScannerFileById,
  formatGermanTimestamp
} from '@/api/scannerApi'

type Mode = 'loading' | 'reuse-prompt' | 'scan' | 'finalising'

export default function KioskScanPage () {
  const router = useRouter()
  const pathname = usePathname()
  const [entered, setEntered] = useState(false)
  const [mode, setMode] = useState<Mode>('loading')
  const [existingFile, setExistingFile] = useState<ScannerFileData | null>(null)
  const [finalisingError, setFinalisingError] = useState('')

  useEffect(() => {
    const rafId = window.requestAnimationFrame(() => setEntered(true))
    return () => window.cancelAnimationFrame(rafId)
  }, [])

  // On mount, decide whether to ask the user to reuse a previous scan or
  // jump straight into a new scan.
  useEffect(() => {
    const flow = readKioskFlowState()
    if (flow.scannerFile && flow.scannerFile.id !== undefined) {
      setExistingFile(flow.scannerFile)
      setMode('reuse-prompt')
    } else {
      setMode('scan')
    }
  }, [])

  const scannedAtLabel = useMemo(() => {
    const iso = existingFile?.createdAt || existingFile?.updatedAt
    return formatGermanTimestamp(iso)
  }, [existingFile])

  const handleUseExisting = () => {
    // When running inside the desktop scanner shell, the scanner hardware was
    // pre-warmed by the WebView2 host as soon as we landed on /kiosk/scan.
    // Tell the host to release Rocket since we are skipping the scan.
    if (
      typeof window !== 'undefined' &&
      window.localStorage.getItem('startedFromScantool') === 'true'
    ) {
      const base = window.location.pathname + window.location.search
      if (window.location.hash === '#scannerExit') {
        window.history.replaceState(null, '', base)
      }
      window.location.hash = '#scannerExit'
      // Brief grace period so the WebView2 SourceChanged event fires before
      // we navigate away. The actual Rocket-exit takes longer, but it runs
      // asynchronously inside the desktop process.
      window.setTimeout(() => router.push('/kiosk/purpose'), 250)
      return
    }
    router.push('/kiosk/purpose')
  }

  const handleScanNew = () => {
    // Drop the cached existing scan so the rest of the flow uses the fresh one.
    const prev = readKioskFlowState()
    writeKioskFlowState({ ...prev, scannerFile: undefined })
    setExistingFile(null)
    setMode('scan')
  }

  const handleScanComplete = async () => {
    setMode('finalising')
    setFinalisingError('')
    try {
      const flow = readKioskFlowState()
      const userId = flow.profile.id
      const shellFileId = flow.scannerFile?.id
      if (shellFileId !== undefined && shellFileId !== null) {
        const full = await fetchScannerFileById(String(shellFileId))
        if (full) {
          writeKioskFlowState({ ...flow, scannerFile: full })
          return
        }
      }
      if (userId !== undefined && userId !== null) {
        const latest = await fetchLatestScreenerFile(userId)
        if (latest) {
          writeKioskFlowState({ ...flow, scannerFile: latest })
        }
      }
    } catch (err) {
      // Even if the fetch fails, the recommendations page can still render
      // with hand-entered values, so we proceed.
      setFinalisingError(
        err instanceof Error ? err.message : 'Konnte Scandaten nicht laden.'
      )
    } finally {
      router.push('/kiosk/purpose')
    }
  }

  return (
    <section className='relative min-h-dvh bg-[#050505]'>
      <button
        type='button'
        onClick={() => router.push(kioskFlowBackOrKiosk(pathname))}
        className='absolute left-3 top-3 sm:left-6 sm:top-6 md:left-8 md:top-8 z-60 rounded-full border border-white/20 px-4 py-2 sm:px-5 text-xs sm:text-sm tracking-widest text-white transition-colors hover:bg-white/10 cursor-pointer'
      >
        ZURUECK
      </button>

      <div
        style={{
          opacity: entered ? 1 : 0,
          transform: entered ? 'translateY(0px)' : 'translateY(18px)',
          transition: 'opacity 420ms ease-out, transform 420ms ease-out'
        }}
      >
        {mode === 'loading' || mode === 'finalising' ? (
          <div className='fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-[#050505] text-white'>
            <div
              className='kiosk-mono tracking-[0.3em]'
              style={{
                fontSize: 'clamp(0.75rem, 1vw, 0.95rem)',
                opacity: 0.65
              }}
            >
              {mode === 'finalising' ? 'SCANDATEN WERDEN GELADEN' : 'EINEN MOMENT...'}
            </div>
            <div
              className='h-1.5 rounded-full overflow-hidden'
              style={{
                width: 'clamp(180px, 30vw, 280px)',
                background: 'rgba(255,255,255,0.08)'
              }}
            >
              <div
                className='h-full rounded-full animate-pulse'
                style={{
                  width: '40%',
                  background: 'rgb(96, 164, 133)',
                  boxShadow: '0 0 12px rgba(96, 164, 133, 0.55)'
                }}
              />
            </div>
            {finalisingError ? (
              <p
                className='kiosk-mono px-4 text-center text-red-300'
                style={{
                  fontSize: 'clamp(0.7rem, 0.9vw, 0.85rem)',
                  letterSpacing: '0.12em'
                }}
              >
                {finalisingError}
              </p>
            ) : null}
          </div>
        ) : null}

        {mode === 'reuse-prompt' && existingFile ? (
          <ReuseScanDialog
            scanDateLabel={scannedAtLabel}
            scanId={existingFile.id}
            onUseExisting={handleUseExisting}
            onScanNew={handleScanNew}
          />
        ) : null}

        {mode === 'scan' ? (
          <ScanScreen
            manualBetweenFeet
            onComplete={handleScanComplete}
          />
        ) : null}
      </div>
    </section>
  )
}

interface ReuseScanDialogProps {
  scanDateLabel: string
  scanId: string | number
  onUseExisting: () => void
  onScanNew: () => void
}

function ReuseScanDialog ({
  scanDateLabel,
  scanId,
  onUseExisting,
  onScanNew
}: ReuseScanDialogProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const id = window.requestAnimationFrame(() => setVisible(true))
    return () => window.cancelAnimationFrame(id)
  }, [])

  return (
    <div className='fixed inset-0 z-50 flex min-h-dvh items-center justify-center bg-[#050505] px-4'>
      <div className='pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_45%,hsl(var(--primary)/0.05)_0%,transparent_55%)]' />
      <div className='pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_50%,transparent_40%,rgba(5,5,5,0.6)_100%)]' />

      <div
        role='dialog'
        aria-modal='true'
        aria-labelledby='reuse-scan-title'
        className='relative z-10 flex w-full max-w-[640px] flex-col items-center rounded-3xl px-6 py-10 sm:px-10 sm:py-12'
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(18px)',
          transition: 'opacity 360ms ease-out, transform 360ms ease-out',
          background: 'linear-gradient(170deg, rgba(18,24,35,0.96), rgba(8,11,17,0.98))',
          border: '1px solid rgba(96,164,133,0.28)',
          boxShadow:
            '0 30px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)'
        }}
      >
        <span
          className='kiosk-mono uppercase tracking-[0.3em] text-white/55'
          style={{ fontSize: 'clamp(0.65rem, 0.9vw, 0.78rem)' }}
        >
          Vorherige Scandaten gefunden
        </span>

        <h2
          id='reuse-scan-title'
          className='kiosk-display mt-3 text-center text-white'
          style={{
            fontSize: 'clamp(1.4rem, 4.4vw, 2.4rem)',
            fontWeight: 700,
            letterSpacing: '0.02em',
            opacity: 0.95
          }}
        >
          Möchtest du die vorherige
          <br />
          Messung verwenden?
        </h2>

        <div
          className='mt-6 flex w-full max-w-[440px] flex-col items-center gap-2 rounded-2xl px-5 py-4'
          style={{
            border: '1px solid rgba(96,164,133,0.32)',
            background: 'rgba(96,164,133,0.06)'
          }}
        >
          <span
            className='kiosk-mono tracking-[0.18em] text-[rgb(120,220,180)]'
            style={{ fontSize: 'clamp(0.7rem, 0.9vw, 0.82rem)' }}
          >
            LETZTER SCAN
          </span>
          <span
            className='kiosk-display text-center text-white/95'
            style={{
              fontSize: 'clamp(1.05rem, 1.6vw, 1.3rem)',
              fontWeight: 600,
              letterSpacing: '0.04em'
            }}
          >
            {scanDateLabel || 'Datum unbekannt'}
          </span>
          <span
            className='kiosk-mono text-white/40'
            style={{ fontSize: 'clamp(0.65rem, 0.85vw, 0.78rem)' }}
          >
            ID #{String(scanId)}
          </span>
        </div>

        <p
          className='mt-5 max-w-[480px] text-center text-white/65'
          style={{
            fontSize: 'clamp(0.8rem, 1vw, 0.95rem)',
            lineHeight: 1.5
          }}
        >
          Wir empfehlen die vorhandenen Daten zu nutzen, wenn sich deine Füße
          seit dem letzten Scan nicht geändert haben.
        </p>

        <div className='mt-8 flex w-full max-w-[480px] flex-col items-center gap-3 sm:flex-row sm:gap-4'>
          <button
            type='button'
            onClick={onUseExisting}
            className='w-full rounded-full px-6 py-3.5 transition-all duration-200 sm:flex-1'
            style={{
              fontSize: 'clamp(0.9rem, 1.2vw, 1.05rem)',
              fontWeight: 700,
              letterSpacing: '0.12em',
              background: 'rgb(96, 164, 133)',
              color: '#ffffff',
              border: 'none',
              cursor: 'pointer',
              boxShadow:
                '0 0 24px rgba(96,164,133,0.32), 0 0 8px rgba(96,164,133,0.18)'
            }}
          >
            VORHERIGE VERWENDEN
          </button>

          <button
            type='button'
            onClick={onScanNew}
            className='w-full rounded-full px-6 py-3.5 transition-all duration-200 sm:flex-1'
            style={{
              fontSize: 'clamp(0.9rem, 1.2vw, 1.05rem)',
              fontWeight: 600,
              letterSpacing: '0.12em',
              background: 'transparent',
              color: 'rgba(255,255,255,0.85)',
              border: '1px solid rgba(255,255,255,0.22)',
              cursor: 'pointer'
            }}
          >
            NEU SCANNEN
          </button>
        </div>
      </div>
    </div>
  )
}
