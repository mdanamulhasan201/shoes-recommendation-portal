'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { kioskFlowBackHref } from '@/app/kiosk/kiosk-flow-navigation'
import { generateRecommendationPdf } from './recommendations-pdf'

export type RecommendationsHeaderProps = {
  totalMatches: number
  scannerId: string | null
}

export function RecommendationsHeader ({
  totalMatches,
  scannerId
}: RecommendationsHeaderProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [busy, setBusy] = useState(false)
  const [pdfError, setPdfError] = useState<string | null>(null)

  const handleBack = () => {
    const href = kioskFlowBackHref(pathname)
    if (href) {
      router.push(href)
      return
    }
    router.push('/kiosk')
  }

  const handleHome = () => {
    router.push('/')
  }

  const handleDownloadPdf = async () => {
    if (!scannerId || busy) return
    setBusy(true)
    setPdfError(null)
    try {
      await generateRecommendationPdf(scannerId)
    } catch (e) {
      setPdfError(e instanceof Error ? e.message : 'PDF konnte nicht erzeugt werden.')
    } finally {
      setBusy(false)
    }
  }

  const disabled = !scannerId || busy

  return (
    <header
      className='w-full shrink-0 rounded-2xl px-5 py-4 sm:px-6 sm:py-5'
      style={{
        marginTop: 'max(1rem, 2vh)',
        border: '1px solid rgba(255,255,255,0.1)',
        background: 'linear-gradient(150deg, rgba(20,25,34,0.82), rgba(8,10,14,0.9))'
      }}
    >
      <div className='grid w-full grid-cols-1 items-center gap-4 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]'>
        <div className='flex min-w-0 items-center gap-3 sm:justify-self-start'>
          {/* Back button — left edge of the header */}
          <button
            type='button'
            onClick={handleBack}
            aria-label='Zurück'
            className='inline-flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full transition-all duration-200 hover:scale-[1.05] active:scale-[0.95]'
            style={{
              background:
                'linear-gradient(135deg, rgba(255,255,255,0.07), rgba(255,255,255,0.02))',
              border: '1px solid rgba(255,255,255,0.14)',
              color: 'rgba(255,255,255,0.85)',
              boxShadow:
                'inset 0 1px 0 rgba(255,255,255,0.05), 0 4px 12px rgba(0,0,0,0.25)'
            }}
          >
            <svg
              width='18'
              height='18'
              viewBox='0 0 24 24'
              fill='none'
              aria-hidden
            >
              <path
                d='M15 6l-6 6 6 6'
                stroke='currentColor'
                strokeWidth='2.2'
                strokeLinecap='round'
                strokeLinejoin='round'
              />
            </svg>
          </button>

          <div className='min-w-0'>
            <p className='kiosk-mono text-[10px] tracking-[0.24em] text-white/45'>
              RECOMMENDATION DASHBOARD
            </p>
            <h1
              className='kiosk-display mt-1 text-white'
              style={{ fontSize: 'clamp(1rem, 2vw, 1.5rem)', fontWeight: 800 }}
            >
              Personalized Shoe Matches
            </h1>
          </div>
        </div>

        <div className='flex flex-wrap items-center justify-center gap-2 sm:justify-self-center'>
          {/* EMPFEHLUNG PDF — centered */}
          <button
            type='button'
            onClick={() => void handleDownloadPdf()}
            disabled={disabled}
            aria-label='Empfehlung als PDF herunterladen'
            className='kiosk-mono inline-flex h-10 cursor-pointer items-center gap-2 rounded-full px-4 text-[11px] font-bold tracking-[0.18em] transition-all duration-200 hover:scale-[1.02] active:scale-[0.97]'
            style={{
              background:
                'linear-gradient(135deg, rgba(96,164,133,0.18), rgba(96,164,133,0.06))',
              border: '1px solid rgba(96,164,133,0.55)',
              color: 'rgb(150,235,200)',
              boxShadow:
                '0 6px 18px rgba(96,164,133,0.18), inset 0 1px 0 rgba(255,255,255,0.04)',
              opacity: disabled ? 0.55 : 1,
              cursor: disabled ? 'not-allowed' : 'pointer'
            }}
          >
            {/* Document icon */}
            <svg
              width='14'
              height='14'
              viewBox='0 0 24 24'
              fill='none'
              aria-hidden
              style={{
                animation: busy ? 'recommendations-spin 0.9s linear infinite' : undefined
              }}
            >
              {busy ? (
                <path
                  d='M12 3a9 9 0 0 1 9 9'
                  stroke='currentColor'
                  strokeWidth='2.4'
                  strokeLinecap='round'
                />
              ) : (
                <>
                  <path
                    d='M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5z'
                    stroke='currentColor'
                    strokeWidth='1.8'
                    strokeLinejoin='round'
                  />
                  <path
                    d='M14 3v5h5'
                    stroke='currentColor'
                    strokeWidth='1.8'
                    strokeLinejoin='round'
                  />
                  <path
                    d='M9 13h6M9 17h4'
                    stroke='currentColor'
                    strokeWidth='1.8'
                    strokeLinecap='round'
                  />
                </>
              )}
            </svg>
            <span>{busy ? 'WIRD ERSTELLT…' : 'EMPFEHLUNG PDF'}</span>
          </button>
        </div>

        <div className='flex items-center justify-end gap-3 sm:justify-self-end'>
          {/* RESULTS counter */}
          <div className='text-right'>
            <p className='kiosk-mono text-[10px] tracking-[0.2em] text-white/45'>
              RESULTS
            </p>
            <p className='text-lg font-semibold text-white/90 tabular-nums'>
              {totalMatches}
            </p>
          </div>

          <button
            type='button'
            onClick={handleHome}
            aria-label='Zur Startseite'
            className='inline-flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full transition-all duration-200 hover:scale-[1.05] active:scale-[0.95]'
            style={{
              background:
                'linear-gradient(135deg, rgba(255,255,255,0.07), rgba(255,255,255,0.02))',
              border: '1px solid rgba(255,255,255,0.14)',
              color: 'rgba(255,255,255,0.85)',
              boxShadow:
                'inset 0 1px 0 rgba(255,255,255,0.05), 0 4px 12px rgba(0,0,0,0.25)'
            }}
          >
            <svg
              width='18'
              height='18'
              viewBox='0 0 24 24'
              fill='none'
              aria-hidden
            >
              <path
                d='M4 10.5L12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5z'
                stroke='currentColor'
                strokeWidth='2'
                strokeLinejoin='round'
              />
            </svg>
          </button>
        </div>
      </div>

      {pdfError ? (
        <p className='mt-2 text-center text-[11px] text-red-400'>{pdfError}</p>
      ) : null}
    </header>
  )
}
