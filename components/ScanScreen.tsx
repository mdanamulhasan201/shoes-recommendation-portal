'use client'

import { useState, useEffect, useCallback } from 'react'
import FootOutline from './FootOutline'
import {
  useScantoolFootScan,
  useScantoolSaveAfterScan,
  useScantoolEnsureReady
} from './scantool/useScantoolScanDriver'
import { UploadProgressOverlay } from './scantool/UploadProgressOverlay'
import { useScannerHardwareMode } from './scantool/useScannerHardwareMode'

interface ScanScreenProps {
  onComplete: () => void
  /** Kiosk flow: user taps WEITER between feet and to exit; default auto-advances. */
  manualBetweenFeet?: boolean
  className?: string
}

type Step =
  | 'setup-left'
  | 'scan-left'
  | 'done-left'
  | 'setup-right'
  | 'scan-right'
  | 'done-right'
  | 'setup-both'
  | 'scan-both'
  | 'done-both'
  | 'finished'

const PAUSE_AFTER_DONE = 1200

const ScanScreen = ({
  onComplete,
  manualBetweenFeet = false,
  className = ''
}: ScanScreenProps) => {
  const {
    mode: hardwareMode,
    loading: modeLoading,
    error: modeError
  } = useScannerHardwareMode()
  const isDoubleMode = hardwareMode === 'double'
  const {
    error: scannerReadyError
  } = useScantoolEnsureReady()

  const [step, setStep] = useState<Step | null>(null)
  const [visible, setVisible] = useState(false)
  const [transitioning, setTransitioning] = useState(false)
  const [scannerError, setScannerError] = useState<string | null>(null)
  const { saveScan, isSaving, uploadProgress } = useScantoolSaveAfterScan()
  const showUploadOverlay = isSaving && uploadProgress != null

  // Show scan UI as soon as XPOD mode is known — never block on Rocket warm-up.
  useEffect(() => {
    if (modeLoading || !hardwareMode || step !== null) return
    setStep(hardwareMode === 'double' ? 'setup-both' : 'setup-left')
  }, [modeLoading, hardwareMode, step])

  useEffect(() => {
    if (modeError) setScannerError(modeError)
    else if (scannerReadyError) setScannerError(scannerReadyError)
  }, [modeError, scannerReadyError])

  const reportScanError = useCallback((message: string | null) => {
    setScannerError(message)
  }, [])

  const onFootScanFinished = useCallback((ok: boolean) => {
    setStep(prev => {
      if (!prev) return prev
      if (!ok) {
        if (prev === 'scan-left') return 'setup-left'
        if (prev === 'scan-right') return 'setup-right'
        if (prev === 'scan-both') return 'setup-both'
        return prev
      }
      if (prev === 'scan-left') return 'done-left'
      if (prev === 'scan-right') return 'done-right'
      if (prev === 'scan-both') return 'done-both'
      return prev
    })
  }, [])

  const scanningPhase =
    step === 'scan-left'
      ? 'left'
      : step === 'scan-right'
        ? 'right'
        : step === 'scan-both'
          ? 'both'
          : null

  const { progress: footScanProgress } = useScantoolFootScan({
    scanningPhase,
    reportError: reportScanError,
    onFinished: onFootScanFinished
  })

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true))
  }, [])

  // After done, transition to next (or wait for WEITER if manualBetweenFeet)
  useEffect(() => {
    if (!step) return
    if (step === 'done-left') {
      if (manualBetweenFeet) return
      const t = setTimeout(() => {
        setTransitioning(true)
        setTimeout(() => {
          setStep('setup-right')
          setTransitioning(false)
        }, 500)
      }, PAUSE_AFTER_DONE)
      return () => clearTimeout(t)
    }
    if (step === 'done-right' || step === 'done-both') {
      if (manualBetweenFeet) return
      // Auto-advance mode: still run #save inside Scantool before finishing.
      let cancelled = false
      const t = setTimeout(() => {
        void (async () => {
          const inShell =
            typeof window !== 'undefined' &&
            window.localStorage.getItem('startedFromScantool') === 'true'
          if (inShell) {
            const ok = await saveScan()
            if (cancelled) return
            if (!ok) {
              setScannerError(
                'Speichern/Hochladen fehlgeschlagen. Bitte erneut versuchen.'
              )
              return
            }
          }
          if (!cancelled) setStep('finished')
        })()
      }, PAUSE_AFTER_DONE)
      return () => {
        cancelled = true
        clearTimeout(t)
      }
    }
  }, [step, manualBetweenFeet, saveScan])

  // Final out
  useEffect(() => {
    if (step !== 'finished') return
    const t = setTimeout(() => onComplete(), 800)
    return () => clearTimeout(t)
  }, [step, onComplete])

  const handleStartScan = useCallback(() => {
    if (step === 'setup-left') setStep('scan-left')
    if (step === 'setup-right') setStep('scan-right')
    if (step === 'setup-both') setStep('scan-both')
  }, [step])

  const handleRescan = useCallback(() => {
    if (step === 'done-left') setStep('setup-left')
    if (step === 'done-right') setStep('setup-right')
    if (step === 'done-both') setStep('setup-both')
  }, [step])

  const goToRightFoot = useCallback(() => {
    if (!manualBetweenFeet || step !== 'done-left') return
    setTransitioning(true)
    setTimeout(() => {
      setStep('setup-right')
      setTransitioning(false)
    }, 500)
  }, [manualBetweenFeet, step])

  const finishToNext = useCallback(async () => {
    if (!manualBetweenFeet) return
    if (step !== 'done-right' && step !== 'done-both') return

    setScannerError(null)
    const ok = await saveScan()
    if (!ok) {
      setScannerError(
        'Speichern/Hochladen fehlgeschlagen. Bitte erneut versuchen.'
      )
      return
    }

    setStep('finished')
  }, [manualBetweenFeet, step, saveScan])

  if (modeLoading || !step) {
    return (
      <div
        className={`fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-[#050505] px-6 text-white ${className}`.trim()}
      >
        {modeLoading ? (
          <p
            className='kiosk-mono tracking-[0.28em]'
            style={{ fontSize: 'clamp(0.7rem, 2.5vw, 0.95rem)', opacity: 0.55 }}
          >
            SCANNERMODUS WIRD GELADEN…
          </p>
        ) : (
          <p
            className='kiosk-mono max-w-md text-center tracking-[0.12em] text-red-300'
            style={{ fontSize: 'clamp(0.7rem, 2.5vw, 0.95rem)', lineHeight: 1.45 }}
          >
            {scannerReadyError ||
              modeError ||
              'Ungültiger Scannermodus: genau eines von XPOD_S oder XPOD_SS muss true sein.'}
          </p>
        )}
      </div>
    )
  }

  const isSetup =
    step === 'setup-left' || step === 'setup-right' || step === 'setup-both'
  const isScanning =
    step === 'scan-left' || step === 'scan-right' || step === 'scan-both'
  const isDone =
    step === 'done-left' || step === 'done-right' || step === 'done-both'
  const isBothStep = step.includes('both')
  const currentSide: 'left' | 'right' = step.includes('right') ? 'right' : 'left'
  const isFinished = step === 'finished'
  const outlineProgress = isScanning ? footScanProgress : isDone ? 1 : 0

  const headline = isBothStep
    ? isSetup
      ? 'Beide Füße positionieren'
      : isScanning
        ? 'Wir scannen beide Füße'
        : 'Beide Füße erfasst'
    : isSetup
      ? currentSide === 'left'
        ? 'Linken Fuß positionieren'
        : 'Rechten Fuß positionieren'
      : isScanning
        ? currentSide === 'left'
          ? 'Wir scannen deinen linken Fuß'
          : 'Wir scannen deinen rechten Fuß'
        : isDone
          ? currentSide === 'left'
            ? 'Linker Fuß erfasst'
            : 'Rechter Fuß erfasst'
          : 'Analyse abgeschlossen'

  const buttonLabel = isBothStep
    ? 'BEIDE FÜSSE SCANNEN'
    : currentSide === 'left'
      ? 'LINKEN FUSS SCANNEN'
      : 'RECHTEN FUSS SCANNEN'

  const safePad = {
    paddingTop: 'max(0.75rem, env(safe-area-inset-top))',
    paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))',
    paddingLeft: 'max(1rem, env(safe-area-inset-left))',
    paddingRight: 'max(1rem, env(safe-area-inset-right))'
  } as const

  return (
    <div
      className={`fixed inset-0 z-50 box-border flex h-dvh max-h-dvh flex-col overflow-hidden bg-[#050505] text-white ${className}`.trim()}
      style={{
        opacity: visible && !isFinished ? 1 : 0,
        transform: isFinished ? 'scale(1.05)' : 'scale(1)',
        transition:
          'opacity 0.7s ease-out, transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
        ...safePad
      }}
    >
      <div
        className='pointer-events-none absolute inset-0 z-0'
        style={{
          background:
            'radial-gradient(ellipse at 50% 50%, transparent 35%, rgba(5, 5, 5, 0.72) 100%)'
        }}
      />

      <div
        className='pointer-events-none absolute inset-0 z-0'
        style={{
          background: `radial-gradient(ellipse at 50% 50%, hsl(var(--primary) / ${
            0.03 + outlineProgress * 0.05
          }) 0%, transparent 50%)`,
          transition: 'background 1s ease-out'
        }}
      />

      <UploadProgressOverlay
        visible={showUploadOverlay}
        percent={uploadProgress ?? 0}
        theme='kiosk'
      />

      <div
        className='relative z-10 flex min-h-0 w-full flex-1 flex-col items-stretch'
        style={{
          opacity: transitioning || showUploadOverlay ? 0 : 1,
          transform: transitioning ? 'scale(0.96)' : 'scale(1)',
          pointerEvents: showUploadOverlay ? 'none' : undefined,
          transition: 'opacity 0.4s ease-out, transform 0.4s ease-out'
        }}
      >
        <div className='flex w-full max-w-lg shrink-0 flex-col items-center gap-3 self-center px-3 pt-1'>
          <div className='flex gap-4'>
            {isDoubleMode ? (
              <div
                className='h-2.5 w-2.5 rounded-full transition-all duration-500'
                style={{
                  background: 'hsl(var(--primary))',
                  boxShadow: `0 0 12px hsl(var(--primary) / 0.5)`
                }}
              />
            ) : (
              <>
                <div
                  className='h-2.5 w-2.5 rounded-full transition-all duration-500'
                  style={{
                    background: `hsl(var(--primary) / ${
                      step.includes('left') ||
                      step === 'done-right' ||
                      isFinished
                        ? 1
                        : 0.3
                    })`,
                    boxShadow:
                      step.includes('left') && !isDone
                        ? `0 0 12px hsl(var(--primary) / 0.5)`
                        : 'none'
                  }}
                />
                <div
                  className='h-2.5 w-2.5 rounded-full transition-all duration-500'
                  style={{
                    background: `hsl(var(--primary) / ${
                      step.includes('right') || isFinished ? 1 : 0.2
                    })`,
                    boxShadow: step.includes('right')
                      ? `0 0 12px hsl(var(--primary) / 0.5)`
                      : 'none'
                  }}
                />
              </>
            )}
          </div>
          <p
            className='kiosk-mono tracking-[0.32em]'
            style={{
              fontSize: 'clamp(0.55rem, 2vw, 0.72rem)',
              opacity: 0.45
            }}
          >
            {isDoubleMode ? 'DOPPELFUSS (XPOD_SS)' : 'EINZELFUSS (XPOD_S)'}
          </p>
          <h2
            className='kiosk-display text-inherit mb-6 text-center leading-tight tracking-[0.06em]'
            style={{
              fontSize: 'clamp(1.15rem, 4.2vw, 2.6rem)',
              fontWeight: 700,
              opacity: 0.9,
              transition: 'opacity 0.5s ease-out'
            }}
          >
            {headline}
          </h2>
        </div>

        <div
          className='relative flex min-h-0 w-full max-w-[400px] flex-1 flex-col items-center justify-center self-center px-2 py-2'
          style={{
            maxHeight: 'min(52dvh, calc(100dvh - 15.5rem))'
          }}
        >
          <div className='flex max-h-full w-full min-h-0 flex-1 items-center justify-center gap-6'>
            {isBothStep ? (
              <>
                <FootOutline
                  side='left'
                  progress={outlineProgress}
                  showLabel={false}
                />
                <FootOutline
                  side='right'
                  progress={outlineProgress}
                  showLabel={false}
                />
              </>
            ) : (
              <FootOutline
                side={currentSide}
                progress={outlineProgress}
                showLabel={false}
              />
            )}
          </div>
        </div>

        <div className='flex w-full max-w-lg shrink-0 flex-col items-center gap-3 self-center px-3 pb-1'>
          {scannerError ? (
            <p
              className='kiosk-mono px-2 text-center tracking-[0.15em] text-red-300'
              style={{
                fontSize: 'clamp(0.7rem, 2.8vw, 0.95rem)',
                lineHeight: 1.35,
                minHeight: '2.75rem'
              }}
            >
              {scannerError}
            </p>
          ) : !isDone ? (
            <p
              className='kiosk-mono text-inherit px-2 text-center tracking-[0.2em]'
              style={{
                fontSize: 'clamp(0.65rem, 2.8vw, 0.95rem)',
                lineHeight: 1.35,
                minHeight: '2.75rem',
                opacity: isSetup
                  ? 0.5
                  : isScanning && outlineProgress < 0.85
                    ? 0.45
                    : 0,
                transition: 'opacity 0.6s ease-out'
              }}
            >
              {isSetup
                ? isBothStep
                  ? 'BITTE BEIDE FÜSSE AUF DIE MARKIERUNG STELLEN'
                  : 'BITTE AUF DIE MARKIERUNG STELLEN'
                : 'BITTE STILLHALTEN'}
            </p>
          ) : (
            <div className='flex min-h-11 animate-fade-in items-center gap-3'>
              <div
                className='flex h-5 w-5 shrink-0 items-center justify-center rounded-full'
                style={{
                  background: 'hsl(var(--primary))',
                  boxShadow: `0 0 16px hsl(var(--primary) / 0.4)`
                }}
              >
                <svg width='12' height='12' viewBox='0 0 12 12' fill='none'>
                  <path
                    d='M2.5 6L5 8.5L9.5 3.5'
                    stroke='hsl(var(--primary-foreground))'
                    strokeWidth='1.5'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                  />
                </svg>
              </div>
              <span
                className='kiosk-mono text-primary tracking-[0.15em]'
                style={{ fontSize: 'clamp(0.8rem, 1.1vw, 1rem)' }}
              >
                ERFASST
              </span>
            </div>
          )}

          <div className='flex w-full flex-col items-center gap-3'>
            {isSetup ? (
              <button
                type='button'
                className='max-w-[95vw] shrink-0'
                onClick={handleStartScan}
                style={{
                  background: 'hsl(var(--primary))',
                  color: 'hsl(var(--primary-foreground))',
                  padding:
                    'clamp(0.85rem, 2.5vw, 1.2rem) clamp(1.5rem, 5vw, 3.5rem)',
                  borderRadius: '9999px',
                  fontSize: 'clamp(0.85rem, 3.8vw, 1.25rem)',
                  fontWeight: 700,
                  letterSpacing: '0.12em',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: `0 0 30px hsl(var(--primary) / 0.3), 0 0 60px hsl(var(--primary) / 0.15)`
                }}
                onPointerDown={e => {
                  ;(e.currentTarget as HTMLElement).style.transform =
                    'scale(0.96)'
                }}
                onPointerUp={e => {
                  ;(e.currentTarget as HTMLElement).style.transform =
                    'scale(1.03)'
                  setTimeout(() => {
                    if (e.currentTarget)
                      (e.currentTarget as HTMLElement).style.transform =
                        'scale(1)'
                  }, 150)
                }}
              >
                {buttonLabel}
              </button>
            ) : null}

            {isDone ? (
              <>
                <button
                  type='button'
                  className='max-w-[95vw] shrink-0'
                  onClick={handleRescan}
                  style={{
                    background: 'transparent',
                    color: 'hsl(var(--muted-foreground))',
                    padding: '0.7rem 2rem',
                    borderRadius: '9999px',
                    fontSize: 'clamp(0.75rem, 3.2vw, 0.95rem)',
                    fontWeight: 500,
                    letterSpacing: '0.1em',
                    border: `1px solid hsl(var(--muted-foreground) / 0.25)`,
                    cursor: 'pointer',
                    opacity: 0.75
                  }}
                >
                  Erneut scannen
                </button>

                {manualBetweenFeet && step === 'done-left' ? (
                  <button
                    type='button'
                    className='max-w-[95vw] shrink-0 px-4'
                    onClick={goToRightFoot}
                    style={{
                      background: 'transparent',
                      color: 'hsl(var(--primary-foreground) / 0.85)',
                      padding: '0.65rem 1.25rem',
                      borderRadius: '9999px',
                      fontSize: 'clamp(0.72rem, 3vw, 0.95rem)',
                      fontWeight: 600,
                      letterSpacing: '0.1em',
                      border: '1px solid rgba(255, 255, 255, 0.22)',
                      cursor: 'pointer'
                    }}
                  >
                    WEITER ZUM RECHTEN FUSS
                  </button>
                ) : null}

                {manualBetweenFeet &&
                (step === 'done-right' || step === 'done-both') ? (
                  <button
                    type='button'
                    className='max-w-[95vw] shrink-0'
                    onClick={finishToNext}
                    disabled={isSaving}
                    style={{
                      background: 'transparent',
                      color: 'hsl(var(--primary-foreground) / 0.85)',
                      padding: '0.65rem 2rem',
                      borderRadius: '9999px',
                      fontSize: 'clamp(0.8rem, 3.2vw, 0.95rem)',
                      fontWeight: 600,
                      letterSpacing: '0.12em',
                      border: '1px solid rgba(255, 255, 255, 0.22)',
                      cursor: isSaving ? 'default' : 'pointer',
                      opacity: isSaving ? 0.6 : 1
                    }}
                  >
                    {isSaving ? 'WIRD GESPEICHERT...' : 'WEITER'}
                  </button>
                ) : null}
              </>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ScanScreen
