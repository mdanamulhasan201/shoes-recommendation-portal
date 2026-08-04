'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { kioskFlowBackHref } from '@/app/kiosk/kiosk-flow-navigation'
import {
  cartArticleCount,
  readCart
} from '@/components/recommendations/shoe-detail/cart-storage'
import { generateRecommendationPdf } from '../recommendations-pdf'

export type KioskTerminalHeaderProps = {
  totalMatches: number
  scannerId: string | null
}

export function KioskTerminalHeader ({
  totalMatches,
  scannerId
}: KioskTerminalHeaderProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [busy, setBusy] = useState(false)
  const [pdfError, setPdfError] = useState<string | null>(null)
  const [cartCount, setCartCount] = useState(0)

  useEffect(() => {
    const sync = () => setCartCount(cartArticleCount(readCart()))
    sync()
    window.addEventListener('kiosk-warenkorb-changed', sync)
    return () => window.removeEventListener('kiosk-warenkorb-changed', sync)
  }, [])

  const handleBack = () => {
    const href = kioskFlowBackHref(pathname)
    router.push(href || '/kiosk')
  }

  const handleDownloadPdf = async () => {
    if (!scannerId || busy) return
    setBusy(true)
    setPdfError(null)
    try {
      await generateRecommendationPdf(scannerId)
    } catch (e) {
      setPdfError(
        e instanceof Error ? e.message : 'PDF konnte nicht erzeugt werden.'
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <header className='w-full shrink-0 border-b border-white/10 bg-zinc-950/80 px-1 py-4 backdrop-blur-md sm:px-2 sm:py-5'>
      <div className='flex flex-wrap items-center justify-between gap-4'>
        <div className='flex min-w-0 items-center gap-3'>
          <button
            type='button'
            onClick={handleBack}
            className='kiosk-mono inline-flex h-12 touch-manipulation cursor-pointer items-center gap-2 rounded-full border border-white/20 bg-transparent px-4 text-[11px] font-bold tracking-[0.14em] text-white transition active:scale-[0.98] hover:bg-white/6 [-webkit-tap-highlight-color:transparent]'
          >
            <svg width='14' height='14' viewBox='0 0 24 24' fill='none' aria-hidden>
              <path
                d='M15 6l-6 6 6 6'
                stroke='currentColor'
                strokeWidth='2.2'
                strokeLinecap='round'
                strokeLinejoin='round'
              />
            </svg>
            ZURUECK
          </button>
          <div className='min-w-0'>
            <p className='kiosk-mono text-[10px] tracking-[0.22em] text-white/40'>
              FEETF1RST TERMINAL
            </p>
            <h1 className='kiosk-display truncate text-lg font-bold tracking-tight text-white sm:text-2xl'>
              Ihre Schuhempfehlungen
            </h1>
          </div>
        </div>

        <div className='flex flex-wrap items-center gap-2 sm:gap-3'>
          <div className='rounded-2xl border border-white/10 bg-white/4 px-3.5 py-2 text-right'>
            <p className='kiosk-mono text-[10px] tracking-[0.18em] text-white/40'>
              TREFFER
            </p>
            <p className='text-lg font-semibold tabular-nums text-white'>
              {totalMatches}
            </p>
          </div>

          <button
            type='button'
            onClick={() => router.push('/kiosk/warenkorb')}
            className='kiosk-mono inline-flex h-12 touch-manipulation cursor-pointer items-center gap-2 rounded-full border border-white/20 bg-transparent px-4 text-[11px] font-bold tracking-[0.14em] text-white transition active:scale-[0.98] hover:bg-white/6 [-webkit-tap-highlight-color:transparent]'
          >
            <svg width='16' height='16' viewBox='0 0 24 24' fill='none' aria-hidden>
              <path
                d='M6 6h15l-1.5 9h-12L6 6zm0 0L5 3H2'
                stroke='currentColor'
                strokeWidth='1.8'
                strokeLinecap='round'
                strokeLinejoin='round'
              />
              <circle cx='9' cy='20' r='1.2' fill='currentColor' />
              <circle cx='18' cy='20' r='1.2' fill='currentColor' />
            </svg>
            <span>WARENKORB</span>
            {cartCount > 0 ? (
              <span className='tabular-nums text-white/80'>{cartCount}</span>
            ) : null}
          </button>

          <button
            type='button'
            onClick={() => void handleDownloadPdf()}
            disabled={!scannerId || busy}
            className='kiosk-mono inline-flex h-12 touch-manipulation cursor-pointer items-center gap-2 rounded-2xl border border-emerald-400/40 bg-emerald-500/15 px-4 text-[11px] font-bold tracking-[0.14em] text-emerald-100 transition active:scale-[0.98] hover:bg-emerald-500/25 disabled:cursor-not-allowed disabled:opacity-50 [-webkit-tap-highlight-color:transparent] sm:px-5 sm:text-[12px]'
          >
            {busy ? 'PDF…' : 'EMPFEHLUNG PDF'}
          </button>

          <button
            type='button'
            onClick={() => router.push('/')}
            aria-label='Zur Startseite'
            className='inline-flex h-12 w-12 shrink-0 touch-manipulation cursor-pointer items-center justify-center rounded-2xl border border-white/14 bg-white/5 text-white/85 transition hover:bg-white/10 active:scale-95 [-webkit-tap-highlight-color:transparent]'
          >
            <svg width='18' height='18' viewBox='0 0 24 24' fill='none' aria-hidden>
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
